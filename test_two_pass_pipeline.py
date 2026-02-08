"""
ATRIQUET Two-Pass Outfit Swap Pipeline
=======================================
Pass 1: SD 1.5 img2img → generates outfit change (face may distort)
        Pillow composite → pastes only clothing pixels onto original face/background
Pass 2: FLUX-2 image editing → refines the composite for photorealistic quality

Output comparison:
  - output_raw_generated.png  → Raw SD output (face distorted)
  - output_composite.png      → After Pillow compositing (face restored, seams visible)
  - output_flux_refined.png   → After FLUX-2 refinement (final, high quality)
"""

import httpx
import base64
import os
import sys
from pathlib import Path
from io import BytesIO

from dotenv import load_dotenv
load_dotenv(Path(__file__).parent / "config" / ".env")

CLOUDFLARE_ACCOUNT_ID = os.getenv("CLOUDFLARE_ACCOUNT_ID")
CLOUDFLARE_API_TOKEN = os.getenv("CLOUDFLARE_API_TOKEN")

if not CLOUDFLARE_ACCOUNT_ID or not CLOUDFLARE_API_TOKEN:
    print("ERROR: Missing CLOUDFLARE_ACCOUNT_ID or CLOUDFLARE_API_TOKEN in config/.env")
    sys.exit(1)

BASE_DIR = Path(__file__).parent
TEST_IMAGE = BASE_DIR / "test.jpg"
OUTPUT_RAW = BASE_DIR / "output_raw_generated.png"
OUTPUT_MASK = BASE_DIR / "outfit_mask.png"
OUTPUT_COMPOSITE = BASE_DIR / "output_composite.png"
OUTPUT_FLUX = BASE_DIR / "output_flux_refined.png"

if not TEST_IMAGE.exists():
    print(f"ERROR: {TEST_IMAGE.name} not found")
    sys.exit(1)

from PIL import Image, ImageDraw, ImageFilter

# ═══════════════════════════════════════════════════════════════
# UTILITY FUNCTIONS
# ═══════════════════════════════════════════════════════════════

