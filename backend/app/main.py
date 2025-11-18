from fastapi import FastAPI, File, UploadFile, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from starlette.responses import JSONResponse
from pathlib import Path

from .models.schemas import MatchResponse, MatchResult
from .services.embeddings import image_embedding
from .services.search import INDEX, ACTOR_IMAGES_DIR

# Simple Visual RAG (optional, uses existing embeddings)
try:
    from .services.simple_visual_rag import VISUAL_RAG
    RAG_AVAILABLE = True
except Exception as e:
    print(f"Visual RAG not available: {e}")
    VISUAL_RAG = None
    RAG_AVAILABLE = False

app = FastAPI(title="Actor Image Matcher", version="0.1.0")

# Allow local dev frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"]
    ,allow_headers=["*"]
)

# Optionally serve actor images if available
if ACTOR_IMAGES_DIR.exists():
    app.mount("/actors", StaticFiles(directory=str(ACTOR_IMAGES_DIR)), name="actors")


@app.get("/health")
async def health():
    return {"status": "ok"}


@app.post("/match-actors", response_model=MatchResponse)
async def match_actors(
    file: UploadFile = File(...),
    top_k: int = Query(3, ge=1, le=10, description="반환할 상위 K값"),
):
    if file.content_type is None or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="이미지 파일을 업로드하세요")
    # 10MB limit safeguard
    contents = await file.read()
    if len(contents) > 10 * 1024 * 1024:
        raise HTTPException(status_code=413, detail="파일이 너무 큽니다 (최대 10MB)")

    try:
        query = image_embedding(contents)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"이미지 처리 실패: {e}")

    try:
        top = INDEX.topk(query, k=top_k)
    except FileNotFoundError as e:
        raise HTTPException(status_code=503, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"검색 실패: {e}")

    results = []
    for idx, score in top:
        info = INDEX.info(idx)
        image_url = None
        if info.get("image_rel"):
            # served under /actors
            image_url = f"/actors/{info['image_rel']}"
        results.append(MatchResult(name=info.get("name", f"Actor {idx}"), score=score, image_url=image_url))

    return MatchResponse(results=results)


@app.post("/match-actors-batch")
async def match_actors_batch(
    files: list[UploadFile] = File(...),
    top_k: int = Query(3, ge=1, le=10),
    reference_actor: str = Query(None, description="레퍼런스 배우 이름 (선택)"),
):
    if not files:
        raise HTTPException(status_code=400, detail="이미지 파일을 업로드하세요")
    outputs = []
    for f in files:
        if f.content_type is None or not str(f.content_type).startswith("image/"):
            outputs.append({"filename": f.filename, "error": "이미지 아님"})
            continue
        contents = await f.read()
        if len(contents) > 10 * 1024 * 1024:
            outputs.append({"filename": f.filename, "error": "파일이 너무 큼(>10MB)"})
            continue
        try:
            q = image_embedding(contents)
            top = INDEX.topk(q, k=top_k)
            items = []
            reference_idx = None
            reference_score = None
            
            # 레퍼런스 배우가 지정된 경우, 해당 배우와의 유사도를 찾음
            if reference_actor:
                for idx, score in top:
                    info = INDEX.info(idx)
                    if info.get("name", "").lower() == reference_actor.lower().strip():
                        reference_idx = idx
                        reference_score = score
                        break
            
            for idx, score in top:
                info = INDEX.info(idx)
                image_url = f"/actors/{info['image_rel']}" if info.get("image_rel") else None
                items.append({
                    "name": info.get("name", f"Actor {idx}"), 
                    "score": score, 
                    "image_url": image_url,
                    "is_reference": info.get("name", "").lower() == reference_actor.lower().strip() if reference_actor else False
                })
            
            result = {"filename": f.filename, "results": items}
            if reference_score is not None:
                result["reference_score"] = reference_score
            outputs.append(result)
        except FileNotFoundError as e:
            raise HTTPException(status_code=503, detail=str(e))
        except Exception as e:
            outputs.append({"filename": f.filename, "error": f"처리 실패: {e}"})

    return {"items": outputs}


@app.post("/visual-rag-search")
async def visual_rag_search(
    file: UploadFile = File(...),
    text_query: str = Query(None, description="Optional text query for hybrid search"),
    top_k: int = Query(5, ge=1, le=20),
    use_llm: bool = Query(False, description="Use LLM for result description"),
):
    """
    Visual RAG search endpoint with optional text query.
    Uses simple NumPy-based similarity search.
    """
    if not RAG_AVAILABLE:
        raise HTTPException(
            status_code=503,
            detail="Visual RAG not available"
        )
    
    if file.content_type is None or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="이미지 파일을 업로드하세요")
    
    contents = await file.read()
    if len(contents) > 10 * 1024 * 1024:
        raise HTTPException(status_code=413, detail="파일이 너무 큽니다 (최대 10MB)")
    
    try:
        query_emb = image_embedding(contents)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"이미지 처리 실패: {e}")
    
    try:
        # Initialize RAG system
        VISUAL_RAG.initialize()
        
        # Hybrid search if text query provided
        if text_query:
            matches = VISUAL_RAG.hybrid_search(
                query_emb,
                text_query=text_query,
                top_k=top_k,
                visual_weight=0.7
            )
        else:
            matches = VISUAL_RAG.search_similar_actors(query_emb, top_k=top_k)
        
        # Format results
        results = []
        for match in matches:
            image_url = None
            if match.get("image_rel"):
                image_url = f"/actors/{match['image_rel']}"
            
            results.append({
                "name": match.get("name", "Unknown"),
                "score": match.get("similarity", 0.0),
                "image_url": image_url,
                "metadata": match
            })
        
        response = {
            "results": results,
            "total_actors": VISUAL_RAG.get_statistics()["total_actors"],
            "search_type": "hybrid" if text_query else "visual_only"
        }
        
        return response
    
    except ValueError as e:
        raise HTTPException(status_code=503, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"검색 실패: {e}")


@app.get("/rag-stats")
async def rag_statistics():
    """Get Visual RAG system statistics."""
    if not RAG_AVAILABLE:
        return {
            "available": False,
            "message": "Visual RAG not installed"
        }
    
    try:
        VISUAL_RAG.initialize()
        stats = VISUAL_RAG.get_statistics()
        stats["available"] = True
        return stats
    except Exception as e:
        return {
            "available": False,
            "error": str(e)
        }
