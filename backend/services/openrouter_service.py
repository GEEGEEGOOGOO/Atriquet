import logging
from openai import AsyncOpenAI

logger = logging.getLogger(__name__)

class OpenRouterService:
    def __init__(self, api_key: str):
        self.api_key = api_key
        self.client = AsyncOpenAI(
            base_url="https://openrouter.ai/api/v1",
            api_key=api_key,
        )
        self.model = "meta-llama/llama-3.2-11b-vision-instruct"
        logger.info(f"OpenRouter initialized with model: {self.model}")
    
    async def describe_outfit(self, image_base64: str, prompt: str = None) -> str:
        """
        Simply describe what the person is wearing in the image.
        
        Args:
            image_base64: Base64 encoded image string
            prompt: Custom prompt (optional)
            
        Returns:
            Plain text description of the outfit
        """
        try:
            logger.info("Analyzing outfit...")
            
            if not prompt:
                prompt = "Describe what this person is wearing. Include clothing items, colors, and style. Keep it simple and direct."
            
            response = await self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {
                        "role": "user",
                        "content": [
                            {
                                "type": "text",
                                "text": prompt
                            },
                            {
                                "type": "image_url",
                                "image_url": {
                                    "url": f"data:image/jpeg;base64,{image_base64}"
                                }
                            }
                        ]
                    }
                ],
                max_tokens=500,
                temperature=0.5
            )
            
            description = response.choices[0].message.content
            logger.info(f"Successfully got outfit description")
            return description
            
        except Exception as e:
            logger.error(f"Error describing outfit: {str(e)}")
            raise e

    async def get_image_description(self, image_base64: str, prompt: str = None) -> str:
        """Alias for describe_outfit to maintain compatibility with RecommendationEngine."""
        return await self.describe_outfit(image_base64, prompt)