def resize_for_model(img: Image.Image, max_size: int = 512) -> tuple:
    """Resize to model limits, dimensions divisible by 8."""
    if img.mode != 'RGB':
        img = img.convert('RGB')
    w, h = img.size
    if w > h:
        new_w = max_size
        new_h = int(h * max_size / w)
    else:
        new_h = max_size
        new_w = int(w * max_size / h)
    new_w = (new_w // 8) * 8
    new_h = (new_h // 8) * 8
    return img.resize((new_w, new_h), Image.LANCZOS), new_w, new_h


def create_clothing_mask(img_w: int, img_h: int) -> Image.Image:
    """
    Create mask covering ONLY clothing area.
    White = clothing to replace. Black = preserve (face, skin, background).
    """
    mask = Image.new('L', (img_w, img_h), 0)
    draw = ImageDraw.Draw(mask)
    cx = img_w // 2

    # Upper body (torso - below neck)
    top_start = int(img_h * 0.33)
    shoulder_w = int(img_w * 0.26)
    waist_y = int(img_h * 0.52)
    waist_w = int(img_w * 0.18)

    draw.polygon([
        (cx - shoulder_w, top_start),
        (cx + shoulder_w, top_start),
        (cx + waist_w, waist_y),
        (cx - waist_w, waist_y),
    ], fill=255)

    # Sleeves
    sleeve_top = int(img_h * 0.34)
    sleeve_bottom = int(img_h * 0.55)
    left_arm_inner = cx - shoulder_w
    left_arm_outer = int(cx - img_w * 0.38)
    draw.polygon([
        (left_arm_inner, sleeve_top),
        (left_arm_outer, int(img_h * 0.40)),
        (left_arm_outer, sleeve_bottom),
        (left_arm_inner, waist_y),
    ], fill=255)
    right_arm_inner = cx + shoulder_w
    right_arm_outer = int(cx + img_w * 0.38)
    draw.polygon([
        (right_arm_inner, sleeve_top),
        (right_arm_outer, int(img_h * 0.40)),
        (right_arm_outer, sleeve_bottom),
        (right_arm_inner, waist_y),
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

    # Feather edges for smooth blending
    mask = mask.filter(ImageFilter.GaussianBlur(radius=6))
    return mask


def img_to_b64(img: Image.Image, fmt: str = "JPEG", quality: int = 92) -> str:
    """Convert PIL Image to base64 string."""
    buf = BytesIO()
    img.save(buf, format=fmt, quality=quality)
    return base64.b64encode(buf.getvalue()).decode('utf-8')


def img_to_bytes(img: Image.Image, fmt: str = "JPEG", quality: int = 92) -> bytes:
    """Convert PIL Image to bytes."""
    buf = BytesIO()
    img.save(buf, format=fmt, quality=quality)
    return buf.getvalue()


# ═══════════════════════════════════════════════════════════════
# PASS 1: SD 1.5 img2img + Composite
# ═══════════════════════════════════════════════════════════════

def pass1_sd_outfit_swap(original: Image.Image, img_w: int, img_h: int) -> Image.Image:
    """
    Pass 1: Use SD 1.5 img2img to generate outfit, then composite.
    Returns the composite image (original face/bg + generated clothing).
    """
    print("\n" + "─" * 50)
    print("PASS 1: SD 1.5 img2img + Pillow Composite")
    print("─" * 50)

    # Step 1: Create mask
    print("[1/3] Creating clothing mask...")
    mask = create_clothing_mask(img_w, img_h)
    mask.save(OUTPUT_MASK)
    mask_pixels = list(mask.tobytes())
    white_pct = sum(1 for p in mask_pixels if p > 128) / len(mask_pixels) * 100
    print(f"  Mask covers {white_pct:.1f}% of image")

    # Step 2: Generate with SD img2img
    print("[2/3] Generating outfit with SD 1.5 img2img...")
    person_b64 = img_to_b64(original)

    outfit_prompt = (
        "wearing a fitted black single-button blazer jacket, "
        "beige khaki formal straight-leg trousers, "
        "black leather dress shoes, "
        "professional business casual clothing, "
        "high quality, detailed fabric textures, natural lighting"
    )
    negative_prompt = (
        "deformed, blurry, bad quality, cartoon, anime, "
        "denim jacket, shorts, combat boots, tights, stockings, distorted"
    )

    model = "@cf/runwayml/stable-diffusion-v1-5-img2img"
    url = f"https://api.cloudflare.com/client/v4/accounts/{CLOUDFLARE_ACCOUNT_ID}/ai/run/{model}"
    headers = {
        "Authorization": f"Bearer {CLOUDFLARE_API_TOKEN}",
        "Content-Type": "application/json"
    }
    payload = {
        "prompt": outfit_prompt,
        "negative_prompt": negative_prompt,
        "image_b64": person_b64,
        "strength": 0.75,
        "guidance": 9.5,
        "num_steps": 20,
    }

    try:
        with httpx.Client(timeout=120.0) as client:
            response = client.post(url, json=payload, headers=headers)
            print(f"  Status: {response.status_code}")

            if response.status_code != 200:
                print(f"  Error: {response.text[:300]}")
                return None

            ct = response.headers.get("content-type", "")
            if "application/json" in ct:
                print(f"  API Error: {response.json()}")
                return None

            gen_bytes = response.content
            if len(gen_bytes) < 1000:
                print(f"  Too small: {len(gen_bytes)} bytes")
                return None

            generated = Image.open(BytesIO(gen_bytes)).convert('RGB')
            if generated.size != (img_w, img_h):
                generated = generated.resize((img_w, img_h), Image.LANCZOS)
            generated.save(OUTPUT_RAW)
            print(f"  Raw SD output saved: {OUTPUT_RAW.name} ({len(gen_bytes)} bytes)")

    except Exception as e:
        print(f"  ERROR: {e}")
        import traceback
        traceback.print_exc()
        return None

    # Step 3: Composite
    print("[3/3] Compositing (clothing from SD + face/bg from original)...")
    composite = Image.composite(generated, original, mask)
    composite.save(OUTPUT_COMPOSITE, quality=95)
    print(f"  Composite saved: {OUTPUT_COMPOSITE.name}")
    print(f"  Face/background: original pixels (preserved)")
    print(f"  Clothing area: SD-generated pixels ({white_pct:.1f}%)")

    return composite


# ═══════════════════════════════════════════════════════════════
# PASS 2: FLUX-2 Refinement
# ═══════════════════════════════════════════════════════════════

def pass2_flux_refine(composite: Image.Image) -> Image.Image:
    """
    Pass 2: Send composite to FLUX-2 for photorealistic refinement.
    FLUX-2 will clean up seams, improve cloth textures, and enhance realism.
    """
    print("\n" + "─" * 50)
    print("PASS 2: FLUX-2 Photorealistic Refinement")
    print("─" * 50)

    # Resize to a good FLUX resolution (FLUX works well with larger images)
    # FLUX-2-klein can handle up to 1024x1024
    w, h = composite.size
    # Scale up from 512 to 768 for better FLUX output
    scale = 768 / max(w, h)
    new_w = int(w * scale)
    new_h = int(h * scale)
    # Make divisible by 8
    new_w = (new_w // 8) * 8
    new_h = (new_h // 8) * 8

    composite_resized = composite.resize((new_w, new_h), Image.LANCZOS)
    print(f"[1/2] Resized composite: {w}x{h} -> {new_w}x{new_h}")

    composite_bytes = img_to_bytes(composite_resized, fmt="PNG", quality=95)

    # FLUX-2 refinement prompt
    refine_prompt = (
        "A photorealistic portrait photo of the same person, wearing a fitted black blazer "
        "with single button, beige khaki formal trousers, black leather dress shoes. "
        "Professional fashion photography, crisp clothing details, natural fabric textures, "
        "smooth transitions between clothing and skin, studio quality lighting, "
        "8k detail, sharp focus, high resolution, photorealistic"
    )

    # Try FLUX-2-klein-9b first (higher quality), fallback to 4b
    models_to_try = [
        ("@cf/black-forest-labs/flux-2-klein-9b", "FLUX-2-klein-9b"),
        ("@cf/black-forest-labs/flux-2-klein-4b", "FLUX-2-klein-4b"),
    ]

    for model_id, model_name in models_to_try:
        print(f"[2/2] Refining with {model_name}...")
        url = f"https://api.cloudflare.com/client/v4/accounts/{CLOUDFLARE_ACCOUNT_ID}/ai/run/{model_id}"

        try:
            with httpx.Client(timeout=180.0) as client:
                response = client.post(
                    url,
                    headers={"Authorization": f"Bearer {CLOUDFLARE_API_TOKEN}"},
                    data={"prompt": refine_prompt},
                    files={"image": ("composite.png", composite_bytes, "image/png")},
                    timeout=180.0,
                )

                print(f"  Status: {response.status_code}")
                ct = response.headers.get("content-type", "")

                if response.status_code != 200:
                    try:
                        err = response.json()
                        print(f"  Error: {err.get('errors', err)}")
                    except:
                        print(f"  Error: {response.text[:300]}")
                    if model_id == models_to_try[-1][0]:
                        return None
                    print(f"  Trying fallback model...")
                    continue

                if "json" in ct:
                    result = response.json()
                    if result.get("success"):
                        img_b64 = result.get("result", {}).get("image", "")
                        if img_b64:
                            img_data = base64.b64decode(img_b64)
                            refined = Image.open(BytesIO(img_data)).convert('RGB')
                            refined.save(OUTPUT_FLUX, quality=95)
                            print(f"  FLUX refined image saved: {OUTPUT_FLUX.name}")
                            print(f"  Size: {refined.size}, {len(img_data)} bytes")
                            return refined
                        else:
                            print(f"  No image in response")
                    else:
                        print(f"  API error: {result.get('errors', result)}")
                else:
                    # Binary response
                    img_data = response.content
                    if len(img_data) > 1000:
                        refined = Image.open(BytesIO(img_data)).convert('RGB')
                        refined.save(OUTPUT_FLUX, quality=95)
                        print(f"  FLUX refined image saved: {OUTPUT_FLUX.name}")
                        return refined
                    else:
                        print(f"  Response too small: {len(img_data)} bytes")

                if model_id != models_to_try[-1][0]:
                    print(f"  Trying fallback model...")
                    continue
                return None

        except httpx.TimeoutException:
            print(f"  Timeout (180s)")
            if model_id != models_to_try[-1][0]:
                print(f"  Trying fallback model...")
                continue
            return None
        except Exception as e:
            print(f"  ERROR: {e}")
            import traceback
            traceback.print_exc()
            if model_id != models_to_try[-1][0]:
                print(f"  Trying fallback model...")
                continue
            return None

    return None


# ═══════════════════════════════════════════════════════════════
# MAIN PIPELINE
# ═══════════════════════════════════════════════════════════════

def main():
    print("=" * 60)
    print("ATRIQUET Two-Pass Outfit Swap Pipeline")
    print("Pass 1: SD 1.5 img2img → Pillow Composite")
    print("Pass 2: FLUX-2 → Photorealistic Refinement")
    print("=" * 60)

    # Load and resize
    print(f"\nInput: {TEST_IMAGE}")
    original_full = Image.open(TEST_IMAGE)
    original, img_w, img_h = resize_for_model(original_full, max_size=512)
    print(f"Resized: {original_full.size} -> {img_w}x{img_h}")

    # Pass 1: SD + Composite
    composite = pass1_sd_outfit_swap(original, img_w, img_h)
    if composite is None:
        print("\nFAILED at Pass 1")
        sys.exit(1)

    # Pass 2: FLUX refinement
    refined = pass2_flux_refine(composite)
    if refined is None:
        print("\nFAILED at Pass 2 — composite still available")
        print(f"  Best result: {OUTPUT_COMPOSITE}")
    else:
        print(f"\n  FINAL result: {OUTPUT_FLUX}")

    # Summary
    print("\n" + "=" * 60)
    print("RESULTS:")
    print(f"  Original:    {TEST_IMAGE.name}")
    print(f"  Mask:        {OUTPUT_MASK.name}")
    print(f"  Raw SD:      {OUTPUT_RAW.name}  (face distorted)")
    print(f"  Composite:   {OUTPUT_COMPOSITE.name}  (face restored)")
    if refined:
        print(f"  FLUX Final:  {OUTPUT_FLUX.name}  (photorealistic)")
    print("=" * 60)


if __name__ == "__main__":
    main()
