import os
import logging
from groq import AsyncGroq
from dotenv import load_dotenv

load_dotenv(dotenv_path="../config/.env")

logger = logging.getLogger(__name__)

class GroqService:
    def __init__(self):
        api_key = os.getenv("GROQ_API_KEY")
        if not api_key:
            logger.warning("GROQ_API_KEY not found in environment variables")
        
        self.client = AsyncGroq(api_key=api_key)
        self.model = "meta-llama/llama-4-scout-17b-16e-instruct" # Current Llama 4 Vision model
        logger.info(f"GroqService initialized with model: {self.model}")

    async def analyze_image(self, image_base64: str, prompt: str) -> str:
        """
        Analyze an image using Groq's Llama 3.2 Vision model.
        Returns the text response.
        """
        try:
            logger.info(f"Sending image analysis request to Groq ({self.model})...")
            
            # Ensure base64 string has prefix if missing (Groq expects data URL or just base64? SDK handles URL usually)
            # The SDK expects a data URL for base64 images: data:image/jpeg;base64,...
            if not image_base64.startswith("data:image"):
                # Assume jpeg if not specified, though frontend usually sends full data URL
                # If the backend receives raw base64, we add the prefix.
                # Based on previous code, it seems we might have raw base64 or data URL.
                # Let's ensure it's a data URL.
                image_url = f"data:image/jpeg;base64,{image_base64}"
            else:
                image_url = image_base64

            chat_completion = await self.client.chat.completions.create(
                messages=[
                    {
                        "role": "user",
                        "content": [
                            {"type": "text", "text": prompt},
                            {
                                "type": "image_url",
                                "image_url": {
                                    "url": image_url,
                                },
                            },
                        ],
                    }
                ],
                model=self.model,
                temperature=0.5,
                max_tokens=1024,
            )

            response_text = chat_completion.choices[0].message.content
            logger.info("Groq analysis complete.")
            return response_text

        except Exception as e:
            logger.error(f"Error calling Groq API: {str(e)}")
            raise e
