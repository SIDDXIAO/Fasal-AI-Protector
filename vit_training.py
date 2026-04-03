import argparse
import os
import torch
from torch.utils.data import DataLoader, random_split
from torchvision import datasets, transforms
from transformers import ViTForImageClassification, ViTImageProcessor, get_linear_schedule_with_warmup
from torch.optim import AdamW
from torch.cuda.amp import autocast, GradScaler
from tqdm import tqdm
import json

# --- CONFIGURATION ---
BATCH_SIZE = 32             # dGPU ke liye increase kiya (8GB+ VRAM ke liye 64 bhi kar sakte ho)
IMAGE_SIZE = 224
NUM_EPOCHS = 10
LEARNING_RATE = 2e-5
FP16 = True                 # Mixed Precision - fast training
VAL_SPLIT = 0.1             # 10% validation data
NUM_WORKERS = 4             # DataLoader workers (CPU cores)
DATASET_DIR = "dataset/New Plant Diseases Dataset(Augmented)/train"
MODEL_SAVE_PATH = "models/vit_plant_disease"
GRADIENT_ACCUMULATION_STEPS = 2  # Effective batch size = BATCH_SIZE * GRAD_ACCUM

# -------------------------------------------------------
# GPU SELECTION: Agar multiple GPUs hain to yahan set karo
# "0" = pehla GPU, "1" = doosra GPU, "0,1" = dono
# -------------------------------------------------------
os.environ["CUDA_VISIBLE_DEVICES"] = "1"  # RTX 3050 GPU 1 pe hai (GPU 0 = Intel iGPU)


def get_device():
    """dGPU ko force karta hai, CPU pe nahi jaata."""
    if not torch.cuda.is_available():
        raise RuntimeError(
            "❌ CUDA GPU nahi mili! \n"
            "  - NVIDIA drivers check karo: nvidia-smi\n"
            "  - PyTorch CUDA version check karo: torch.version.cuda\n"
            "  - Agar laptop hai aur dGPU+iGPU dono hain, to CUDA_VISIBLE_DEVICES=0 set karo"
        )
    
    device = torch.device('cuda:0')
    gpu_name = torch.cuda.get_device_name(0)
    vram = torch.cuda.get_device_properties(0).total_memory / 1024**3
    
    print(f"✅ GPU Found: {gpu_name}")
    print(f"   VRAM: {vram:.2f} GB")
    print(f"   CUDA Version: {torch.version.cuda}")
    
    # VRAM ke hisaab se batch size suggest karna
    if vram < 4:
        print("⚠️  Warning: VRAM < 4GB. BATCH_SIZE=4 karo aur GRADIENT_ACCUMULATION_STEPS=8 karo")
    elif vram < 8:
        print("ℹ️  VRAM 4-8GB. BATCH_SIZE=16 recommended")
    elif vram >= 8:
        print("✅ VRAM >= 8GB. BATCH_SIZE=32+ chal sakta hai")
    
    return device


def get_transforms(processor):
    """Train aur validation ke liye alag transforms."""
    
    train_transform = transforms.Compose([
        transforms.Resize((IMAGE_SIZE, IMAGE_SIZE)),
        transforms.RandomHorizontalFlip(),
        transforms.RandomVerticalFlip(),
        transforms.RandomRotation(15),
        transforms.ColorJitter(brightness=0.2, contrast=0.2, saturation=0.2),
        transforms.ToTensor(),
        transforms.Normalize(mean=processor.image_mean, std=processor.image_std)
    ])
    
    val_transform = transforms.Compose([
        transforms.Resize((IMAGE_SIZE, IMAGE_SIZE)),
        transforms.ToTensor(),
        transforms.Normalize(mean=processor.image_mean, std=processor.image_std)
    ])
    
    return train_transform, val_transform


