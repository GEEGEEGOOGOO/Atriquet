import logging
import time
from typing import Dict, Any
import json
import re
from models.schemas import RecommendationResponse, PhysicalAnalysis, OutfitRecommendation, UserAttributes
from services.openrouter_service import OpenRouterService
from services.groq_service import GroqService
from services.clothing_image_service import ClothingImageService
from utils.cache_manager import CacheManager

logger = logging.getLogger(__name__)

class RecommendationEngine:
    """Main engine orchestrating the recommendation pipeline using Groq (Llama 4 Scout) and OpenRouter."""

    def __init__(
        self,
        openrouter_service: OpenRouterService,
        groq_service: GroqService,
        cache_manager: CacheManager,
        cloudflare_diffusion=None
    ):
        self.openrouter_service = openrouter_service
        self.groq_service = groq_service
        self.cache_manager = cache_manager
        self.clothing_image_service = ClothingImageService()
        self.cloudflare_diffusion = cloudflare_diffusion

    def _clean_json_response(self, response_str: str) -> str:
        """
        Clean the response string to extract valid JSON.
        Removes markdown code blocks, extra text, and whitespace.
        """
        if not response_str or not response_str.strip():
            raise ValueError("Received empty response from API")
        
        # Remove leading/trailing whitespace
        response_str = response_str.strip()
        
        # Remove markdown code blocks
        if response_str.startswith("```json"):
            response_str = response_str[7:]
        elif response_str.startswith("```"):
            response_str = response_str[3:]
        
        if response_str.endswith("```"):
            response_str = response_str[:-3]
        
        response_str = response_str.strip()
        
        # Try to extract JSON object if there's extra text
        # Look for the first { and last }
        first_brace = response_str.find('{')
        last_brace = response_str.rfind('}')
        
        if first_brace != -1 and last_brace != -1 and last_brace > first_brace:
            response_str = response_str[first_brace:last_brace + 1]
        
        return response_str

    async def generate_recommendations(
        self,
        image: str,
        occasion: str,
        style: str,
        user_attributes: UserAttributes = None,
        include_brands: bool = False
    ) -> RecommendationResponse:
        """
        Simplified Workflow using ONLY Gemma 3:
        1. Analyze image and validate outfit appropriateness for occasion
        2. If inappropriate: Suggest 3 different outfit styles
        3. No avatar generation (removed for simplicity)
        """
        total_start = time.time()

        try:
            # Step 1: Extract user attributes for avatar generation
            logger.info("Extracting user attributes for avatar generation...")
            
            attributes_prompt = """Analyze this person's physical attributes for avatar generation.
Provide ONLY the following information in this exact format:

BODY_TYPE: [slim/athletic/average/curvy/plus-size]
SKIN_TONE: [fair/light/medium/tan/brown/dark]
HEIGHT: [short/average/tall]
GENDER: [male/female/non-binary]

Be concise and specific."""
            
            attributes_text = await self.groq_service.analyze_image(image, attributes_prompt)
            logger.info(f"User attributes extracted: {attributes_text[:200]}")
            
            # Parse user attributes
            user_attrs = {}
            for line in attributes_text.split('\n'):
                if ':' in line:
                    key, value = line.split(':', 1)
                    key = key.strip().lower().replace('_', ' ')
                    user_attrs[key] = value.strip()
            
            # Step 2: Analyze outfit appropriateness
            logger.info("Analyzing outfit with Groq (Llama 4 Vision)...")
            
            analysis_prompt = f"""Analyze this image and determine if the outfit is appropriate for the occasion: "{occasion}".

Please provide your analysis in the following format:

APPROPRIATE: [Yes/No]
CRITIQUE: [Explain why the outfit is or isn't appropriate for {occasion}]
SUGGESTIONS: [If appropriate, suggest minor improvements. If not appropriate, explain what should be worn instead]

If the outfit is NOT appropriate, also provide 3 different outfit recommendations for {occasion}:

OUTFIT 1:
- Name: [Outfit style name]
- Description: [Brief description]
- Top: [Specific top item]
- Bottom: [Specific bottom item]
- Shoes: [Specific shoes]
- Colors: [Color palette]
- Why it works: [Rationale]

OUTFIT 2:
[Same format]

OUTFIT 3:
[Same format]

Be specific and practical in your recommendations."""

            # Call Groq (Llama 4 Scout)
            response_text = await self.groq_service.analyze_image(image, analysis_prompt)
            logger.info(f"Groq Response (first 500 chars): {response_text[:500]}")

            # Parse the response
            is_appropriate = "APPROPRIATE: Yes" in response_text or "APPROPRIATE:Yes" in response_text
            
            # Extract critique
            critique = ""
            if "CRITIQUE:" in response_text:
                critique_start = response_text.find("CRITIQUE:") + len("CRITIQUE:")
                critique_end = response_text.find("SUGGESTIONS:", critique_start)
                if critique_end == -1:
                    critique_end = response_text.find("OUTFIT 1:", critique_start)
                if critique_end == -1:
                    critique_end = len(response_text)
                critique = response_text[critique_start:critique_end].strip()

            # Extract suggestions
            suggestions = ""
            if "SUGGESTIONS:" in response_text:
                sugg_start = response_text.find("SUGGESTIONS:") + len("SUGGESTIONS:")
                sugg_end = response_text.find("OUTFIT 1:", sugg_start)
                if sugg_end == -1:
                    sugg_end = len(response_text)
                suggestions = response_text[sugg_start:sugg_end].strip()

            # Build recommendations list
            recommendations = []
            
            if not is_appropriate:
                # Parse the 3 outfit recommendations
                for i in range(1, 4):
                    outfit_marker = f"OUTFIT {i}:"
                    if outfit_marker in response_text:
                        outfit_start = response_text.find(outfit_marker)
                        outfit_end = response_text.find(f"OUTFIT {i+1}:", outfit_start)
                        if outfit_end == -1:
                            outfit_end = len(response_text)
                        
                        outfit_text = response_text[outfit_start:outfit_end]
                        
                        # Extract fields
                        def extract_field(text, field_name):
                            if f"{field_name}:" in text:
                                start = text.find(f"{field_name}:") + len(f"{field_name}:")
                                # Find next field or end
                                next_fields = ["Name:", "Description:", "Top:", "Bottom:", "Shoes:", "Colors:", "Why it works:", "OUTFIT"]
                                end = len(text)
                                for nf in next_fields:
                                    pos = text.find(nf, start)
                                    if pos != -1 and pos < end:
                                        end = pos
                                return text[start:end].strip()
                            return ""
                        
                        outfit_name = extract_field(outfit_text, "Name") or f"Outfit Option {i}"
                        description = extract_field(outfit_text, "Description") or "Recommended outfit"
                        top = extract_field(outfit_text, "Top") or "Appropriate top"
                        bottom = extract_field(outfit_text, "Bottom") or "Appropriate bottom"
                        shoes = extract_field(outfit_text, "Shoes") or "Appropriate shoes"
                        colors_str = extract_field(outfit_text, "Colors") or "Neutral colors"
                        rationale = extract_field(outfit_text, "Why it works") or "Suitable for the occasion"
                        
                        colors = [c.strip() for c in colors_str.split(",") if c.strip()]
                        
                        rec = OutfitRecommendation(
                            outfit_name=outfit_name,
                            description=description,
                            top=top,
                            bottom=bottom,
                            shoes=shoes,
                            accessories=[],
                            colors=colors,
                            rationale=rationale,
                            styling_tips=[suggestions] if suggestions else [],
                            confidence_score=0.85,
                            why_it_works=rationale,
                            match_score=85
                        )
                        recommendations.append(rec)
            
                # Fetch real clothing images for ALL recommendations
                logger.info("Fetching clothing images for recommendations...")
                import asyncio
                
                async def fetch_images_for_recommendation(rec):
                    """Fetch clothing images for a single recommendation."""
                    try:
                        images = await self.clothing_image_service.get_outfit_images(
                            top=rec.top,
                            bottom=rec.bottom,
                            shoes=rec.shoes
                        )
                        rec.top_image_url = images.get("top_image_url")
                        rec.bottom_image_url = images.get("bottom_image_url")
                        rec.shoes_image_url = images.get("shoes_image_url")
                        logger.info(f"Fetched images for: {rec.outfit_name}")
                    except Exception as e:
                        logger.warning(f"Failed to fetch images for {rec.outfit_name}: {e}")
                
                # Fetch images for all recommendations concurrently
                if recommendations:
                    await asyncio.gather(*[fetch_images_for_recommendation(rec) for rec in recommendations])

                # Generate outfit visualizations using img2img if cloudflare service is available
                generated_avatars = []
                if self.cloudflare_diffusion and recommendations:
                    logger.info("Generating outfit visualizations on the person...")
                    
                    async def generate_outfit_for_recommendation(rec, idx):
                        """Generate outfit visualization for a single recommendation."""
                        try:
                            # Build complete outfit description from recommendation
                            outfit_desc = f"{rec.top}, {rec.bottom}, {rec.shoes}"
                            if rec.accessories:
                                outfit_desc += f", {', '.join(rec.accessories)}"
                            
                            # Generate image of person wearing this new outfit
                            result_image_base64 = await self.cloudflare_diffusion.generate_outfit_on_person(
                                original_image_base64=image,
                                outfit_description=outfit_desc,
                                body_attributes=user_physical_attributes
                            )
                            
                            avatar_data = {
                                "outfit_name": rec.outfit_name,
                                "outfit_index": idx + 1,
                                "image": f"data:image/png;base64,{result_image_base64}",
                                "description": outfit_desc
                            }
                            generated_avatars.append(avatar_data)
                            logger.info(f"Generated outfit visualization {idx + 1}: {rec.outfit_name}")
                            
                        except Exception as e:
                            logger.warning(f"Failed to generate outfit visualization for {rec.outfit_name}: {e}")
                    
                    # Generate outfit visualizations for all recommendations concurrently
                    await asyncio.gather(*[generate_outfit_for_recommendation(rec, idx) for idx, rec in enumerate(recommendations)])
                    logger.info(f"Successfully generated {len(generated_avatars)} outfit visualizations")

            # Build response
            processing_time = time.time() - total_start
            
            return RecommendationResponse(
                success=True,
                physical_analysis=None,  # Not needed in simplified workflow
                recommendations=recommendations,
                general_styling_tips=[suggestions] if suggestions else [],
                occasion=occasion,
                style=style,
                processing_time=processing_time,
                used_api="GROQ+LLAMA4",
                avatar_url=None,
                is_appropriate=is_appropriate,
                critique=critique,
                improvement_suggestions=suggestions,
                generated_avatars=generated_avatars  # Include generated outfit visualizations
            )

        except Exception as e:
            logger.error(f"Error in generate_recommendations: {str(e)}")
            import traceback
            logger.error(f"Traceback: {traceback.format_exc()}")
            
            # Return error response
            return RecommendationResponse(
                success=False,
                physical_analysis=None,
                recommendations=[],
                general_styling_tips=[],
                occasion=occasion,
                style=style,
                processing_time=time.time() - total_start,
                used_api="OLLAMA+GEMMA3",
                avatar_url=None,
                is_appropriate=False,
                critique=f"Error during analysis: {str(e)}",
                improvement_suggestions="Please try again or check the logs.",
                generated_avatars=[]
            )

    async def quick_analysis(self, image: str) -> Dict[str, Any]:
        """Quick analysis without full recommendations."""
        start_time = time.time()
        
        try:
            analysis_prompt = """Analyze the person in this image and provide a quick analysis.

CRITICAL: Respond with ONLY valid JSON. No markdown, no code blocks, no additional text.

Required JSON structure (ALL fields are mandatory):
{
    "body_type": "string (e.g., Rectangle, Hourglass, Pear, Apple, Inverted Triangle)",
    "skin_tone": "string (e.g., Fair, Light, Medium, Tan, Dark)",
    "proportions": "string (describe body proportions)",
    "skin_undertone": "string (e.g., Warm, Cool, Neutral)",
    "recommended_colors": ["color1", "color2", "color3"],
    "colors_to_avoid": ["color1", "color2"],
    "flattering_styles": ["style1", "style2", "style3"],
    "style_notes": "string (styling notes)"
}

Return ONLY the JSON object, nothing else."""
            
            analysis_json_str = await self.openrouter_service.get_image_description(image, analysis_prompt)
            
            # Log raw response for debugging
            logger.info(f"Raw quick analysis response (first 300 chars): {analysis_json_str[:300]}")
            
            # Clean the response
            try:
                cleaned_analysis = self._clean_json_response(analysis_json_str)
                analysis = json.loads(cleaned_analysis)
                logger.info("Successfully parsed quick analysis JSON")
            except json.JSONDecodeError as e:
                logger.error(f"Failed to parse quick analysis JSON. Raw response: {analysis_json_str[:500]}")
                raise ValueError(f"Invalid JSON from quick analysis: {str(e)}")
            
            return {
                "success": True,
                "body_type": analysis.get("body_type", "Unknown"),
                "skin_tone": analysis.get("skin_tone", "Unknown"),
                "recommended_colors": analysis.get("recommended_colors", []),
                "flattering_styles": analysis.get("flattering_styles", []),
                "processing_time": time.time() - start_time,
                "used_api": "openrouter"
            }
            
        except Exception as e:
            logger.error(f"Error in quick analysis: {str(e)}")
            raise