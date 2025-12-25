'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { Search } from 'lucide-react'
import { MindMap } from '@/components/MindMap'
import type { Movie } from '@/lib/types'

type ViewState = 'search' | 'loading' | 'preview' | 'result'

interface PreviewChip {
  id: string
  title: string
  year: number
  posterUrl: string | null
  overview: string
  mood: string[]
  atmosphere: string
  tmdbId: number
}

export default function Home() {
  const [query, setQuery] = useState('')
  const [viewState, setViewState] = useState<ViewState>('search')
  const [rootMovie, setRootMovie] = useState<Movie | null>(null)
  const [previewChips, setPreviewChips] = useState<PreviewChip[]>([])
  const [filterDescription, setFilterDescription] = useState('')
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // GSAP refs
  const containerRef = useRef<HTMLDivElement>(null)
  const searchRef = useRef<HTMLDivElement>(null)
  const loadingRef = useRef<HTMLDivElement>(null)
  const previewRef = useRef<HTMLDivElement>(null)
  const resultRef = useRef<HTMLDivElement>(null)
  const dotsRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
    // Initial animation
    if (searchRef.current) {
      gsap.fromTo(searchRef.current,
        { opacity: 0, y: 40 },
        { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out' }
      )
    }
  }, [])

  // Animate loading dots
  useEffect(() => {
    if (viewState === 'loading' && dotsRef.current) {
      const dots = dotsRef.current.querySelectorAll('.dot')
      gsap.to(dots, {
        y: -12,
        stagger: 0.15,
        repeat: -1,
        yoyo: true,
        ease: 'power2.inOut',
        duration: 0.4
      })
    }
  }, [viewState])

  // Animate preview cards
  useEffect(() => {
    if (viewState === 'preview' && previewRef.current) {
      const cards = previewRef.current.querySelectorAll('.preview-card')
      gsap.fromTo(cards,
        { opacity: 0, y: 60, scale: 0.9 },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          stagger: 0.1,
          duration: 0.6,
          ease: 'back.out(1.4)'
        }
      )
    }
  }, [viewState, previewChips])

  // Transition to search → loading
  const animateToLoading = async () => {
    // Animate out search if visible
    if (searchRef.current) {
      await gsap.to(searchRef.current, {
        scale: 0.95,
        opacity: 0,
        y: -20,
        duration: 0.3,
        ease: 'power2.in'
      })
    }

    setViewState('loading')
  }

  // Transition loading → preview
  const animateToPreview = async () => {
    setViewState('preview')
  }

  // Transition to result (mind map)
  const animateToResult = async () => {
    setViewState('result')
  }

  const handleSearch = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) return

    setError(null)
    setPreviewChips([])

    await animateToLoading()

    try {
      const discoverResponse = await fetch('/api/discover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: searchQuery, limit: 6 }),
      })

      if (!discoverResponse.ok) {
        throw new Error('Failed to discover movies')
      }

      const discoverData = await discoverResponse.json()

      if (discoverData.results.length === 0) {
        throw new Error(`No movies found for "${searchQuery}"`)
      }

      if (discoverData.isNaturalQuery && discoverData.results.length > 1) {
        setPreviewChips(discoverData.results)
        setFilterDescription(discoverData.filterDescription)
        await animateToPreview()
        return
      }

      const singleMovie = discoverData.results[0]
      await expandToMindMap(singleMovie)

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setViewState('search')
      // Animate back to search
      if (searchRef.current) {
        gsap.fromTo(searchRef.current,
          { opacity: 0, y: 20 },
          { opacity: 1, y: 0, duration: 0.4, ease: 'power2.out' }
        )
      }
    }
  }, [])

  const expandToMindMap = useCallback(async (chip: PreviewChip) => {
    const movie: Movie = {
      id: chip.id,
      title: chip.title,
      year: chip.year,
      posterUrl: chip.posterUrl,
      overview: chip.overview,
      vibeProfile: {
        mood: chip.mood,
        visualStyle: [],
        narrativeEnergy: '',
        themes: [],
        emotionalColor: '',
        pacing: '',
        atmosphere: chip.atmosphere,
        era: '',
      },
      vibeSummary: chip.overview?.slice(0, 150) + '...' || '',
      embedding: [],
      tmdbId: chip.tmdbId,
    }

    setRootMovie(movie)
    await animateToResult()
    setPreviewChips([])
  }, [viewState])

  const fetchSimilar = useCallback(async (movieId: string) => {
    const response = await fetch('/api/recommend', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ movieId, limit: 4 }),
    })
    if (!response.ok) throw new Error('Failed')
    const data = await response.json()
    return data.recommendations || []
  }, [])

  const reset = async () => {
    // Animate out current view
    const current = viewState === 'result' ? resultRef.current :
                    viewState === 'preview' ? previewRef.current : null

    if (current) {
      await gsap.to(current, {
        opacity: 0,
        scale: 0.95,
        duration: 0.3,
        ease: 'power2.in'
      })
    }

    setRootMovie(null)
    setViewState('search')
    setQuery('')
    setError(null)
    setPreviewChips([])

    // Animate search back in
    setTimeout(() => {
      if (searchRef.current) {
        gsap.fromTo(searchRef.current,
          { opacity: 0, y: 30 },
          { opacity: 1, y: 0, duration: 0.5, ease: 'power3.out' }
        )
      }
      inputRef.current?.focus()
    }, 50)
  }

  const suggestions = [
    '90s horror',
    'feel-good 80s',
    'dark thriller',
    'sci-fi epic',
    'romantic comedy',
  ]

  // Hover animation for cards
  const handleCardHover = (e: React.MouseEvent, entering: boolean) => {
    const card = e.currentTarget
    gsap.to(card, {
      scale: entering ? 1.03 : 1,
      y: entering ? -8 : 0,
      duration: 0.3,
      ease: 'power2.out'
    })
  }

  return (
    <div ref={containerRef} className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 text-slate-800 overflow-hidden relative">
      {/* Grid background */}
      <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: 'linear-gradient(rgba(148,163,184,0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,0.2) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 p-4">
        <div className="flex items-center justify-between max-w-6xl mx-auto">
          <button onClick={reset} className="text-slate-600 hover:text-slate-900 text-sm font-medium transition-colors">
            MoodReel
          </button>
          {(viewState === 'result' || viewState === 'preview') && (
            <button onClick={reset} className="text-slate-500 hover:text-slate-700 text-xs border border-slate-200 bg-white/80 backdrop-blur-sm px-3 py-1.5 rounded-full hover:border-slate-300 hover:bg-white transition-all shadow-sm">
              New search
            </button>
          )}
        </div>
      </header>

      <main className="min-h-screen flex items-center justify-center">
        {/* Search */}
        {viewState === 'search' && (
          <div ref={searchRef} className="w-full max-w-lg px-6">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-light text-slate-800 mb-2">Find your vibe</h1>
              <p className="text-slate-500 text-sm">Search a movie or try &quot;90s horror&quot;</p>
            </div>

            <form onSubmit={(e) => { e.preventDefault(); handleSearch(query) }} className="relative mb-6">
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Enter a movie or vibe..."
                className="w-full px-5 py-3.5 pl-12 bg-white/90 backdrop-blur-sm border border-slate-200 rounded-full text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition-all shadow-lg shadow-slate-200/50"
              />
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              {query && (
                <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-1.5 bg-violet-500 text-white text-sm font-semibold rounded-full hover:bg-violet-600 transition-colors shadow-md">
                  Go
                </button>
              )}
            </form>

            {error && <p className="text-red-500 text-sm text-center mb-4">{error}</p>}

            <div className="flex flex-wrap justify-center gap-2">
              {suggestions.map((s) => (
                <button
                  key={s}
                  onClick={() => { setQuery(s); handleSearch(s) }}
                  className="px-3 py-1 text-xs text-slate-500 bg-white/70 backdrop-blur-sm border border-slate-200 rounded-full hover:text-slate-700 hover:border-slate-300 hover:bg-white transition-all shadow-sm"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Loading */}
        {viewState === 'loading' && (
          <div ref={loadingRef} className="flex flex-col items-center gap-6">
            <div ref={dotsRef} className="flex gap-3">
              <div className="dot w-4 h-4 rounded-full bg-violet-400 shadow-lg shadow-violet-300/50" />
              <div className="dot w-4 h-4 rounded-full bg-pink-400 shadow-lg shadow-pink-300/50" />
              <div className="dot w-4 h-4 rounded-full bg-amber-400 shadow-lg shadow-amber-300/50" />
            </div>
            <span className="text-slate-500 text-sm">Finding vibes...</span>
          </div>
        )}

        {/* Preview Chips */}
        {viewState === 'preview' && (
          <div ref={previewRef} className="w-full max-w-4xl px-6 pt-20">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-light text-slate-800 mb-2">
                {filterDescription}
              </h2>
              <p className="text-slate-500 text-sm">Click a movie to explore its vibe</p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {previewChips.map((chip) => (
                <button
                  key={chip.id}
                  onClick={() => expandToMindMap(chip)}
                  onMouseEnter={(e) => handleCardHover(e, true)}
                  onMouseLeave={(e) => handleCardHover(e, false)}
                  className="preview-card relative group bg-white/90 backdrop-blur-sm rounded-2xl overflow-hidden border border-slate-200 hover:border-slate-300 cursor-pointer transition-all shadow-lg shadow-slate-200/50"
                >
                  {/* Poster */}
                  <div className="aspect-[2/3] relative overflow-hidden">
                    {chip.posterUrl ? (
                      <img
                        src={chip.posterUrl}
                        alt={chip.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-slate-100 flex items-center justify-center text-slate-400 text-4xl">
                        {chip.title[0]}
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                  </div>

                  {/* Info */}
                  <div className="absolute bottom-0 left-0 right-0 p-3 text-left">
                    <h3 className="text-white font-medium text-sm truncate drop-shadow-lg">
                      {chip.title}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-slate-200 text-xs">{chip.year}</span>
                      {chip.mood[0] && (
                        <span className="text-xs bg-violet-500/30 border border-violet-400/50 text-white px-2 py-0.5 rounded-full">
                          {chip.mood[0]}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Expand indicator */}
                  <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="w-8 h-8 rounded-full bg-violet-500 flex items-center justify-center shadow-lg">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                      </svg>
                    </div>
                  </div>
                </button>
              ))}
            </div>

            {/* Back to search */}
            <div className="text-center mt-8">
              <button
                onClick={reset}
                className="text-slate-500 hover:text-slate-700 text-xs border border-slate-200 bg-white/80 backdrop-blur-sm px-4 py-2 rounded-full hover:border-slate-300 hover:bg-white transition-all shadow-sm"
              >
                ← Try a different search
              </button>
            </div>
          </div>
        )}

        {/* Result - Mind Map */}
        {viewState === 'result' && rootMovie && (
          <div ref={resultRef} className="w-full h-screen">
            <MindMap rootMovie={rootMovie} onFetchSimilar={fetchSimilar} />
          </div>
        )}
      </main>

      {/* Subtle ambient glow */}
      <div className="fixed top-1/4 right-1/4 w-96 h-96 bg-cyan-500/10 blur-[120px] rounded-full pointer-events-none" />
      <div className="fixed bottom-1/4 left-1/4 w-64 h-64 bg-purple-500/10 blur-[100px] rounded-full pointer-events-none" />
    </div>
  )
}
