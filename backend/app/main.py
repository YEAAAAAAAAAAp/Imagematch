from fastapi import FastAPI, File, UploadFile, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from starlette.responses import JSONResponse
from pathlib import Path

from .models.schemas import MatchResponse, MatchResult
from .services.embeddings import image_embedding
from .services.search import INDEX, ACTOR_IMAGES_DIR

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
            for idx, score in top:
                info = INDEX.info(idx)
                image_url = f"/actors/{info['image_rel']}" if info.get("image_rel") else None
                items.append({"name": info.get("name", f"Actor {idx}"), "score": score, "image_url": image_url})
            outputs.append({"filename": f.filename, "results": items})
        except FileNotFoundError as e:
            raise HTTPException(status_code=503, detail=str(e))
        except Exception as e:
            outputs.append({"filename": f.filename, "error": f"처리 실패: {e}"})

    return {"items": outputs}
