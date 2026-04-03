"""
Plant Disease Detection - ML Service
ViT model predictions ko XLSX Reference Guide + UP CSV Dataset se match karta hai
"""
try:
    import torch
    from transformers import ViTForImageClassification, ViTImageProcessor
    HAS_TORCH = True
except ImportError:
    HAS_TORCH = False
    print("[WARNING] PyTorch/Transformers not installed. Scanner will return mock results.")
from PIL import Image
import os
import re
import pandas as pd
from django.conf import settings


# ─────────────────────────────────────────────
# Dataset Loader - App startup par ek baar load
# ─────────────────────────────────────────────

class DatasetCache:
    """XLSX aur CSV dono datasets ko memory mein cache karta hai"""
    _xlsx_df = None
    _csv_df = None

    @classmethod
    def get_xlsx(cls):
        if cls._xlsx_df is None:
            # Look at project root (not inside data/ subfolder)
            xlsx_path = os.path.join(settings.BASE_DIR, "Crop_Wise_LEAF_DISEASE_Reference_Guide.xlsx")
            if os.path.exists(xlsx_path):
                try:
                    df = pd.read_excel(xlsx_path)
                    # Header rows (emoji wali) ko hata do
                    df = df[df["Disease Name"].notna()].copy()
                    # Normalized columns banao matching ke liye
                    df["_crop_norm"] = df["Crop Name"].astype(str).apply(_normalize)
                    df["_disease_norm"] = df["Disease Name"].astype(str).apply(_normalize)
                    cls._xlsx_df = df
                    print(f"[OK] XLSX loaded: {len(df)} disease records")
                except Exception as e:
                    print(f"[WARN] Error loading XLSX: {e}")
                    cls._xlsx_df = pd.DataFrame()
            else:
                print(f"[WARN] XLSX not found at: {xlsx_path}")
                cls._xlsx_df = pd.DataFrame()
        return cls._xlsx_df

    @classmethod
    def get_csv(cls):
        if cls._csv_df is None:
            dfs = []
            base_dir = settings.BASE_DIR
            # Try uncompressed CSV files at project root first
            csv_files = [
                "UP_Complete_PART1.csv",
                "UP_Complete_PART2.csv",
                "UP_Complete_PART3.csv",
            ]
            for filename in csv_files:
                path = os.path.join(base_dir, filename)
                if os.path.exists(path):
                    try:
                        df = pd.read_csv(path, low_memory=False)
                        dfs.append(df)
                        print(f"[OK] CSV loaded: {filename} ({len(df)} rows)")
                    except Exception as e:
                        print(f"[WARN] Error loading {filename}: {e}")

            # Fallback: try gzipped versions in data/ folder
            if not dfs:
                import gzip
                data_dir = os.path.join(base_dir, "data")
                gz_files = [
                    "UP_Complete_PART1_csv.gz",
                    "UP_Complete_PART2_csv.gz",
                    "UP_Complete_PART3_csv.gz",
                ]
                for filename in gz_files:
                    path = os.path.join(data_dir, filename)
                    if os.path.exists(path):
                        try:
                            with gzip.open(path, "rt", encoding="utf-8") as f:
                                dfs.append(pd.read_csv(f))
                        except Exception as e:
                            print(f"[WARN] Error loading {filename}: {e}")

            if dfs:
                df = pd.concat(dfs, ignore_index=True)
                # Deduplicate - same crop+insect ka sirf ek record
                if "Crop" in df.columns and "Insect_Name" in df.columns:
                    df = df.drop_duplicates(subset=["Crop", "Insect_Name"]).copy()
                    df["_crop_norm"] = df["Crop"].astype(str).apply(_normalize)
                    df["_insect_norm"] = df["Insect_Name"].astype(str).apply(_normalize)
                cls._csv_df = df
                print(f"[OK] CSV total: {len(df)} unique records")
            else:
                print("[WARN] No CSV data files found")
                cls._csv_df = pd.DataFrame()
        return cls._csv_df


def _normalize(text: str) -> str:
    """Text ko lowercase + sirf alphabets/spaces mein convert karo"""
    text = text.lower()
    text = re.sub(r"[^a-z\s]", " ", text)
    text = re.sub(r"\s+", " ", text).strip()
    return text


