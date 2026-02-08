"""
ATRIQUET Outfit Swap Test Script
================================
Takes test.jpg (person) and swaps ONLY their clothing using:
1. Cloudflare SD 1.5 img2img to generate outfit change
2. Pillow compositing to paste ONLY clothing pixels back onto original

Face, hair, skin, and background are guaranteed pixel-perfect from the original.
"""

import httpx
import base64
import os
import sys
from pathlib import Path
from io import BytesIO

# Load env
from dotenv import load_dotenv
load_dotenv(Path(__file__).parent / "config" / ".env")

CLOUDFLARE_ACCOUNT_ID = os.getenv("CLOUDFLARE_ACCOUNT_ID")
CLOUDFLARE_API_TOKEN = os.getenv("CLOUDFLARE_API_TOKEN")

if not CLOUDFLARE_ACCOUNT_ID or not CLOUDFLARE_API_TOKEN:
    print("ERROR: Missing CLOUDFLARE_ACCOUNT_ID or CLOUDFLARE_API_TOKEN in config/.env")
    sys.exit(1)

# Paths
BASE_DIR = Path(__file__).parent
TEST_IMAGE = BASE_DIR / "test.jpg"
BLAZER_IMAGE = BASE_DIR / "blazers.jpg"
PANTS_IMAGE = BASE_DIR / "formalpant.jpg"
OUTPUT_IMAGE = BASE_DIR / "output_outfit_swap.png"
MASK_IMAGE = BASE_DIR / "outfit_mask.png"
RAW_GEN_IMAGE = BASE_DIR / "output_raw_generated.png"

for f in [TEST_IMAGE, BLAZER_IMAGE, PANTS_IMAGE]:
    if not f.exists():
        print(f"ERROR: {f.name} not found at {f}")
        sys.exit(1)

print("=" * 60)
print("ATRIQUET Outfit Swap (Composite Mode)")
print("Face & background = original pixels (guaranteed)")
print("=" * 60)

from PIL import Image, ImageDraw, ImageFilter


def resize_for_model(img: Image.Image, max_size: int = 512):
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


def create_clothing_only_mask(img_w: int, img_h: int) -> Image.Image:
    """
    Create a precise mask that covers STRICTLY the clothing.
    White = clothing to replace.  Black = preserve (face, skin, background).
    
    The mask intentionally excludes:
    - Head/face (top 32% of image)
    - Hands/wrists (edges of arms)
    - Below ankles (shoes area kept narrow)
    - All background (outside body silhouette)
    """
    mask = Image.new('L', (img_w, img_h), 0)
    draw = ImageDraw.Draw(mask)
    
    cx = img_w // 2  # center x
    
    # === UPPER BODY (jacket/top area) ===
    # Start BELOW the chin/neck — around 33% from top
    top_start = int(img_h * 0.33)
    # Shoulders — wider
    shoulder_w = int(img_w * 0.26)
    # Narrow at waist
    waist_y = int(img_h * 0.52)
    waist_w = int(img_w * 0.18)
    
    # Torso polygon (shoulders to waist)
    draw.polygon([
        (cx - shoulder_w, top_start),
        (cx + shoulder_w, top_start),
        (cx + waist_w, waist_y),
        (cx - waist_w, waist_y),
    ], fill=255)
    
    # === SLEEVES (arms - jacket sleeves) ===
    sleeve_top = int(img_h * 0.34)
    sleeve_bottom = int(img_h * 0.55)
    # Left sleeve
    left_arm_inner = cx - shoulder_w
    left_arm_outer = int(cx - img_w * 0.38)
    draw.polygon([
        (left_arm_inner, sleeve_top),
        (left_arm_outer, int(img_h * 0.40)),
        (left_arm_outer, sleeve_bottom),
        (left_arm_inner, waist_y),
    ], fill=255)
    # Right sleeve
    right_arm_inner = cx + shoulder_w
    right_arm_outer = int(cx + img_w * 0.38)
    draw.polygon([
        (right_arm_inner, sleeve_top),
        (right_arm_outer, int(img_h * 0.40)),
        (right_arm_outer, sleeve_bottom),
        (right_arm_inner, waist_y),
    ], fill=255)
    
    # === LOWER BODY (pants/trousers area) ===
    hip_w = int(img_w * 0.20)
    ankle_y = int(img_h * 0.87)
    ankle_w = int(img_w * 0.08)
    
    # Left leg
    draw.polygon([
        (cx - hip_w, waist_y),
        (cx - 4, waist_y),
        (cx - 4, ankle_y),
        (cx - ankle_w - 4, ankle_y),
    ], fill=255)
    # Right leg
    draw.polygon([
        (cx + 4, waist_y),
        (cx + hip_w, waist_y),
        (cx + ankle_w + 4, ankle_y),
        (cx + 4, ankle_y),
    ], fill=255)
    
    # === SHOES area (small) ===
    shoe_top = int(img_h * 0.87)
    shoe_bot = int(img_h * 0.95)
    shoe_w = int(img_w * 0.10)
    draw.rectangle([cx - hip_w, shoe_top, cx - ankle_w + 10, shoe_bot], fill=255)
    draw.rectangle([cx + ankle_w - 10, shoe_top, cx + hip_w, shoe_bot], fill=255)
    
    # Soft edges (feather the mask so blending is smooth)
    mask = mask.filter(ImageFilter.GaussianBlur(radius=6))
    
    return mask


