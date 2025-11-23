'use client'

import { useState, useCallback } from 'react'
import { Heart, Sparkles, Film, AlertCircle, RefreshCw, SearchX } from 'lucide-react'
import { MovieCard } from '@/components/MovieCard'
import { SearchInput } from '@/components/SearchInput'
import { VibeLoader } from '@/components/VibeLoader'
import { MoodSelector } from '@/components/MoodSelector'
import { Badge, Button } from '@/components/ui'
import type { Recommendation, Movie } from '@/lib/types'

export default function Home() {
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [sourceMovie, setSourceMovie] = useState<Movie | null>(null)
  const [recommendations, setRecommendations] = useState<Recommendation[]>([])
  const [favorites, setFavorites] = useState<Set<string>>(new Set())
  const [error, setError] = useState<string | null>(null)

  const handleSearch = useCallback(async (title: string) => {
    if (!title.trim()) return

    setLoading(true)
    setError(null)
    setSourceMovie(null)
    setRecommendations([])

    try {
      // First, analyze the input movie
      const analyzeRes = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title }),
      })

      if (!analyzeRes.ok) {
        const data = await analyzeRes.json().catch(() => ({}))
        if (analyzeRes.status === 404) {
          throw new Error(`Movie "${title}" not found. Try checking the spelling or adding the year.`)
        } else if (analyzeRes.status === 429) {
          throw new Error('Too many requests. Please wait a moment and try again.')
        }
        throw new Error(data.error || 'Failed to analyze movie')
      }

      const analyzeData = await analyzeRes.json()
      if (!analyzeData.movie || !analyzeData.movie.id) {
        throw new Error('Invalid response from analyze API')
      }
      setSourceMovie(analyzeData.movie)

      // Then get recommendations
      const recommendRes = await fetch('/api/recommend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ movieId: analyzeData.movie.id, limit: 8 }),
      })

      if (!recommendRes.ok) {
        const data = await recommendRes.json().catch(() => ({}))
        throw new Error(data.error || 'Failed to get recommendations')
      }

      const recommendData = await recommendRes.json()
      if (!Array.isArray(recommendData.recommendations)) {
        throw new Error('Invalid response from recommend API')
      }
      setRecommendations(recommendData.recommendations)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }, [])

  const toggleFavorite = useCallback((movieId: string) => {
    setFavorites(prev => {
      const next = new Set(prev)
      if (next.has(movieId)) {
        next.delete(movieId)
      } else {
        next.add(movieId)
      }
      return next
    })
  }, [])

  return (
    <main className="min-h-screen px-4 py-12 md:px-8 lg:px-16">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <header className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Film className="w-10 h-10 text-purple-500" aria-hidden="true" />
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent">
              MoodReel
            </h1>
          </div>
          <p className="text-zinc-400 text-lg max-w-xl mx-auto">
            Find movies that match your vibe, not just your genre.
            Enter a title and discover aesthetically similar films.
          </p>
        </header>

        {/* Search */}
        <div className="max-w-xl mx-auto mb-12">
          <SearchInput
            value={query}
            onChange={setQuery}
            onSubmit={handleSearch}
            disabled={loading}
          />
        </div>

        {/* Loading State */}
        {loading && <VibeLoader />}

        {/* Error State */}
        {error && (
          <div className="max-w-xl mx-auto mb-8" role="alert" aria-live="assertive">
            <div className="bg-red-900/20 border border-red-800 rounded-xl p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" aria-hidden="true" />
              <div className="flex-1">
                <p className="text-red-300">{error}</p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => { setError(null); setQuery('') }}
                  className="mt-2 text-red-400 hover:text-red-300"
                >
                  <RefreshCw className="w-3 h-3" aria-hidden="true" />
                  Try again
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Source Movie */}
        {sourceMovie && !loading && (
          <div className="mb-12">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-400" aria-hidden="true" />
              Analyzing vibes for
            </h2>
            <div className="bg-zinc-900/50 rounded-xl p-6 border border-zinc-800 shadow-card">
              <div className="flex gap-6">
                {sourceMovie.posterUrl && (
                  <img
                    src={sourceMovie.posterUrl}
                    alt={`${sourceMovie.title} poster`}
                    className="w-32 h-48 object-cover rounded-lg"
                    loading="lazy"
                    onError={(e) => { e.currentTarget.style.display = 'none' }}
                  />
                )}
                <div className="flex-1">
                  <h3 className="text-xl font-semibold mb-1">
                    {sourceMovie.title}
                    <span className="text-zinc-400 font-normal ml-2">
                      ({sourceMovie.year})
                    </span>
                  </h3>
                  <p className="text-purple-300 italic mb-4">
                    {sourceMovie.vibeSummary}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {sourceMovie.vibeProfile.mood.map(m => (
                      <Badge key={m} variant="purple">{m}</Badge>
                    ))}
                    {sourceMovie.vibeProfile.themes.slice(0, 3).map(t => (
                      <Badge key={t} variant="pink">{t}</Badge>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Recommendations Grid */}
        {recommendations.length > 0 && (
          <div>
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
              <Heart className="w-5 h-5 text-pink-400" aria-hidden="true" />
              Movies with similar vibes
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {recommendations.map(rec => (
                <MovieCard
                  key={rec.movie.id}
                  movie={rec.movie}
                  explanation={rec.vibeExplanation}
                  similarity={rec.similarityScore}
                  isFavorite={favorites.has(rec.movie.id)}
                  onToggleFavorite={() => toggleFavorite(rec.movie.id)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Empty Recommendations State */}
        {sourceMovie && !loading && recommendations.length === 0 && (
          <div className="text-center py-12">
            <SearchX className="w-12 h-12 mx-auto mb-4 text-zinc-600" aria-hidden="true" />
            <h3 className="text-lg font-medium text-zinc-300 mb-2">
              No similar vibes found
            </h3>
            <p className="text-zinc-400 mb-4">
              We couldn&apos;t find movies with matching vibes in our database yet.
            </p>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => { setSourceMovie(null); setQuery('') }}
            >
              Try another movie
            </Button>
          </div>
        )}

        {/* Empty State with Mood Selector */}
        {!loading && !sourceMovie && !error && (
          <div className="mt-12">
            <div className="text-center mb-8">
              <p className="text-zinc-400 mb-2">Or pick a mood to get started</p>
            </div>
            <div className="max-w-2xl mx-auto">
              <MoodSelector onSelectMood={handleSearch} />
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
