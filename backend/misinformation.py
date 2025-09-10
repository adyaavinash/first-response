import pytesseract
from PIL import Image
import subprocess
import os

MODEL_NAME = os.getenv("OLLAMA_MODEL", "gpt-oss:20b")

OCR_LANGS = "eng+ara+heb+hin+spa+fra+deu+ita+rus"

def query_ollama(prompt: str) -> str:
    try:
        result = subprocess.run(
            ["ollama", "run", MODEL_NAME],
            input=prompt,
            capture_output=True,
            text=True,
            encoding="utf-8",
            errors="replace",
            timeout=120
        )
        if result.returncode != 0:
            return f"⚠ Ollama error: {result.stderr.strip()}"
        return (result.stdout or "").strip()
    except subprocess.TimeoutExpired:
        return "⚠ Model timed out."
    except Exception as e:
        return f"⚠ Ollama exception: {str(e)}"


def clean_verdict(answer: str) -> dict:
    """
    Normalize model output into structured dict:
    { 'verdict': ..., 'reason': ... }
    """
    if not answer or "⚠" in answer:
        return {
            "verdict": "❓ Unknown",
            "reason": "No clear text extracted or model output was invalid."
        }

    lines = [l.strip() for l in answer.splitlines() if l.strip()]
    verdict, reason = None, None

    for line in lines:
        if line.lower().startswith("verdict:"):
            verdict = line.split(":", 1)[-1].strip()
        elif line.lower().startswith("reason:"):
            reason = line.split(":", 1)[-1].strip()

    # Default fallbacks
    if not verdict:
        verdict = "❓ Unknown"
    if not reason:
        reason = "The flyer contains random, garbled text with no official markers or credible details."

    return {"verdict": verdict, "reason": reason}


def check_flyer(file):
    """Extract text from flyer image and classify it as Verified / Suspicious"""
    img = Image.open(file.file)
    text = pytesseract.image_to_string(img, lang=OCR_LANGS)

    markers = ["Red Cross", "WHO", "UN", "Government", "Ministry", "Official", "☎", "http", ".gov", "logo"]
    has_marker = any(m.lower() in text.lower() for m in markers)

    prompt = f"""
You are a misinformation detector for emergency flyers.

Extracted text from the flyer:
{text}

Guidelines:
- Some official flyers may contain only urgent short instructions.
- Do not mark something suspicious *only because it is short or urgent*.
- Mark "Verified" if it resembles an official evacuation/aid notice,
  especially if it contains markers like organization names, contact info, dates, logos, or web addresses.
- Mark "Suspicious" if it looks misleading, generic, fear-inducing, or lacks any credibility markers.

⚠️ Respond strictly in this format:
Verdict: Verified / Suspicious
Reason: <one short line>
"""

    raw_answer = query_ollama(prompt)
    result = clean_verdict(raw_answer)

    if has_marker and result["verdict"].lower().startswith("suspicious"):
        result["verdict"] = "Verified ✅ (override)"
        result["reason"] = "Contains official identifiers (logo/name/contact). Likely genuine."

    return text.strip(), result







