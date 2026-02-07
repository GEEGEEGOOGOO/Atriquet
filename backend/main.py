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

recommendation_engine = RecommendationEngine(
    openrouter_service=openrouter_service,
    groq_service=groq_service,
    cache_manager=cache_manager
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

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host=os.getenv("HOST", "0.0.0.0"),
        port=int(os.getenv("PORT", 8000)),
        reload=os.getenv("DEBUG", "True") == "True"
    )