import asyncio
import base64
import os
from pathlib import Path

from dotenv import load_dotenv

from services.gemini_vton_service import GeminiVTONService


def read_b64(path: Path) -> str:
    return base64.b64encode(path.read_bytes()).decode("utf-8")


def guess_mime(path: Path) -> str:
    suffix = path.suffix.lower()
    if suffix == ".png":
        return "image/png"
    if suffix in {".jpg", ".jpeg"}:
        return "image/jpeg"
    if suffix == ".webp":
        return "image/webp"
    return "image/jpeg"


async def main() -> None:
    root = Path(r"d:\ATRIQUET\Atriquet")
    load_dotenv(root / ".env", override=True)

    gemini_key = os.getenv("GEMINI_API_KEY")
    if not gemini_key:
        raise RuntimeError("GEMINI_API_KEY is missing in environment")

    person = Path(r"C:\Users\kumar\AppData\Roaming\Code\User\workspaceStorage\vscode-chat-images\image-1774436287519.png")
    garment = Path(r"C:\Users\kumar\AppData\Roaming\Code\User\workspaceStorage\vscode-chat-images\image-1774434716174.png")

    service = GeminiVTONService(api_key=gemini_key, model="gemini-3-pro-image-preview")

    output_b64 = await service.generate_outfit_from_garment(
        original_image_base64=read_b64(person),
        garment_image_base64=read_b64(garment),
        person_mime_type=guess_mime(person),
        garment_mime_type=guess_mime(garment),
        body_attributes={"body type": "average", "skin tone": "medium", "gender": "person"},
        extra_instruction="Apply the garment style from reference image to the person while preserving identity.",
    )

    out_path = root / "backend" / "OUTPUT_TEST.png"
    out_path.write_bytes(base64.b64decode(output_b64))
    print(f"OUTPUT_TEST saved at: {out_path}")


if __name__ == "__main__":
    asyncio.run(main())
