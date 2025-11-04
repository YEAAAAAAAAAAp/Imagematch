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
    try {
      // batch endpoint
      const resp = await fetch(`/api/match-actors-batch?${qs.toString()}`, { method: 'POST', body: form })
      const data = await resp.json()
      if (!resp.ok) throw new Error((data as any)?.detail || '요청 실패')
      // normalize to array of arrays
      const items = (data.items || []).map((it: any) => it.results || []) as MatchResult[][]
      setResults(items)
    } catch (err: any) {
      setError(err?.message || '에러가 발생했습니다')
    } finally {
      setLoading(false)
      setProgress(100)
    }
  }

  const onInputChange = (evt: React.ChangeEvent<HTMLInputElement>) => {
    const list = Array.from(evt.target.files || [])
    setFiles(list)
  }

  const onDrop = (evt: React.DragEvent<HTMLDivElement>) => {
    evt.preventDefault()
    const list = Array.from(evt.dataTransfer.files || []) as File[]
    const onlyImages = list.filter((f: File) => f.type.startsWith('image/'))
    setFiles((prev: File[]) => [...prev, ...onlyImages])
  }

  const onDragOver = (evt: React.DragEvent<HTMLDivElement>) => {
    evt.preventDefault()
  }

  const previews = useMemo(() => files.map((f: File) => ({ name: f.name, url: URL.createObjectURL(f) })), [files])

  return (
    <main className="p-8 font-sans">
      <h1 className="text-2xl font-semibold mb-4">업로드한 이미지로 배우 TOP-K 유사도 찾기</h1>

      <form onSubmit={onSubmit} className="flex flex-col gap-3 max-w-3xl">
        <div
          onDrop={onDrop}
          onDragOver={onDragOver}
          className="border-2 border-dashed rounded-xl p-6 text-center text-gray-600 hover:bg-gray-50"
        >
          <p className="mb-2">이미지를 드래그&드롭 하세요</p>
          <p className="mb-2">또는</p>
          <label className="inline-block px-3 py-2 rounded bg-blue-600 text-white cursor-pointer">
            파일 선택
            <input type="file" accept="image/*" multiple className="hidden" onChange={onInputChange} />
          </label>
          {files.length > 0 && <p className="mt-2 text-sm text-gray-500">선택된 파일: {files.length}개</p>}
        </div>

        <div className="flex items-center gap-3">
          <label htmlFor="topk" className="text-sm text-gray-700">Top-K:</label>
          <input id="topk" type="range" min={1} max={10} value={topK} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTopK(parseInt(e.target.value))} />
          <span className="text-sm w-6 text-right">{topK}</span>
        </div>

        <div className="w-full bg-gray-200 rounded-full h-2">
          <div className="bg-blue-600 h-2 rounded-full transition-all" style={{ width: `${progress}%` }} />
        </div>

        <div>
          <button type="submit" disabled={loading || files.length === 0} className="px-4 py-2 rounded bg-blue-600 text-white disabled:opacity-50">
            {loading ? '처리 중...' : '분석하기'}
          </button>
        </div>
      </form>

      {error && <p className="text-red-600 mt-3">{error}</p>}

      {previews.length > 0 && (
        <section className="mt-6">
          <h2 className="text-lg font-medium mb-2">미리보기</h2>
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {previews.map((p) => (
              <div key={p.name} className="border rounded-lg p-2">
                <div className="relative w-full h-56">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={p.url} alt={p.name} className="object-cover w-full h-full rounded" />
                </div>
                <p className="text-sm text-gray-600 mt-1 truncate">{p.name}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {results.length > 0 && (
        <section className="mt-8">
          <h2 className="text-lg font-medium mb-2">결과</h2>
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {results.map((res, i) => (
              <div key={`res-${i}`} className="border rounded-xl p-4 shadow-sm">
                <h3 className="font-semibold mb-2">파일 {i + 1}</h3>
                <div className="flex flex-col gap-3">
                  {res.map((r) => (
                    <div key={`${i}-${r.name}`} className="flex items-center gap-3">
                      <div className="w-16 h-16 relative shrink-0 bg-gray-100 rounded overflow-hidden">
                        {r.image_url ? (
                          <Image src={`${backendPublic}${r.image_url}`} alt={r.name} fill className="object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">NO IMG</div>
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="font-medium">{r.name}</div>
                        <div className="text-sm text-gray-600">유사도: {(r.score * 100).toFixed(1)}%</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </main>
  )
}
