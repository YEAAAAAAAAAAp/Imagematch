"""
Simple Visual RAG System - NumPy 기반 구현
ChromaDB 의존성 없이 기존 인프라만 사용
"""

import numpy as np
from pathlib import Path
from typing import List, Dict, Any, Optional
import json
import logging

logger = logging.getLogger(__name__)


class SimpleVisualRAGSystem:
    """간소화된 Visual RAG 시스템 - NumPy 기반"""
    
    def __init__(self, data_dir: str = "backend/app/data"):
        self.data_dir = Path(data_dir)
        self.embeddings: Optional[np.ndarray] = None
        self.metadata: List[Dict] = []
        self.initialized = False
        
    def initialize(self) -> bool:
        """기존 임베딩 로드"""
        try:
            emb_path = self.data_dir / "embeddings.npy"
            meta_path = self.data_dir / "metadata.json"
            
            if not emb_path.exists() or not meta_path.exists():
                logger.warning(f"데이터 파일이 없습니다: {emb_path}, {meta_path}")
                return False
            
            self.embeddings = np.load(emb_path)
            with open(meta_path, 'r', encoding='utf-8') as f:
                self.metadata = json.load(f)
            
            self.initialized = True
            logger.info(f"Visual RAG 초기화 완료: {len(self.metadata)}명의 배우")
            return True
            
        except Exception as e:
            logger.error(f"Visual RAG 초기화 실패: {e}")
            return False
    
    def search_similar_actors(
        self,
        query_embedding: np.ndarray,
        top_k: int = 10,
        filters: Optional[Dict[str, Any]] = None
    ) -> List[Dict[str, Any]]:
        """시각적 유사도 검색"""
        if not self.initialized or self.embeddings is None:
            return []
        
        try:
            # 코사인 유사도 계산
            query_norm = query_embedding / np.linalg.norm(query_embedding)
            embeddings_norm = self.embeddings / np.linalg.norm(self.embeddings, axis=1, keepdims=True)
            similarities = np.dot(embeddings_norm, query_norm)
            
            # 필터 적용
            valid_indices = list(range(len(self.metadata)))
            if filters:
                valid_indices = self._apply_filters(filters)
            
            # 상위 k개 선택
            valid_similarities = [(i, similarities[i]) for i in valid_indices]
            valid_similarities.sort(key=lambda x: x[1], reverse=True)
            top_indices = [i for i, _ in valid_similarities[:top_k]]
            
            # 결과 구성
            results = []
            for idx in top_indices:
                result = self.metadata[idx].copy()
                result['similarity'] = float(similarities[idx])
                results.append(result)
            
            return results
            
        except Exception as e:
            logger.error(f"검색 실패: {e}")
            return []
    
    def hybrid_search(
        self,
        query_embedding: np.ndarray,
        text_query: Optional[str] = None,
        top_k: int = 10,
        visual_weight: float = 0.7
    ) -> List[Dict[str, Any]]:
        """하이브리드 검색 (시각 + 텍스트)"""
        if not self.initialized:
            return []
        
        try:
            # 시각적 유사도
            visual_results = self.search_similar_actors(query_embedding, top_k=top_k*2)
            
            if not text_query or not text_query.strip():
                return visual_results[:top_k]
            
            # 텍스트 매칭 (간단한 키워드 매칭)
            text_query_lower = text_query.lower()
            text_weight = 1.0 - visual_weight
            
            for result in visual_results:
                # 텍스트 점수 계산
                text_score = 0.0
                name = result.get('name', '').lower()
                
                # 이름 매칭
                if text_query_lower in name:
                    text_score += 1.0
                
                # 성별 매칭
                if 'male' in text_query_lower or 'man' in text_query_lower:
                    if result.get('gender') == 'male':
                        text_score += 0.5
                elif 'female' in text_query_lower or 'woman' in text_query_lower:
                    if result.get('gender') == 'female':
                        text_score += 0.5
                
                # 하이브리드 점수
                visual_score = result['similarity']
                result['hybrid_score'] = (visual_weight * visual_score + 
                                         text_weight * text_score)
                result['text_score'] = text_score
            
            # 하이브리드 점수로 재정렬
            visual_results.sort(key=lambda x: x.get('hybrid_score', 0), reverse=True)
            return visual_results[:top_k]
            
        except Exception as e:
            logger.error(f"하이브리드 검색 실패: {e}")
            return self.search_similar_actors(query_embedding, top_k)
    
    def _apply_filters(self, filters: Dict[str, Any]) -> List[int]:
        """메타데이터 필터 적용"""
        valid_indices = []
        for idx, meta in enumerate(self.metadata):
            match = True
            for key, value in filters.items():
                if meta.get(key) != value:
                    match = False
                    break
            if match:
                valid_indices.append(idx)
        return valid_indices
    
    def get_statistics(self) -> Dict[str, Any]:
        """시스템 통계"""
        if not self.initialized:
            return {
                "initialized": False,
                "total_actors": 0,
                "embedding_dimension": 0
            }
        
        return {
            "initialized": True,
            "total_actors": len(self.metadata),
            "embedding_dimension": self.embeddings.shape[1] if self.embeddings is not None else 0,
            "backend_type": "numpy_cosine_similarity"
        }


# 전역 인스턴스
VISUAL_RAG = SimpleVisualRAGSystem()
