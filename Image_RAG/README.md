# InsightFace 기반 얼굴 이미지 RAG 시스템

InsightFace 모델을 사용하여 얼굴 이미지 기반 RAG (Retrieval-Augmented Generation) 시스템을 구축합니다.

## 📋 개요

이 프로젝트는 [InsightFace](https://github.com/deepinsight/insightface) 라이브러리를 사용하여:
- 얼굴 이미지를 512차원 임베딩 벡터로 변환
- 데이터베이스에 얼굴 이미지 임베딩 저장
- 쿼리 얼굴 이미지와 유사한 얼굴 검색

## 🚀 설치

```bash
pip install -r requirements.txt
```

## 📖 사용 방법

### 1. 명령줄 사용

#### 데이터베이스 구축

```bash
python insightface_rag.py build \
    --dataset_dir ./dataset \
    --output_db face_database.pkl
```

#### 유사 얼굴 검색

```bash
python insightface_rag.py search \
    --query_image image2.jpg \
    --database face_database.pkl \
    --top_k 10 \
    --threshold 0.0 \
    --output results.txt
```

### 2. Python 코드에서 사용

#### 쿼리 이미지와 유사한 이미지 찾기

```python
from insightface_rag import InsightFaceRAG, load_images_from_directory

# RAG 시스템 초기화
rag_system = InsightFaceRAG()

# 데이터셋 이미지 로드
images = load_images_from_directory("./dataset")

# 데이터베이스에 추가
rag_system.add_images_to_database(images)

# 쿼리 이미지로 검색
results = rag_system.search_similar_faces(
    "image2.jpg",
    top_k=10,
    threshold=0.0
)

# 결과 확인
for i, (entry, score) in enumerate(results, 1):
    print(f"{i}. 유사도: {score:.4f} - {entry['path']}")
```

#### 단일 이미지 임베딩

```python
from insightface_rag import InsightFaceRAG

rag_system = InsightFaceRAG()

# 이미지를 512차원 벡터로 변환
embedding = rag_system.encode_face("path/to/face_image.jpg")

if embedding is not None:
    print(f"임베딩 차원: {embedding.shape}")
else:
    print("얼굴을 찾을 수 없습니다.")
```

## 🔧 주요 기능

### InsightFaceRAG 클래스

#### 메서드

- `encode_face(image)`: 얼굴 이미지를 512차원 임베딩으로 변환 (얼굴이 없으면 None 반환)
- `add_images_to_database(images, metadata)`: 데이터베이스에 이미지 추가
- `search_similar_faces(query_image, top_k, threshold)`: 유사 얼굴 검색
- `save_database(filepath)`: 데이터베이스를 파일로 저장 (.pkl)
- `load_database(filepath)`: 저장된 데이터베이스 로드

#### 속성

- `image_database`: 이미지 정보와 메타데이터 저장
- `embeddings_matrix`: 모든 이미지의 임베딩 행렬

## 📊 데이터베이스 형식

데이터베이스는 각 이미지에 대해 다음 정보를 저장합니다:

```python
{
    'id': 0,  # 고유 ID
    'path': 'path/to/image.jpg',  # 이미지 경로
    'metadata': {'name': 'person_1'},  # 사용자 정의 메타데이터
    'embedding': np.array([...])  # 512차원 임베딩 벡터
}
```

## 🎯 사용 사례

1. **얼굴 인식 시스템**: 데이터베이스에서 특정 인물 찾기
2. **중복 얼굴 검출**: 동일 인물의 다른 사진 찾기
3. **얼굴 클러스터링**: 유사한 얼굴 그룹화
4. **이미지 검색**: 텍스트가 아닌 얼굴 이미지로 검색

## ⚙️ 설정 옵션

### 모델 선택

```python
# 기본 모델 (buffalo_l)
rag_system = InsightFaceRAG()

# 다른 모델 사용
rag_system = InsightFaceRAG(model_name="buffalo_s")  # 더 작은 모델
```

### 디바이스 선택

```python
# GPU 사용 (기본값)
rag_system = InsightFaceRAG(ctx_id=0)

# CPU 사용
rag_system = InsightFaceRAG(ctx_id=-1)
```

## 📝 주의사항

1. **얼굴 검출**: InsightFace는 자동으로 이미지에서 얼굴을 검출합니다. 얼굴이 없는 이미지는 건너뜁니다.

2. **이미지 형식**: OpenCV를 사용하므로 BGR 형식의 이미지를 처리합니다.

3. **첫 실행**: InsightFace 모델을 자동으로 다운로드하므로 시간이 걸릴 수 있습니다.

4. **GPU**: GPU가 있으면 자동으로 사용하며, 처리 속도가 크게 향상됩니다.

## 🔗 참고 자료

- [InsightFace GitHub](https://github.com/deepinsight/insightface)
- [InsightFace 문서](https://github.com/deepinsight/insightface/wiki)

## 📄 라이선스

이 프로젝트는 MIT 라이선스를 따릅니다. InsightFace 모델의 라이선스는 원본 저장소를 참고하세요.
