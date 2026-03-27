import base64
import binascii
import logging
import asyncio
import os
import ssl
import time
from typing import Any, Dict, Optional

import httpx
from google import genai
from google.genai import types

logger = logging.getLogger(__name__)


class GeminiVTONService:
    """VTON service backed by Gemini image preview model."""

    def __init__(self, api_key: str, model: str = "gemini-3-pro-image-preview"):
        if not api_key:
            raise ValueError("GEMINI_API_KEY is required for GeminiVTONService")

        self.api_key = api_key
        self.model = model

    @staticmethod
    def _decode_b64(image_base64: str) -> bytes:
        try:
            return base64.b64decode(image_base64)
        except (binascii.Error, ValueError) as exc:
            raise RuntimeError(f"Invalid base64 image payload: {exc}") from exc

    def _build_config(self) -> types.GenerateContentConfig:
        return types.GenerateContentConfig(
            response_modalities=["IMAGE", "TEXT"],
        )

    @staticmethod
    def _extract_chunk_parts(chunk: Any) -> list[Any]:
        parts = getattr(chunk, "parts", None)
        if parts:
            return list(parts)

        candidates = getattr(chunk, "candidates", None) or []
        for candidate in candidates:
            content = getattr(candidate, "content", None)
            candidate_parts = getattr(content, "parts", None)
            if candidate_parts:
                return list(candidate_parts)

        return []

    @staticmethod
    def _safe_chunk_text(chunk: Any) -> str:
        try:
            return getattr(chunk, "text", None) or ""
        except Exception:
            return ""

    @staticmethod
    def _is_transient_transport_error(exc: BaseException) -> bool:
        current: Optional[BaseException] = exc
        while current is not None:
            if isinstance(current, (ssl.SSLError, httpx.TransportError, ConnectionError, TimeoutError)):
                return True
            current = getattr(current, "__cause__", None) or getattr(current, "__context__", None)
        return False

    def _generate_content_with_retry(
        self,
        client: genai.Client,
        *,
        prompt: str,
        image_parts: list[types.Part],
        attempts: int = 3,
        base_delay_seconds: float = 1.0,
    ) -> Any:
        contents = [
            types.Content(
                role="user",
                parts=[types.Part.from_text(text=prompt), *image_parts],
            ),
        ]

        last_error: Optional[Exception] = None
        for attempt in range(1, attempts + 1):
            try:
                return client.models.generate_content(
                    model=self.model,
                    contents=contents,
                    config=self._build_config(),
                )
            except Exception as exc:
                last_error = exc
                if attempt >= attempts or not self._is_transient_transport_error(exc):
                    raise

                logger.warning(
                    "Transient Gemini transport failure on attempt %s/%s for model %s: %s",
                    attempt,
                    attempts,
                    self.model,
                    exc,
                )
                time.sleep(base_delay_seconds * attempt)

        if last_error is not None:
            raise last_error
        raise RuntimeError("Gemini request failed before a response was returned.")

    def _generate_image_sync(self, prompt: str, image_parts: list[types.Part]) -> str:
        # Prevent SDK from picking an unrelated GOOGLE_API_KEY from parent env.
        os.environ["GEMINI_API_KEY"] = self.api_key
        os.environ["GOOGLE_API_KEY"] = self.api_key
        client = genai.Client(api_key=self.api_key)
        response = self._generate_content_with_retry(
            client,
            prompt=prompt,
            image_parts=image_parts,
        )

        image_bytes = None
        streamed_text = []
        for part in self._extract_chunk_parts(response):
            if getattr(part, "inline_data", None) and getattr(part.inline_data, "data", None):
                image_bytes = part.inline_data.data
                break

        response_text = self._safe_chunk_text(response)
        if response_text:
            streamed_text.append(response_text)

        if image_bytes is None:
            text_hint = "".join(streamed_text).strip()
            raise RuntimeError(f"Gemini did not return an image. Model text: {text_hint[:500]}")

        return base64.b64encode(image_bytes).decode("utf-8")

    async def generate_outfit_on_person(
        self,
        original_image_base64: str,
        outfit_description: str,
        body_attributes: Optional[Dict[str, str]] = None,
        mime_type: str = "image/jpeg",
    ) -> str:
        body_type = (body_attributes or {}).get("body type", "average")
        skin_tone = (body_attributes or {}).get("skin tone", "medium")
        gender = (body_attributes or {}).get("gender", "person")

        prompt = (
            "Edit the provided person photo to keep the same person identity, face, pose, and framing. "
            f"Change only the outfit to: {outfit_description}. "
            f"Person details: {gender}, {body_type} build, {skin_tone} skin tone. "
            "Photorealistic fashion photography, clean details, realistic fabric, natural lighting. "
            "Do not add extra people, text, watermark, or logos."
        )

        image_parts = [
            types.Part.from_bytes(
                data=self._decode_b64(original_image_base64),
                mime_type=mime_type,
            )
        ]

        return await asyncio.to_thread(self._generate_image_sync, prompt, image_parts)

    async def generate_outfit_from_garment(
        self,
        original_image_base64: str,
        garment_image_base64: str,
        body_attributes: Optional[Dict[str, str]] = None,
        person_mime_type: str = "image/jpeg",
        garment_mime_type: str = "image/jpeg",
        extra_instruction: str = "",
    ) -> str:
        body_type = (body_attributes or {}).get("body type", "average")
        skin_tone = (body_attributes or {}).get("skin tone", "medium")
        gender = (body_attributes or {}).get("gender", "person")

        prompt = (
            "Use the first image as the person reference and the second image as the garment reference. "
            "Dress the same person from image one in the garment from image two. "
            "Keep person identity, face, body proportions, and pose consistent with image one. "
            f"Person details: {gender}, {body_type} build, {skin_tone} skin tone. "
            "Preserve garment design details from image two as closely as possible: cut, fabric texture, color, and silhouette. "
            "Photorealistic fashion output, clean lighting, no text, no watermark, no extra people. "
            f"Additional instruction: {extra_instruction or 'none'}"
        )

        image_parts = [
            types.Part.from_bytes(
                data=self._decode_b64(original_image_base64),
                mime_type=person_mime_type,
            ),
            types.Part.from_bytes(
                data=self._decode_b64(garment_image_base64),
                mime_type=garment_mime_type,
            ),
        ]

        return await asyncio.to_thread(self._generate_image_sync, prompt, image_parts)

    async def generate_avatar(
        self,
        prompt: str,
        width: int = 768,
        height: int = 1024,
        **_: Any,
    ) -> str:
        # Width and height are accepted for API compatibility with previous service.
        rich_prompt = (
            f"{prompt}. Render as a photorealistic full-body fashion image. "
            f"Target aspect ratio close to {width}:{height}."
        )
        return await asyncio.to_thread(self._generate_image_sync, rich_prompt, [])

    async def generate_outfit_visualization(
        self,
        outfit_description: str,
        body_type: str = "average",
        skin_tone: str = "medium",
        style: str = "modern",
    ) -> str:
        prompt = (
            f"A {style} style full-body fashion portrait of a {body_type} build person with {skin_tone} skin tone, "
            f"wearing {outfit_description}. High quality studio fashion photography."
        )
        return await self.generate_avatar(prompt=prompt)



