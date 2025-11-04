"""
배우 인덱스 생성 스크립트

두 가지 데이터셋 구조를 지원합니다.
1) 폴더 기반 (권장):
   dataset_dir/
     배우이름A/*.jpg
     배우이름B/*.png
   => 각 폴더의 이미지 임베딩 평균을 배우 대표 벡터로 저장

2) CSV 기반:
   --csv file.csv (columns: name,image_path)
   => 같은 이름을 가진 이미지들을 그룹핑하여 평균

출력: backend/app/data/
  - embeddings.npy (shape: [N_actors, D])
  - metadata.json (list[{name, image_rel}])
  - actors/ (대표 이미지 복사본)
"""
from __future__ import annotations
import argparse
import csv
import json
from collections import defaultdict
from pathlib import Path
from typing import Dict, List, Tuple

import numpy as np
from PIL import Image

from backend.app.services.embeddings import image_embedding
from backend.app.services.search import DATA_DIR, ACTOR_IMAGES_DIR


def iter_folder(dataset_dir: Path) -> Dict[str, List[Path]]:
    mapping: Dict[str, List[Path]] = defaultdict(list)
    for actor_dir in sorted([p for p in dataset_dir.iterdir() if p.is_dir()]):
        name = actor_dir.name
        for img in actor_dir.rglob("*"):
            if img.suffix.lower() in {".jpg", ".jpeg", ".png", ".webp"}:
                mapping[name].append(img)
    return mapping


def iter_csv(csv_path: Path) -> Dict[str, List[Path]]:
    mapping: Dict[str, List[Path]] = defaultdict(list)
    with open(csv_path, "r", encoding="utf-8-sig") as f:
        reader = csv.DictReader(f)
        for row in reader:
            name = row["name"].strip()
            img_path = Path(row["image_path"]).expanduser().resolve()
            if img_path.exists():
                mapping[name].append(img_path)
    return mapping


def compute_actor_vectors(groups: Dict[str, List[Path]], clusters_per_actor: int = 1) -> Tuple[np.ndarray, List[Dict]]:
    ACTOR_IMAGES_DIR.mkdir(parents=True, exist_ok=True)
    vectors = []
    meta: List[Dict] = []
    for name, paths in sorted(groups.items()):
        if not paths:
            continue
        embs = []
        rep_rel = None
        for i, p in enumerate(paths[:20]):  # 최대 20장까지 샘플링
            try:
                with open(p, "rb") as f:
                    emb = image_embedding(f.read())
                embs.append(emb)
                if rep_rel is None:
                    # 대표 이미지 복사 (상대경로 저장)
                    target = ACTOR_IMAGES_DIR / f"{name.replace(' ', '_')}{p.suffix.lower()}"
                    if not target.exists():
                        try:
                            Image.open(p).save(target)
                        except Exception:
                            pass
                    if target.exists():
                        rep_rel = target.name
            except Exception:
                # 이미지 깨짐 등은 무시
                continue
        if not embs:
            continue
        X = np.stack(embs, axis=0)
        if clusters_per_actor > 1 and len(embs) >= clusters_per_actor:
            try:
                from sklearn.cluster import KMeans  # type: ignore
                km = KMeans(n_clusters=clusters_per_actor, n_init=10, random_state=42)
                labels = km.fit_predict(X)
                for c in range(clusters_per_actor):
                    members = X[labels == c]
                    if members.size == 0:
                        continue
                    centroid = members.mean(axis=0)
                    centroid = centroid / (np.linalg.norm(centroid) + 1e-12)
                    vectors.append(centroid.astype("float32"))
                    meta.append({"name": name, "image_rel": rep_rel, "cluster": c})
            except Exception:
                # fallback to mean if sklearn not available
                mean_vec = np.mean(X, axis=0)
                mean_vec = mean_vec / (np.linalg.norm(mean_vec) + 1e-12)
                vectors.append(mean_vec.astype("float32"))
                meta.append({"name": name, "image_rel": rep_rel})
        else:
            mean_vec = np.mean(X, axis=0)
            mean_vec = mean_vec / (np.linalg.norm(mean_vec) + 1e-12)
            vectors.append(mean_vec.astype("float32"))
            meta.append({"name": name, "image_rel": rep_rel})
    return np.stack(vectors, axis=0), meta


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--dataset-dir", type=str, help="배우 이미지 루트 폴더")
    parser.add_argument("--csv", type=str, help="'name,image_path' CSV 파일 경로")
    parser.add_argument("--clusters-per-actor", type=int, default=1, help="배우별 클러스터 개수 (>=1)")
    args = parser.parse_args()

    DATA_DIR.mkdir(parents=True, exist_ok=True)

    groups: Dict[str, List[Path]]
    if args.dataset_dir:
        groups = iter_folder(Path(args.dataset_dir))
    elif args.csv:
        groups = iter_csv(Path(args.csv))
    else:
        raise SystemExit("--dataset-dir 또는 --csv 중 하나는 필수입니다")

    if not groups:
        raise SystemExit("데이터셋에서 이미지를 찾지 못했습니다")

    emb, meta = compute_actor_vectors(groups, clusters_per_actor=max(1, int(args.clusters_per_actor)))
    np.save(DATA_DIR / "embeddings.npy", emb)
    with open(DATA_DIR / "metadata.json", "w", encoding="utf-8") as f:
        json.dump(meta, f, ensure_ascii=False, indent=2)

    print(f"완료: {emb.shape[0]}명 저장, 벡터 차원 {emb.shape[1]}")
    print(f"경로: {DATA_DIR}")


if __name__ == "__main__":
    main()