def _score_match(query_words: list, target: str) -> int:
    """Kitne query words target mein match hote hain"""
    return sum(1 for w in query_words if w in target)


# ─────────────────────────────────────────────
# Core Matching Logic
# ─────────────────────────────────────────────

def _match_from_xlsx(crop_norm: str, disease_norm: str) -> dict | None:
    """
    XLSX Reference Guide se best matching disease find karo.
    """
    df = DatasetCache.get_xlsx()
    if df.empty:
        return None

    disease_words = [w for w in disease_norm.split() if len(w) > 2]
    crop_words = [w for w in crop_norm.split() if len(w) > 2]

    if not disease_words:
        return None

    # Crop filter
    def crop_match(row_crop):
        return any(w in row_crop for w in crop_words)

    crop_matched = df[df["_crop_norm"].apply(crop_match)]
    search_pool = crop_matched if not crop_matched.empty else df

    # Disease score
    scores = search_pool["_disease_norm"].apply(
        lambda d: _score_match(disease_words, d)
    )

    if scores.max() == 0:
        scores = df["_disease_norm"].apply(
            lambda d: _score_match(disease_words, d)
        )
        if scores.max() == 0:
            return None
        best_row = df.iloc[scores.idxmax()]
    else:
        best_row = search_pool.iloc[scores.idxmax()]

    return {
        "source": "xlsx_reference",
        "crop": best_row.get("Crop Name", ""),
        "disease_name": best_row.get("Disease Name", ""),
        "hindi_name": best_row.get("Hindi Name", ""),
        "local_name": best_row.get("Common/Local Name", ""),
        "type": best_row.get("Type", ""),
        "damage_description": best_row.get("Damage Description", ""),
        "how_to_recognize": best_row.get("How to Recognize", ""),
        "best_control_time": best_row.get("Best Control Time", ""),
        "treatment_options": best_row.get("Treatment Options", ""),
        "mrp_2026": best_row.get("MRP (2026)", ""),
        "season": best_row.get("Season", ""),
    }


def _match_from_csv(crop_norm: str, disease_norm: str, district: str = None) -> list:
    """
    UP CSV Dataset se treatment data lo.
    """
    df = DatasetCache.get_csv()
    if df.empty:
        return []

    disease_words = [w for w in disease_norm.split() if len(w) > 2]
    crop_words = [w for w in crop_norm.split() if len(w) > 2]

    if not disease_words:
        return []

    # Step 1: Crop filter
    if crop_words:
        crop_mask = df["_crop_norm"].apply(lambda c: any(w in c for w in crop_words))
        crop_pool = df[crop_mask]
    else:
        crop_pool = df

    if crop_pool.empty:
        crop_pool = df

    # Step 2: District filter (optional)
    if district:
        dist_norm = _normalize(district)
        dist_mask = crop_pool["District"].astype(str).apply(
            lambda d: dist_norm in _normalize(d)
        )
        if dist_mask.any():
            crop_pool = crop_pool[dist_mask]

    # Step 3: Disease/insect score
    scores = crop_pool["_insect_norm"].apply(
        lambda i: _score_match(disease_words, i)
    )

    if scores.max() == 0:
        return []

    # Top 3 matches
    top_idx = scores.nlargest(3).index
    results = []
    for idx in top_idx:
        row = crop_pool.loc[idx]
        if pd.notna(row.get("Pesticide_Options")):
            results.append({
                "source": "csv_district_data",
                "district": row.get("District", ""),
                "village": row.get("Village", ""),
                "crop": row.get("Crop", ""),
                "insect_name": row.get("Insect_Name", ""),
                "insect_hindi": row.get("Insect_Hindi_Name", ""),
                "insect_type": row.get("Insect_Type", ""),
                "damage_type": row.get("Damage_Type", ""),
                "how_to_recognize": row.get("How_To_Recognize", ""),
                "best_control_time": row.get("Best_Control_Time", ""),
                "pesticide_options": row.get("Pesticide_Options", ""),
                "mrp_2026": row.get("MRP_2026", ""),
                "application_method": row.get("Application_Method", ""),
            })

    return results


