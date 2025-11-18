"""
Visual RAG (Retrieval-Augmented Generation) Service
Combines visual embeddings with text-based retrieval for enhanced actor matching.
"""

from pathlib import Path
from typing import Dict, List, Optional, Tuple
import json

import numpy as np
import chromadb
from chromadb.config import Settings
from PIL import Image

from .embeddings import image_embedding


# Paths
DATA_DIR = Path(__file__).resolve().parents[1] / "data"
CHROMA_DIR = DATA_DIR / "chroma_db"
METADATA_PATH = DATA_DIR / "metadata.json"


class VisualRAGSystem:
    """Visual RAG system for multimodal actor matching."""
    
    def __init__(self):
        self._client: Optional[chromadb.Client] = None
        self._collection = None
        self._metadata: Optional[List[Dict]] = None
        self._initialized = False
    
    def initialize(self) -> None:
        """Initialize ChromaDB and load metadata."""
        if self._initialized:
            return
        
        # Create ChromaDB client
        CHROMA_DIR.mkdir(parents=True, exist_ok=True)
        self._client = chromadb.Client(Settings(
            chroma_db_impl="duckdb+parquet",
            persist_directory=str(CHROMA_DIR)
        ))
        
        # Get or create collection
        self._collection = self._client.get_or_create_collection(
            name="actor_embeddings",
            metadata={"hnsw:space": "cosine"}
        )
        
        # Load metadata
        if METADATA_PATH.exists():
            with open(METADATA_PATH, "r", encoding="utf-8") as f:
                self._metadata = json.load(f)
        else:
            self._metadata = []
        
        self._initialized = True
    
    def add_actor_embeddings(
        self, 
        embeddings: np.ndarray, 
        metadata: List[Dict]
    ) -> None:
        """
        Add actor embeddings to ChromaDB.
        
        Args:
            embeddings: Array of shape (N, D) with actor embeddings
            metadata: List of metadata dicts for each actor
        """
        self.initialize()
        
        if len(embeddings) != len(metadata):
            raise ValueError("Embeddings and metadata length mismatch")
        
        # Prepare data for ChromaDB
        ids = [f"actor_{i}" for i in range(len(embeddings))]
        embeddings_list = embeddings.tolist()
        
        # Add documents with metadata
        self._collection.add(
            embeddings=embeddings_list,
            ids=ids,
            metadatas=metadata
        )
        
        self._metadata = metadata
    
    def search_similar_actors(
        self,
        query_embedding: np.ndarray,
        top_k: int = 5,
        filters: Optional[Dict] = None
    ) -> List[Tuple[int, float, Dict]]:
        """
        Search for similar actors using visual embeddings.
        
        Args:
            query_embedding: Query image embedding
            top_k: Number of results to return
            filters: Optional metadata filters
        
        Returns:
            List of (index, score, metadata) tuples
        """
        self.initialize()
        
        if self._collection.count() == 0:
            raise ValueError("No actors in database. Please add embeddings first.")
        
        # Query ChromaDB
        results = self._collection.query(
            query_embeddings=[query_embedding.tolist()],
            n_results=top_k,
            where=filters
        )
        
        # Parse results
        matches = []
        if results['ids'] and len(results['ids'][0]) > 0:
            for idx, (id_, distance, metadata) in enumerate(zip(
                results['ids'][0],
                results['distances'][0],
                results['metadatas'][0]
            )):
                # Convert distance to similarity score (1 - cosine distance)
                score = 1.0 - distance
                actor_idx = int(id_.split('_')[1])
                matches.append((actor_idx, score, metadata))
        
        return matches
    
    def get_actor_info(self, actor_idx: int) -> Optional[Dict]:
        """Get metadata for a specific actor by index."""
        self.initialize()
        
        if self._metadata and 0 <= actor_idx < len(self._metadata):
            return self._metadata[actor_idx]
        return None
    
    def hybrid_search(
        self,
        query_embedding: np.ndarray,
        text_query: Optional[str] = None,
        top_k: int = 5,
        visual_weight: float = 0.7
    ) -> List[Tuple[int, float, Dict]]:
        """
        Hybrid search combining visual and text-based retrieval.
        
        Args:
            query_embedding: Visual embedding
            text_query: Optional text query (actor name, characteristics)
            top_k: Number of results
            visual_weight: Weight for visual similarity (0-1)
        
        Returns:
            List of (index, score, metadata) tuples
        """
        self.initialize()
        
        # Visual search
        visual_results = self.search_similar_actors(
            query_embedding, 
            top_k=top_k * 2  # Get more candidates for re-ranking
        )
        
        if not text_query:
            return visual_results[:top_k]
        
        # Text-based filtering and re-ranking
        text_query_lower = text_query.lower()
        reranked = []
        
        for idx, visual_score, metadata in visual_results:
            text_score = 0.0
            actor_name = metadata.get('name', '').lower()
            
            # Simple text matching
            if text_query_lower in actor_name:
                text_score = 1.0
            elif any(char in actor_name for char in text_query_lower):
                text_score = 0.5
            
            # Combine scores
            combined_score = (
                visual_weight * visual_score + 
                (1 - visual_weight) * text_score
            )
            
            reranked.append((idx, combined_score, metadata))
        
        # Sort by combined score and return top K
        reranked.sort(key=lambda x: x[1], reverse=True)
        return reranked[:top_k]
    
    def get_statistics(self) -> Dict:
        """Get database statistics."""
        self.initialize()
        
        return {
            "total_actors": self._collection.count() if self._collection else 0,
            "collection_name": "actor_embeddings",
            "embedding_dimension": 512,  # CLIP ViT-B/32
            "initialized": self._initialized
        }


# Global instance
VISUAL_RAG = VisualRAGSystem()
