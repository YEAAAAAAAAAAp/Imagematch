from typing import List, Optional
from pydantic import BaseModel


class MatchResult(BaseModel):
    name: str
    score: float  # 0..1 cosine similarity
    image_url: Optional[str] = None  # served static path if available


class MatchResponse(BaseModel):
    results: List[MatchResult]
