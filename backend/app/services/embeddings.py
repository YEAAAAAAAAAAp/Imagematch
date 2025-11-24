"""
InsightFace AuraFace-v1 기반 얼굴 임베딩 서비스 (Image_RAG 의존성 제거)
"""
from functools import lru_cache
from io import BytesIO
from typing import Optional

import numpy as np
from PIL import Image
import cv2
from insightface.app import FaceAnalysis


@lru_cache(maxsize=1)
def get_insightface_model() -> FaceAnalysis:
    """
    InsightFace AuraFace-v1 모델 싱글톤
    최초 호출 시 모델을 로드하고 캐시합니다.
    """
    print("🔮 InsightFace AuraFace-v1 모델 로딩 중...")
    model = FaceAnalysis(name="auraface", root=".")
    model.prepare(ctx_id=-1, det_size=(640, 640))  # -1: CPU, 0: GPU
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
    이미지를 512차원 얼굴 임베딩 벡터로 변환 (InsightFace AuraFace-v1)
    
    Args:
        img_bytes: 이미지 바이트 데이터
        
    Returns:
        512차원 numpy 배열 (float32, L2-normalized) 또는 None (얼굴이 없는 경우)
    """
    try:
        model = get_insightface_model()
        cv_image = _load_image(img_bytes)
        
        # 얼굴 감지 및 임베딩 추출
        faces = model.get(cv_image)
        
        if not faces or len(faces) == 0:
            print("⚠️ 이미지에서 얼굴을 감지할 수 없습니다.")
            return None
        
        # 가장 큰 얼굴 선택 (bbox 면적 기준)
        face = max(faces, key=lambda x: (x.bbox[2] - x.bbox[0]) * (x.bbox[3] - x.bbox[1]))
        
        # 정규화된 임베딩 반환 (normed_embedding)
        return face.normed_embedding.astype("float32")
        
    except Exception as e:
        print(f"❌ InsightFace 임베딩 생성 실패: {e}")
        import traceback
        traceback.print_exc()
        return None
