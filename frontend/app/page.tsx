'use client'

import { useMemo, useState } from 'react'
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

  const backendPublic = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000'

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
    <main className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <span className="text-4xl">🎭</span>
                Actor Match AI
              </h1>
              <p className="text-gray-600 mt-1">AI 기반 배우 유사도 분석 서비스</p>
            </div>
            {files.length > 0 && (
              <button
                onClick={clearAll}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all"
              >
                전체 초기화
              </button>
            )}
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Upload Section */}
        <section className="bg-white rounded-2xl shadow-lg p-8 mb-8">
          <form onSubmit={onSubmit} className="space-y-6">
            {/* Drag & Drop Area */}
            <div
              onDrop={onDrop}
              onDragOver={onDragOver}
              onDragLeave={onDragLeave}
              className={`
                border-2 border-dashed rounded-2xl p-12 text-center transition-all duration-300
                ${isDragActive 
                  ? 'border-blue-500 bg-blue-50 scale-105' 
                  : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'
                }
              `}
            >
              <div className="flex flex-col items-center gap-4">
                <div className="text-6xl">📸</div>
                <div>
                  <p className="text-xl font-semibold text-gray-700 mb-2">
                    {isDragActive ? '여기에 놓으세요!' : '이미지를 드래그하여 업로드'}
                  </p>
                  <p className="text-gray-500 mb-4">또는 아래 버튼을 클릭하세요</p>
                </div>
                <label className="px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold cursor-pointer hover:from-blue-700 hover:to-purple-700 transition-all shadow-md hover:shadow-lg">
                  파일 선택
                  <input type="file" accept="image/*" multiple className="hidden" onChange={onInputChange} />
                </label>
                {files.length > 0 && (
                  <p className="mt-2 text-sm font-medium text-blue-600">
                    ✓ {files.length}개 파일 선택됨
                  </p>
                )}
              </div>
            </div>

            {/* Top-K Slider */}
            <div className="bg-gray-50 rounded-xl p-6">
              <div className="flex items-center justify-between mb-3">
                <label htmlFor="topk" className="text-sm font-semibold text-gray-700">
                  결과 개수 (Top-K)
                </label>
                <span className="text-2xl font-bold text-blue-600 bg-white px-4 py-1 rounded-lg shadow-sm">
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
                className="w-full h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-2">
                <span>1개</span>
                <span>5개</span>
                <span>10개</span>
              </div>
            </div>

            {/* Progress Bar */}
            {(loading || progress > 0) && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm text-gray-600">
                  <span>{loading ? '분석 중...' : '완료!'}</span>
                  <span>{progress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden shadow-inner">
                  <div
                    className="bg-gradient-to-r from-blue-500 to-purple-500 h-3 rounded-full transition-all duration-300 ease-out"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || files.length === 0}
              className="w-full px-6 py-4 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl disabled:hover:shadow-lg transform hover:scale-[1.02] disabled:hover:scale-100"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  AI 분석 중...
                </span>
              ) : (
                '🚀 분석 시작'
              )}
            </button>
          </form>

          {/* Error Message */}
          {error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl">
              <p className="text-red-600 flex items-center gap-2">
                <span className="text-xl">⚠️</span>
                {error}
              </p>
            </div>
          )}
        </section>

        {/* Preview Section */}
        {previews.length > 0 && (
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <span>🖼️</span>
              업로드된 이미지
            </h2>
            <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {previews.map((p, idx) => (
                <div key={p.name} className="group relative bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-all">
                  <div className="relative w-full aspect-square">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={p.url} alt={p.name} className="object-cover w-full h-full" />
                  </div>
                  <button
                    onClick={() => removeFile(idx)}
                    className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-8 h-8 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                  >
                    ×
                  </button>
                  <div className="p-2 bg-white">
                    <p className="text-xs text-gray-600 truncate">{p.name}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Results Section */}
        {results.length > 0 && (
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <span>✨</span>
              분석 결과
            </h2>
            <div className="grid gap-6 grid-cols-1 lg:grid-cols-2 xl:grid-cols-3">
              {results.map((res, i) => (
                <div key={`res-${i}`} className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-all">
                  <div className="bg-gradient-to-r from-blue-500 to-purple-500 p-4">
                    <h3 className="font-bold text-white text-lg flex items-center gap-2">
                      <span className="bg-white text-blue-600 rounded-full w-8 h-8 flex items-center justify-center font-bold">
                        {i + 1}
                      </span>
                      이미지 {i + 1}
                    </h3>
                  </div>
                  <div className="p-4 space-y-3">
                    {res.length === 0 ? (
                      <p className="text-gray-500 text-center py-8">매칭된 배우가 없습니다</p>
                    ) : (
                      res.map((r, rank) => (
                        <div
                          key={`${i}-${r.name}`}
                          className="flex items-center gap-4 p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-all"
                        >
                          <div className="flex items-center justify-center w-8 h-8 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full font-bold text-white shadow-md">
                            {rank + 1}
                          </div>
                          <div className="w-20 h-20 relative shrink-0 bg-gray-200 rounded-lg overflow-hidden shadow-md">
                            {r.image_url ? (
                              <Image
                                src={`${backendPublic}${r.image_url}`}
                                alt={r.name}
                                fill
                                className="object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                                NO IMG
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-bold text-gray-900 truncate">{r.name}</div>
                            <div className="flex items-center gap-2 mt-1">
                              <div className="flex-1 bg-gray-200 rounded-full h-2 overflow-hidden">
                                <div
                                  className="bg-gradient-to-r from-green-400 to-blue-500 h-2 rounded-full"
                                  style={{ width: `${r.score * 100}%` }}
                                />
                              </div>
                              <span className="text-sm font-semibold text-blue-600">
                                {(r.score * 100).toFixed(1)}%
                              </span>
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
      <footer className="mt-16 py-8 bg-white border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-gray-600">
          <p>Powered by CLIP AI Model • Actor Match Service</p>
        </div>
      </footer>
    </main>
  )
}
