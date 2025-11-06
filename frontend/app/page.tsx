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
      {/* Sophisticated Background */}
      <div className="fixed inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
        {/* Subtle Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-tr from-blue-950/30 via-transparent to-purple-950/30" />
        
        {/* Minimal Floating Particles */}
        {particles.slice(0, 8).map((particle) => (
          <div
            key={particle.id}
            className="absolute rounded-full bg-white/5 backdrop-blur-sm animate-float"
            style={{
              left: `${particle.x}%`,
              top: `${particle.y}%`,
              width: `${particle.size * 1.5}px`,
              height: `${particle.size * 1.5}px`,
              animationDelay: `${particle.delay}s`,
              animationDuration: `${20 + Math.random() * 10}s`
            }}
          />
        ))}
        
        {/* Elegant Radial Accents */}
        <div className="absolute top-1/4 right-1/4 w-[600px] h-[600px] bg-blue-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/3 left-1/3 w-[500px] h-[500px] bg-purple-500/5 rounded-full blur-3xl" />
      </div>

      {/* Content */}
      <div className="relative z-10">
        {/* Minimalist Header */}
        <header className="backdrop-blur-xl bg-slate-900/60 border-b border-slate-800/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-6">
                <div className="relative">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 backdrop-blur-sm border border-white/10 flex items-center justify-center">
                    <span className="text-3xl">🎭</span>
                  </div>
                </div>
                <div>
                  <h1 className="text-3xl font-light tracking-tight text-white">
                    Actor Match <span className="font-semibold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">AI</span>
                  </h1>
                  <p className="text-sm text-slate-400 mt-1">Advanced facial recognition technology</p>
                </div>
              </div>
              {files.length > 0 && (
                <button
                  onClick={clearAll}
                  className="px-5 py-2.5 text-sm text-slate-400 hover:text-white bg-slate-800/50 hover:bg-slate-800 backdrop-blur-sm rounded-lg transition-all border border-slate-700/50 hover:border-slate-600"
                >
                  Clear All
                </button>
              )}
            </div>
          </div>
        </header>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Upload Section */}
          <section className="backdrop-blur-xl bg-slate-900/40 border border-slate-800/50 rounded-2xl p-10 mb-10">
            <form onSubmit={onSubmit} className="space-y-8">
              {/* Minimal Drag & Drop Area */}
              <div
                onDrop={onDrop}
                onDragOver={onDragOver}
                onDragLeave={onDragLeave}
                className={`
                  relative border-2 border-dashed rounded-2xl p-16 text-center transition-all duration-300
                  ${isDragActive 
                    ? 'border-blue-500/50 bg-blue-500/5' 
                    : 'border-slate-700/50 hover:border-slate-600/50 hover:bg-slate-800/30'
                  }
                `}
              >
                <div className="flex flex-col items-center gap-6">
                  <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500/10 to-purple-500/10 backdrop-blur-sm border border-slate-700/50 flex items-center justify-center">
                    <svg className="w-10 h-10 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-lg font-light text-white mb-2">
                      {isDragActive ? 'Drop files here' : 'Upload Images'}
                    </p>
                    <p className="text-sm text-slate-400">Drag and drop or click to browse</p>
                  </div>
                  <label className="relative group cursor-pointer">
                    <div className="px-8 py-3 rounded-lg bg-gradient-to-r from-blue-500 to-purple-500 text-white font-medium text-sm transition-all group-hover:shadow-lg group-hover:shadow-blue-500/25">
                      Select Files
                    </div>
                    <input type="file" accept="image/*" multiple className="hidden" onChange={onInputChange} />
                  </label>
                  {files.length > 0 && (
                    <div className="mt-2 px-4 py-2 rounded-lg bg-slate-800/50 backdrop-blur-sm border border-slate-700/50">
                      <p className="text-xs font-medium text-slate-300">
                        {files.length} {files.length === 1 ? 'file' : 'files'} selected
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Refined Top-K Slider */}
              <div className="backdrop-blur-sm bg-slate-800/30 border border-slate-700/50 rounded-xl p-6">
                <div className="flex items-center justify-between mb-5">
                  <label htmlFor="topk" className="text-sm font-medium text-slate-300 flex items-center gap-2">
                    <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    Top Results
                  </label>
                  <span className="text-2xl font-light text-white px-4 py-1 rounded-lg bg-slate-800/50 border border-slate-700/50 min-w-[60px] text-center">
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
                  className="w-full h-1 bg-slate-700/50 rounded-full appearance-none cursor-pointer slider-thumb"
                />
                <div className="flex justify-between text-xs text-slate-500 mt-3">
                  <span>1</span>
                  <span>10</span>
                </div>
              </div>

              {/* Elegant Progress Bar */}
              {(loading || progress > 0) && (
                <div className="space-y-3 backdrop-blur-sm bg-slate-800/30 border border-slate-700/50 rounded-xl p-5">
                  <div className="flex justify-between text-sm text-slate-300">
                    <span className="flex items-center gap-2">
                      {loading && (
                        <svg className="animate-spin h-4 w-4 text-blue-400" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                      )}
                      {loading ? 'Analyzing...' : 'Complete'}
                    </span>
                    <span className="font-medium">{progress}%</span>
                  </div>
                  <div className="relative w-full bg-slate-800/50 rounded-full h-2 overflow-hidden border border-slate-700/50">
                    <div
                      className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-300 ease-out"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Professional Submit Button */}
              <button
                type="submit"
                disabled={loading || files.length === 0}
                className="relative w-full group overflow-hidden rounded-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <div className="px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-500 text-white font-medium transition-all group-hover:shadow-xl group-hover:shadow-blue-500/25">
                  {loading ? (
                    <span className="flex items-center justify-center gap-3">
                      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Processing
                    </span>
                  ) : (
                    'Start Analysis'
                  )}
                </div>
              </button>
            </form>

            {/* Clean Error Message */}
            {error && (
              <div className="mt-6 p-4 backdrop-blur-sm bg-red-500/10 border border-red-500/20 rounded-xl">
                <p className="text-red-300 text-sm flex items-center gap-2">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  {error}
                </p>
              </div>
            )}
          </section>

          {/* Refined Preview Section */}
          {previews.length > 0 && (
            <section className="mb-10">
              <h2 className="text-xl font-light text-white mb-6 flex items-center gap-3">
                <svg className="w-6 h-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span className="text-slate-300">Uploaded Images</span>
              </h2>
              <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
                {previews.map((p, idx) => (
                  <div key={p.name} className="group relative backdrop-blur-sm bg-slate-800/30 border border-slate-700/50 rounded-xl overflow-hidden hover:border-slate-600/50 transition-all">
                    <div className="relative w-full aspect-square">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={p.url} alt={p.name} className="object-cover w-full h-full" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <button
                      onClick={() => removeFile(idx)}
                      className="absolute top-2 right-2 bg-slate-900/90 backdrop-blur-sm text-white rounded-lg w-8 h-8 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:bg-red-500 border border-slate-700/50"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                    <div className="p-2 backdrop-blur-sm bg-slate-900/50 border-t border-slate-700/50">
                      <p className="text-xs text-slate-400 truncate">{p.name}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Professional Results Section */}
          {results.length > 0 && (
            <section>
              <h2 className="text-xl font-light text-white mb-6 flex items-center gap-3">
                <svg className="w-6 h-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
                <span className="text-slate-300">Analysis Results</span>
              </h2>
              <div className="grid gap-6 grid-cols-1 lg:grid-cols-2 xl:grid-cols-3">
                {results.map((res, i) => (
                  <div key={`res-${i}`} className="backdrop-blur-sm bg-slate-900/40 border border-slate-800/50 rounded-xl overflow-hidden hover:border-slate-700/50 transition-all">
                    <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border-b border-slate-800/50 p-4">
                      <h3 className="font-medium text-white text-sm flex items-center gap-2">
                        <span className="w-7 h-7 bg-slate-800/50 border border-slate-700/50 rounded-lg flex items-center justify-center text-xs font-semibold">
                          {i + 1}
                        </span>
                        Image {i + 1}
                      </h3>
                    </div>
                    <div className="p-4 space-y-3">
                      {res.length === 0 ? (
                        <p className="text-slate-400 text-center py-8 text-sm">No matches found</p>
                      ) : (
                        res.map((r, rank) => (
                          <div
                            key={`${i}-${r.name}`}
                            className="flex items-center gap-4 p-3 backdrop-blur-sm bg-slate-800/30 border border-slate-700/50 rounded-lg hover:bg-slate-800/50 transition-all"
                          >
                            <div className="flex items-center justify-center w-8 h-8 bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-slate-700/50 rounded-lg text-white text-sm font-medium">
                              {rank + 1}
                            </div>
                            <div className="relative w-16 h-16 shrink-0 bg-slate-800/50 rounded-lg overflow-hidden border border-slate-700/50">
                              {r.image_url ? (
                                <Image
                                  src={`${backendPublic}${r.image_url}`}
                                  alt={r.name}
                                  fill
                                  className="object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-slate-500 text-xs">
                                  N/A
                                </div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-white text-sm truncate mb-1.5">{r.name}</div>
                              <div className="space-y-1.5">
                                <div className="flex items-center gap-2">
                                  <div className="flex-1 bg-slate-800/50 rounded-full h-1.5 overflow-hidden border border-slate-700/50">
                                    <div
                                      className="h-1.5 rounded-full bg-gradient-to-r from-blue-500 to-purple-500"
                                      style={{ width: `${r.score * 100}%` }}
                                    />
                                  </div>
                                  <span className="text-xs font-medium text-slate-300 whitespace-nowrap w-12 text-right">
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

        {/* Minimalist Footer */}
        <footer className="relative z-10 mt-20 py-6 backdrop-blur-xl bg-slate-900/60 border-t border-slate-800/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <p className="text-sm text-slate-400">Powered by <span className="text-slate-300">CLIP AI</span> • Actor Match Service</p>
          </div>
        </footer>
      </div>
    </main>
  )
}
