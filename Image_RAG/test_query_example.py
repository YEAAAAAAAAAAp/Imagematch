"""
쿼리 이미지와 유사한 이미지 찾기 - InsightFace 사용 예제
"""

from insightface_rag import InsightFaceRAG, load_images_from_directory


def find_similar_images():
    """image2.jpg와 유사한 dataset 이미지 찾기"""
    print("=== 쿼리 이미지와 유사한 이미지 찾기 ===\n")
    
    # 쿼리 이미지
    query_image = "image2.jpg"
    
    # 데이터셋 디렉토리
    dataset_dir = "./dataset"
    
    # RAG 시스템 초기화
    print("InsightFace 모델 초기화 중...")
    rag_system = InsightFaceRAG()
    print()
    
    # 데이터셋 이미지 로드
    dataset_images = load_images_from_directory(dataset_dir)
    
    if len(dataset_images) == 0:
        print(f"오류: {dataset_dir}에서 이미지를 찾을 수 없습니다.")
        return
    
    print(f"로드된 이미지: {len(dataset_images)}개\n")
    
    # 데이터베이스에 추가
    rag_system.add_images_to_database(dataset_images)
    print()
    
    # 쿼리 이미지로 검색
    print(f"쿼리 이미지: {query_image}")
    print("유사 이미지 검색 중...\n")
    
    results = rag_system.search_similar_faces(
        query_image,
        top_k=10,
        threshold=0.0
    )
    
    # 결과 출력
    print(f"=== 발견된 유사 이미지: {len(results)}개 ===\n")
    
    for i, (entry, score) in enumerate(results, 1):
        print(f"{i}. 유사도: {score:.4f}")
        print(f"   경로: {entry['path']}")
        print()


if __name__ == "__main__":
    find_similar_images()
