from fastapi import FastAPI, File, UploadFile, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import os
from dotenv import load_dotenv
import logging
import base64

from services.openrouter_service import OpenRouterService
from services.recommendation_engine import RecommendationEngine
from services.groq_service import GroqService
from services.clothing_image_service import ClothingImageService
from services.cloudflare_diffusion_service import CloudflareDiffusionService
from utils.cache_manager import CacheManager
from models.schemas import UserAttributes
from pydantic import BaseModel


import sys
from pathlib import Path

# Add parent directory to path
sys.path.append(str(Path(__file__).parent.parent))

# Load environment variables
env_path = Path(__file__).parent.parent / "config" / ".env"
load_dotenv(env_path)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting ATRIQUET Fashion Recommendation System")
    yield
    logger.info("Shutting down ATRIQUET")

app = FastAPI(
    title="ATRIQUET Fashion Recommendation API",
    description="Simple outfit analyzer",
    version="2.0.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize Services
openrouter_service = OpenRouterService(api_key=os.getenv("OPENROUTER_API_KEY"))
cache_manager = CacheManager()
groq_service = GroqService()
clothing_image_service = ClothingImageService()

# Initialize Cloudflare Diffusion Service (optional - only if keys are provided)
cloudflare_diffusion = None
if os.getenv("CLOUDFLARE_ACCOUNT_ID") and os.getenv("CLOUDFLARE_API_TOKEN"):
    cloudflare_diffusion = CloudflareDiffusionService(
        account_id=os.getenv("CLOUDFLARE_ACCOUNT_ID"),
        api_token=os.getenv("CLOUDFLARE_API_TOKEN")
    )
    logger.info("Cloudflare Diffusion Service initialized")
else:
    logger.warning("Cloudflare credentials not found. Avatar generation will be unavailable.")

recommendation_engine = RecommendationEngine(
    openrouter_service=openrouter_service,
    groq_service=groq_service,
    cache_manager=cache_manager,
    cloudflare_diffusion=cloudflare_diffusion
)

# Request model for clothing images
class ClothingImageRequest(BaseModel):
    top: str
    bottom: str
    shoes: str

@app.get("/")
async def root():
    return {
        "message": "ATRIQUET Fashion Recommendation API",
        "version": "2.0.0",
        "status": "operational"
    }

@app.get("/health")
async def health_check():
    return {
        "status": "healthy"
    }

@app.post("/api/clothing-images")
async def get_clothing_images(request: ClothingImageRequest):
    """
    Fetch clothing images from the web for recommended outfit items.
    """
    try:
        logger.info(f"Fetching clothing images for: top={request.top[:30]}..., bottom={request.bottom[:30]}...")
        
        images = await clothing_image_service.get_outfit_images(
            top=request.top,
            bottom=request.bottom,
            shoes=request.shoes
        )
        
        return images
        
    except Exception as e:
        logger.error(f"Error fetching clothing images: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/analyze")
async def analyze_outfit(
    image: UploadFile = File(...),
    occasion: str = Form("casual"),
    style: str = Form("modern"),
    include_brands: bool = Form(False)
):
    """
    Full outfit analysis and recommendation with Avatar visualization.
    """
    try:
        logger.info(f"Processing request - Occasion: {occasion}, Style: {style}")
        
        # Read and encode image
        image_data = await image.read()
        
        # Basic validation
        if len(image_data) > 10 * 1024 * 1024:  # 10MB limit
            raise HTTPException(status_code=400, detail="Image too large. Max 10MB.")
        
        image_base64 = base64.b64encode(image_data).decode('utf-8')
        
        # Generate recommendations
        response = await recommendation_engine.generate_recommendations(
            image=image_base64,
            occasion=occasion,
            style=style,
            include_brands=include_brands
        )
        
        return response

        
    except HTTPException as he:
        raise he
    except Exception as e:
        import traceback
        logger.error(f"Error processing request: {str(e)}")
        logger.error(f"Traceback: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/quick-analyze")
async def quick_analyze(
    image: UploadFile = File(...)
):
    """
    Quick analysis endpoint - just tells you what the person is wearing.
    """
    try:
        image_data = await image.read()
        
        # Basic validation
        if len(image_data) > 10 * 1024 * 1024:
            raise HTTPException(status_code=400, detail="Image too large. Max 10MB.")
        
        image_base64 = base64.b64encode(image_data).decode('utf-8')
        
        prompt = "Briefly describe what this person is wearing. Just the basics: items and colors."
        description = await openrouter_service.describe_outfit(image_base64, prompt)
        
        return {
            "success": True,
            "description": description
        }
        
    except Exception as e:
        logger.error(f"Error in quick analysis: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/occasions")
async def get_occasions():
    """Return available occasion types."""
    return {
        "occasions": [
            "casual",
            "formal",
            "business",
            "party",
            "wedding",
            "date_night",
            "beach",
            "sports",
            "travel"
        ]
    }

@app.get("/api/styles")
async def get_styles():
    """Return available style types."""
    return {
        "styles": [
            "minimalist",
            "streetwear",
            "classic",
            "bohemian",
            "preppy",
            "edgy",
            "romantic",
            "athletic",
            "vintage",
            "modern"
        ]
    }

@app.post("/api/generate-avatar")
async def generate_avatar(
    outfit_description: str = Form(...),
    body_type: str = Form("average"),
    skin_tone: str = Form("medium"),
    style: str = Form("modern")
):
    """
    Generate a fashion avatar wearing the described outfit using Cloudflare Workers AI.
    
    Args:
        outfit_description: Description of the outfit (e.g., "blue jeans, white t-shirt, sneakers")
        body_type: Body type descriptor (slim, average, athletic, curvy)
        skin_tone: Skin tone descriptor (fair, medium, tan, dark)
        style: Fashion style (modern, vintage, streetwear, etc.)
    
    Returns:
        Base64 encoded image of the generated avatar
    """
    try:
        if not cloudflare_diffusion:
            raise HTTPException(
                status_code=503,
                detail="Avatar generation service is not configured. Please add CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_API_TOKEN to your .env file."
            )
        
        logger.info(f"Generating avatar: {outfit_description[:50]}...")
        
        # Generate the avatar image
        image_base64 = await cloudflare_diffusion.generate_outfit_visualization(
            outfit_description=outfit_description,
            body_type=body_type,
            skin_tone=skin_tone,
            style=style
        )
        
        return {
            "success": True,
            "image": f"data:image/png;base64,{image_base64}",
            "message": "Avatar generated successfully"
        }
        
    except HTTPException as he:
        raise he
    except Exception as e:
        logger.error(f"Error generating avatar: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to generate avatar: {str(e)}")

@app.post("/api/generate-custom-image")
async def generate_custom_image(
    prompt: str = Form(...),
    width: int = Form(512),
    height: int = Form(768),
    model: str = Form("sdxl")
):
    """
    Generate a custom image using Cloudflare Workers AI with a custom prompt.
    
    Args:
        prompt: Full text prompt for image generation
        width: Image width (256-2048)
        height: Image height (256-2048)
        model: Model to use (sdxl, sd15, dreamshaper)
    
    Returns:
        Base64 encoded generated image
    """
    try:
        if not cloudflare_diffusion:
            raise HTTPException(
                status_code=503,
                detail="Image generation service is not configured. Please add CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_API_TOKEN to your .env file."
            )
        
        # Validate dimensions
        if not (256 <= width <= 2048) or not (256 <= height <= 2048):
            raise HTTPException(
                status_code=400,
                detail="Width and height must be between 256 and 2048 pixels"
            )
        
        logger.info(f"Generating custom image: {prompt[:50]}...")
        
        image_base64 = await cloudflare_diffusion.generate_avatar(
            prompt=prompt,
            width=width,
            height=height,
            model=model
        )
        
        return {
            "success": True,
            "image": f"data:image/png;base64,{image_base64}",
            "message": "Image generated successfully"
        }
        
    except HTTPException as he:
        raise he
    except Exception as e:
        logger.error(f"Error generating custom image: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to generate image: {str(e)}")

@app.post("/api/generate-outfit-on-person")
async def generate_outfit_on_person(
    image: UploadFile = File(...),
    outfit_description: str = Form(...),
    body_type: str = Form("average"),
    skin_tone: str = Form("medium"),
    gender: str = Form("person")
):
    """
    Generate image of the SAME person wearing a NEW outfit using img2img.
    
    Args:
        image: Original photo of the person
        outfit_description: Full description of the new outfit to put on the person
        body_type: Body type descriptor (slim, average, athletic, curvy)
        skin_tone: Skin tone descriptor (fair, medium, tan, dark)
        gender: Gender descriptor (man, woman, person)
    
    Returns:
        Base64 encoded image showing the same person in the new outfit
    """
    try:
        if not cloudflare_diffusion:
            raise HTTPException(
                status_code=503,
                detail="Outfit generation service is not configured. Please add CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_API_TOKEN to your .env file."
            )
        
        logger.info(f"Generating new outfit on person: {outfit_description[:50]}...")
        
        # Read and encode the original image
        image_data = await image.read()
        
        if len(image_data) > 10 * 1024 * 1024:
            raise HTTPException(status_code=400, detail="Image too large. Max 10MB.")
        
        image_base64 = base64.b64encode(image_data).decode('utf-8')
        
        # Generate the new outfit on the same person
        result_image_base64 = await cloudflare_diffusion.generate_outfit_on_person(
            original_image_base64=image_base64,
            outfit_description=outfit_description,
            body_attributes={
                'body type': body_type,
                'skin tone': skin_tone,
                'gender': gender
            }
        )
        
        return {
            "success": True,
            "image": f"data:image/png;base64,{result_image_base64}",
            "message": "Outfit visualization generated successfully"
        }
        
    except HTTPException as he:
        raise he
    except Exception as e:
        logger.error(f"Error generating outfit on person: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to generate outfit: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host=os.getenv("HOST", "0.0.0.0"),
        port=int(os.getenv("PORT", 8000)),
        reload=os.getenv("DEBUG", "True") == "True"
    )