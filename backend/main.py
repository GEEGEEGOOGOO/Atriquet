from fastapi import FastAPI, File, UploadFile, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import os
from dotenv import load_dotenv
import logging
import base64
import binascii

from services.openrouter_service import OpenRouterService
from services.recommendation_engine import RecommendationEngine
from services.groq_service import GroqService
from services.clothing_image_service import ClothingImageService
from services.gemini_vton_service import GeminiVTONService
from utils.cache_manager import CacheManager
from models.schemas import UserAttributes
from pydantic import BaseModel


import sys
from pathlib import Path

# Add parent directory to path
sys.path.append(str(Path(__file__).parent.parent))

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def _unwrap_nested_base64(payload: str) -> str:
    current = payload.strip().strip('"').strip("'")

    if current.startswith("data:image/"):
        current = current.split(",", 1)[1] if "," in current else current

    for _ in range(2):
        try:
            raw = base64.b64decode(current, validate=False)
        except (binascii.Error, ValueError):
            break

        # If the decoded bytes are already an image, stop unwrapping.
        if raw.startswith(b"\x89PNG\r\n\x1a\n") or raw.startswith(b"\xff\xd8\xff") or raw.startswith((b"GIF87a", b"GIF89a")) or (raw.startswith(b"RIFF") and len(raw) > 12 and raw[8:12] == b"WEBP"):
            break

        try:
            decoded_text = raw.decode("ascii").strip().strip('"').strip("'")
        except UnicodeDecodeError:
            break

        base64_chars = set("ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=\r\n")
        if decoded_text and all(ch in base64_chars for ch in decoded_text):
            current = decoded_text
            continue

        break

    return current


def _guess_image_mime_from_base64(image_base64: str) -> str:
    payload = _unwrap_nested_base64(image_base64)
    if payload.startswith("data:image/"):
        try:
            return payload.split(";", 1)[0].split(":", 1)[1]
        except (IndexError, ValueError):
            return "image/png"

    if "," in payload and payload.split(",", 1)[0].endswith(";base64"):
        payload = payload.split(",", 1)[1]

    try:
        raw = base64.b64decode(payload, validate=False)
    except (binascii.Error, ValueError):
        return "image/png"

    if raw.startswith(b"\x89PNG\r\n\x1a\n"):
        return "image/png"
    if raw.startswith(b"\xff\xd8\xff"):
        return "image/jpeg"
    if raw.startswith((b"GIF87a", b"GIF89a")):
        return "image/gif"
    if raw.startswith(b"RIFF") and len(raw) > 12 and raw[8:12] == b"WEBP":
        return "image/webp"

    return "image/png"


def _to_data_url(image_base64: str) -> str:
    payload = _unwrap_nested_base64(image_base64)
    if payload.startswith("data:image/"):
        return payload

    mime = _guess_image_mime_from_base64(payload)
    if "," in payload and payload.split(",", 1)[0].endswith(";base64"):
        payload = payload.split(",", 1)[1]
    return f"data:{mime};base64,{payload}"

# Load environment variables from one authoritative location.
# Prefer repo-root .env to avoid stale keys from parent shell or other files.
project_root = Path(__file__).parent.parent
env_candidates = [
    project_root / ".env",
    project_root / "config" / ".env",
    project_root.parent / ".env",
    Path.cwd() / ".env",
    Path(__file__).parent / ".env",
]

loaded_env = None
for env_path in env_candidates:
    if env_path.exists():
        load_dotenv(env_path, override=True)
        loaded_env = env_path
        logger.info(f"Loaded environment from: {env_path}")
        break

if loaded_env is None:
    logger.warning("No .env file found in expected locations.")

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
openrouter_api_key = os.getenv("OPENROUTER_API_KEY")
openrouter_service = OpenRouterService(api_key=openrouter_api_key) if openrouter_api_key else None
if not openrouter_service:
    logger.warning("OPENROUTER_API_KEY not found. OpenRouter quick analysis endpoint will use Groq instead.")

cache_manager = CacheManager()
groq_service = GroqService(api_key=os.getenv("GROQ_API_KEY"))
clothing_image_service = ClothingImageService()

# Initialize Gemini VTON Service (optional - only if key is provided)
vton_service = None
if os.getenv("GEMINI_API_KEY"):
    gemini_model = os.getenv("GEMINI_MODEL", "nano-banana-pro-preview")
    vton_service = GeminiVTONService(
        api_key=os.getenv("GEMINI_API_KEY"),
        model=gemini_model
    )
    logger.info(f"Gemini VTON model: {gemini_model}")
    logger.info("Gemini VTON Service initialized")
else:
    logger.warning("GEMINI_API_KEY not found. VTON generation will be unavailable.")

