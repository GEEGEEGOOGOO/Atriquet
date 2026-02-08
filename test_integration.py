"""
Integration test: Tests the two-pass pipeline through CloudflareDiffusionService
(the exact same code path the backend API endpoint uses).
"""
import asyncio
import base64
import os
import sys
import time

# Add backend to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "backend"))

from dotenv import load_dotenv
load_dotenv(os.path.join(os.path.dirname(__file__), "config", ".env"))

from services.cloudflare_diffusion_service import CloudflareDiffusionService


async def main():
    account_id = os.getenv("CLOUDFLARE_ACCOUNT_ID")
    api_token = os.getenv("CLOUDFLARE_API_TOKEN")

    if not account_id or not api_token:
        print("ERROR: Missing CLOUDFLARE_ACCOUNT_ID or CLOUDFLARE_API_TOKEN in .env")
        return

    # ── Init service (same as main.py does) ──
    service = CloudflareDiffusionService(account_id, api_token)
    print(f"Service initialized  |  Models: {list(service.models.keys())}")

    # ── Load test image ──
    test_image_path = os.path.join(os.path.dirname(__file__), "test.jpg")
    if not os.path.exists(test_image_path):
        print(f"ERROR: test image not found at {test_image_path}")
        return

    with open(test_image_path, "rb") as f:
        image_data = f.read()
    image_base64 = base64.b64encode(image_data).decode("utf-8")
    print(f"Loaded test image: {test_image_path} ({len(image_data)} bytes)")

    # ── Call generate_outfit_on_person (same args as the API endpoint) ──
    outfit_description = "navy blue blazer, white dress shirt, charcoal grey trousers, black oxford shoes"
    body_attributes = {
        "body type": "average",
        "skin tone": "medium",
        "gender": "man",
    }

    print(f"\nOutfit: {outfit_description}")
    print(f"Body:   {body_attributes}")
    print("-" * 60)

    start = time.time()
    try:
        result_b64 = await service.generate_outfit_on_person(
            original_image_base64=image_base64,
            outfit_description=outfit_description,
            body_attributes=body_attributes,
        )
        elapsed = time.time() - start

        # Save output
        out_bytes = base64.b64decode(result_b64)
        out_path = os.path.join(os.path.dirname(__file__), "output_integration_test.png")
        with open(out_path, "wb") as f:
            f.write(out_bytes)

        print(f"\n{'='*60}")
        print(f"SUCCESS  |  Output: {out_path}")
        print(f"         |  Size:   {len(out_bytes)} bytes")
        print(f"         |  Time:   {elapsed:.1f}s")
        print(f"{'='*60}")

    except Exception as e:
        elapsed = time.time() - start
        print(f"\nFAILED after {elapsed:.1f}s: {e}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    asyncio.run(main())
