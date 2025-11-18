#!/usr/bin/env python3
"""
Visual RAG 환경 검증 스크립트
설치된 패키지와 시스템 상태를 확인합니다.
"""

import sys
from pathlib import Path


def check_package(package_name: str, optional: bool = False) -> bool:
    """패키지 설치 확인"""
    try:
        __import__(package_name)
        print(f"✅ {package_name:25s} - 설치됨")
        return True
    except ImportError:
        if optional:
            print(f"⏭️  {package_name:25s} - 설치 안 됨 (선택사항)")
        else:
            print(f"❌ {package_name:25s} - 설치 안 됨")
        return False


def check_file(file_path: Path, description: str) -> bool:
    """파일 존재 확인"""
    if file_path.exists():
        size = file_path.stat().st_size
        print(f"✅ {description:30s} - 존재 ({size:,} bytes)")
        return True
    else:
        print(f"❌ {description:30s} - 없음")
        return False


def main():
    print("=" * 70)
    print("🔍 Visual RAG 환경 검증")
    print("=" * 70)
    print()
    
    # 1. 필수 패키지 확인
    print("📦 필수 패키지:")
    print("-" * 70)
    required_packages = {
        "numpy": False,
        "PIL": False,
        "torch": False,
        "transformers": False,
        "fastapi": False,
        "chromadb": False,
        "langchain": False,
        "sentence_transformers": False,
    }
    
    for pkg in required_packages:
        required_packages[pkg] = check_package(pkg)
    
    print()
    
    # 2. 선택 패키지 확인
    print("📦 선택 패키지:")
    print("-" * 70)
    optional_packages = {
        "openai": False,
        "tiktoken": False,
    }
    
    for pkg in optional_packages:
        optional_packages[pkg] = check_package(pkg, optional=True)
    
    print()
    
    # 3. 파일 존재 확인
    print("📁 데이터 파일:")
    print("-" * 70)
    
    base_dir = Path(__file__).resolve().parents[1]
    data_dir = base_dir / "backend" / "app" / "data"
    
    files_to_check = {
        data_dir / "embeddings.npy": "배우 임베딩 (embeddings.npy)",
        data_dir / "metadata.json": "배우 메타데이터 (metadata.json)",
        data_dir / "chroma_db": "ChromaDB 인덱스 (chroma_db/)",
    }
    
    file_status = {}
    for file_path, desc in files_to_check.items():
        file_status[desc] = check_file(file_path, desc)
    
    print()
    
    # 4. 서비스 가용성 확인
    print("🔧 서비스 상태:")
    print("-" * 70)
    
    try:
        sys.path.insert(0, str(base_dir))
        from backend.app.services.visual_rag import VISUAL_RAG
        
        VISUAL_RAG.initialize()
        stats = VISUAL_RAG.get_statistics()
        
        print(f"✅ Visual RAG 시스템        - 정상")
        print(f"   ├─ 총 배우 수: {stats['total_actors']}")
        print(f"   ├─ 임베딩 차원: {stats['embedding_dimension']}")
        print(f"   └─ 초기화: {stats['initialized']}")
        
    except Exception as e:
        print(f"❌ Visual RAG 시스템        - 오류: {e}")
    
    print()
    
    try:
        from backend.app.services.llm_integration import LLM_SERVICE
        
        if LLM_SERVICE.is_available():
            print(f"✅ LLM 서비스               - 정상 (API 키 설정됨)")
        else:
            print(f"⚠️  LLM 서비스               - API 키 미설정")
    except Exception as e:
        print(f"❌ LLM 서비스               - 오류: {e}")
    
    print()
    
    # 5. 종합 결과
    print("=" * 70)
    print("📊 검증 결과 요약")
    print("=" * 70)
    
    required_ok = all(required_packages.values())
    data_ok = all(file_status.values())
    
    if required_ok and data_ok:
        print("🎉 모든 검증 통과! Visual RAG 환경이 완벽하게 구축되었습니다.")
        print()
        print("다음 단계:")
        print("  1. 서버 실행: uvicorn backend.app.main:app --reload")
        print("  2. API 테스트: curl http://localhost:8000/rag-stats")
        return 0
    
    else:
        print("⚠️  일부 항목이 누락되었습니다.")
        print()
        
        if not required_ok:
            print("❌ 필수 패키지:")
            for pkg, status in required_packages.items():
                if not status:
                    print(f"   - {pkg}")
            print("   → 설치: pip install -r requirements.txt")
            print()
        
        if not data_ok:
            print("❌ 데이터 파일:")
            for desc, status in file_status.items():
                if not status:
                    print(f"   - {desc}")
            print("   → 인덱스 생성:")
            print("     1. python backend/scripts/build_actor_index.py --dataset-dir C:/data/actors")
            print("     2. python backend/scripts/build_visual_rag_index.py")
            print()
        
        return 1


if __name__ == "__main__":
    sys.exit(main())