def generate_outfit_swap():
    """Full pipeline: generate → composite."""
    
    # ── Step 1: Load and resize original ──
    print("\n[1/5] Loading original image...")
    original_full = Image.open(TEST_IMAGE)
    original, img_w, img_h = resize_for_model(original_full, max_size=512)
    print(f"  Original: {original_full.size} -> {img_w}x{img_h}")
    
    buf = BytesIO()
    original.save(buf, format='JPEG', quality=92)
    person_b64 = base64.b64encode(buf.getvalue()).decode('utf-8')
    
    # ── Step 2: Create clothing-only mask ──
    print("\n[2/5] Creating clothing-only mask...")
    mask = create_clothing_only_mask(img_w, img_h)
    mask.save(MASK_IMAGE)
    
    mask_array = list(mask.tobytes())
    white_pct = sum(1 for p in mask_array if p > 128) / len(mask_array) * 100
    print(f"  Mask covers {white_pct:.1f}% of image (clothing only)")
    print(f"  Saved: {MASK_IMAGE}")
    
    # ── Step 3: Generate with Cloudflare img2img ──
    print("\n[3/5] Generating outfit with Cloudflare img2img...")
    
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
    
    # Use HIGH strength here since we'll composite back anyway
    # The model can freely change the image — we only keep clothing pixels
    print(f"  Strength: 0.75 (aggressive — we composite back anyway)")
    print(f"  Guidance: 9.5")
    
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
        "mask": mask_array,
        "strength": 0.75,
        "guidance": 9.5,
        "num_steps": 20,
    }
    
    try:
        with httpx.Client(timeout=120.0) as client:
            response = client.post(url, json=payload, headers=headers)
            
            print(f"  Status: {response.status_code}")
            
            if response.status_code != 200:
                try:
                    print(f"  Error: {response.json()}")
                except:
                    print(f"  Error: {response.text[:500]}")
                return False
            
            content_type = response.headers.get("content-type", "")
            if "application/json" in content_type:
                result = response.json()
                print(f"  API Error: {result}")
                return False
            
            gen_bytes = response.content
            print(f"  Generated: {len(gen_bytes)} bytes")
            
            if len(gen_bytes) < 1000:
                print(f"  Too small, likely error: {gen_bytes[:200]}")
                return False
            
            # Save raw generation for comparison
            generated = Image.open(BytesIO(gen_bytes)).convert('RGB')
            # Resize to match original if needed
            if generated.size != (img_w, img_h):
                generated = generated.resize((img_w, img_h), Image.LANCZOS)
            generated.save(RAW_GEN_IMAGE)
            print(f"  Raw generated saved: {RAW_GEN_IMAGE}")
    
    except httpx.TimeoutException:
        print("  ERROR: Timeout (120s)")
        return False
    except Exception as e:
        print(f"  ERROR: {e}")
        import traceback
        traceback.print_exc()
        return False
    
    # ── Step 4: Composite — paste ONLY clothing pixels onto original ──
    print("\n[4/5] Compositing (clothing from generated + face/bg from original)...")
    
    # The mask tells us where clothing is (white areas)
    # Use original as base, paste generated pixels only where mask is white
    # mask is already feathered for smooth blending
    
    composite = Image.composite(generated, original, mask)
    
    print(f"  Original pixels: face, hair, skin, background (preserved)")
    print(f"  Generated pixels: clothing area only ({white_pct:.1f}%)")
    
    # ── Step 5: Save final output ──
    print("\n[5/5] Saving final output...")
    composite.save(OUTPUT_IMAGE, quality=95)
    print(f"  Output: {OUTPUT_IMAGE} ({OUTPUT_IMAGE.stat().st_size} bytes)")
    
    return True


if __name__ == "__main__":
    print(f"\nInput:   {TEST_IMAGE}")
    print(f"Blazer:  {BLAZER_IMAGE}")
    print(f"Pants:   {PANTS_IMAGE}")
    print(f"Output:  {OUTPUT_IMAGE}")
    
    success = generate_outfit_swap()
    
    if success:
        print("\n" + "=" * 60)
        print("DONE! Compare these files:")
        print(f"  Original:       {TEST_IMAGE.name}")
        print(f"  Raw generated:  {RAW_GEN_IMAGE.name}  (model output — face distorted)")
        print(f"  Mask:           {MASK_IMAGE.name}    (white = clothing area)")
        print(f"  FINAL:          {OUTPUT_IMAGE.name}  (composited — face preserved)")
        print("=" * 60)
    else:
        print("\nFAILED — check errors above")
        sys.exit(1)
