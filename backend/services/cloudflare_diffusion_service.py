import httpx
import base64
import logging
from io import BytesIO
from typing import Optional, Any

logger = logging.getLogger(__name__)


class CloudflareDiffusionService:
    """Service for generating images using Cloudflare Workers AI"""
    
    def __init__(self, account_id: str, api_token: str):
        """
        Initialize Cloudflare Diffusion Service
        
        Args:
            account_id: Cloudflare Account ID
            api_token: Cloudflare API Token
        """
        self.account_id = account_id
        self.api_token = api_token
        self.base_url = f"https://api.cloudflare.com/client/v4/accounts/{account_id}/ai/run"
        
        # Available models
        self.models = {
            "sdxl": "@cf/stabilityai/stable-diffusion-xl-base-1.0",
            "img2img": "@cf/runwayml/stable-diffusion-v1-5-img2img",
            "dreamshaper": "@cf/lykon/dreamshaper-8-lcm",
            "flux2-klein-9b": "@cf/black-forest-labs/flux-2-klein-9b",
            "flux2-klein-4b": "@cf/black-forest-labs/flux-2-klein-4b",
        }
        
    async def generate_avatar(
        self, 
        prompt: str, 
        width: int = 512, 
        height: int = 768,
        model: str = "sdxl",
        num_steps: int = 20,
        guidance: float = 7.5,
        negative_prompt: Optional[str] = None
    ) -> str:
        """
        Generate fashion avatar image using Cloudflare Workers AI
        
        Args:
            prompt: Text description of the image
            width: Image width in pixels (256-2048)
            height: Image height in pixels (256-2048)
            model: Model to use ("sdxl", "sd15", "dreamshaper")
            num_steps: Number of diffusion steps (max 20)
            guidance: How closely to follow prompt (higher = more strict)
            negative_prompt: What to avoid in the image
            
        Returns:
            Base64 encoded image string
        """
        try:
            model_id = self.models.get(model, self.models["sdxl"])
            url = f"{self.base_url}/{model_id}"
            
            headers = {
                "Authorization": f"Bearer {self.api_token}",
                "Content-Type": "application/json"
            }
            
            payload = {
                "prompt": prompt,
                "width": width,
                "height": height,
                "num_steps": min(num_steps, 20),  # Cloudflare max is 20
                "guidance": guidance
            }
            
            if negative_prompt:
                payload["negative_prompt"] = negative_prompt
            
            logger.info(f"Generating image with Cloudflare AI: {prompt[:50]}...")
            
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    url, 
                    json=payload, 
                    headers=headers, 
                    timeout=60.0
                )
                
                if response.status_code != 200:
                    error_msg = f"Cloudflare API error: {response.status_code} - {response.text}"
                    logger.error(error_msg)
                    raise Exception(error_msg)
                
                # Response is binary image data
                image_bytes = response.content
                
                # Convert to base64
                image_base64 = base64.b64encode(image_bytes).decode('utf-8')
                
                logger.info("Image generated successfully")
                return image_base64
                
        except httpx.TimeoutException:
            logger.error("Cloudflare API timeout")
            raise Exception("Image generation timed out. Please try again.")
        except Exception as e:
            logger.error(f"Error generating image: {str(e)}")
            raise
    
    async def generate_outfit_on_person(
        self,
        original_image_base64: str,
        outfit_description: str,
        body_attributes: dict = None
    ) -> str:
        """
        Two-pass pipeline to generate image of the SAME person in a NEW outfit.
        
        Pass 1: SD 1.5 img2img generates the outfit change, then Pillow composites
                only clothing pixels onto the original (preserving face/background).
        Pass 2: FLUX-2 refines the composite for photorealistic quality.
        
        Args:
            original_image_base64: Base64 encoded original image of the person
            outfit_description: Description of the new outfit
            body_attributes: Dict with body_type, skin_tone, gender, etc.
            
        Returns:
            Base64 encoded image string of person in new outfit
        """
        try:
            from PIL import Image, ImageDraw, ImageFilter
            from io import BytesIO as _BytesIO
            
            # ── Resize input image ──
            img_bytes = base64.b64decode(original_image_base64)
            img = Image.open(_BytesIO(img_bytes))
            if img.mode != 'RGB':
                img = img.convert('RGB')
            
            w, h = img.size
            max_size = 512
            if w > h:
                new_w = max_size
                new_h = int(h * max_size / w)
            else:
                new_h = max_size
                new_w = int(w * max_size / h)
            new_w = (new_w // 8) * 8
            new_h = (new_h // 8) * 8
            
            original = img.resize((new_w, new_h), Image.LANCZOS)
            logger.info(f"Resized input image: {w}x{h} -> {new_w}x{new_h}")
            
            # ── PASS 1: SD 1.5 img2img + Composite ──
            composite = await self._pass1_sd_composite(original, new_w, new_h, outfit_description, body_attributes)
            
            if composite is None:
                raise Exception("Pass 1 (SD img2img) failed")
            
            # ── PASS 2: FLUX-2 Refinement ──
            refined = await self._pass2_flux_refine(composite, outfit_description, body_attributes)
            
            if refined is not None:
                # Use FLUX-refined result
                buf = _BytesIO()
                refined.save(buf, format='PNG', quality=95)
                logger.info("Two-pass pipeline complete (FLUX refined)")
                return base64.b64encode(buf.getvalue()).decode('utf-8')
            else:
                # Fallback to composite only
                buf = _BytesIO()
                composite.save(buf, format='PNG', quality=95)
                logger.warning("FLUX refinement failed, using composite only")
                return base64.b64encode(buf.getvalue()).decode('utf-8')
                
        except Exception as e:
            logger.error(f"Error in two-pass outfit pipeline: {str(e)}")
            raise
    
    def _create_clothing_mask(self, img_w: int, img_h: int) -> Any:
        """Create mask covering ONLY clothing area (white=replace, black=preserve)."""
        from PIL import Image, ImageDraw, ImageFilter
        
        mask = Image.new('L', (img_w, img_h), 0)
        draw = ImageDraw.Draw(mask)
        cx = img_w // 2

        # Upper body torso (below neck)
        top_start = int(img_h * 0.33)
        shoulder_w = int(img_w * 0.26)
        waist_y = int(img_h * 0.52)
        waist_w = int(img_w * 0.18)
        draw.polygon([
            (cx - shoulder_w, top_start), (cx + shoulder_w, top_start),
            (cx + waist_w, waist_y), (cx - waist_w, waist_y),
        ], fill=255)

        # Sleeves
        sleeve_top = int(img_h * 0.34)
        sleeve_bottom = int(img_h * 0.55)
        left_inner = cx - shoulder_w
        left_outer = int(cx - img_w * 0.38)
        draw.polygon([
            (left_inner, sleeve_top), (left_outer, int(img_h * 0.40)),
            (left_outer, sleeve_bottom), (left_inner, waist_y),
        ], fill=255)
        right_inner = cx + shoulder_w
        right_outer = int(cx + img_w * 0.38)
        draw.polygon([
            (right_inner, sleeve_top), (right_outer, int(img_h * 0.40)),
            (right_outer, sleeve_bottom), (right_inner, waist_y),
        ], fill=255)

        # Lower body (pants)
        hip_w = int(img_w * 0.20)
        ankle_y = int(img_h * 0.87)
        ankle_w = int(img_w * 0.08)
        draw.polygon([
            (cx - hip_w, waist_y), (cx - 4, waist_y),
            (cx - 4, ankle_y), (cx - ankle_w - 4, ankle_y),
        ], fill=255)
        draw.polygon([
            (cx + 4, waist_y), (cx + hip_w, waist_y),
            (cx + ankle_w + 4, ankle_y), (cx + 4, ankle_y),
        ], fill=255)

        # Shoes
        shoe_top = int(img_h * 0.87)
        shoe_bot = int(img_h * 0.95)
        draw.rectangle([cx - hip_w, shoe_top, cx - ankle_w + 10, shoe_bot], fill=255)
        draw.rectangle([cx + ankle_w - 10, shoe_top, cx + hip_w, shoe_bot], fill=255)

        # Feather edges
        mask = mask.filter(ImageFilter.GaussianBlur(radius=6))
        return mask
    
    async def _pass1_sd_composite(
        self, original: Any, img_w: int, img_h: int,
        outfit_description: str, body_attributes: dict = None
    ) -> Optional[Any]:
        """Pass 1: SD 1.5 img2img → generate outfit → composite onto original."""
        from PIL import Image
        from io import BytesIO as _BytesIO
        
        try:
            # Create clothing mask
            mask = self._create_clothing_mask(img_w, img_h)
            
            # Encode original for API
            buf = _BytesIO()
            original.save(buf, format='JPEG', quality=92)
            person_b64 = base64.b64encode(buf.getvalue()).decode('utf-8')
            
            # Build prompt
            body_desc = ""
            if body_attributes:
                body_type = body_attributes.get('body type', 'average')
                skin_tone = body_attributes.get('skin tone', 'medium')
                gender = body_attributes.get('gender', 'person')
                body_desc = f"same {gender} with {body_type} build and {skin_tone} skin, "
            
            prompt = (
                f"{body_desc}wearing {outfit_description}, "
                f"professional business clothing, high quality, "
                f"detailed fabric textures, natural lighting"
            )
            negative_prompt = (
                "deformed, blurry, bad quality, cartoon, anime, "
                "distorted, extra limbs, disfigured face"
            )
            
            model_id = self.models["img2img"]
            url = f"{self.base_url}/{model_id}"
            headers = {
                "Authorization": f"Bearer {self.api_token}",
                "Content-Type": "application/json"
            }
            payload = {
                "prompt": prompt,
                "negative_prompt": negative_prompt,
                "image_b64": person_b64,
                "strength": 0.75,
                "guidance": 9.5,
                "num_steps": 20,
            }
            
            logger.info(f"Pass 1: SD img2img generating outfit...")
            
            async with httpx.AsyncClient() as client:
                response = await client.post(url, json=payload, headers=headers, timeout=120.0)
                
                if response.status_code != 200:
                    logger.error(f"Pass 1 SD error: {response.status_code}")
                    return None
                
                ct = response.headers.get("content-type", "")
                if "application/json" in ct:
                    logger.error(f"Pass 1 unexpected JSON: {response.json()}")
                    return None
                
                gen_bytes = response.content
                if len(gen_bytes) < 1000:
                    logger.error(f"Pass 1 response too small: {len(gen_bytes)} bytes")
                    return None
                
                generated = Image.open(_BytesIO(gen_bytes)).convert('RGB')
                if generated.size != (img_w, img_h):
                    generated = generated.resize((img_w, img_h), Image.LANCZOS)
            
            # Composite: clothing from generated + face/bg from original
            composite = Image.composite(generated, original, mask)
            logger.info(f"Pass 1 complete: composite created ({img_w}x{img_h})")
            return composite
            
        except httpx.TimeoutException:
            logger.error("Pass 1 timeout")
            return None
        except Exception as e:
            logger.error(f"Pass 1 error: {str(e)}")
            return None
    
    async def _pass2_flux_refine(
        self, composite: Any,
        outfit_description: str, body_attributes: dict = None
    ) -> Optional[Any]:
        """Pass 2: Send composite to FLUX-2 for photorealistic refinement."""
        from PIL import Image
        from io import BytesIO as _BytesIO
        
        try:
            # Scale up for better FLUX output
            w, h = composite.size
            scale = 768 / max(w, h)
            new_w = (int(w * scale) // 8) * 8
            new_h = (int(h * scale) // 8) * 8
            composite_resized = composite.resize((new_w, new_h), Image.LANCZOS)
            
            buf = _BytesIO()
            composite_resized.save(buf, format='PNG', quality=95)
            composite_bytes = buf.getvalue()
            
            # Build refinement prompt
            body_desc = ""
            if body_attributes:
                gender = body_attributes.get('gender', 'person')
                body_desc = f"of the same {gender}, "
            
            refine_prompt = (
                f"A photorealistic portrait photo {body_desc}"
                f"wearing {outfit_description}. "
                f"Professional fashion photography, crisp clothing details, "
                f"natural fabric textures, smooth transitions, "
                f"studio quality lighting, 8k detail, sharp focus, photorealistic"
            )
            
            # Try 9b first, fallback to 4b
            flux_models = [
                self.models["flux2-klein-9b"],
                self.models["flux2-klein-4b"],
            ]
            
            for model_id in flux_models:
                model_name = model_id.split("/")[-1]
                logger.info(f"Pass 2: FLUX refinement with {model_name}...")
                
                url = f"{self.base_url}/{model_id}"
                
                try:
                    async with httpx.AsyncClient() as client:
                        response = await client.post(
                            url,
                            headers={"Authorization": f"Bearer {self.api_token}"},
                            data={"prompt": refine_prompt},
                            files={"image": ("composite.png", composite_bytes, "image/png")},
                            timeout=180.0,
                        )
                        
                        if response.status_code != 200:
                            logger.warning(f"FLUX {model_name} error: {response.status_code}")
                            continue
                        
                        ct = response.headers.get("content-type", "")
                        if "json" in ct:
                            result = response.json()
                            if result.get("success"):
                                img_b64 = result.get("result", {}).get("image", "")
                                if img_b64:
                                    img_data = base64.b64decode(img_b64)
                                    refined = Image.open(_BytesIO(img_data)).convert('RGB')
                                    logger.info(f"Pass 2 complete: FLUX refined ({refined.size})")
                                    return refined
                            logger.warning(f"FLUX {model_name} no image in response")
                            continue
                        else:
                            img_data = response.content
                            if len(img_data) > 1000:
                                refined = Image.open(_BytesIO(img_data)).convert('RGB')
                                logger.info(f"Pass 2 complete: FLUX refined ({refined.size})")
                                return refined
                            continue
                            
                except httpx.TimeoutException:
                    logger.warning(f"FLUX {model_name} timeout")
                    continue
                except Exception as e:
                    logger.warning(f"FLUX {model_name} error: {e}")
                    continue
            
            logger.warning("All FLUX models failed, returning None")
            return None
            
        except Exception as e:
            logger.error(f"Pass 2 error: {str(e)}")
            return None
    
    async def generate_outfit_visualization(
        self,
        outfit_description: str,
        body_type: str = "average",
        skin_tone: str = "medium",
        style: str = "modern"
    ) -> str:
        """
        Generate a fashion avatar wearing the described outfit
        
        Args:
            outfit_description: Description of the outfit items
            body_type: Body type descriptor
            skin_tone: Skin tone descriptor
            style: Fashion style
            
        Returns:
            Base64 encoded image string
        """
        # Craft a detailed prompt for fashion visualization
        prompt = f"""A fashion illustration of a {body_type} build person with {skin_tone} skin tone, 
wearing {outfit_description}. {style} style, professional fashion photography, 
clean white background, full body shot, standing pose, high quality, detailed clothing textures."""
        
        negative_prompt = "blurry, distorted, low quality, cartoon, anime, multiple people, nudity, inappropriate"
        
        return await self.generate_avatar(
            prompt=prompt,
            width=512,
            height=768,
            negative_prompt=negative_prompt,
            guidance=8.0
        )
