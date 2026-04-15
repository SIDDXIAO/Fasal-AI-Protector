"""
Plant Disease Detection - ML Service
ViT model predictions ko Reference CSV + UP CSV Dataset se match karta hai
Aur LLM (Gemma-2 / Mistral) ke through smart response generate karta hai.
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
import json
import requests
import pandas as pd
from django.conf import settings

# Ollama API URL for local LLMs
GEMMA_AI_BASE_URL="http://192.168.1.24:1234"
# ─────────────────────────────────────────────
# Dataset Loader - App startup par ek baar load
# ─────────────────────────────────────────────

class DatasetCache:
    """Dono CSV datasets (Reference aur UP Data) ko memory mein cache karta hai"""
    _ref_df = None
    _csv_df = None

    @classmethod
    def get_reference_csv(cls):
        """Ab ye Excel ki jagah aapki nayi CSV file ko read karega"""
        if cls._ref_df is None:
            ref_path = os.path.join(settings.BASE_DIR, "Crop_Wise_LEAF_DISEASE_Reference_Guide.csv")
            if os.path.exists(ref_path):
                try:
                    df = pd.read_csv(ref_path) # Changed to read_csv
                    df = df[df["Disease Name"].notna()].copy()
                    df["_crop_norm"] = df["Crop Name"].astype(str).apply(_normalize)
                    df["_disease_norm"] = df["Disease Name"].astype(str).apply(_normalize)
                    cls._ref_df = df
                    print(f"[OK] Reference CSV loaded: {len(df)} disease records")
                except Exception as e:
                    print(f"[WARN] Error loading Reference CSV: {e}")
                    cls._ref_df = pd.DataFrame()
            else:
                print(f"[WARN] Reference CSV not found at: {ref_path}")
                cls._ref_df = pd.DataFrame()
        return cls._ref_df

    @classmethod
    def get_csv(cls):
        """Ye UP wali teeno files read karega"""
        if cls._csv_df is None:
            dfs = []
            base_dir = settings.BASE_DIR
            csv_files = [
                "UP_Complete_PART1.csv",
                "UP_Complete_PART2.csv",
                "UP_Complete_PART3.csv",
                "Crop_Wise_LEAF_DISEASE_Reference_Guide.csv",
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
    text = text.lower()
    text = re.sub(r"[^a-z\s]", " ", text)
    text = re.sub(r"\s+", " ", text).strip()
    return text


def _score_match(query_words: list, target: str) -> int:
    return sum(1 for w in query_words if w in target)


# ─────────────────────────────────────────────
# Core Matching Logic
# ─────────────────────────────────────────────

def _match_from_reference(crop_norm: str, disease_norm: str) -> dict | None:
    df = DatasetCache.get_reference_csv()
    if df.empty: return None

    disease_words = [w for w in disease_norm.split() if len(w) > 2]
    crop_words = [w for w in crop_norm.split() if len(w) > 2]

    if not disease_words: return None

    def crop_match(row_crop): return any(w in row_crop for w in crop_words)
    crop_matched = df[df["_crop_norm"].apply(crop_match)]
    search_pool = crop_matched if not crop_matched.empty else df

    scores = search_pool["_disease_norm"].apply(lambda d: _score_match(disease_words, d))

    if scores.max() == 0:
        scores = df["_disease_norm"].apply(lambda d: _score_match(disease_words, d))
        if scores.max() == 0: return None
        best_row = df.iloc[scores.idxmax()]
    else:
        best_row = search_pool.iloc[scores.idxmax()]

    return {
        "source": "csv_reference",
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
    df = DatasetCache.get_csv()
    if df.empty: return []

    disease_words = [w for w in disease_norm.split() if len(w) > 2]
    crop_words = [w for w in crop_norm.split() if len(w) > 2]

    if not disease_words: return []

    if crop_words:
        crop_mask = df["_crop_norm"].apply(lambda c: any(w in c for w in crop_words))
        crop_pool = df[crop_mask]
    else:
        crop_pool = df

    if crop_pool.empty: crop_pool = df

    if district:
        dist_norm = _normalize(district)
        dist_mask = crop_pool["District"].astype(str).apply(lambda d: dist_norm in _normalize(d))
        if dist_mask.any(): crop_pool = crop_pool[dist_mask]

    scores = crop_pool["_insect_norm"].apply(lambda i: _score_match(disease_words, i))
    if scores.max() == 0: return []

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
    crop_norm = _normalize(crop)
    disease_norm = _normalize(disease)

    ref_result = _match_from_reference(crop_norm, disease_norm)
    csv_results = _match_from_csv(crop_norm, disease_norm, district=location)

    return {
        "reference": ref_result,
        "treatments": csv_results,
        "matched": bool(ref_result or csv_results),
    }

# ─────────────────────────────────────────────
# LLM Integration (RAG Logic)
# ─────────────────────────────────────────────

def generate_smart_advice(crop: str, disease: str, is_healthy: bool, dataset_result: dict, location: str) -> str:
    """LLM ko local data feed karke smart expert advice generate karta hai."""
    
    if is_healthy:
        return f"Badhai ho! Aapki {crop} ki fasal bilkul swasth (Healthy) lag rahi hai. Kripya niyamit roop se khet ki nigrani karte rahein."

    # Dataset matched data ko JSON me convert karo taaki LLM read kar sake
    local_data = {
        "reference_guide_info": dataset_result.get("reference"),
        "district_level_treatments": dataset_result.get("treatments")
    }
    local_data_json = json.dumps(local_data, ensure_ascii=False)

    prompt = f"""
    You are 'Fasal AI', an expert Indian Agricultural Assistant.
    A farmer from '{location}' uploaded an image of their '{crop}'.
    Our Vision Model detected the disease/pest: '{disease}'.

    Here is the exact treatment, pesticide, and localized data from our verified UP Database in JSON format:
    {local_data_json}

    INSTRUCTIONS:
    1. Write a highly helpful, easy-to-understand response for the farmer.
    2. Base your treatment advice STRICTLY on the 'verified dataset' provided above. Do not invent pesticides.
    3. Keep the tone empathetic and respectful. Mention their location ({location}) to make it personalized.
    4. Provide the solution in clear bullet points (Cause, Chemical Treatment, Organic Treatment).
    5. Keep it concise and use a mix of Hindi and English (Hinglish) if possible.
    """

    # Primary Model: Gemma-2
    try:
        print("[LLM] Generating advice using Gemma-2...")
        res = requests.post(LLM_API_URL, json={"model": "gemma2", "prompt": prompt, "stream": False}, timeout=30)
        res.raise_for_status()
        return res.json().get('response', '')
    except Exception as e:
        print(f"[LLM] Gemma-2 failed: {e}. Switching to Mistral 7B...")
        
        # Secondary Model: Mistral
        try:
            res = requests.post(LLM_API_URL, json={"model": "mistral", "prompt": prompt, "stream": False}, timeout=30)
            res.raise_for_status()
            return res.json().get('response', '')
        except Exception as e2:
            print(f"[LLM] Mistral also failed: {e2}")
            # Fallback text in case both models are offline
            return "Kshama karein, abhi hamara AI system busy hai. Kripya neeche diye gaye Treatment Cards me dawaiyo ki jaankari dekhein."


# ─────────────────────────────────────────────
# ViT Plant Disease Detector
# ─────────────────────────────────────────────

class PlantDiseaseDetector:
    """Vision Transformer (ViT) based plant disease detection with LLM RAG"""

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
        if not HAS_TORCH: return
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

    def predict(self, img_path: str, top_k: int = 3, user_location: str = "Uttar Pradesh") -> dict:
        """Plant image analyze karo, dataset se data nikalo, aur LLM se advice lo."""
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

            # Class Name Parse
            parts = predicted_class.split("___")
            if len(parts) == 2:
                crop = parts[0].replace("_", " ").strip()
                disease = parts[1].replace("_", " ").strip()
            else:
                crop = "Unknown"
                disease = predicted_class.replace("_", " ").strip()

            is_healthy = any(kw in disease.lower() for kw in ["healthy", "normal", "no disease"])

            # 1. Dataset Matching
            dataset_result = {"reference": None, "treatments": [], "matched": False}
            if not is_healthy:
                dataset_result = get_disease_treatment(crop, disease, location=user_location)

            # 2. RAG LLM Integration (Get Smart Advice)
            llm_advice = generate_smart_advice(
                crop=crop, 
                disease=disease, 
                is_healthy=is_healthy, 
                dataset_result=dataset_result, 
                location=user_location
            )

            return {
                "predictions": top_predictions,
                "is_healthy": is_healthy,
                "top_disease": disease,
                "top_crop": crop,
                "confidence": round(confidence, 4),
                "reference_data": dataset_result["reference"],
                "treatments": dataset_result["treatments"],
                "dataset_matched": dataset_result["matched"],
                "llm_expert_advice": llm_advice # Frontend par dikhane ke liye naya parameter
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
            "llm_expert_advice": "System currently unavailable."
        }


# Singleton - app startup par ek baar initialize
detector = PlantDiseaseDetector()