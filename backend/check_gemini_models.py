import json
import os
import sys
import urllib.error
import urllib.request
from pathlib import Path


def _load_dotenv(dotenv_path: Path, override: bool = False) -> None:
    if not dotenv_path.exists():
        return

    for line in dotenv_path.read_text(encoding="utf-8").splitlines():
        text = line.strip()
        if not text or text.startswith("#") or "=" not in text:
            continue

        key, value = text.split("=", 1)
        key = key.strip()
        value = value.strip().strip('"').strip("'")
        if key and value and (override or key not in os.environ):
            os.environ[key] = value


def _fetch_models(api_key: str) -> list[str]:
    url = f"https://generativelanguage.googleapis.com/v1beta/models?key={api_key}"
    request = urllib.request.Request(url, method="GET")
    with urllib.request.urlopen(request, timeout=30) as response:
        payload = json.loads(response.read().decode("utf-8"))
    return [m.get("name", "") for m in payload.get("models", []) if m.get("name")]


def main() -> int:
    repo_root = Path(__file__).resolve().parent.parent
    # Root .env should win to avoid stale shell variables.
    _load_dotenv(repo_root / ".env", override=True)
    _load_dotenv(repo_root / "config" / ".env", override=False)

    api_key = os.getenv("GEMINI_API_KEY", "").strip()
    if not api_key:
        print("ERROR: GEMINI_API_KEY is not set.")
        return 1

    masked = f"{api_key[:6]}...{api_key[-4:]}" if len(api_key) >= 12 else "[short-key]"
    print(f"Using GEMINI_API_KEY: {masked}")

    targets = [
        "models/gemini-3-pro-image-preview",
        "models/nano-banana-pro-preview",
        "models/gemini-3.1-flash-image-preview",
        "models/gemini-2.5-flash-image",
    ]

    if len(sys.argv) > 1:
        targets = [
            arg if arg.startswith("models/") else f"models/{arg}"
            for arg in sys.argv[1:]
        ]

    try:
        names = _fetch_models(api_key)
    except urllib.error.HTTPError as exc:
        body = exc.read().decode("utf-8", errors="replace") if exc.fp else ""
        print(f"HTTP {exc.code}: {exc.reason}")
        if body:
            print(body)
        return 2
    except Exception as exc:
        print(f"ERROR: {exc}")
        return 3

    print(f"Total models for this key: {len(names)}")
    print()
    print("Image-capable candidates:")
    image_like = [n for n in names if "image" in n.lower() or "imagen" in n.lower() or "banana" in n.lower()]
    for name in image_like:
        print(f"- {name}")

    print()
    print("Target checks:")
    supported = set(names)
    for target in targets:
        status = "SUPPORTED" if target in supported else "NOT SUPPORTED"
        print(f"- {target}: {status}")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
