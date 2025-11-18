"""
Build Visual RAG index from actor embeddings.
This script imports existing embeddings into ChromaDB for RAG capabilities.
"""

import argparse
import json
from pathlib import Path
import sys

import numpy as np

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).resolve().parents[2]))

from backend.app.services.visual_rag import VISUAL_RAG


def build_visual_rag_index(data_dir: Path) -> None:
    """
    Build Visual RAG index from existing embeddings.
    
    Args:
        data_dir: Directory containing embeddings.npy and metadata.json
    """
    emb_path = data_dir / "embeddings.npy"
    meta_path = data_dir / "metadata.json"
    
    if not emb_path.exists():
        raise FileNotFoundError(f"Embeddings not found: {emb_path}")
    if not meta_path.exists():
        raise FileNotFoundError(f"Metadata not found: {meta_path}")
    
    print(f"Loading embeddings from {emb_path}...")
    embeddings = np.load(str(emb_path))
    
    print(f"Loading metadata from {meta_path}...")
    with open(meta_path, "r", encoding="utf-8") as f:
        metadata = json.load(f)
    
    if len(embeddings) != len(metadata):
        raise ValueError(
            f"Mismatch: {len(embeddings)} embeddings vs {len(metadata)} metadata entries"
        )
    
    print(f"Building Visual RAG index with {len(embeddings)} actors...")
    VISUAL_RAG.initialize()
    VISUAL_RAG.add_actor_embeddings(embeddings, metadata)
    
    print("✅ Visual RAG index built successfully!")
    print(f"   Total actors: {len(embeddings)}")
    print(f"   Embedding dimension: {embeddings.shape[1]}")
    
    # Show statistics
    stats = VISUAL_RAG.get_statistics()
    print(f"\nDatabase statistics:")
    for key, value in stats.items():
        print(f"   {key}: {value}")


def main():
    parser = argparse.ArgumentParser(
        description="Build Visual RAG index from actor embeddings"
    )
    parser.add_argument(
        "--data-dir",
        type=Path,
        default=Path(__file__).resolve().parents[2] / "backend" / "app" / "data",
        help="Directory containing embeddings.npy and metadata.json"
    )
    
    args = parser.parse_args()
    
    try:
        build_visual_rag_index(args.data_dir)
    except Exception as e:
        print(f"❌ Error: {e}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
