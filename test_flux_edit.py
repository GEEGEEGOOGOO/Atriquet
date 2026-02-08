"""Test FLUX-2 image editing capability on Cloudflare Workers AI"""
import httpx
import base64
from pathlib import Path
from dotenv import load_dotenv
from PIL import Image
from io import BytesIO
import os

load_dotenv(Path(__file__).parent / "config" / ".env")
ACCOUNT_ID = os.getenv("CLOUDFLARE_ACCOUNT_ID")
TOKEN = os.getenv("CLOUDFLARE_API_TOKEN")

# Resize test.jpg to small for quick test
img = Image.open("test.jpg").convert("RGB")
img = img.resize((256, 256), Image.LANCZOS)
buf = BytesIO()
img.save(buf, format="JPEG", quality=80)
img_bytes = buf.getvalue()

model = "@cf/black-forest-labs/flux-2-klein-4b"
url = f"https://api.cloudflare.com/client/v4/accounts/{ACCOUNT_ID}/ai/run/{model}"

print("=== Test: multipart with image file + prompt ===")
try:
    with httpx.Client(timeout=120) as c:
        resp = c.post(
            url,
            headers={"Authorization": f"Bearer {TOKEN}"},
            data={"prompt": "same person wearing a professional black blazer and khaki pants, business casual outfit, photorealistic"},
            files={"image": ("test.jpg", img_bytes, "image/jpeg")},
            timeout=120,
        )
        print(f"Status: {resp.status_code}")
        ct = resp.headers.get("content-type", "")
        print(f"Content-Type: {ct}")
        if "json" in ct:
            r = resp.json()
            if r.get("success"):
                img_b64 = r.get("result", {}).get("image", "")
                print(f"Got image: {len(img_b64)} chars base64")
                img_data = base64.b64decode(img_b64)
                with open("output_flux_test.png", "wb") as f:
                    f.write(img_data)
                print("Saved to output_flux_test.png")
            else:
                errors = r.get("errors", r)
                print(f"Error: {errors}")
        else:
            print(f"Binary: {len(resp.content)} bytes")
            with open("output_flux_test.png", "wb") as f:
                f.write(resp.content)
            print("Saved to output_flux_test.png")
except Exception as e:
    print(f"Error: {e}")
    import traceback
    traceback.print_exc()
