import json
import sys
import os

# ─── Django setup for standalone CLI usage ───────────────────────────────────
if __name__ == "__main__":
    # Allow running as: python dataset_loader.py "Tomato___Late_blight" "Lucknow"
    sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
    os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
    import django
    django.setup()

from apps.scanner.ml_service import (
    DatasetCache,
    _normalize,
    _match_from_reference,
    _match_from_csv,
)


# ─── Core Functions ───────────────────────────────────────────────────────────

def vit_result_to_json(predicted_class: str, confidence: float, top_k: list = None) -> dict:
    parts = predicted_class.split("___")
    if len(parts) == 2:
        crop = parts[0].replace("_", " ").strip()
        disease = parts[1].replace("_", " ").strip()
    else:
        crop = "Unknown"
        disease = predicted_class.replace("_", " ").strip()

    is_healthy = any(kw in disease.lower() for kw in ["healthy", "normal", "no disease"])

    top_k_clean = []
    if top_k:
        for item in top_k:
            if isinstance(item, (list, tuple)) and len(item) >= 2:
                top_k_clean.append({"label": str(item[0]), "score": round(float(item[1]), 4)})
            elif isinstance(item, dict):
                top_k_clean.append(item)

    return {
        "predicted_class": predicted_class,
        "crop": crop,
        "disease": disease,
        "confidence": round(confidence, 4),
        "is_healthy": is_healthy,
        "top_k": top_k_clean,
    }


def get_disease_context(predicted_class: str, district: str = None) -> dict:
    vit_json = vit_result_to_json(predicted_class, 0.0)
    crop = vit_json["crop"]
    disease = vit_json["disease"]
    is_healthy = vit_json["is_healthy"]

    if is_healthy:
        return {
            "crop": crop,
            "disease": disease,
            "is_healthy": True,
            "reference": None,
            "treatments": [],
            "context_summary": f"{crop} ki fasal swasth (Healthy) hai.",
        }

    crop_norm = _normalize(crop)
    disease_norm = _normalize(disease)

    reference = _match_from_reference(crop_norm, disease_norm)
    treatments = _match_from_csv(crop_norm, disease_norm, district=district)

    # Build a compact plain-text summary for LLM context window
    lines = [f"Crop: {crop}", f"Disease: {disease}"]

    if district:
        lines.append(f"Farmer Location: {district}, Uttar Pradesh")

    if reference:
        lines.append("\n[Reference Guide Data]")
        if reference.get("hindi_name"):
            lines.append(f"Hindi Name: {reference['hindi_name']}")
        if reference.get("damage_description"):
            lines.append(f"Damage: {reference['damage_description'][:200]}")
        if reference.get("treatment_options"):
            lines.append(f"Treatment: {reference['treatment_options'][:300]}")
        if reference.get("best_control_time"):
            lines.append(f"Best Control Time: {reference['best_control_time']}")
        if reference.get("mrp_2026"):
            lines.append(f"Medicine MRP 2026: {reference['mrp_2026']}")

    if treatments:
        lines.append("\n[District-Level Treatment Data]")
        for t in treatments[:2]:  # top 2 matches only — keeps prompt lean
            if t.get("pesticide_options"):
                lines.append(f"Pesticide: {t['pesticide_options'][:200]}")
            if t.get("application_method"):
                lines.append(f"Application: {t['application_method'][:150]}")
            if t.get("mrp_2026"):
                lines.append(f"MRP 2026: {t['mrp_2026']}")

    context_summary = "\n".join(lines)

    return {
        "crop": crop,
        "disease": disease,
        "is_healthy": False,
        "reference": reference,
        "treatments": treatments,
        "context_summary": context_summary,
    }


def get_local_district_info(district: str) -> dict:
    """
    Returns common diseases and crops for a given U.P. district
    by querying the DatasetCache (UP CSV).

    Args:
        district : str  e.g. "Lucknow"

    Returns:
        dict with keys: district, crops, common_diseases
    """
    df = DatasetCache.get_csv()
    if df.empty:
        return {"district": district, "crops": [], "common_diseases": []}

    dist_norm = _normalize(district)

    if "District" not in df.columns:
        return {"district": district, "crops": [], "common_diseases": []}

    mask = df["District"].astype(str).apply(lambda d: dist_norm in _normalize(d))
    local_df = df[mask]

    if local_df.empty:
        return {"district": district, "crops": [], "common_diseases": []}

    crops = []
    if "Crop" in local_df.columns:
        crops = local_df["Crop"].dropna().unique().tolist()[:10]

    diseases = []
    if "Insect_Name" in local_df.columns:
        diseases = local_df["Insect_Name"].dropna().unique().tolist()[:10]

    return {
        "district": district,
        "crops": crops,
        "common_diseases": diseases,
    }


# ─── CLI Test ─────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    predicted = sys.argv[1] if len(sys.argv) > 1 else "Tomato___Late_blight"
    district = sys.argv[2] if len(sys.argv) > 2 else "Lucknow"

    print(f"\n{'='*60}")
    print(f"Testing dataset_loader for: {predicted} | District: {district}")
    print(f"{'='*60}\n")

    ctx = get_disease_context(predicted, district)
    print("=== Context Summary ===")
    print(ctx["context_summary"])
    print("\n=== Full JSON (reference) ===")
    print(json.dumps(ctx.get("reference"), indent=2, ensure_ascii=False))
    print("\n=== District Info ===")
    info = get_local_district_info(district)
    print(json.dumps(info, indent=2, ensure_ascii=False))
