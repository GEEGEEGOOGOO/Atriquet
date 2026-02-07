from pydantic import BaseModel, Field
from typing import List, Optional, Dict
from enum import Enum

class BodyType(str, Enum):
    RECTANGLE = "rectangle"
    TRIANGLE = "triangle"
    INVERTED_TRIANGLE = "inverted_triangle"
    HOURGLASS = "hourglass"
    OVAL = "oval"

class SkinTone(str, Enum):
    FAIR = "fair"
    LIGHT = "light"
    MEDIUM = "medium"
    OLIVE = "olive"
    TAN = "tan"
    DEEP = "deep"

class UserAttributes(BaseModel):
    height: Optional[str] = None
    skin_tone: Optional[str] = None
    hair_style: Optional[str] = None
    hair_color: Optional[str] = None
    gender: Optional[str] = "Male" # Default or required? Let's make it optional but default to Male for now as example
    body_shape: Optional[str] = None

class RecommendationRequest(BaseModel):
    occasion: str
    style: str
    user_attributes: Optional[UserAttributes] = None
    include_brands: bool = False

class PhysicalAnalysis(BaseModel):
    body_type: str
    proportions: Dict[str, str]
    skin_tone: str
    skin_undertone: str
    recommended_colors: List[str]
    colors_to_avoid: List[str]
    flattering_silhouettes: List[str]
    style_notes: str
    # User attributes for avatar generation
    user_attributes: Optional[Dict[str, str]] = None

class OutfitRecommendation(BaseModel):
    outfit_name: str
    description: str
    top: str
    bottom: str
    shoes: str
    accessories: List[str]
    colors: List[str]
    brands: Optional[List[str]] = None
    rationale: str
    styling_tips: List[str]
    confidence_score: float
    # Avatar image URL (deprecated - use clothing images instead)
    avatar_image_url: Optional[str] = None
    why_it_works: Optional[str] = None  # For frontend display
    match_score: Optional[int] = None  # Percentage match
    # Real clothing images from web
    top_image_url: Optional[str] = None
    bottom_image_url: Optional[str] = None
    shoes_image_url: Optional[str] = None

class RecommendationResponse(BaseModel):
    success: bool
    physical_analysis: Optional[PhysicalAnalysis] = None # Made optional as we might rely less on explicit analysis
    recommendations: List[OutfitRecommendation]
    general_styling_tips: List[str]
    occasion: str
    style: str
    processing_time: float
    used_api: str
    
    # New Validation Fields
    is_appropriate: bool
    critique: Optional[str] = None
    improvement_suggestions: Optional[str] = None
    generated_avatars: List[str] = [] # List of URLs for multiple avatars
    avatar_url: Optional[str] = None # Keep for backward compatibility or primary avatar

class QuickAnalysisResponse(BaseModel):
    success: bool
    body_type: str
    skin_tone: str
    recommended_colors: List[str]
    flattering_styles: List[str]
    processing_time: float
