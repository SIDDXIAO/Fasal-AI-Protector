# scanner_app/utils.py
import json

def scan_leaf_image(image_file):
    # ... your actual PyTorch/TensorFlow model prediction logic will go here ...
    
    # Standardize the output into a dictionary for now
    scan_result = {
        "crop_name": "Tomato",
        "disease_detected": "Late Blight",
        "confidence_score": 0.94,
        "status": "Infected"
    }
    return scan_result