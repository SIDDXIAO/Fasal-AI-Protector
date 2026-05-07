import argparse
import os
import torch
from torch.utils.data import DataLoader, random_split, Dataset
from torchvision import transforms
from transformers import ViTForImageClassification, ViTImageProcessor
from torch.optim import AdamW
from torch.optim.lr_scheduler import CosineAnnealingLR
from tqdm import tqdm
from PIL import Image
import gc

# ─────────────────────────────────────────────────────────────
# ⚙️  CONFIGURATION — RTX 3050 4GB ke liye OPTIMIZED
# ─────────────────────────────────────────────────────────────
DATASET_DIR      = r"dataset"
MODEL_SAVE_PATH  = "models/vit_plant_disease"

BATCH_SIZE                 = 16    # 4GB VRAM ke liye safe
GRADIENT_ACCUMULATION_STEPS = 4   # Effective batch = 16x4 = 64
IMAGE_SIZE                 = 224
NUM_EPOCHS                 = 12
LEARNING_RATE              = 2e-5
WEIGHT_DECAY               = 0.01
FP16                       = True
VAL_SPLIT                  = 0.15
NUM_WORKERS                = 4     # Windows pe 8 se crash ho sakta hai
PIN_MEMORY                 = True

# Koi folder skip nahi hoga — saare folders ka data train hoga
SKIP_FOLDERS = set()  # Empty = no folder skipped

# Ye saari "healthy" classes ek single "Healthy" class me merge hongi
HEALTHY_MERGE_CLASSES = {
    "Healthy", "HealthyLeaf", "Healthy Rice Leaf", "No disease", "FRESH_LEAF",
    "Apple___healthy", "Blueberry___healthy", "Cherry_(including_sour)___healthy",
    "Corn_(maize)___healthy", "Grape___healthy", "Peach___healthy",
    "Pepper,_bell___healthy", "Pepper__bell___healthy", "Chilli___healthy",
    "Potato___healthy", "Raspberry___healthy", "Soybean___healthy",
    "Strawberry___healthy", "Tomato___healthy",
}
MERGED_HEALTHY_LABEL = "Healthy"  # Sabka naam yahi hoga

# ─────────────────────────────────────────────────────────────
# 🛠  SMART NESTED DATASET — Flat + Nested dono handle karta hai
# ─────────────────────────────────────────────────────────────
class SmartImageDataset(Dataset):
    """
    Mixed dataset structure handle karta hai:
      - Top-level folder directly images rakhta hai  → folder name = class
      - Top-level folder ke andar aur folders hain   → inner folder name = class

    SKIP_FOLDERS me listed folders ignore kiye jayenge.
    """
    VALID_EXT = {'.png', '.jpg', '.jpeg', '.JPG', '.JPEG', '.PNG', '.bmp', '.BMP'}

    def __init__(self, root_dir, skip_folders=None, healthy_merge=None, merged_label="Healthy"):
        self.image_paths   = []
        self.labels        = []
        self.classes       = []
        self.skip          = skip_folders or set()
        self.healthy_merge = healthy_merge or set()  # Jin classes ko merge karna hai
        self.merged_label  = merged_label

        print(f"\n🔍 Scanning dataset: {root_dir}")
        print(f"🔀 Merging {len(self.healthy_merge)} healthy classes → '{self.merged_label}'\n")

        class_image_map = {}  # {class_name: [paths]}

        for top_folder in sorted(os.listdir(root_dir)):
            top_path = os.path.join(root_dir, top_folder)

            if not os.path.isdir(top_path):
                continue
            if top_folder in self.skip:
                continue

            # Check: kya is folder me direct images hain?
            direct_images = [
                f for f in os.listdir(top_path)
                if os.path.isfile(os.path.join(top_path, f))
                and os.path.splitext(f)[1] in self.VALID_EXT
            ]

            if direct_images:
                # Case 1: Flat folder — top folder name = class
                raw_cls = top_folder
                cls = self.merged_label if raw_cls in self.healthy_merge else raw_cls
                paths = [os.path.join(top_path, f) for f in direct_images]
                class_image_map.setdefault(cls, []).extend(paths)
            else:
                # Case 2: Nested folder — walk karke inner folders = classes
                for dirpath, dirnames, filenames in os.walk(top_path):
                    dirnames[:] = [d for d in dirnames if d not in self.skip]
                    imgs = [
                        os.path.join(dirpath, f) for f in filenames
                        if os.path.splitext(f)[1] in self.VALID_EXT
                    ]
                    if imgs:
                        raw_cls = os.path.basename(dirpath)
                        cls = self.merged_label if raw_cls in self.healthy_merge else raw_cls
                        class_image_map.setdefault(cls, []).extend(imgs)

        # Sort classes for reproducibility
        self.classes      = sorted(class_image_map.keys())
        self.class_to_idx = {c: i for i, c in enumerate(self.classes)}

        for cls, paths in class_image_map.items():
            idx = self.class_to_idx[cls]
            self.image_paths.extend(paths)
            self.labels.extend([idx] * len(paths))

        print(f"✅ Total Classes : {len(self.classes)}")
        print(f"✅ Total Images  : {len(self.image_paths)}\n")

        # Per-class summary
        from collections import Counter
        label_counts = Counter(self.labels)
        for cls in self.classes:
            count = label_counts[self.class_to_idx[cls]]
            flag = " ← MERGED" if cls == self.merged_label else ""
            print(f"   {cls:<55} → {count} images{flag}")

    def __len__(self):
        return len(self.image_paths)

    def __getitem__(self, idx):
        return self.image_paths[idx], self.labels[idx]


