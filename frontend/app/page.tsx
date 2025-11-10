'use client'

import { useMemo, useState, useEffect } from 'react'
import Image from 'next/image'

type MatchResult = {
  name: string
  score: number
  image_url?: string | null
}

type MatchResponse = {
  results: MatchResult[]
}

export default function Page() {
  const [files, setFiles] = useState<File[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [results, setResults] = useState<MatchResult[][]>([])
  const [topK, setTopK] = useState<number>(3)
  const [progress, setProgress] = useState<number>(0)
  const [isDragActive, setIsDragActive] = useState(false)
  const [particles, setParticles] = useState<Array<{id: number, x: number, y: number, size: number, delay: number}>>([])
  const [showGuide, setShowGuide] = useState(true)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [totalAnalyzed, setTotalAnalyzed] = useState(0)

  const backendPublic = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000'

  // Generate floating particles on mount
  useEffect(() => {
    const newParticles = Array.from({ length: 20 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 4 + 2,
      delay: Math.random() * 5
    }))
    setParticles(newParticles)
  }, [])

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setResults([])
    setSuccessMessage(null)
    if (files.length === 0) return
    const form = new FormData()
    files.forEach((f: File) => form.append('files', f))
    const qs = new URLSearchParams({ top_k: String(topK) })
    setLoading(true)
    setProgress(0)
    
    // Simulate progress for better UX
    const progressInterval = setInterval(() => {
      setProgress(prev => Math.min(prev + 10, 90))
    }, 200)
    
    try {
      const resp = await fetch(`/api/match-actors-batch?${qs.toString()}`, { method: 'POST', body: form })
      const data = await resp.json()
      if (!resp.ok) throw new Error((data as any)?.detail || '요청 실패')
      const items = (data.items || []).map((it: any) => it.results || []) as MatchResult[][]
      setResults(items)
      setProgress(100)
      setTotalAnalyzed(prev => prev + files.length)
      setSuccessMessage(`Successfully analyzed ${files.length} image${files.length > 1 ? 's' : ''}!`)
      setTimeout(() => setSuccessMessage(null), 5000)
    } catch (err: any) {
      setError(err?.message || '에러가 발생했습니다')
    } finally {
      clearInterval(progressInterval)
      setLoading(false)
      setTimeout(() => setProgress(0), 1000)
    }
  }

  const onInputChange = (evt: React.ChangeEvent<HTMLInputElement>) => {
    const list = Array.from(evt.target.files || [])
    setFiles(list)
  }

  const onDrop = (evt: React.DragEvent<HTMLDivElement>) => {
    evt.preventDefault()
    setIsDragActive(false)
    const list = Array.from(evt.dataTransfer.files || []) as File[]
    const onlyImages = list.filter((f: File) => f.type.startsWith('image/'))
    setFiles((prev: File[]) => [...prev, ...onlyImages])
  }

  const onDragOver = (evt: React.DragEvent<HTMLDivElement>) => {
    evt.preventDefault()
    setIsDragActive(true)
  }

  const onDragLeave = (evt: React.DragEvent<HTMLDivElement>) => {
    evt.preventDefault()
    setIsDragActive(false)
  }

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index))
  }

  const clearAll = () => {
    setFiles([])
    setResults([])
    setError(null)
    setProgress(0)
  }

  const previews = useMemo(() => files.map((f: File) => ({ name: f.name, url: URL.createObjectURL(f) })), [files])

  return (
    <main className="min-h-screen relative overflow-hidden">
      {/* Premium Background */}
      <div className="fixed inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
        {/* Sophisticated Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-tr from-blue-950/40 via-transparent to-purple-950/40" />
        
        {/* Premium Floating Particles */}
        {particles.slice(0, 8).map((particle) => (
          <div
            key={particle.id}
            className="absolute rounded-full bg-gradient-to-br from-blue-400/10 to-purple-400/10 backdrop-blur-sm animate-float"
            style={{
              left: `${particle.x}%`,
              top: `${particle.y}%`,
              width: `${particle.size * 2}px`,
              height: `${particle.size * 2}px`,
              animationDelay: `${particle.delay}s`,
              animationDuration: `${20 + Math.random() * 10}s`,
              boxShadow: '0 0 20px rgba(59, 130, 246, 0.1)'
            }}
          />
        ))}
        
        {/* Elegant Radial Accents with Animation */}
        <div className="absolute top-1/4 right-1/4 w-[700px] h-[700px] bg-blue-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '8s' }} />
        <div className="absolute bottom-1/3 left-1/3 w-[600px] h-[600px] bg-purple-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '10s' }} />
        
        {/* Subtle Grid Pattern */}
        <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.02) 1px, transparent 0)', backgroundSize: '40px 40px' }} />
      </div>

      {/* Content */}
      <div className="relative z-10">
        {/* Professional Navigation Bar */}
        <nav className="backdrop-blur-2xl bg-slate-900/80 border-b border-slate-700/30 shadow-2xl shadow-black/20 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-20">
              {/* Logo & Brand */}
              <div className="flex items-center gap-4">
                <div className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-purple-500 rounded-2xl blur-xl opacity-50 group-hover:opacity-75 transition-opacity" />
                  <div className="relative w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500/30 to-purple-500/30 backdrop-blur-xl border border-white/20 flex items-center justify-center shadow-xl">
                    <span className="text-2xl">🎭</span>
                  </div>
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-white">
                    Actor Match <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">AI</span>
                  </h1>
                  <p className="text-xs text-slate-400 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                    얼굴 인식 서비스
                  </p>
                </div>
              </div>

              {/* Navigation Links */}
              <div className="hidden md:flex items-center gap-2">
                <button className="px-4 py-2 text-sm font-medium text-white bg-slate-800/50 rounded-xl hover:bg-slate-800 transition-all">
                  대시보드
                </button>
                <button 
                  onClick={() => setShowGuide(!showGuide)}
                  className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800/50 rounded-xl transition-all"
                >
                  사용 가이드
                </button>
              </div>

              {/* Stats Badge */}
              {totalAnalyzed > 0 && (
                <div className="hidden lg:flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20">
                  <svg className="w-4 h-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  <span className="text-xs font-semibold text-slate-300">
                    {totalAnalyzed}개 분석 완료
                  </span>
                </div>
              )}
            </div>
          </div>
        </nav>

        {/* Success Toast */}
        {successMessage && (
          <div className="fixed top-24 right-4 z-50 animate-slide-in">
            <div className="backdrop-blur-xl bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/30 rounded-2xl p-4 shadow-2xl shadow-green-500/20 max-w-md">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-semibold text-green-300">{successMessage}</p>
                  <p className="text-xs text-green-400/80">아래에서 결과를 확인하세요</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Quick Guide Banner */}
        {showGuide && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
            <div className="backdrop-blur-xl bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-2xl p-6 shadow-xl relative">
              <button
                onClick={() => setShowGuide(false)}
                className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                  <svg className="w-6 h-6 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-white mb-2">사용 방법</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-slate-300">
                    <div className="flex items-start gap-2">
                      <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 text-xs font-bold flex-shrink-0">1</span>
                      <span>사람이 포함된 이미지를 업로드하세요</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="flex items-center justify-center w-6 h-6 rounded-full bg-purple-500/20 text-purple-400 text-xs font-bold flex-shrink-0">2</span>
                      <span>결과 개수를 조정하세요 (1-10)</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="flex items-center justify-center w-6 h-6 rounded-full bg-pink-500/20 text-pink-400 text-xs font-bold flex-shrink-0">3</span>
                      <span>분석 버튼을 클릭하고 결과를 확인하세요</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Luxurious Header */}
        <header className="backdrop-blur-2xl bg-slate-900/70 border-b border-slate-700/30 shadow-2xl shadow-black/20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              {/* Hero Section */}
              <div className="text-center md:text-left">
                <h2 className="text-3xl md:text-4xl font-light tracking-tight text-white mb-2">
                  유사 <span className="font-bold bg-gradient-to-r from-blue-400 via-blue-300 to-purple-400 bg-clip-text text-transparent">배우</span> 찾기
                </h2>
                <p className="text-sm text-slate-400">이미지를 업로드하고 첨단 AI 기술로 유사한 배우를 찾아보세요</p>
              </div>

              {/* Database Stats */}
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-3 px-6 py-3 backdrop-blur-xl bg-slate-800/40 border border-slate-700/40 rounded-xl">
                  <div className="relative">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center">
                      <svg className="w-5 h-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
                      </svg>
                    </div>
                    <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-green-400 rounded-full animate-pulse border-2 border-slate-800" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                      100,000+
                    </div>
                    <div className="text-xs text-slate-400 mt-0.5 font-medium">배우 이미지 데이터</div>
                  </div>
                </div>
                {files.length > 0 && (
                  <button
                    onClick={clearAll}
                    className="group px-4 py-3 text-sm text-slate-300 hover:text-white bg-slate-800/50 hover:bg-slate-800 backdrop-blur-xl rounded-xl transition-all duration-300 border border-slate-600/30 hover:border-slate-500/50 shadow-lg hover:shadow-xl hover:shadow-red-500/10"
                  >
                    <svg className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            </div>
          </div>
        </header>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Feature Cards Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="backdrop-blur-xl bg-slate-800/30 border border-slate-700/40 rounded-2xl p-5 hover:border-slate-600/60 transition-all">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
                  <svg className="w-5 h-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h3 className="font-semibold text-white">빠른 처리</h3>
              </div>
              <p className="text-sm text-slate-400">최적화된 AI 엔진으로 몇 초만에 이미지를 분석합니다</p>
            </div>

            <div className="backdrop-blur-xl bg-slate-800/30 border border-slate-700/40 rounded-2xl p-5 hover:border-slate-600/60 transition-all">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
                  <svg className="w-5 h-5 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <h3 className="font-semibold text-white">안전한 보안</h3>
              </div>
              <p className="text-sm text-slate-400">이미지는 안전하게 처리되며 저장되지 않습니다</p>
            </div>

            <div className="backdrop-blur-xl bg-slate-800/30 border border-slate-700/40 rounded-2xl p-5 hover:border-slate-600/60 transition-all">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-pink-500/20 flex items-center justify-center">
                  <svg className="w-5 h-5 text-pink-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <h3 className="font-semibold text-white">높은 정확도</h3>
              </div>
              <p className="text-sm text-slate-400">최첨단 CLIP 모델 기술로 구동됩니다</p>
            </div>
          </div>

          {/* Upload Section */}
          <section className="backdrop-blur-2xl bg-slate-900/50 border border-slate-700/30 rounded-3xl p-12 mb-12 shadow-2xl shadow-black/20">
            <form onSubmit={onSubmit} className="space-y-10">
              {/* Premium Drag & Drop Area */}
              <div
                onDrop={onDrop}
                onDragOver={onDragOver}
                onDragLeave={onDragLeave}
                className={`
                  relative border-2 border-dashed rounded-3xl p-20 text-center transition-all duration-500
                  ${isDragActive 
                    ? 'border-blue-400/60 bg-blue-500/10 scale-[1.02] shadow-2xl shadow-blue-500/20' 
                    : 'border-slate-600/40 hover:border-slate-500/60 hover:bg-slate-800/40 hover:shadow-xl hover:shadow-black/10'
                  }
                `}
              >
                <div className="flex flex-col items-center gap-8">
                  <div className="relative group">
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-purple-500 rounded-3xl blur-2xl opacity-30 group-hover:opacity-50 transition-opacity duration-500" />
                    <div className="relative w-24 h-24 rounded-3xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 backdrop-blur-xl border border-slate-600/50 flex items-center justify-center shadow-2xl transform group-hover:scale-110 group-hover:rotate-3 transition-all duration-500">
                      <svg className="w-12 h-12 text-slate-300 group-hover:text-white transition-colors duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                    </div>
                  </div>
                  <div>
                    <p className="text-2xl font-light text-white mb-3">
                      {isDragActive ? '여기에 파일을 놓으세요' : '이미지 업로드'}
                    </p>
                    <p className="text-sm text-slate-400">드래그 앤 드롭 또는 클릭하여 선택 • JPG, PNG, WEBP 지원</p>
                  </div>
                  <label className="relative group cursor-pointer">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl blur-lg opacity-50 group-hover:opacity-100 transition-opacity duration-300" />
                    <div className="relative px-10 py-4 rounded-xl bg-gradient-to-r from-blue-500 to-purple-500 text-white font-semibold text-sm transition-all duration-300 group-hover:shadow-2xl group-hover:shadow-blue-500/40 group-hover:scale-105 transform">
                      파일 선택
                    </div>
                    <input type="file" accept="image/*" multiple className="hidden" onChange={onInputChange} />
                  </label>
                  {files.length > 0 && (
                    <div className="mt-2 px-6 py-3 rounded-xl bg-gradient-to-r from-slate-800/60 to-slate-700/60 backdrop-blur-xl border border-slate-600/50 shadow-lg">
                      <p className="text-sm font-medium text-slate-200 flex items-center gap-2">
                        <svg className="w-4 h-4 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        {files.length}개 파일 선택됨
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Luxurious Top-K Slider */}
              <div className="backdrop-blur-xl bg-gradient-to-br from-slate-800/40 to-slate-700/40 border border-slate-600/50 rounded-2xl p-8 shadow-xl">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 backdrop-blur-sm border border-slate-600/50 flex items-center justify-center">
                      <svg className="w-5 h-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                    </div>
                    <label htmlFor="topk" className="text-base font-medium text-slate-200">
                      결과 개수
                    </label>
                    {/* Tooltip */}
                    <div className="group relative">
                      <svg className="w-4 h-4 text-slate-500 cursor-help" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <div className="hidden group-hover:block absolute left-0 top-6 w-48 p-2 bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-10">
                        <p className="text-xs text-slate-300">업로드된 각 이미지에 대해 표시할 유사 배우의 수를 선택하세요</p>
                      </div>
                    </div>
                  </div>
                  <span className="text-3xl font-semibold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent px-6 py-2 rounded-xl bg-slate-800/60 border border-slate-600/50 min-w-[70px] text-center shadow-lg">
                    {topK}
                  </span>
                </div>
                <input
                  id="topk"
                  type="range"
                  min={1}
                  max={10}
                  value={topK}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTopK(parseInt(e.target.value))}
                  className="w-full h-2 bg-slate-700/50 rounded-full appearance-none cursor-pointer slider-thumb"
                />
                <div className="relative flex justify-between text-xs text-slate-500 mt-4 font-medium px-1">
                  <span className="absolute left-0">1</span>
                  <span className="absolute left-1/2 -translate-x-1/2">5</span>
                  <span className="absolute right-0">10</span>
                </div>
              </div>

              {/* Premium Progress Bar */}
              {(loading || progress > 0) && (
                <div className="space-y-4 backdrop-blur-xl bg-gradient-to-br from-slate-800/40 to-slate-700/40 border border-slate-600/50 rounded-2xl p-6 shadow-xl">
                  <div className="flex justify-between text-sm text-slate-200">
                    <span className="flex items-center gap-3">
                      {loading && (
                        <svg className="animate-spin h-5 w-5 text-blue-400" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                      )}
                      <span className="font-medium">{loading ? '이미지 분석 중...' : '완료'}</span>
                    </span>
                    <span className="font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">{progress}%</span>
                  </div>
                  <div className="relative w-full bg-slate-800/60 rounded-full h-3 overflow-hidden border border-slate-700/50 shadow-inner">
                    <div
                      className="absolute inset-0 bg-gradient-to-r from-blue-500 via-blue-400 to-purple-500 h-3 rounded-full transition-all duration-500 ease-out shadow-lg shadow-blue-500/50"
                      style={{ width: `${progress}%` }}
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
                    </div>
                  </div>
                </div>
              )}

              {/* Luxurious Submit Button */}
              <button
                type="submit"
                disabled={loading || files.length === 0}
                className="relative w-full group overflow-hidden rounded-2xl transition-all duration-500 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500 via-blue-400 to-purple-500 blur-xl opacity-50 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="relative px-10 py-5 bg-gradient-to-r from-blue-500 via-blue-400 to-purple-500 text-white font-bold text-base transition-all duration-300 group-hover:shadow-2xl group-hover:shadow-blue-500/50 group-hover:scale-[1.02] transform">
                  {loading ? (
                    <span className="flex items-center justify-center gap-3">
                      <svg className="animate-spin h-6 w-6" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      분석 진행 중
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      AI 분석 시작
                    </span>
                  )}
                </div>
              </button>
            </form>

            {/* Premium Error Message */}
            {error && (
              <div className="mt-6 p-5 backdrop-blur-xl bg-gradient-to-r from-red-500/10 to-pink-500/10 border border-red-500/30 rounded-2xl shadow-xl shadow-red-500/10">
                <p className="text-red-300 text-sm flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-red-500/20 flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <span className="font-medium">{error}</span>
                </p>
              </div>
            )}
          </section>

          {/* Luxurious Preview Section */}
          {previews.length > 0 && (
            <section className="mb-12">
              <h2 className="text-2xl font-light text-white mb-8 flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 backdrop-blur-sm border border-slate-600/50 flex items-center justify-center">
                  <svg className="w-6 h-6 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <span className="text-slate-200">업로드된 이미지</span>
                <span className="ml-auto px-4 py-2 rounded-xl bg-gradient-to-r from-slate-800/60 to-slate-700/60 backdrop-blur-xl border border-slate-600/50 text-sm font-medium text-slate-300">
                  {previews.length}개 이미지
                </span>
              </h2>
              <div className="grid gap-5 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
                {previews.map((p, idx) => (
                  <div key={p.name} className="group relative backdrop-blur-xl bg-slate-800/40 border border-slate-700/40 rounded-2xl overflow-hidden hover:border-slate-600/60 hover:shadow-2xl hover:shadow-blue-500/10 transition-all duration-500 hover:scale-105 transform">
                    <div className="relative w-full aspect-square">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={p.url} alt={p.name} className="object-cover w-full h-full" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    </div>
                    <button
                      onClick={() => removeFile(idx)}
                      className="absolute top-3 right-3 bg-slate-900/95 backdrop-blur-xl text-white rounded-xl w-9 h-9 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-red-500 hover:scale-110 border border-slate-700/50 hover:border-red-500 shadow-lg transform"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                    <div className="p-3 backdrop-blur-xl bg-slate-900/60 border-t border-slate-700/50">
                      <p className="text-xs text-slate-300 truncate font-medium">{p.name}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Premium Results Section */}
          {results.length > 0 && (
            <section>
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-light text-white flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 backdrop-blur-sm border border-slate-600/50 flex items-center justify-center">
                    <svg className="w-6 h-6 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                    </svg>
                  </div>
                  <span className="text-slate-200">분석 결과</span>
                </h2>
                <div className="flex items-center gap-3">
                  <span className="px-4 py-2 rounded-xl bg-gradient-to-r from-green-500/20 to-emerald-500/20 backdrop-blur-xl border border-green-500/30 text-sm font-medium text-green-300">
                    <svg className="w-4 h-4 inline-block mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    {results.length}개 이미지 분석 완료
                  </span>
                  <button
                    onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                    className="px-4 py-2 rounded-xl bg-slate-800/50 hover:bg-slate-800 border border-slate-700/50 hover:border-slate-600 text-sm font-medium text-slate-300 hover:text-white transition-all"
                  >
                    맨 위로
                  </button>
                </div>
              </div>
              <div className="grid gap-6 grid-cols-1 lg:grid-cols-2 xl:grid-cols-3">
                {results.map((res, i) => (
                  <div key={`res-${i}`} className="group backdrop-blur-xl bg-slate-900/50 border border-slate-700/40 rounded-2xl overflow-hidden hover:border-slate-600/60 hover:shadow-2xl hover:shadow-blue-500/10 transition-all duration-500 hover:scale-[1.02] transform">
                    <div className="bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-pink-500/20 border-b border-slate-700/50 p-5 backdrop-blur-xl">
                      <h3 className="font-semibold text-white text-base flex items-center gap-3">
                        <span className="w-9 h-9 bg-gradient-to-br from-blue-500/30 to-purple-500/30 border border-slate-600/50 rounded-xl flex items-center justify-center text-sm font-bold shadow-lg">
                          {i + 1}
                        </span>
                        이미지 {i + 1}
                      </h3>
                    </div>
                    <div className="p-5 space-y-4">
                      {res.length === 0 ? (
                        <div className="text-center py-12">
                          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-slate-800/50 border border-slate-700/50 flex items-center justify-center">
                            <svg className="w-8 h-8 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </div>
                          <p className="text-slate-400 text-sm font-medium">일치하는 항목을 찾을 수 없습니다</p>
                        </div>
                      ) : (
                        res.map((r, rank) => (
                          <div
                            key={`${i}-${r.name}`}
                            className="relative flex items-center gap-4 p-4 backdrop-blur-xl bg-gradient-to-br from-slate-800/40 to-slate-700/40 border border-slate-600/50 rounded-xl hover:bg-slate-800/60 hover:border-slate-500/60 hover:shadow-lg hover:shadow-blue-500/10 transition-all duration-300 group/item"
                          >
                            {/* Rank Badge */}
                            <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-blue-500/30 to-purple-500/30 border border-slate-600/50 rounded-xl text-white text-base font-bold shadow-lg group-hover/item:scale-110 transition-transform duration-300">
                              {rank + 1}
                            </div>
                            
                            {/* Actor Image */}
                            <div className="relative w-20 h-20 shrink-0 bg-slate-800/60 rounded-xl overflow-hidden border border-slate-600/50 shadow-lg group-hover/item:shadow-xl group-hover/item:shadow-blue-500/20 transition-all duration-300">
                              {r.image_url ? (
                                <Image
                                  src={`${backendPublic}${r.image_url}`}
                                  alt={r.name}
                                  fill
                                  className="object-cover group-hover/item:scale-110 transition-transform duration-500"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-slate-500 text-xs font-medium">
                                  N/A
                                </div>
                              )}
                            </div>
                            
                            {/* Actor Info */}
                            <div className="flex-1 min-w-0">
                              <div className="font-semibold text-white text-base truncate mb-2">{r.name}</div>
                              <div className="space-y-2">
                                <div className="flex items-center gap-3">
                                  <div className="flex-1 bg-slate-800/60 rounded-full h-2 overflow-hidden border border-slate-700/50 shadow-inner">
                                    <div
                                      className="h-2 rounded-full bg-gradient-to-r from-blue-500 via-blue-400 to-purple-500 shadow-lg shadow-blue-500/50 transition-all duration-500"
                                      style={{ width: `${r.score * 100}%` }}
                                    >
                                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
                                    </div>
                                  </div>
                                  <span className="text-sm font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent whitespace-nowrap w-14 text-right">
                                    {(r.score * 100).toFixed(1)}%
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>

        {/* Professional Footer */}
        <footer className="relative z-10 mt-24 backdrop-blur-2xl bg-slate-900/80 border-t border-slate-700/30 shadow-2xl shadow-black/20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="grid grid-cols-1 md:grid-cols-1 gap-8 mb-8">
              {/* Brand Section */}
              <div className="text-center">
                <div className="flex items-center justify-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 backdrop-blur-sm border border-slate-600/50 flex items-center justify-center">
                    <span className="text-xl">🎭</span>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">Actor Match AI</h3>
                    <p className="text-xs text-slate-400">Professional Edition</p>
                  </div>
                </div>
                <p className="text-sm text-slate-400 mb-4 max-w-2xl mx-auto">
                  Advanced facial recognition service powered by state-of-the-art CLIP AI technology. 
                  Find similar actors instantly with our cutting-edge machine learning algorithms.
                </p>
                <div className="flex items-center justify-center gap-2 text-xs text-slate-500">
                  <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                  <span>All systems operational</span>
                </div>
              </div>
            </div>

            {/* Bottom Bar */}
            <div className="pt-8 border-t border-slate-700/30">
              <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <p className="text-sm text-slate-500">
                  © 2025 Actor Match AI. All rights reserved.
                </p>
                <div className="flex items-center gap-6 text-sm text-slate-500">
                  <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
                  <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
                  <a href="#" className="hover:text-white transition-colors">Contact</a>
                </div>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </main>
  )
}
