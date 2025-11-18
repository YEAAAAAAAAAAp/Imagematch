# 🎭 Genie Match - AI 배우 캐스팅 솔루션

**AI 기반 시각적 유사도 검색으로 완벽한 배우를 찾아드립니다**

Genie Match는 CLIP 임베딩을 활용한 고급 이미지 매칭 시스템으로, 지원자의 사진을 업로드하면 가장 유사한 레퍼런스 배우를 자동으로 찾아줍니다.

---

## ✨ 주요 기능

- 🎯 **AI 시각적 매칭**: OpenAI CLIP 모델 기반 정확한 얼굴 유사도 분석
- 🚀 **배치 처리**: 여러 지원자 사진을 한 번에 분석
- 🎨 **직관적 UI**: Genie 테마의 마법 같은 사용자 경험
- 🔍 **레퍼런스 배우 지정**: 특정 배우와의 유사도 강조 표시
- 📊 **실시간 진행률**: 분석 과정 시각화
- 🌐 **RESTful API**: 쉬운 통합과 확장성

---

## 🚀 빠른 시작

### 1. 사전 요구사항

- **Python** 3.10 이상
- **Node.js** 18 이상
- **Git**

### 2. 프로젝트 클론

```bash
git clone https://github.com/YEAAAAAAAAAAp/Imagematch.git
cd Imagematch
```

### 3. 백엔드 설정

```bash
# 가상환경 생성
python -m venv .venv

# 가상환경 활성화 (Windows)
.\.venv\Scripts\Activate.ps1

# 패키지 설치
pip install -r requirements.txt

# PyTorch CPU 버전 설치 (Windows)
pip install torch==2.2.0 torchvision==0.17.0 --index-url https://download.pytorch.org/whl/cpu
```

### 4. 배우 데이터 준비

```bash
# 배우 이미지 폴더 구조
C:\data\actors\
├── Actor_Name1\
│   ├── image1.jpg
│   ├── image2.jpg
│   └── ...
├── Actor_Name2\
│   └── ...
└── ...

# 임베딩 인덱스 생성
python backend\scripts\build_actor_index.py --dataset-dir C:\data\actors
```

### 5. 프론트엔드 설정

```bash
cd frontend
npm install
```

### 6. 서버 실행

```bash
# 터미널 1: 백엔드 서버
.\.venv\Scripts\python.exe -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000

# 터미널 2: 프론트엔드 서버
cd frontend
npm run dev
```

### 7. 접속

- 🌐 **프론트엔드**: http://localhost:3000
- 📡 **백엔드 API**: http://localhost:8000
- 📚 **API 문서**: http://localhost:8000/docs

---

## 🎯 사용 방법

### 웹 인터페이스

1. http://localhost:3000 접속
2. **드래그 앤 드롭** 또는 **클릭**하여 지원자 사진 업로드
3. (선택) 레퍼런스 배우 이름 입력
4. (선택) Top K 값 조정 (기본: 3)
5. **Analyze Images** 버튼 클릭
6. 결과 확인 (레퍼런스 배우는 금색 별표로 표시)

### API 사용

#### 단일 이미지 매칭

```bash
curl -X POST "http://localhost:8000/match-actors?top_k=5" \
  -F "file=@applicant.jpg"
```

#### 배치 이미지 매칭

```bash
curl -X POST "http://localhost:8000/match-actors-batch?top_k=5" \
  -F "files=@applicant1.jpg" \
  -F "files=@applicant2.jpg"
```

#### 레퍼런스 배우 지정

```bash
curl -X POST "http://localhost:8000/match-actors-batch?top_k=5&reference_actor=Tom_Cruise" \
  -F "files=@applicant.jpg"
```

---

## 📂 프로젝트 구조

```
Imagematch/
├── backend/
│   ├── app/
│   │   ├── main.py                    # FastAPI 애플리케이션
│   │   ├── models/
│   │   │   └── schemas.py             # Pydantic 스키마
│   │   ├── services/
│   │   │   ├── embeddings.py          # CLIP 임베딩 생성
│   │   │   ├── search.py              # 유사도 검색 엔진
│   │   │   └── simple_visual_rag.py   # Visual RAG (옵션)
│   │   └── data/
│   │       ├── embeddings.npy         # 배우 임베딩 캐시
│   │       ├── metadata.json          # 배우 메타데이터
│   │       └── actors/                # 배우 이미지 폴더
│   └── scripts/
│       └── build_actor_index.py       # 인덱스 생성 스크립트
│
├── frontend/
│   ├── app/
│   │   ├── page.tsx                   # 메인 페이지
│   │   ├── layout.tsx                 # 레이아웃
│   │   └── api/
│   │       ├── match-actors/          # 단일 매칭 API
│   │       └── match-actors-batch/    # 배치 매칭 API
│   └── package.json
│
├── tests/
│   └── test_api.py                    # API 테스트
│
├── requirements.txt                   # Python 의존성
├── SETUP_GUIDE.md                     # 상세 설정 가이드
├── NAMING_RULES.md                    # 파일명 규칙
└── README.md                          # 이 파일
```

---

## 📊 API 엔드포인트

| 메서드 | 엔드포인트 | 설명 |
|--------|-----------|------|
| GET | `/health` | 서버 상태 확인 |
| POST | `/match-actors` | 단일 이미지 매칭 |
| POST | `/match-actors-batch` | 배치 이미지 매칭 |
| POST | `/visual-rag-search` | RAG 기반 하이브리드 검색 (옵션) |
| GET | `/rag-stats` | RAG 시스템 통계 |
| GET | `/docs` | Swagger UI |

---

## 🎨 기술 스택

### 백엔드
- **FastAPI** 0.115.5 - 고성능 웹 프레임워크
- **PyTorch** 2.2.0 - 딥러닝 프레임워크
- **Transformers** 4.45.2 - CLIP 모델
- **NumPy** 1.26.4 - 수치 연산
- **Pillow** 10.4.0 - 이미지 처리

### 프론트엔드
- **Next.js** 14.2.10 - React 프레임워크
- **TypeScript** - 타입 안정성
- **Tailwind CSS** - 스타일링
- **Genie Theme** - 마법 같은 UI/UX

---

## 🛠️ 트러블슈팅

### "Actor index not built" 오류
```bash
# 해결: 배우 인덱스 생성
python backend\scripts\build_actor_index.py --dataset-dir C:\data\actors
```

### PyTorch 설치 오류 (Windows)
```bash
# 해결: CPU 버전 수동 설치
pip install torch==2.2.0 torchvision==0.17.0 --index-url https://download.pytorch.org/whl/cpu
```

### 프론트엔드 포트 충돌
```bash
# 해결: 다른 포트 사용
cd frontend
npm run dev -- -p 3001
```

---

## 📖 추가 문서

- **[SETUP_GUIDE.md](SETUP_GUIDE.md)** - 상세 설치 및 설정 가이드
- **[NAMING_RULES.md](NAMING_RULES.md)** - 파일/폴더 네이밍 규칙
- **API 문서** - http://localhost:8000/docs

---

## 🤝 기여

이슈 및 풀 리퀘스트를 환영합니다!

---

## 📄 라이선스

This project is licensed under the MIT License.

---

**Made with ✨ by Genie Match Team**
