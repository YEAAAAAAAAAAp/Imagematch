from functools import lru_cache
from io import BytesIO
from typing import Tuple

import numpy as np
from PIL import Image
import torch
from transformers import CLIPModel, CLIPProcessor
try:
    from .face_preprocess import preprocess_face
except Exception:
    # Optional dependency. If import fails, no face preprocessing will be applied.
    preprocess_face = None  # type: ignore


MODEL_NAME = "openai/clip-vit-base-patch32"


def _load_image(img_bytes: bytes) -> Image.Image:
    image = Image.open(BytesIO(img_bytes))
    if image.mode != "RGB":
        image = image.convert("RGB")
    return image


@lru_cache(maxsize=1)
def get_clip() -> Tuple[CLIPModel, CLIPProcessor, torch.device]:
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    model = CLIPModel.from_pretrained(MODEL_NAME)
    processor = CLIPProcessor.from_pretrained(MODEL_NAME)
    model.eval().to(device)
    return model, processor, device


def image_embedding(img_bytes: bytes) -> np.ndarray:
    """Compute an L2-normalized CLIP image embedding (np.ndarray float32).
    Optionally applies face detection/cropping if insightface is available.
    """
    model, processor, device = get_clip()
    image = _load_image(img_bytes)
    # optional face preprocessing (largest aligned face)
    if preprocess_face is not None:
        try:
            face_img = preprocess_face(image)
            if face_img is not None:
                image = face_img
        except Exception:
            # fallback to original image on any failure
            pass
    inputs = processor(images=image, return_tensors="pt")
    with torch.no_grad():
        pixel_values = inputs["pixel_values"].to(device)
        feats = model.get_image_features(pixel_values=pixel_values)
        feats = feats / feats.norm(p=2, dim=-1, keepdim=True)
    emb = feats.squeeze(0).detach().cpu().numpy().astype("float32")
    return emb