recommendation_engine = RecommendationEngine(
    openrouter_service=openrouter_service,
    groq_service=groq_service,
    cache_manager=cache_manager,
    clothing_image_service=clothing_image_service,
    vton_service=vton_service
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

        if openrouter_service:
            description = await openrouter_service.describe_outfit(image_base64, prompt)
        else:
            description = await groq_service.analyze_image(image_base64, prompt)
        
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
        if not vton_service:
            raise HTTPException(
                status_code=503,
                detail="Avatar generation service is not configured. Please add GEMINI_API_KEY to your .env file."
            )
        
        logger.info(f"Generating avatar: {outfit_description[:50]}...")
        
        # Generate the avatar image
        image_base64 = await vton_service.generate_outfit_visualization(
            outfit_description=outfit_description,
            body_type=body_type,
            skin_tone=skin_tone,
            style=style
        )
        
        return {
            "success": True,
            "image": _to_data_url(image_base64),
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
    model: str = Form("gemini-3-pro-image-preview")
):
    """
    Generate a custom image using Gemini image generation.
    
    Args:
        prompt: Full text prompt for image generation
        width: Image width (256-2048)
        height: Image height (256-2048)
        model: Model to use (currently fixed to gemini-3-pro-image-preview)
    
    Returns:
        Base64 encoded generated image
    """
    try:
        if not vton_service:
            raise HTTPException(
                status_code=503,
                detail="Image generation service is not configured. Please add GEMINI_API_KEY to your .env file."
            )
        
        # Validate dimensions
        if not (256 <= width <= 2048) or not (256 <= height <= 2048):
            raise HTTPException(
                status_code=400,
                detail="Width and height must be between 256 and 2048 pixels"
            )
        
        logger.info(f"Generating custom image: {prompt[:50]}...")
        
        image_base64 = await vton_service.generate_avatar(
            prompt=prompt,
            width=width,
            height=height,
            model=model
        )
        
        return {
            "success": True,
            "image": _to_data_url(image_base64),
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
    garment_image: UploadFile = File(None),
    outfit_description: str = Form(""),
    body_type: str = Form("average"),
    skin_tone: str = Form("medium"),
    gender: str = Form("person")
):
    """
    Generate image of the SAME person wearing a NEW outfit using Gemini VTON.
    
    Args:
        image: Original photo of the person
        garment_image: Optional garment/product image to transfer onto the person
        outfit_description: Optional text instruction for garment styling
        body_type: Body type descriptor (slim, average, athletic, curvy)
        skin_tone: Skin tone descriptor (fair, medium, tan, dark)
        gender: Gender descriptor (man, woman, person)
    
    Returns:
        Base64 encoded image showing the same person in the new outfit
    """
    try:
        if not vton_service:
            raise HTTPException(
                status_code=503,
                detail="Outfit generation service is not configured. Please add GEMINI_API_KEY to your .env file."
            )
        
        logger.info("Generating new outfit on person using Gemini VTON...")
        
        # Read and encode the original image
        image_data = await image.read()
        
        if len(image_data) > 10 * 1024 * 1024:
            raise HTTPException(status_code=400, detail="Image too large. Max 10MB.")
        
        image_base64 = base64.b64encode(image_data).decode('utf-8')

        body_attrs = {
            'body type': body_type,
            'skin tone': skin_tone,
            'gender': gender
        }

        result_image_base64 = None

        if garment_image is not None:
            garment_data = await garment_image.read()
            if len(garment_data) > 10 * 1024 * 1024:
                raise HTTPException(status_code=400, detail="Garment image too large. Max 10MB.")

            garment_base64 = base64.b64encode(garment_data).decode('utf-8')

            person_mime = image.content_type or "image/jpeg"
            garment_mime = garment_image.content_type or "image/jpeg"

            result_image_base64 = await vton_service.generate_outfit_from_garment(
                original_image_base64=image_base64,
                garment_image_base64=garment_base64,
                body_attributes=body_attrs,
                person_mime_type=person_mime,
                garment_mime_type=garment_mime,
                extra_instruction=outfit_description,
            )
        else:
            if not outfit_description.strip():
                raise HTTPException(status_code=400, detail="Provide garment_image or outfit_description.")
        
            result_image_base64 = await vton_service.generate_outfit_on_person(
                original_image_base64=image_base64,
                outfit_description=outfit_description,
                body_attributes=body_attrs
            )
        
        return {
            "success": True,
            "image": _to_data_url(result_image_base64),
            "message": "Outfit visualization generated successfully"
        }
        
    except HTTPException as he:
        raise he
    except Exception as e:
        raw_error = str(e)
        sanitized_error = raw_error.replace("inline_data=Blob(data='", "inline_data=Blob(data='[truncated]")
        if len(sanitized_error) > 400:
            sanitized_error = f"{sanitized_error[:400]}..."

        logger.exception("Error generating outfit on person")
        raise HTTPException(status_code=500, detail=f"Failed to generate outfit: {sanitized_error}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host=os.getenv("HOST", "0.0.0.0"),
        port=int(os.getenv("PORT", 8000)),
        reload=os.getenv("DEBUG", "True") == "True"
    )
