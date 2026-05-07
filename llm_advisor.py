"""
llm_advisor.py — Fasal AI Protector
U.P. Release LLM Advisor

Bridges ViT scan result + dataset context → Gemma-2 (primary) → Mistral (fallback)
→ Hinglish advice card.


Exports:
    enrich_scan_response(scan_result, disease_context, location_dict) -> dict
    get_llm_advice(crop, disease, is_healthy, context_summary, location) -> str
"""

import json
import os
import requests

# ─── Ollama Config (reused from ml_service.py settings) ──────────────────────
GEMMA_MODEL = os.getenv("GEMMA_AI_MODEL", "gemma2")
MISTRAL_MODEL = os.getenv("MISTRAL_AI_MODEL", "mistral")
LLM_TIMEOUT = 30  # seconds


# ─── LLM Call ─────────────────────────────────────────────────────────────────

def _call_ollama(model: str, prompt: str) -> str:
    """
    Call a local Ollama model and return the text response.
    Raises on failure so caller can try the next model.
    """
    res = requests.post(
        OLLAMA_URL,
        json={"model": model, "prompt": prompt, "stream": False},
        timeout=LLM_TIMEOUT,
    )
    res.raise_for_status()
    return res.json().get("response", "").strip()


def _build_prompt(crop: str, disease: str, is_healthy: bool,
                  context_summary: str, location: str) -> str:
    """Builds the Hindi/Hinglish expert advice prompt."""

    if is_healthy:
        return (
            f"Ek kisan ka {crop} ka khet hai jahan sab kuch theek lag raha hai (Healthy). "
            f"Unhe 2-3 points mein batayen kaise apni fasal ko aur achha rakhein. "
            f"Hinglish mein jawab dein, zyada se zyada 250 shabdon mein."
        )

    return f"""
Tu ek expert Indian Agricultural Advisor hai — 'Fasal AI'.
Ek kisan ne {location}, Uttar Pradesh se apni {crop} ki fasal ki photo bheji hai.
Humara ViT model iska rog pata lagaya hai: '{disease}'.

Neeche verified dataset ka data diya gaya hai:
---
{context_summary}
---

INSTRUCTIONS:
1. Kisan ko clearly samjhao ki yeh rog kya hai (1-2 line).
2. Dataset ke data ke basis par chemical aur organic treatment batao (bullet points).
3. Best Control Time batao agar dataset mein hai.
4. Agar MRP/pesticide naam dataset mein hai to woh zaroor batao.
5. Tone empathetic aur helpful rakho. {location} ka mention karo personalization ke liye.
6. Hinglish mein jawab do (Hindi + thoda English). Zyada se zyada 250 shabdon mein.
""".strip()


# ─── Main Function ────────────────────────────────────────────────────────────

def get_llm_advice(
    crop: str,
    disease: str,
    is_healthy: bool,
    context_summary: str,
    location: str = "Uttar Pradesh",
) -> str:
    """
    Generates LLM advice using Gemma-2 (primary) → Mistral (fallback).

    Args:
        crop            : str  e.g. "Tomato"
        disease         : str  e.g. "Late blight"
        is_healthy      : bool
        context_summary : str  from dataset_loader.get_disease_context()
        location        : str  district name, e.g. {location}, Uttar Pradesh

    Returns:
        str  — Advice text in Hinglish
    """
    if is_healthy:
        return (
            f"Badhai ho! Aapki {crop} ki fasal bilkul swasth (Healthy) lag rahi hai. "
            f"Kripya niyamit roop se khet ki nigrani karte rahein aur seedlings ka dhyan rakhein."
        )

    prompt = _build_prompt(crop, disease, is_healthy, context_summary, location)

    # Primary: Gemma-2
    try:
        print(f"[LLM Advisor] Trying Gemma-2 for '{disease}'...")
        advice = _call_ollama(GEMMA_MODEL, prompt)
        if advice:
            print("[LLM Advisor] Gemma-2 response received.")
            return advice
    except Exception as e:
        print(f"[LLM Advisor] Gemma-2 failed: {e}. Trying Mistral...")

    # Fallback: Mistral
    try:
        advice = _call_ollama(MISTRAL_MODEL, prompt)
        if advice:
            print("[LLM Advisor] Mistral response received.")
            return advice
    except Exception as e:
        print(f"[LLM Advisor] Mistral also failed: {e}")

    # Static fallback
    return (
        "Kshama karein, abhi hamara AI system busy hai. "
        "Kripya neeche diye gaye Treatment Cards mein dawaiyon ki jaankari dekhein."
    )


# ─── enrich_scan_response ─────────────────────────────────────────────────────

def enrich_scan_response(
    scan_result: dict,
    disease_context: dict,
    location_dict: dict = None,
) -> dict:
    """
    Takes an existing scan result JSON and adds LLM advice to it.

    Args:
        scan_result     : dict  — Result already returned by scanner_api / ml_service
        disease_context : dict  — From dataset_loader.get_disease_context()
        location_dict   : dict  — Optional {'district': 'Lucknow', 'state': 'UP' ...}

    Returns:
        dict  — scan_result enriched with 'llm_advice' key
    """
    location = "Uttar Pradesh"
    if location_dict:
        district = location_dict.get("district", "")
        state = location_dict.get("state", "Uttar Pradesh")
        location = f"{district}, {state}".strip(", ") if district else state

    crop = disease_context.get("crop", scan_result.get("top_crop", "Unknown"))
    disease = disease_context.get("disease", scan_result.get("top_disease", "Unknown"))
    is_healthy = disease_context.get("is_healthy", scan_result.get("is_healthy", False))
    context_summary = disease_context.get("context_summary", "")

    advice = get_llm_advice(crop, disease, is_healthy, context_summary, location)

    enriched = dict(scan_result)
    enriched["llm_advice"] = advice
    enriched["llm_location"] = location

    return enriched
