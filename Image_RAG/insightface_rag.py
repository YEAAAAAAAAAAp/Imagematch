"""
AuraFace-v1 기반 얼굴 이미지 유사도 검색 시스템
"""

import numpy as np
import cv2
from pathlib import Path
from typing import List, Union, Tuple, Dict, Optional
from sklearn.metrics.pairwise import cosine_similarity

try:
    from insightface.app import FaceAnalysis
except ImportError:
    print("필요한 패키지를 설치해주세요: pip install insightface")
    raise

try:
    from huggingface_hub import snapshot_download
except ImportError:
    print("필요한 패키지를 설치해주세요: pip install huggingface_hub")
    raise


class InsightFaceRAG:
    """InsightFace Buffalo_L을 사용한 얼굴 이미지 검색 시스템"""
    
    def __init__(self, ctx_id: int = 0):
        """
        Args:
            ctx_id: 디바이스 ID (0: GPU, -1: CPU)
        """
        self.ctx_id = ctx_id
        self.image_database: List[Dict] = []
        self.embeddings_matrix: Optional[np.ndarray] = None
        
        print("🔮 InsightFace Buffalo_L 모델 로딩 중...")
        self._load_model()
        print("✅ 모델 로딩 완료")
    
    def _load_model(self):
        """InsightFace Buffalo_L 모델 로드"""
        # InsightFace 기본 모델 사용 (buffalo_l)
        self.model = FaceAnalysis(
            name="buffalo_l",
            root="."
        )
        self.model.prepare(ctx_id=self.ctx_id, det_size=(640, 640))
    
    def _load_image(self, image: Union[str, np.ndarray]) -> np.ndarray:
        """이미지를 OpenCV 형식으로 로드"""
        if isinstance(image, str):
            img = cv2.imread(image)
            if img is None:
                raise ValueError(f"이미지를 로드할 수 없습니다: {image}")
            return img
        elif isinstance(image, np.ndarray):
            return image.copy()
        else:
            raise ValueError(f"지원하지 않는 이미지 타입: {type(image)}")
    
    def encode_face(self, image: Union[str, np.ndarray]) -> Optional[np.ndarray]:
        """얼굴 이미지를 임베딩 벡터로 변환"""
        img = self._load_image(image)
        faces = self.model.get(img)
        
        if len(faces) == 0:
            return None
        
        return faces[0].normed_embedding
    
    def add_images_to_database(self, images: List[Union[str, np.ndarray]]):
        """데이터베이스에 이미지 추가"""
        print(f"데이터베이스에 {len(images)}개 이미지 추가 중...")
        
        new_embeddings = []
        for i, img in enumerate(images):
            try:
                embedding = self.encode_face(img)
                if embedding is None:
                    print(f"  경고: 이미지 {i}에서 얼굴을 찾을 수 없습니다.")
                    continue
                
                new_embeddings.append(embedding)
                img_path = img if isinstance(img, str) else f"Image_{len(self.image_database)}"
                
                self.image_database.append({
                    'id': len(self.image_database),
                    'path': img_path,
                    'embedding': embedding
                })
                
                if len(new_embeddings) % 10 == 0:
                    print(f"  진행: {len(new_embeddings)}/{len(images)}")
            except Exception as e:
                print(f"  경고: 이미지 {i} 처리 실패 - {e}")
                continue
        
        if new_embeddings:
            new_matrix = np.array(new_embeddings)
            if self.embeddings_matrix is None:
                self.embeddings_matrix = new_matrix
            else:
                self.embeddings_matrix = np.vstack([self.embeddings_matrix, new_matrix])
        
        print(f"완료: 총 {len(self.image_database)}개 이미지가 데이터베이스에 저장되었습니다.")
    
    def search_similar_faces(
        self, 
        query_image: Union[str, np.ndarray],
        top_k: int = 10,
        threshold: float = 0.0
    ) -> List[Tuple[Dict, float]]:
        """쿼리 이미지와 유사한 얼굴 검색"""
        if len(self.image_database) == 0:
            raise ValueError("데이터베이스가 비어있습니다. 먼저 이미지를 추가해주세요.")
        
        query_embedding = self.encode_face(query_image)
        if query_embedding is None:
            raise ValueError("쿼리 이미지에서 얼굴을 찾을 수 없습니다.")
        
        query_embedding = query_embedding.reshape(1, -1)
        similarities = cosine_similarity(query_embedding, self.embeddings_matrix)[0]
        
        results = [
            (self.image_database[idx], float(score))
            for idx, score in enumerate(similarities)
            if score >= threshold
        ]
        results.sort(key=lambda x: x[1], reverse=True)
        
        return results[:top_k]


def load_images_from_directory(directory: str) -> List[str]:
    """디렉토리에서 이미지 파일 경로 리스트 로드"""
    image_extensions = {'.jpg', '.jpeg', '.png', '.bmp', '.gif', '.webp'}
    image_paths = []
    
    directory = Path(directory)
    for ext in image_extensions:
        image_paths.extend(directory.glob(f'*{ext}'))
        image_paths.extend(directory.glob(f'*{ext.upper()}'))
    
    return sorted(list(set([str(p) for p in image_paths])))
