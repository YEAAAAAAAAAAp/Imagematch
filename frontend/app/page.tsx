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
      {/* Animated Background */}
      <div className="fixed inset-0 bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900">
        {/* Mesh Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-tr from-blue-500/20 via-purple-500/20 to-pink-500/20 animate-pulse" />
        
        {/* Floating Particles */}
        {particles.map((particle) => (
          <div
            key={particle.id}
            className="absolute rounded-full bg-white/20 backdrop-blur-sm animate-float"
            style={{
              left: `${particle.x}%`,
              top: `${particle.y}%`,
              width: `${particle.size}px`,
              height: `${particle.size}px`,
              animationDelay: `${particle.delay}s`,
              animationDuration: `${15 + Math.random() * 10}s`
            }}
          />
        ))}
        
        {/* Radial Gradient Spots */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/30 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/30 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-pink-500/30 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      {/* Content */}
      <div className="relative z-10">
        {/* Header */}
        <header className="backdrop-blur-md bg-white/10 border-b border-white/20 shadow-2xl">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <span className="text-5xl animate-bounce">🎭</span>
                  <div className="absolute inset-0 blur-xl bg-purple-500/50 animate-pulse" />
                </div>
                <div>
                  <h1 className="text-4xl font-bold text-white flex items-center gap-3">
                    <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                      Actor Match AI
                    </span>
                  </h1>
                  <p className="text-purple-200 mt-1 font-medium">AI 기반 배우 유사도 분석 서비스</p>
                </div>
              </div>
              {files.length > 0 && (
                <button
                  onClick={clearAll}
                  className="px-6 py-3 text-sm text-white/90 hover:text-white bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-xl transition-all border border-white/20 hover:border-white/40 shadow-lg"
                >
                  전체 초기화
                </button>
              )}
            </div>
          </div>
        </header>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Upload Section */}
        <section className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl shadow-2xl p-8 mb-8">
          <form onSubmit={onSubmit} className="space-y-6">
            {/* Drag & Drop Area */}
            <div
              onDrop={onDrop}
              onDragOver={onDragOver}
              onDragLeave={onDragLeave}
              className={`
                relative border-2 border-dashed rounded-3xl p-12 text-center transition-all duration-300 overflow-hidden
                ${isDragActive 
                  ? 'border-white/60 bg-white/20 scale-105 shadow-2xl' 
                  : 'border-white/30 hover:border-white/50 hover:bg-white/10'
                }
              `}
            >
              {/* Glow Effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-pink-500/20 blur-xl" />
              
              <div className="relative flex flex-col items-center gap-4">
                <div className="relative">
                  <div className="text-7xl animate-bounce">📸</div>
                  <div className="absolute inset-0 blur-2xl bg-white/30 animate-pulse" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white mb-2">
                    {isDragActive ? '여기에 놓으세요!' : '이미지를 드래그하여 업로드'}
                  </p>
                  <p className="text-purple-200 mb-4">또는 아래 버튼을 클릭하세요</p>
                </div>
                <label className="relative group cursor-pointer">
                  <div className="px-8 py-4 rounded-2xl bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white font-bold text-lg shadow-2xl transition-all group-hover:shadow-purple-500/50 group-hover:scale-105">
                    파일 선택
                  </div>
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 blur-xl opacity-50 group-hover:opacity-75 transition-opacity" />
                  <input type="file" accept="image/*" multiple className="hidden" onChange={onInputChange} />
                </label>
                {files.length > 0 && (
                  <div className="mt-2 px-6 py-2 rounded-full bg-white/20 backdrop-blur-md border border-white/30">
                    <p className="text-sm font-bold text-white">
                      ✓ {files.length}개 파일 선택됨
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Top-K Slider */}
            <div className="backdrop-blur-md bg-white/10 border border-white/20 rounded-2xl p-6 shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <label htmlFor="topk" className="text-lg font-bold text-white flex items-center gap-2">
                  <span className="text-2xl">🎯</span>
                  결과 개수 (Top-K)
                </label>
                <span className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent px-6 py-2 rounded-xl backdrop-blur-md bg-white/20 border border-white/30 shadow-lg">
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
                className="w-full h-4 bg-white/20 rounded-full appearance-none cursor-pointer slider-thumb"
              />
              <div className="flex justify-between text-sm text-purple-200 mt-3 font-medium">
                <span>1개</span>
                <span>5개</span>
                <span>10개</span>
              </div>
            </div>

            {/* Progress Bar */}
            {(loading || progress > 0) && (
              <div className="space-y-3 backdrop-blur-md bg-white/10 border border-white/20 rounded-2xl p-6 shadow-xl">
                <div className="flex justify-between text-sm text-white font-medium">
                  <span className="flex items-center gap-2">
                    {loading && <span className="animate-spin">⚡</span>}
                    {loading ? 'AI 분석 중...' : '완료!'}
                  </span>
                  <span className="font-bold">{progress}%</span>
                </div>
                <div className="relative w-full bg-white/10 rounded-full h-4 overflow-hidden shadow-inner border border-white/20">
                  <div
                    className="absolute inset-0 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 h-4 rounded-full transition-all duration-300 ease-out shadow-lg"
                    style={{ width: `${progress}%` }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
                </div>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || files.length === 0}
              className="relative w-full group overflow-hidden rounded-2xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 blur-xl opacity-75 group-hover:opacity-100 transition-opacity" />
              <div className="relative px-8 py-5 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white font-bold text-xl shadow-2xl group-hover:shadow-purple-500/50 transition-all">
                {loading ? (
                  <span className="flex items-center justify-center gap-3">
                    <svg className="animate-spin h-6 w-6" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    AI 분석 중...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <span className="text-2xl">🚀</span>
                    분석 시작
                  </span>
                )}
              </div>
            </button>
          </form>

          {/* Error Message */}
          {error && (
            <div className="mt-6 p-5 backdrop-blur-md bg-red-500/20 border border-red-400/30 rounded-2xl shadow-xl">
              <p className="text-red-100 flex items-center gap-3 font-medium">
                <span className="text-2xl">⚠️</span>
                {error}
              </p>
            </div>
          )}
        </section>

        {/* Preview Section */}
        {previews.length > 0 && (
          <section className="mb-8">
            <h2 className="text-3xl font-bold text-white mb-6 flex items-center gap-3">
              <span className="text-4xl">🖼️</span>
              <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                업로드된 이미지
              </span>
            </h2>
            <div className="grid gap-6 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {previews.map((p, idx) => (
                <div key={p.name} className="group relative backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl overflow-hidden hover:scale-105 transition-all duration-300 shadow-xl hover:shadow-2xl hover:shadow-purple-500/30">
                  <div className="relative w-full aspect-square">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={p.url} alt={p.name} className="object-cover w-full h-full" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <button
                    onClick={() => removeFile(idx)}
                    className="absolute top-3 right-3 bg-red-500/90 backdrop-blur-md text-white rounded-full w-10 h-10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:bg-red-600 hover:scale-110 shadow-lg font-bold text-xl"
                  >
                    ×
                  </button>
                  <div className="p-3 backdrop-blur-md bg-white/10 border-t border-white/20">
                    <p className="text-xs text-white/90 truncate font-medium">{p.name}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Results Section */}
        {results.length > 0 && (
          <section>
            <h2 className="text-3xl font-bold text-white mb-6 flex items-center gap-3">
              <span className="text-4xl">✨</span>
              <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                분석 결과
              </span>
            </h2>
            <div className="grid gap-6 grid-cols-1 lg:grid-cols-2 xl:grid-cols-3">
              {results.map((res, i) => (
                <div key={`res-${i}`} className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl overflow-hidden hover:scale-105 transition-all duration-300 shadow-2xl hover:shadow-purple-500/30">
                  <div className="relative bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 p-5 overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <h3 className="relative font-bold text-white text-xl flex items-center gap-3 z-10">
                      <span className="bg-white text-purple-600 rounded-full w-10 h-10 flex items-center justify-center font-bold shadow-lg">
                        {i + 1}
                      </span>
                      이미지 {i + 1}
                    </h3>
                  </div>
                  <div className="p-5 space-y-4">
                    {res.length === 0 ? (
                      <p className="text-purple-200 text-center py-12 font-medium">매칭된 배우가 없습니다</p>
                    ) : (
                      res.map((r, rank) => (
                        <div
                          key={`${i}-${r.name}`}
                          className="group flex items-center gap-4 p-4 backdrop-blur-md bg-white/10 border border-white/20 rounded-2xl hover:bg-white/20 transition-all hover:scale-105 shadow-lg"
                        >
                          <div className="relative flex items-center justify-center w-10 h-10 bg-gradient-to-br from-yellow-400 via-orange-500 to-red-500 rounded-full font-bold text-white shadow-lg">
                            <span className="relative z-10">{rank + 1}</span>
                            <div className="absolute inset-0 bg-gradient-to-br from-yellow-500 via-orange-600 to-red-600 rounded-full blur-lg opacity-50" />
                          </div>
                          <div className="relative w-24 h-24 shrink-0 bg-white/10 rounded-2xl overflow-hidden shadow-xl border border-white/20">
                            {r.image_url ? (
                              <Image
                                src={`${backendPublic}${r.image_url}`}
                                alt={r.name}
                                fill
                                className="object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-white/50 text-xs font-medium">
                                NO IMG
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-bold text-white text-lg truncate mb-2">{r.name}</div>
                            <div className="space-y-2">
                              <div className="flex items-center gap-3">
                                <div className="flex-1 bg-white/10 rounded-full h-3 overflow-hidden border border-white/20 shadow-inner">
                                  <div
                                    className="relative h-3 rounded-full overflow-hidden"
                                    style={{ width: `${r.score * 100}%` }}
                                  >
                                    <div className="absolute inset-0 bg-gradient-to-r from-green-400 via-blue-400 to-purple-500" />
                                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
                                  </div>
                                </div>
                                <span className="text-sm font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent whitespace-nowrap">
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

      {/* Footer */}
      <footer className="relative z-10 mt-20 py-8 backdrop-blur-md bg-white/10 border-t border-white/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-purple-200 font-medium">Powered by CLIP AI Model • Actor Match Service</p>
          <div className="mt-3 flex items-center justify-center gap-2 text-sm text-purple-300">
            <span>Made with</span>
            <span className="text-red-400 animate-pulse text-lg">❤️</span>
            <span>by AI</span>
          </div>
        </div>
      </footer>
      </div>
    </main>
  )
}