def get_disease_treatment(crop: str, disease: str, location: str = None) -> dict:
    """
    Crop aur disease name se complete treatment information lo.
    XLSX + CSV dono sources check karta hai.
    """
    crop_norm = _normalize(crop)
    disease_norm = _normalize(disease)

    xlsx_result = _match_from_xlsx(crop_norm, disease_norm)
    csv_results = _match_from_csv(crop_norm, disease_norm, district=location)

    return {
        "reference": xlsx_result,
        "treatments": csv_results,
        "matched": bool(xlsx_result or csv_results),
    }


# ─────────────────────────────────────────────
# ViT Plant Disease Detector
# ─────────────────────────────────────────────

class PlantDiseaseDetector:
    """Vision Transformer (ViT) based plant disease detection"""

    def __init__(self):
        self.model_path = os.path.join(settings.AI_MODEL_PATH, "vit_plant_disease", "best")
        self.model = None
        self.processor = None

        if not HAS_TORCH:
            print("[WARN] PyTorch not available. Detector will use mock predictions.")
            return

        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        self._load_model()

    def _load_model(self):
        if not HAS_TORCH:
            return
        try:
            if os.path.exists(self.model_path):
                print(f"Loading ViT model from {self.model_path}...")
                self.model = ViTForImageClassification.from_pretrained(self.model_path)
                self.processor = ViTImageProcessor.from_pretrained("google/vit-base-patch16-224")
                self.model.to(self.device)
                self.model.eval()
                print("[OK] ViT Model loaded successfully.")
            else:
                print(f"[WARN] ViT model not found at {self.model_path}.")
        except Exception as e:
            print(f"[ERROR] Error loading ViT model: {e}")

    def predict(self, img_path: str, top_k: int = 3, user_location: str = None) -> dict:
        """Plant image analyze karo aur dataset se treatment dhundo."""
        if not HAS_TORCH or not self.model:
            return self._dummy_prediction("Model not trained or PyTorch not installed.")

        try:
            image = Image.open(img_path).convert("RGB")
            inputs = self.processor(images=image, return_tensors="pt").to(self.device)

            with torch.no_grad():
                outputs = self.model(**inputs)
                logits = outputs.logits
                probs = torch.nn.functional.softmax(logits, dim=-1)

                top_prob, top_idx = torch.max(probs, dim=-1)
                predicted_class = self.model.config.id2label[str(top_idx.item())]
                confidence = top_prob.item()

                top_k_probs, top_k_indices = torch.topk(probs, min(top_k, probs.shape[-1]))
                top_predictions = [
                    {
                        "label": self.model.config.id2label[str(idx.item())],
                        "score": round(prob.item(), 4),
                    }
                    for prob, idx in zip(top_k_probs[0], top_k_indices[0])
                ]

            print(f"ViT Prediction: {predicted_class} (confidence: {confidence:.2%})")

            # Class Name Parse (Format: "Crop___Disease_Name")
            parts = predicted_class.split("___")
            if len(parts) == 2:
                crop = parts[0].replace("_", " ").strip()
                disease = parts[1].replace("_", " ").strip()
            else:
                crop = "Unknown"
                disease = predicted_class.replace("_", " ").strip()

            is_healthy = any(
                kw in disease.lower() for kw in ["healthy", "normal", "no disease"]
            )

            # Dataset Matching
            dataset_result = {"reference": None, "treatments": [], "matched": False}
            if not is_healthy:
                dataset_result = get_disease_treatment(crop, disease, location=user_location)

            return {
                "predictions": top_predictions,
                "is_healthy": is_healthy,
                "top_disease": disease,
                "top_crop": crop,
                "confidence": round(confidence, 4),
                "reference_data": dataset_result["reference"],
                "treatments": dataset_result["treatments"],
                "dataset_matched": dataset_result["matched"],
            }

        except Exception as e:
            print(f"Prediction Error: {e}")
            return self._dummy_prediction(str(e))

    def _dummy_prediction(self, error_msg: str = "Unknown Error") -> dict:
        return {
            "predictions": [],
            "is_healthy": False,
            "top_disease": f"Analysis Failed: {error_msg}",
            "top_crop": "Unknown",
            "confidence": 0.0,
            "reference_data": None,
            "treatments": [],
            "dataset_matched": False,
        }


# Singleton - app startup par ek baar initialize
detector = PlantDiseaseDetector()