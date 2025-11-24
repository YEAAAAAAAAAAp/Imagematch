"""
InsightFace AuraFace-v1 기반 얼굴 임베딩 서비스
CLIP에서 InsightFace로 완전 교체
"""
from functools import lru_cache
from io import BytesIO
from typing import Optional
from pathlib import Path
import sys

import numpy as np
from PIL import Image
import cv2

# Image_RAG 모듈 경로 추가
project_root = Path(__file__).parent.parent.parent.parent
sys.path.insert(0, str(project_root / "Image_RAG"))

try:
    from insightface_rag import InsightFaceRAG
except ImportError as e:
    print(f"⚠️ InsightFace RAG 모듈을 찾을 수 없습니다: {e}")
    print(f"경로 확인: {project_root / 'Image_RAG'}")
    raise


@lru_cache(maxsize=1)
def get_insightface_model() -> InsightFaceRAG:
    """
    InsightFace AuraFace-v1 모델 싱글톤
    최초 호출 시 모델을 로드하고 캐시합니다.
    """
    print("🔮 InsightFace AuraFace-v1 모델 로딩 중...")
    model = InsightFaceRAG(ctx_id=0)  # 0: GPU, -1: CPU
    print("✅ InsightFace 모델 로딩 완료")
    return model


def _load_image(img_bytes: bytes) -> np.ndarray:
    """이미지 바이트를 OpenCV 형식(BGR)으로 변환"""
    pil_image = Image.open(BytesIO(img_bytes))
    if pil_image.mode != "RGB":
        pil_image = pil_image.convert("RGB")
    
    # PIL RGB -> OpenCV BGR
    cv_image = cv2.cvtColor(np.array(pil_image), cv2.COLOR_RGB2BGR)
    return cv_image


def image_embedding(img_bytes: bytes) -> Optional[np.ndarray]:
    """
    이미지를 512차원 얼굴 임베딩 벡터로 변환 (InsightFace)
    
    Args:
        img_bytes: 이미지 바이트 데이터
        
    Returns:
        512차원 numpy 배열 (float32, L2-normalized) 또는 None (얼굴이 없는 경우)
    """
    try:
        model = get_insightface_model()
        cv_image = _load_image(img_bytes)
        
        # InsightFace로 얼굴 임베딩 추출
        embedding = model.encode_face(cv_image)
        
        if embedding is None:
            print("⚠️ 이미지에서 얼굴을 감지할 수 없습니다.")
            return None
        
        # InsightFace는 이미 정규화된 임베딩 반환 (normed_embedding)
        return embedding.astype("float32")
        
    except Exception as e:
        print(f"❌ InsightFace 임베딩 생성 실패: {e}")
        import traceback
        traceback.print_exc()
        return None
