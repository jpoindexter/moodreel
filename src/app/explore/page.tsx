'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
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

export default function ExplorePage() {
  const [query, setQuery] = useState('')
  const [viewState, setViewState] = useState<ViewState>('search')
  const [rootMovie, setRootMovie] = useState<Movie | null>(null)
  const [previewChips, setPreviewChips] = useState<PreviewChip[]>([])
  const [filterDescription, setFilterDescription] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [expandingChip, setExpandingChip] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const handleSearch = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) return

    setViewState('loading')
    setError(null)
    setPreviewChips([])

    try {
      // First try discover API for natural language or single title
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

      // If natural language query with multiple results, show preview chips
      if (discoverData.isNaturalQuery && discoverData.results.length > 1) {
        setPreviewChips(discoverData.results)
        setFilterDescription(discoverData.filterDescription)
        setViewState('preview')
        return
      }

      // Single result - go directly to analyze and mind map
      const singleMovie = discoverData.results[0]
      await expandToMindMap(singleMovie)

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setViewState('search')
    }
  }, [])

  const expandToMindMap = useCallback(async (chip: PreviewChip) => {
    setExpandingChip(chip.id)
    setViewState('loading')

    try {
      // Create a Movie object from the chip data
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

      // Small delay for animation
      await new Promise((r) => setTimeout(r, 400))

      setRootMovie(movie)
      setViewState('result')
      setExpandingChip(null)
      setPreviewChips([])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load movie')
      setViewState('search')
      setExpandingChip(null)
    }
  }, [])

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

  const reset = () => {
    setRootMovie(null)
    setViewState('search')
    setQuery('')
    setError(null)
    setPreviewChips([])
    setExpandingChip(null)
    setTimeout(() => inputRef.current?.focus(), 100)
  }

  const backToPreview = () => {
    setViewState('preview')
    setRootMovie(null)
  }

  const suggestions = [
    '90s horror',
    'feel-good 80s',
    'dark thriller',
    'sci-fi epic',
    'romantic comedy',
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 text-slate-800 overflow-hidden relative">
      {/* Grid background */}
      <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: 'linear-gradient(rgba(163,184,204,0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(163,184,204,0.15) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 p-4">
        <div className="flex items-center justify-between max-w-6xl mx-auto">
          <button onClick={reset} className="text-slate-500 hover:text-slate-800 text-sm font-medium transition-colors">
            MoodReel
          </button>
          {(viewState === 'result' || viewState === 'preview') && (
            <button onClick={reset} className="text-slate-400 hover:text-slate-700 text-xs border border-slate-200 bg-white/60 backdrop-blur-sm px-3 py-1.5 rounded-full hover:border-slate-300 hover:bg-white transition-all shadow-sm">
              New search
            </button>
          )}
        </div>
      </header>

      <main className="min-h-screen flex items-center justify-center">
        <AnimatePresence mode="wait">
          {/* Search */}
          {viewState === 'search' && (
            <motion.div
              key="search"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3 }}
              className="w-full max-w-lg px-6"
            >
              <div className="text-center mb-8">
                <h1 className="text-3xl font-light text-slate-700 mb-2">Find your vibe</h1>
                <p className="text-slate-400 text-sm">Search a movie or try &quot;90s horror&quot;</p>
              </div>

              <form onSubmit={(e) => { e.preventDefault(); handleSearch(query) }} className="relative mb-6">
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Enter a movie or vibe..."
                  className="w-full px-5 py-3.5 pl-12 bg-white/80 backdrop-blur-sm border border-slate-200 rounded-full text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100 transition-all shadow-lg shadow-slate-200/50"
                />
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                {query && (
                  <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-1.5 bg-slate-700 text-white text-sm font-medium rounded-full hover:bg-slate-800 transition-colors shadow-md">
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
                    className="px-3 py-1 text-xs text-slate-500 bg-white/60 backdrop-blur-sm border border-slate-200 rounded-full hover:text-slate-700 hover:border-slate-300 hover:bg-white transition-all shadow-sm"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {/* Loading - growing dot */}
          {viewState === 'loading' && (
            <motion.div
              key="loading"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 2, opacity: 0 }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
              className="flex flex-col items-center gap-4"
            >
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ repeat: Infinity, duration: 1.5 }}
                className="w-4 h-4 rounded-full bg-blue-400 shadow-lg shadow-blue-300/50"
              />
              <span className="text-slate-400 text-xs">Finding vibes...</span>
            </motion.div>
          )}

          {/* Preview Chips */}
          {viewState === 'preview' && (
            <motion.div
              key="preview"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3 }}
              className="w-full max-w-4xl px-6 pt-20"
            >
              <div className="text-center mb-8">
                <h2 className="text-2xl font-light text-slate-700 mb-2">
                  {filterDescription}
                </h2>
                <p className="text-slate-400 text-sm">Click a movie to explore its vibe</p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {previewChips.map((chip, index) => (
                  <motion.button
                    key={chip.id}
                    layoutId={chip.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    onClick={() => expandToMindMap(chip)}
                    disabled={expandingChip !== null}
                    className={`relative group bg-white/80 backdrop-blur-sm rounded-2xl overflow-hidden border border-slate-200 shadow-lg shadow-slate-200/50 hover:shadow-xl hover:border-slate-300 transition-all ${
                      expandingChip === chip.id ? 'scale-105 ring-2 ring-blue-400' : ''
                    }`}
                  >
                    {/* Poster */}
                    <div className="aspect-[2/3] relative overflow-hidden">
                      {chip.posterUrl ? (
                        <img
                          src={chip.posterUrl}
                          alt={chip.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full bg-slate-100 flex items-center justify-center text-slate-300 text-4xl">
                          {chip.title[0]}
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                    </div>

                    {/* Info */}
                    <div className="absolute bottom-0 left-0 right-0 p-3 text-left">
                      <h3 className="text-white font-medium text-sm truncate drop-shadow-lg">
                        {chip.title}
                      </h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-white/80 text-xs">{chip.year}</span>
                        {chip.mood[0] && (
                          <span className="text-xs bg-white/20 backdrop-blur-sm text-white px-2 py-0.5 rounded-full">
                            {chip.mood[0]}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Expand indicator */}
                    <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="w-8 h-8 rounded-full bg-white/90 flex items-center justify-center shadow-lg">
                        <svg className="w-4 h-4 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                        </svg>
                      </div>
                    </div>
                  </motion.button>
                ))}
              </div>

              {/* Back to search */}
              <div className="text-center mt-8">
                <button
                  onClick={() => { setViewState('search'); setPreviewChips([]) }}
                  className="text-slate-400 hover:text-slate-700 text-xs border border-slate-200 bg-white/60 backdrop-blur-sm px-4 py-2 rounded-full hover:border-slate-300 hover:bg-white transition-all"
                >
                  ← Try a different search
                </button>
              </div>
            </motion.div>
          )}

          {/* Result - Mind Map */}
          {viewState === 'result' && rootMovie && (
            <motion.div
              key="result"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
              className="w-full h-screen"
            >
              <MindMap rootMovie={rootMovie} onFetchSimilar={fetchSimilar} />

              {/* Back button if we came from preview */}
              {previewChips.length > 0 && (
                <button
                  onClick={backToPreview}
                  className="fixed bottom-4 left-4 text-slate-400 hover:text-slate-700 text-xs border border-slate-200 bg-white/60 backdrop-blur-sm px-3 py-1.5 rounded-full hover:border-slate-300 hover:bg-white transition-all z-50"
                >
                  ← Back to results
                </button>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Subtle ambient glow */}
      <div className="fixed top-1/4 right-1/4 w-96 h-96 bg-blue-200/30 blur-[120px] rounded-full pointer-events-none" />
      <div className="fixed bottom-1/4 left-1/4 w-64 h-64 bg-purple-200/20 blur-[100px] rounded-full pointer-events-none" />
    </div>
  )
}