class TransformWrapper(Dataset):
    """random_split ke baad alag transforms apply karne ke liye"""
    def __init__(self, subset, transform):
        self.subset    = subset
        self.transform = transform

    def __len__(self):
        return len(self.subset)

    def __getitem__(self, idx):
        img_path, label = self.subset[idx]
        try:
            image = Image.open(img_path).convert('RGB')
            image = self.transform(image)
        except Exception as e:
            print(f"\n⚠️  Corrupt image skipped: {img_path} | Error: {e}")
            # Return a black image as fallback so training doesn't crash
            image = torch.zeros(3, IMAGE_SIZE, IMAGE_SIZE)
        return image, label


# ─────────────────────────────────────────────────────────────
# 🚀  TRAINING FUNCTION
# ─────────────────────────────────────────────────────────────
def train_model():
    print("=" * 65)
    print("  🌾 FASAL AI PROTECTOR — ViT Training (RTX 3050 4GB)")
    print("=" * 65)

    if not os.path.exists(DATASET_DIR):
        raise FileNotFoundError(f"❌ Dataset folder nahi mila: '{DATASET_DIR}'")

    # ── 1. Image Processor ──────────────────────────────────
    processor = ViTImageProcessor.from_pretrained("google/vit-base-patch16-224")
    mean, std = processor.image_mean, processor.image_std

    # ── 2. Augmentation ──────────────────────────────────────
    train_tf = transforms.Compose([
        transforms.Resize((IMAGE_SIZE, IMAGE_SIZE)),
        transforms.RandomHorizontalFlip(p=0.5),
        transforms.RandomVerticalFlip(p=0.2),
        transforms.RandomRotation(20),
        transforms.ColorJitter(brightness=0.3, contrast=0.3, saturation=0.2),
        transforms.RandomGrayscale(p=0.05),
        transforms.ToTensor(),
        transforms.Normalize(mean=mean, std=std),
    ])

    val_tf = transforms.Compose([
        transforms.Resize((IMAGE_SIZE, IMAGE_SIZE)),
        transforms.ToTensor(),
        transforms.Normalize(mean=mean, std=std),
    ])

    # ── 3. Dataset ────────────────────────────────────────────
    base_ds   = SmartImageDataset(
        DATASET_DIR,
        skip_folders=SKIP_FOLDERS,
        healthy_merge=HEALTHY_MERGE_CLASSES,
        merged_label=MERGED_HEALTHY_LABEL,
    )
    n_classes = len(base_ds.classes)

    if n_classes == 0:
        raise ValueError("❌ Koi valid class nahi mili. Folder structure check karein.")

    id2label = {str(i): c for i, c in enumerate(base_ds.classes)}
    label2id = {c: str(i) for i, c in enumerate(base_ds.classes)}

    # ── 4. Train / Val Split ──────────────────────────────────
    val_size   = int(len(base_ds) * VAL_SPLIT)
    train_size = len(base_ds) - val_size
    train_sub, val_sub = random_split(
        base_ds, [train_size, val_size],
        generator=torch.Generator().manual_seed(42)
    )

    train_ds = TransformWrapper(train_sub, train_tf)
    val_ds   = TransformWrapper(val_sub,   val_tf)

    train_loader = DataLoader(
        train_ds, batch_size=BATCH_SIZE, shuffle=True,
        num_workers=NUM_WORKERS, pin_memory=PIN_MEMORY,
        persistent_workers=True
    )
    val_loader = DataLoader(
        val_ds, batch_size=BATCH_SIZE, shuffle=False,
        num_workers=NUM_WORKERS, pin_memory=PIN_MEMORY,
        persistent_workers=True
    )

    print(f"\n📊 Train: {train_size} | Val: {val_size}")
    print(f"📦 Effective Batch Size: {BATCH_SIZE * GRADIENT_ACCUMULATION_STEPS}")

    # ── 5. Model ──────────────────────────────────────────────
    model = ViTForImageClassification.from_pretrained(
        "google/vit-base-patch16-224",
        num_labels=n_classes,
        id2label=id2label,
        label2id=label2id,
        ignore_mismatched_sizes=True,
    )

    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"💻 Device : {device.type.upper()}")
    if device.type == "cuda":
        print(f"🎮 GPU    : {torch.cuda.get_device_name(0)}")
        print(f"💾 VRAM   : {torch.cuda.get_device_properties(0).total_memory / 1e9:.1f} GB")

    model.to(device)

    # ── 6. Optimizer + Scheduler ──────────────────────────────
    optimizer = AdamW(model.parameters(), lr=LEARNING_RATE, weight_decay=WEIGHT_DECAY)
    scheduler = CosineAnnealingLR(optimizer, T_max=NUM_EPOCHS, eta_min=1e-7)
    scaler    = torch.amp.GradScaler('cuda', enabled=FP16 and device.type == "cuda")
    loss_fn   = torch.nn.CrossEntropyLoss(label_smoothing=0.1)

    # ── 7. Training Loop ──────────────────────────────────────
    best_val_acc = 0.0
    history = []

    for epoch in range(NUM_EPOCHS):
        print(f"\n{'─'*55}")
        print(f"  Epoch {epoch+1}/{NUM_EPOCHS}  |  LR: {scheduler.get_last_lr()[0]:.2e}")
        print(f"{'─'*55}")

        # ─ Train ─
        model.train()
        t_loss, t_correct, t_total = 0.0, 0, 0
        optimizer.zero_grad()

        pbar = tqdm(train_loader, desc="  Train", ncols=90)
        for step, (images, labels) in enumerate(pbar):
            images, labels = images.to(device, non_blocking=True), labels.to(device, non_blocking=True)

            with torch.amp.autocast('cuda', enabled=FP16 and device.type == "cuda"):
                logits = model(images).logits
                loss   = loss_fn(logits, labels) / GRADIENT_ACCUMULATION_STEPS

            scaler.scale(loss).backward()

            if (step + 1) % GRADIENT_ACCUMULATION_STEPS == 0:
                scaler.unscale_(optimizer)
                torch.nn.utils.clip_grad_norm_(model.parameters(), max_norm=1.0)
                scaler.step(optimizer)
                scaler.update()
                optimizer.zero_grad()

            t_loss    += loss.item() * GRADIENT_ACCUMULATION_STEPS
            preds      = logits.argmax(dim=1)
            t_correct += (preds == labels).sum().item()
            t_total   += labels.size(0)

            pbar.set_postfix({
                "loss": f"{t_loss/(step+1):.4f}",
                "acc" : f"{t_correct/t_total:.4f}",
                "vram": f"{torch.cuda.memory_allocated()/1e9:.1f}GB" if device.type=="cuda" else "N/A"
            })

        train_acc = t_correct / t_total

        # ─ Validate ─
        model.eval()
        v_loss, v_correct, v_total = 0.0, 0, 0

        with torch.no_grad():
            for images, labels in tqdm(val_loader, desc="  Val  ", ncols=90):
                images, labels = images.to(device, non_blocking=True), labels.to(device, non_blocking=True)
                with torch.amp.autocast('cuda', enabled=FP16 and device.type == "cuda"):
                    logits = model(images).logits
                    loss   = loss_fn(logits, labels)
                v_loss    += loss.item()
                v_correct += (logits.argmax(dim=1) == labels).sum().item()
                v_total   += labels.size(0)

        val_acc = v_correct / v_total
        scheduler.step()

        print(f"\n  📈 Train Acc: {train_acc:.4f} | Val Acc: {val_acc:.4f}")
        history.append({"epoch": epoch+1, "train_acc": train_acc, "val_acc": val_acc})

        # ─ Save Best ─
        if val_acc > best_val_acc:
            best_val_acc = val_acc
            save_dir = os.path.join(MODEL_SAVE_PATH, "best")
            os.makedirs(save_dir, exist_ok=True)
            model.save_pretrained(save_dir)
            processor.save_pretrained(save_dir)
            print(f"  🌟 Best model saved! Val Acc = {best_val_acc:.4f}")

        # ─ VRAM cleanup ─
        gc.collect()
        if device.type == "cuda":
            torch.cuda.empty_cache()

    # ── 8. Final Summary ──────────────────────────────────────
    print("\n" + "=" * 55)
    print("  🎉 Training Complete!")
    print(f"  Best Val Accuracy : {best_val_acc:.4f}")
    print(f"  Model saved at    : {os.path.join(MODEL_SAVE_PATH, 'best')}")
    print("=" * 55)

    print("\n📋 Epoch History:")
    print(f"  {'Epoch':<8} {'Train Acc':<14} {'Val Acc'}")
    for h in history:
        print(f"  {h['epoch']:<8} {h['train_acc']:<14.4f} {h['val_acc']:.4f}")


# ─────────────────────────────────────────────────────────────
# ENTRY POINT
# ─────────────────────────────────────────────────────────────
if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Fasal AI — ViT Trainer (RTX 3050 4GB)")
    parser.add_argument('--mode', required=True, choices=['train'])
    parser.add_argument('--gpu',  default='0', help='GPU ID (default: 0)')
    args = parser.parse_args()

    os.environ["CUDA_VISIBLE_DEVICES"] = args.gpu

    if args.mode == 'train':
        train_model()