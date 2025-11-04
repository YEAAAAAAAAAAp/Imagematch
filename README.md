# 배우 유사도 매칭 Agent (Imagematch)

업로드한 얼굴 사진을 분석해, 사전에 구축한 배우 임베딩 인덱스에서 유사도가 높은 배우 TOP3를 반환하는 FastAPI 기반 서비스입니다.

- 백엔드: FastAPI + CLIP (HuggingFace Transformers, PyTorch)
- 임베딩: CLIP ViT-B/32 이미지 임베딩 (코사인 유사도)
- 인덱스: 배우별 대표 임베딩(여러 장 평균) + 메타데이터(JSON)
- 프론트엔드: 간단한 정적 HTML 업로드 페이지 (`frontend/index.html`)

## 폴더 구조

```
backend/
  app/
    main.py                # API 엔드포인트 (/match-actors)
    models/schemas.py      # 응답 스키마
    services/
      embeddings.py        # CLIP 임베딩 계산
      search.py            # 인덱스 로드/탐색
    data/                  # 생성된 인덱스와 배우 썸네일(생성됨)
  scripts/
    build_actor_index.py   # 데이터셋에서 배우 인덱스 생성
frontend/
  index.html               # 업로드/결과 확인용 간단 페이지
requirements.txt           # Python 의존성
README.md                  # 이 문서
```

## 사전 준비 (Windows, PowerShell)

1) Python 3.10+ 설치 (권장: 3.10/3.11). 설치 시 "Add Python to PATH" 체크.

2) 가상환경 생성 및 활성화

```powershell
python -m venv .venv
.\.venv\Scripts\Activate
```

3) 의존성 설치

- 기본 패키지 설치:

```powershell
pip install -r requirements.txt
```

- PyTorch (Windows)는 공식 가이드로 설치하세요. CPU만 사용 시 예:

```powershell
# CPU 전용(예시) - 최신 설치 명령은 링크에서 확인
pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cpu
```

자세한 설치 방법: https://pytorch.org/get-started/locally/

## 배우 인덱스 만들기

배우 이미지 데이터셋이 필요합니다. 두 가지 방식을 지원합니다.

1) 폴더 구조 (권장):
```
C:\data\actors\
  전지현\*.jpg
  송강호\*.png
  ...
```
배우 폴더마다 여러 장의 이미지를 넣어주세요. 스크립트가 폴더별로 평균 임베딩을 계산합니다.

2) CSV 파일:
```
name,image_path
전지현,C:\data\img\juneji1.jpg
전지현,C:\data\img\juneji2.jpg
송강호,C:\data\img\song1.png
```

### 인덱스 생성 실행

```powershell
# 폴더 기반
python backend\scripts\build_actor_index.py --dataset-dir C:\data\actors

# 또는 CSV 기반
python backend\scripts\build_actor_index.py --csv C:\data\actors.csv
```

완료 후 `backend/app/data/` 아래에 다음 파일이 생성됩니다.
- `embeddings.npy`: 배우별 임베딩 (N x D)
- `metadata.json`: 배우 이름과 대표 이미지 상대경로
- `actors/`: 대표 이미지 저장(정적 서비스용)

## 서버 실행

```powershell
uvicorn backend.app.main:app --reload --port 8000
```

프런트엔드(Next.js):

```powershell
cd frontend
copy .env.local.example .env.local
npm install
npm run dev
```

브라우저에서 http://localhost:3000 접속 후 업로드/Top-K 조절/다중 업로드를 확인하세요.

- API:
  - 단일: `POST http://localhost:8000/match-actors?top_k=3` (form-data: file=이미지)
  - 배치: `POST http://localhost:8000/match-actors-batch?top_k=3` (form-data: files=이미지들)

## 동작 방식

- 업로드한 이미지를 CLIP으로 임베딩 → 코사인 유사도로 배우 인덱스와 비교 → 상위 3명 반환
- `backend/app/services/embeddings.py`: CLIP 모델/프로세서 로드 및 이미지 임베딩 계산 (옵션) InsightFace로 얼굴 크롭/정렬 후 임베딩
- `backend/app/services/search.py`: `backend/app/data/`의 인덱스를 로드하고 탐색

## 자주 묻는 질문

- GPU가 꼭 필요한가요?
  - 아닙니다. CPU로도 동작합니다. 다만 최초 모델 로드가 느릴 수 있습니다.

- 인덱스를 만들기 전 요청하면?
  - 503 오류와 함께 "Actor index not built" 메시지를 보냅니다. 먼저 인덱스를 만들어 주세요.

- 얼굴 인식 전용 모델인가요?
  - CLIP은 일반 이미지 임베딩 모델입니다. 얼굴 전용 모델보다 정확도는 낮을 수 있지만, 설치와 운용이 쉽습니다. 더 높은 정확도가 필요하면 FaceNet/ArcFace/InsightFace 등으로 교체 가능합니다.

## 테스트

간단한 헬스체크 및 인덱스 미구축 시 동작 테스트가 포함되어 있습니다.

```powershell
pytest -q
```

## 향후 개선 아이디어

- Next/Image 최적화 고도화(도메인 설정, 캐시 전략)
- 프론트 디자인 시스템/컴포넌트 라이브러리 도입
- 배우 데이터셋 관리 도구(추가/삭제/재인덱싱)