def train():
    print("=" * 50)
    print("   ViT Plant Disease - dGPU Training")
    print("=" * 50)
    print(f"Config: Batch={BATCH_SIZE}, Epochs={NUM_EPOCHS}, LR={LEARNING_RATE}, FP16={FP16}")
    print(f"Grad Accumulation Steps: {GRADIENT_ACCUMULATION_STEPS}")
    print(f"Effective Batch Size: {BATCH_SIZE * GRADIENT_ACCUMULATION_STEPS}")
    
    # --- 1. dGPU Force ---
    device = get_device()
    
    # Dataset check
    if not os.path.exists(DATASET_DIR):
        print(f"\n❌ Error: Dataset directory '{DATASET_DIR}' nahi mili.")
        print("Structure hona chahiye: dataset/class_name/image.jpg")
        return

    # --- 2. Data Loading ---
    processor = ViTImageProcessor.from_pretrained('google/vit-base-patch16-224')
    train_transform, val_transform = get_transforms(processor)
    
    # Full dataset load
    full_dataset = datasets.ImageFolder(root=DATASET_DIR, transform=train_transform)
    labels = full_dataset.classes
    num_labels = len(labels)
    print(f"\nFound {num_labels} classes")
    
    # Train/Val split
    val_size = int(len(full_dataset) * VAL_SPLIT)
    train_size = len(full_dataset) - val_size
    train_dataset, val_dataset = random_split(full_dataset, [train_size, val_size])
    
    # Validation ko alag transform dena
    val_dataset.dataset = datasets.ImageFolder(root=DATASET_DIR, transform=val_transform)
    
    # DataLoader - pin_memory=True GPU ke liye speed badhata hai
    train_loader = DataLoader(
        train_dataset,
        batch_size=BATCH_SIZE,
        shuffle=True,
        num_workers=NUM_WORKERS,
        pin_memory=True,       # CPU se GPU transfer fast hota hai
        prefetch_factor=2      # Agle batch ko pehle se load karta hai
    )
    
    val_loader = DataLoader(
        val_dataset,
        batch_size=BATCH_SIZE * 2,  # Validation mein grad nahi, to bada batch chal sakta hai
        shuffle=False,
        num_workers=NUM_WORKERS,
        pin_memory=True
    )
    
    print(f"Train samples: {train_size} | Val samples: {val_size}")
    print(f"Train batches: {len(train_loader)} | Val batches: {len(val_loader)}")

    # --- 3. Model ---
    model = ViTForImageClassification.from_pretrained(
        'google/vit-base-patch16-224',
        num_labels=num_labels,
        id2label={str(i): c for i, c in enumerate(labels)},
        label2id={c: str(i) for i, c in enumerate(labels)},
        ignore_mismatched_sizes=True
    )
    model.to(device)
    
    # Multi-GPU support (agar 2+ GPUs hain)
    if torch.cuda.device_count() > 1:
        print(f"🚀 {torch.cuda.device_count()} GPUs mili! DataParallel use ho raha hai.")
        model = torch.nn.DataParallel(model)

    # --- 4. Optimizer + Scheduler ---
    optimizer = AdamW(model.parameters(), lr=LEARNING_RATE, weight_decay=0.01)
    
    total_steps = len(train_loader) * NUM_EPOCHS // GRADIENT_ACCUMULATION_STEPS
    warmup_steps = total_steps // 10  # 10% warmup
    
    scheduler = get_linear_schedule_with_warmup(
        optimizer,
        num_warmup_steps=warmup_steps,
        num_training_steps=total_steps
    )
    
    # --- 5. FP16 Mixed Precision ---
    scaler = GradScaler(enabled=FP16)
    
    os.makedirs(MODEL_SAVE_PATH, exist_ok=True)
    best_val_acc = 0.0
    history = []

    # --- 6. Training Loop ---
    for epoch in range(NUM_EPOCHS):
        print(f"\n{'='*40}")
        print(f"Epoch {epoch+1}/{NUM_EPOCHS}")
        print(f"{'='*40}")
        
        # VRAM usage print karo
        allocated = torch.cuda.memory_allocated(0) / 1024**3
        reserved = torch.cuda.memory_reserved(0) / 1024**3
        print(f"GPU Memory: {allocated:.2f}GB allocated / {reserved:.2f}GB reserved")
        
        # --- Train Phase ---
        model.train()
        total_loss = 0
        optimizer.zero_grad()
        
        progress_bar = tqdm(train_loader, desc="Training", unit="batch")
        for step, (inputs, targets) in enumerate(progress_bar):
            
            # Non-blocking GPU transfer (pin_memory ke saath kaam karta hai)
            inputs = inputs.to(device, non_blocking=True)
            targets = targets.to(device, non_blocking=True)
            
            # Mixed Precision Forward Pass
            with autocast(enabled=FP16):
                outputs = model(pixel_values=inputs, labels=targets)
                loss = outputs.loss
                
                # Gradient accumulation ke liye loss scale karo
                loss = loss / GRADIENT_ACCUMULATION_STEPS
            
            # Backward
            scaler.scale(loss).backward()
            
            # Gradient accumulation - har N steps pe update
            if (step + 1) % GRADIENT_ACCUMULATION_STEPS == 0:
                scaler.unscale_(optimizer)
                torch.nn.utils.clip_grad_norm_(model.parameters(), max_norm=1.0)
                scaler.step(optimizer)
                scaler.update()
                scheduler.step()
                optimizer.zero_grad()
            
            total_loss += loss.item() * GRADIENT_ACCUMULATION_STEPS
            progress_bar.set_postfix({
                'loss': f"{loss.item() * GRADIENT_ACCUMULATION_STEPS:.4f}",
                'lr': f"{scheduler.get_last_lr()[0]:.2e}"
            })
        
        avg_train_loss = total_loss / len(train_loader)
        
        # --- Validation Phase ---
        model.eval()
        val_loss = 0
        correct = 0
        total = 0
        
        with torch.no_grad():
            val_bar = tqdm(val_loader, desc="Validation", unit="batch")
            for inputs, targets in val_bar:
                inputs = inputs.to(device, non_blocking=True)
                targets = targets.to(device, non_blocking=True)
                
                with autocast(enabled=FP16):
                    outputs = model(pixel_values=inputs, labels=targets)
                
                val_loss += outputs.loss.item()
                preds = outputs.logits.argmax(dim=-1)
                correct += (preds == targets).sum().item()
                total += targets.size(0)
                
                val_bar.set_postfix({'acc': f"{correct/total*100:.1f}%"})
        
        avg_val_loss = val_loss / len(val_loader)
        val_acc = correct / total * 100
        
        print(f"\n📊 Results:")
        print(f"   Train Loss: {avg_train_loss:.4f}")
        print(f"   Val Loss:   {avg_val_loss:.4f}")
        print(f"   Val Acc:    {val_acc:.2f}%")
        
        history.append({
            'epoch': epoch + 1,
            'train_loss': avg_train_loss,
            'val_loss': avg_val_loss,
            'val_acc': val_acc
        })
        
        # Best model save karo
        save_model = model.module if hasattr(model, 'module') else model
        
        if val_acc > best_val_acc:
            best_val_acc = val_acc
            save_model.save_pretrained(os.path.join(MODEL_SAVE_PATH, "best"))
            print(f"   ✅ Best model saved! (Acc: {best_val_acc:.2f}%)")
        
        # Har epoch ka checkpoint bhi save karo
        save_model.save_pretrained(os.path.join(MODEL_SAVE_PATH, "last"))
    
    # Training history save karo
    with open(os.path.join(MODEL_SAVE_PATH, "training_history.json"), "w") as f:
        json.dump(history, f, indent=2)
    
    print("\n" + "="*50)
    print(f"✅ Training Complete!")
    print(f"   Best Val Accuracy: {best_val_acc:.2f}%")
    print(f"   Model saved to: {MODEL_SAVE_PATH}/best")
    print("="*50)


