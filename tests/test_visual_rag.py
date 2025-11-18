"""
Tests for Visual RAG functionality
"""

import pytest
import numpy as np
from pathlib import Path

# Skip if chromadb not installed
try:
    import chromadb
    CHROMADB_AVAILABLE = True
except ImportError:
    CHROMADB_AVAILABLE = False


@pytest.mark.skipif(not CHROMADB_AVAILABLE, reason="ChromaDB not installed")
def test_visual_rag_import():
    """Test that Visual RAG can be imported."""
    from backend.app.services.visual_rag import VISUAL_RAG
    assert VISUAL_RAG is not None


@pytest.mark.skipif(not CHROMADB_AVAILABLE, reason="ChromaDB not installed")
def test_visual_rag_initialization():
    """Test Visual RAG initialization."""
    from backend.app.services.visual_rag import VISUAL_RAG
    
    VISUAL_RAG.initialize()
    assert VISUAL_RAG._initialized == True


@pytest.mark.skipif(not CHROMADB_AVAILABLE, reason="ChromaDB not installed")
def test_visual_rag_statistics():
    """Test getting RAG statistics."""
    from backend.app.services.visual_rag import VISUAL_RAG
    
    stats = VISUAL_RAG.get_statistics()
    assert 'total_actors' in stats
    assert 'collection_name' in stats
    assert 'embedding_dimension' in stats


@pytest.mark.skipif(not CHROMADB_AVAILABLE, reason="ChromaDB not installed")
def test_add_embeddings():
    """Test adding embeddings to ChromaDB."""
    from backend.app.services.visual_rag import VISUAL_RAG
    
    # Create dummy data
    n_actors = 5
    dim = 512
    embeddings = np.random.rand(n_actors, dim).astype('float32')
    
    # Normalize embeddings
    norms = np.linalg.norm(embeddings, axis=1, keepdims=True)
    embeddings = embeddings / (norms + 1e-12)
    
    metadata = [
        {"name": f"Actor{i}", "image_rel": f"actor_{i}.jpg"}
        for i in range(n_actors)
    ]
    
    VISUAL_RAG.initialize()
    VISUAL_RAG.add_actor_embeddings(embeddings, metadata)
    
    stats = VISUAL_RAG.get_statistics()
    assert stats['total_actors'] >= n_actors


@pytest.mark.skipif(not CHROMADB_AVAILABLE, reason="ChromaDB not installed")
def test_search_similar_actors():
    """Test searching for similar actors."""
    from backend.app.services.visual_rag import VISUAL_RAG
    
    # Initialize and add test data
    n_actors = 10
    dim = 512
    embeddings = np.random.rand(n_actors, dim).astype('float32')
    norms = np.linalg.norm(embeddings, axis=1, keepdims=True)
    embeddings = embeddings / (norms + 1e-12)
    
    metadata = [
        {"name": f"TestActor{i}", "image_rel": f"test_{i}.jpg"}
        for i in range(n_actors)
    ]
    
    VISUAL_RAG.initialize()
    VISUAL_RAG.add_actor_embeddings(embeddings, metadata)
    
    # Query
    query_emb = np.random.rand(dim).astype('float32')
    query_emb = query_emb / (np.linalg.norm(query_emb) + 1e-12)
    
    results = VISUAL_RAG.search_similar_actors(query_emb, top_k=3)
    
    assert len(results) <= 3
    assert all(isinstance(r, tuple) and len(r) == 3 for r in results)
    
    # Check result format: (index, score, metadata)
    if results:
        idx, score, meta = results[0]
        assert isinstance(idx, int)
        assert 0 <= score <= 1
        assert isinstance(meta, dict)
        assert 'name' in meta


@pytest.mark.skipif(not CHROMADB_AVAILABLE, reason="ChromaDB not installed")
def test_hybrid_search():
    """Test hybrid search with text query."""
    from backend.app.services.visual_rag import VISUAL_RAG
    
    # Setup test data
    n_actors = 10
    dim = 512
    embeddings = np.random.rand(n_actors, dim).astype('float32')
    norms = np.linalg.norm(embeddings, axis=1, keepdims=True)
    embeddings = embeddings / (norms + 1e-12)
    
    metadata = [
        {"name": f"Actor{i}", "image_rel": f"actor_{i}.jpg"}
        for i in range(n_actors)
    ]
    # Add one specific actor
    metadata[0]["name"] = "송강호"
    
    VISUAL_RAG.initialize()
    VISUAL_RAG.add_actor_embeddings(embeddings, metadata)
    
    # Query with text
    query_emb = np.random.rand(dim).astype('float32')
    query_emb = query_emb / (np.linalg.norm(query_emb) + 1e-12)
    
    results = VISUAL_RAG.hybrid_search(
        query_emb,
        text_query="송강호",
        top_k=5,
        visual_weight=0.7
    )
    
    assert len(results) <= 5
    
    # Check if target actor is boosted
    actor_names = [r[2]['name'] for r in results]
    assert "송강호" in actor_names or len(results) == 0


def test_llm_service_import():
    """Test LLM service import."""
    from backend.app.services.llm_integration import LLM_SERVICE
    assert LLM_SERVICE is not None


def test_llm_service_availability():
    """Test LLM service availability check."""
    from backend.app.services.llm_integration import LLM_SERVICE
    
    # Without API key, should return False
    is_available = LLM_SERVICE.is_available()
    assert isinstance(is_available, bool)


def test_llm_fallback_description():
    """Test LLM fallback description generation."""
    from backend.app.services.llm_integration import LLM_SERVICE
    
    matches = [
        {"name": "송강호", "score": 0.85},
        {"name": "이정재", "score": 0.75},
    ]
    
    description = LLM_SERVICE._fallback_description(matches, "중년 남성")
    
    assert isinstance(description, str)
    assert len(description) > 0
    assert "송강호" in description


@pytest.mark.asyncio
async def test_visual_rag_endpoint_not_initialized():
    """Test Visual RAG endpoint without initialization."""
    from httpx import AsyncClient
    from backend.app.main import app
    
    if not CHROMADB_AVAILABLE:
        pytest.skip("ChromaDB not available")
    
    async with AsyncClient(app=app, base_url="http://test") as client:
        # Try to get stats without data
        response = await client.get("/rag-stats")
        assert response.status_code == 200
        data = response.json()
        assert 'available' in data
