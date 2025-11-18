# Genie Match - AI 캐스팅 솔루션 🪔✨

시나리오에 생각한 유명 배우를 자연어로 입력하고, 지원받은 배우들의 사진을 업로드하면 유사도 기준으로 지원자를 랭킹해주는 AI 기반 캐스팅 매칭 서비스입니다.

## 주요 특징

- 🎭 **자연어 타겟 입력**: 목표 배우 이름을 자연어로 입력
- 🔮 **AI 얼굴 매칭**: CLIP 임베딩 기반 코사인 유사도 분석
- ⚡ **배치 처리**: 여러 지원자 이미지 동시 분석
- ✨ **Genie 테마**: 마법적인 사용자 경험 제공
- 📊 **Top-K 조절**: 1~10개의 결과 개수 조절 가능

## 기술 스택

### 백엔드
- **FastAPI**: REST API 서버
- **CLIP (ViT-B/32)**: HuggingFace Transformers 이미지 임베딩
- **PyTorch**: 딥러닝 프레임워크
- **Uvicorn**: ASGI 서버

### 프론트엔드
- **Next.js 14.2.10**: App Router 기반 React 프레임워크
- **TypeScript**: 타입 안전성
- **Tailwind CSS**: 유틸리티 기반 스타일링
- **Genie Theme**: 커스텀 Purple/Fuchsia/Amber 그라데이션

## 프로젝트 구조

```
backend/
  app/
    main.py                      # FastAPI 엔드포인트
    models/schemas.py            # Pydantic 스키마
    services/
      embeddings.py              # CLIP 임베딩 생성
      face_preprocess.py         # 얼굴 전처리 (옵션)
      search.py                  # 배우 인덱스 검색
    data/                        # 생성된 인덱스 파일
      embeddings.npy             # 배우 임베딩 벡터
      metadata.json              # 배우 메타데이터
      actors/                    # 배우 대표 이미지
  scripts/
    build_actor_index.py         # 인덱스 빌더

frontend/
  app/
    page.tsx                     # 메인 페이지 (Genie UI)
    layout.tsx                   # 레이아웃
    globals.css                  # Tailwind 설정
    api/
      match-actors/route.ts      # 단일 매칭 API 라우트
      match-actors-batch/route.ts # 배치 매칭 API 라우트
  public/
    Genie-clean.png              # 지니 로고 (투명 배경)
    Genie.png                    # 지니 이미지 (원본)
  next.config.mjs                # Next.js 설정
  tailwind.config.js             # Tailwind 커스텀 테마

tests/
  test_api.py                    # API 테스트

requirements.txt                 # Python 의존성
package.json                     # Node.js 의존성
README.md                        # 프로젝트 문서
```

## 설치 및 실행

### 1. Python 환경 설정 (Windows PowerShell)

**요구사항**: Python 3.10 이상

```powershell
# 가상환경 생성 및 활성화
python -m venv .venv
.\.venv\Scripts\Activate

# Python 패키지 설치
pip install -r requirements.txt

# PyTorch 설치 (CPU 버전)
pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cpu
```