def predict(image_path):
    print(f"--- Predicting for: {image_path} ---")
    
    best_model_path = os.path.join(MODEL_SAVE_PATH, "best")
    if not os.path.exists(best_model_path):
        print(f"❌ Model nahi mila: {best_model_path}")
        print("Pehle --mode train karo")
        return

    # Predict ke liye GPU optional hai, CPU pe bhi chalta hai
    device = torch.device('cuda:0' if torch.cuda.is_available() else 'cpu')
    print(f"Using device: {device}")

    try:
        model = ViTForImageClassification.from_pretrained(best_model_path)
        model.to(device)
        model.eval()
        
        processor = ViTImageProcessor.from_pretrained('google/vit-base-patch16-224')
        
        from PIL import Image
        image = Image.open(image_path).convert("RGB")
        inputs = processor(images=image, return_tensors="pt").to(device)
        
        with torch.no_grad():
            with autocast(enabled=(device.type == 'cuda' and FP16)):
                outputs = model(**inputs)
                logits = outputs.logits
        
        # Top-3 predictions dikhao
        probs = torch.softmax(logits, dim=-1)[0]
        top3 = torch.topk(probs, 3)
        
        print("\n🌿 Prediction Results:")
        for prob, idx in zip(top3.values, top3.indices):
            label = model.config.id2label[str(idx.item())]
            print(f"   {label}: {prob.item()*100:.2f}%")
            
    except Exception as e:
        print(f"❌ Error during prediction: {e}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="ViT Plant Disease - dGPU Optimized")
    parser.add_argument('--mode', type=str, required=True,
                        choices=['train', 'predict'],
                        help='Mode: train ya predict')
    parser.add_argument('--image', type=str,
                        help='Prediction ke liye image path')
    parser.add_argument('--gpu', type=str, default='1',
                        help='GPU ID (default: 1 = RTX 3050). Multi-GPU ke liye: "0,1"')
    
    args = parser.parse_args()
    
    # GPU ID set karo
    os.environ["CUDA_VISIBLE_DEVICES"] = args.gpu
    
    if args.mode == 'train':
        train()
    elif args.mode == 'predict':
        if not args.image:
            print("❌ Error: --image argument chahiye prediction ke liye")
        else:
            predict(args.image)