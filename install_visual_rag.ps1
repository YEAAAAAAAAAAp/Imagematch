# Visual RAG 환경 설치 및 검증 스크립트

Write-Host "🎨 Visual RAG 환경 설치 시작..." -ForegroundColor Cyan
Write-Host ""

# 1. 가상환경 확인
if (-not (Test-Path ".venv")) {
    Write-Host "❌ 가상환경이 없습니다. 먼저 가상환경을 생성하세요:" -ForegroundColor Red
    Write-Host "   python -m venv .venv" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ 가상환경 확인 완료" -ForegroundColor Green

# 2. 가상환경 활성화
Write-Host "🔧 가상환경 활성화 중..." -ForegroundColor Cyan
& .\.venv\Scripts\Activate.ps1

# 3. Visual RAG 패키지 설치
Write-Host ""
Write-Host "📦 Visual RAG 패키지 설치 중..." -ForegroundColor Cyan
Write-Host "   - chromadb" -ForegroundColor Gray
Write-Host "   - langchain" -ForegroundColor Gray
Write-Host "   - sentence-transformers" -ForegroundColor Gray
Write-Host ""

pip install chromadb==0.4.22 langchain==0.1.0 langchain-community==0.0.10 sentence-transformers==2.3.1

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ 패키지 설치 실패" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "✅ 패키지 설치 완료" -ForegroundColor Green

# 4. 선택적 LLM 패키지 설치 여부 확인
Write-Host ""
$installLLM = Read-Host "LLM 기능을 사용하시겠습니까? (y/N)"

if ($installLLM -eq "y" -or $installLLM -eq "Y") {
    Write-Host ""
    Write-Host "📦 LLM 패키지 설치 중..." -ForegroundColor Cyan
    pip install openai==1.12.0 tiktoken==0.5.2
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ LLM 패키지 설치 완료" -ForegroundColor Green
        
        # OpenAI API 키 설정 안내
        Write-Host ""
        Write-Host "⚙️  OpenAI API 키 설정이 필요합니다:" -ForegroundColor Yellow
        Write-Host "   1. 환경 변수로 설정:" -ForegroundColor Gray
        Write-Host "      `$env:OPENAI_API_KEY = 'sk-your-api-key'" -ForegroundColor Gray
        Write-Host "   2. 또는 .env 파일에 추가:" -ForegroundColor Gray
        Write-Host "      OPENAI_API_KEY=sk-your-api-key" -ForegroundColor Gray
    }
} else {
    Write-Host "⏭️  LLM 패키지 설치 건너뛰기" -ForegroundColor Yellow
}

# 5. 설치된 패키지 확인
Write-Host ""
Write-Host "📋 설치된 패키지 확인:" -ForegroundColor Cyan
$packages = @("chromadb", "langchain", "sentence-transformers", "openai")

foreach ($pkg in $packages) {
    $version = pip show $pkg 2>$null | Select-String "Version:"
    if ($version) {
        Write-Host "   ✅ $pkg : $($version -replace 'Version: ', '')" -ForegroundColor Green
    } else {
        if ($pkg -eq "openai") {
            Write-Host "   ⏭️  $pkg : 설치 안 됨 (선택사항)" -ForegroundColor Yellow
        } else {
            Write-Host "   ❌ $pkg : 설치 안 됨" -ForegroundColor Red
        }
    }
}

# 6. 기존 인덱스 확인
Write-Host ""
Write-Host "🔍 기존 배우 인덱스 확인 중..." -ForegroundColor Cyan

$embPath = "backend\app\data\embeddings.npy"
$metaPath = "backend\app\data\metadata.json"

$hasIndex = (Test-Path $embPath) -and (Test-Path $metaPath)

if ($hasIndex) {
    Write-Host "   ✅ 기존 인덱스 발견" -ForegroundColor Green
    Write-Host "      - $embPath" -ForegroundColor Gray
    Write-Host "      - $metaPath" -ForegroundColor Gray
    
    # ChromaDB 인덱스 생성 여부 확인
    Write-Host ""
    $buildRAG = Read-Host "ChromaDB 인덱스를 생성하시겠습니까? (Y/n)"
    
    if ($buildRAG -ne "n" -and $buildRAG -ne "N") {
        Write-Host ""
        Write-Host "🔨 ChromaDB 인덱스 생성 중..." -ForegroundColor Cyan
        python backend\scripts\build_visual_rag_index.py
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host ""
            Write-Host "✅ ChromaDB 인덱스 생성 완료" -ForegroundColor Green
        } else {
            Write-Host ""
            Write-Host "❌ ChromaDB 인덱스 생성 실패" -ForegroundColor Red
        }
    }
} else {
    Write-Host "   ⚠️  기존 인덱스가 없습니다" -ForegroundColor Yellow
    Write-Host "      먼저 배우 데이터를 수집하고 인덱스를 생성하세요:" -ForegroundColor Yellow
    Write-Host "      python backend\scripts\build_actor_index.py --dataset-dir C:\data\actors" -ForegroundColor Gray
}

# 7. 테스트 실행
Write-Host ""
$runTests = Read-Host "Visual RAG 테스트를 실행하시겠습니까? (y/N)"

if ($runTests -eq "y" -or $runTests -eq "Y") {
    Write-Host ""
    Write-Host "🧪 테스트 실행 중..." -ForegroundColor Cyan
    pytest tests\test_visual_rag.py -v
}

# 8. 완료 메시지
Write-Host ""
Write-Host "=" * 60 -ForegroundColor Cyan
Write-Host "🎉 Visual RAG 환경 설치 완료!" -ForegroundColor Green
Write-Host "=" * 60 -ForegroundColor Cyan
Write-Host ""
Write-Host "📖 다음 단계:" -ForegroundColor Cyan
Write-Host "   1. 배우 이미지 수집 및 인덱스 생성" -ForegroundColor White
Write-Host "      python backend\scripts\build_actor_index.py --dataset-dir C:\data\actors" -ForegroundColor Gray
Write-Host ""
Write-Host "   2. ChromaDB 인덱스 생성" -ForegroundColor White
Write-Host "      python backend\scripts\build_visual_rag_index.py" -ForegroundColor Gray
Write-Host ""
Write-Host "   3. 서버 실행" -ForegroundColor White
Write-Host "      uvicorn backend.app.main:app --reload" -ForegroundColor Gray
Write-Host ""
Write-Host "   4. Visual RAG API 테스트" -ForegroundColor White
Write-Host "      curl http://localhost:8000/rag-stats" -ForegroundColor Gray
Write-Host ""
Write-Host "📚 상세 가이드: VISUAL_RAG_SETUP.md" -ForegroundColor Cyan
Write-Host ""