> **참고**: GPU 사용 시 [PyTorch 공식 사이트](https://pytorch.org/get-started/locally/)에서 CUDA 버전에 맞는 설치 명령을 확인하세요.

### 2. 배우 인덱스 생성

배우 이미지 데이터셋을 준비합니다. 두 가지 방식을 지원합니다.

#### 방법 1: 폴더 구조 (권장)

```
C:\data\actors\
  송강호\
    image1.jpg
    image2.jpg
  전지현\
    photo1.png
    photo2.png
  이정재\
    pic1.jpg
```

```powershell
python backend\scripts\build_actor_index.py --dataset-dir C:\data\actors
```

#### 방법 2: CSV 파일

```csv
name,image_path
송강호,C:\data\images\song1.jpg
송강호,C:\data\images\song2.jpg
전지현,C:\data\images\jeon1.png
```

```powershell
python backend\scripts\build_actor_index.py --csv C:\data\actors.csv
```

**생성 결과**: `backend/app/data/` 폴더에 다음 파일이 생성됩니다.
- `embeddings.npy`: 배우 임베딩 벡터 (N × 512 차원)
- `metadata.json`: 배우 이름 및 대표 이미지 경로
- `actors/`: 배우 대표 이미지 사본

### 3. 서버 실행

#### 백엔드 서버 (FastAPI)

```powershell
cd backend
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

서버 실행 후: http://localhost:8000/docs 에서 API 문서 확인

#### 프론트엔드 서버 (Next.js)

새 터미널을 열고:

```powershell
cd frontend

# 환경 변수 설정
echo "BACKEND_URL=http://localhost:8000" > .env
echo "NEXT_PUBLIC_BACKEND_URL=http://localhost:8000" >> .env

# 패키지 설치 (최초 1회)
npm install

# 개발 서버 시작
npm run dev
```

브라우저에서 http://localhost:3000 접속

## 사용 방법

1. **목표 배우 입력**: 시나리오에 생각한 유명 배우 이름 입력 (예: 송강호, 전지현)
2. **이미지 업로드**: 지원자 사진을 드래그&드롭 또는 파일 선택
3. **소원 개수 조절**: 슬라이더로 결과 개수 설정 (1-10개)
4. **분석 시작**: "🪔 지니의 마법 시작 ✨" 버튼 클릭
5. **결과 확인**: 목표 배우와 유사한 순서대로 지원자 랭킹 확인

## API 엔드포인트

### 단일 이미지 매칭
```http
POST /match-actors?top_k=3
Content-Type: multipart/form-data

file: [이미지 파일]
```

### 배치 이미지 매칭
```http
POST /match-actors-batch?top_k=5
Content-Type: multipart/form-data

files: [이미지 파일1]
files: [이미지 파일2]
files: [이미지 파일3]
```

**응답 예시**:
```json
{
  "items": [
    {
      "results": [
        {
          "name": "송강호",
          "score": 0.8523,
          "image_rel": "actor_001.jpg",
          "image_url": "http://localhost:8000/actors/actor_001.jpg"
        }
      ]
    }
  ]
}
```

## 환경 변수

### 프론트엔드 (.env)

```env
# 서버 사이드에서 FastAPI 호출 시 사용
BACKEND_URL=http://localhost:8000

# 클라이언트에서 이미지 URL 생성 시 사용
NEXT_PUBLIC_BACKEND_URL=http://localhost:8000
```

### 프로덕션 배포 (Vercel)

Vercel 프로젝트 설정에서 Environment Variables 추가:
- `BACKEND_URL`: 백엔드 API 서버 주소
- `NEXT_PUBLIC_BACKEND_URL`: 백엔드 정적 파일 서버 주소

## 동작 원리

1. **임베딩 생성**: CLIP 모델이 업로드된 이미지를 512차원 벡터로 변환
2. **유사도 계산**: 코사인 유사도로 배우 인덱스와 비교
3. **랭킹**: 유사도 점수가 높은 순서로 Top-K 배우 반환
4. **결과 표시**: 프론트엔드에서 배우 정보와 점수 시각화

### 핵심 컴포넌트

- `embeddings.py`: CLIP ViT-B/32 모델로 이미지 임베딩 생성
- `search.py`: NumPy 기반 코사인 유사도 계산 및 Top-K 검색
- `build_actor_index.py`: 배우별 이미지를 평균하여 대표 벡터 생성
- `page.tsx`: Genie 테마 UI, 드래그&드롭, 진행률 표시

## 테스트

```powershell
# 전체 테스트 실행
pytest -v

# 특정 테스트만 실행
pytest tests/test_api.py -v
```

## FAQ

### GPU가 필요한가요?
CPU만으로도 동작합니다. 최초 모델 로드 시 시간이 소요될 수 있습니다.

### 인덱스 없이 API를 호출하면?
`503 Service Unavailable` 에러를 반환합니다. 먼저 인덱스를 생성해야 합니다.

### CLIP 대신 다른 모델을 사용할 수 있나요?
네, `embeddings.py`를 수정하여 FaceNet, ArcFace, InsightFace 등으로 교체 가능합니다.

### 결과의 정확도를 높이려면?
- 배우 데이터셋의 이미지 품질과 수량을 늘리세요
- 얼굴 전용 임베딩 모델로 교체하세요
- `face_preprocess.py`의 얼굴 정렬 기능을 활성화하세요

## 배포

### Vercel 배포

1. GitHub 저장소를 Vercel에 Import
2. Framework Preset: **Next.js**
3. Root Directory: `frontend`
4. Environment Variables 설정:
   - `BACKEND_URL`: 백엔드 API 주소
   - `NEXT_PUBLIC_BACKEND_URL`: 백엔드 정적 파일 주소
5. Deploy 클릭

### 백엔드 배포 (예: Railway, Render)

```bash
# 프로덕션 서버 실행 예시
uvicorn backend.app.main:app --host 0.0.0.0 --port 8000
```

## 향후 개선 사항

- [ ] 실시간 웹캠 촬영 및 분석
- [ ] 배우 데이터셋 관리 대시보드
- [ ] 유사도 히트맵 시각화
- [ ] 다국어 지원 (영어, 일본어)
- [ ] 배우 프로필 상세 정보 표시
- [ ] CSV/Excel 결과 내보내기
- [ ] 얼굴 전용 모델 옵션 (FaceNet, ArcFace)

## 라이선스

MIT License

## 문의

프로젝트 관련 문의: **disco922@naver.com**

---

Made with 🪔 by Genie Match Team
