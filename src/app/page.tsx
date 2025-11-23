'use client'

import { useState } from 'react'
import { Search, Heart, Sparkles, Film } from 'lucide-react'
import { MovieCard } from '@/components/MovieCard'
import { SearchInput } from '@/components/SearchInput'
import { VibeLoader } from '@/components/VibeLoader'
import type { Recommendation, Movie } from '@/lib/types'

export default function Home() {
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [sourceMovie, setSourceMovie] = useState<Movie | null>(null)
  const [recommendations, setRecommendations] = useState<Recommendation[]>([])
  const [favorites, setFavorites] = useState<Set<string>>(new Set())
  const [error, setError] = useState<string | null>(null)

  const handleSearch = async (title: string) => {
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
        throw new Error('Failed to analyze movie')
      }

      const { movie } = await analyzeRes.json()
      setSourceMovie(movie)

      // Then get recommendations
      const recommendRes = await fetch('/api/recommend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ movieId: movie.id, limit: 8 }),
      })

      if (!recommendRes.ok) {
        throw new Error('Failed to get recommendations')
      }

      const { recommendations: recs } = await recommendRes.json()
      setRecommendations(recs)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  const toggleFavorite = async (movieId: string) => {
    setFavorites(prev => {
      const next = new Set(prev)
      if (next.has(movieId)) {
        next.delete(movieId)
      } else {
        next.add(movieId)
      }
      return next
    })
  }

  return (
    <main className="min-h-screen px-4 py-12 md:px-8 lg:px-16">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <header className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Film className="w-10 h-10 text-purple-500" />
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
          <div className="text-center text-red-400 mb-8">
            {error}
          </div>
        )}

        {/* Source Movie */}
        {sourceMovie && !loading && (
          <div className="mb-12">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-400" />
              Analyzing vibes for
            </h2>
            <div className="bg-zinc-900/50 rounded-xl p-6 border border-zinc-800">
              <div className="flex gap-6">
                {sourceMovie.posterUrl && (
                  <img
                    src={sourceMovie.posterUrl}
                    alt={sourceMovie.title}
                    className="w-32 h-48 object-cover rounded-lg"
                  />
                )}
                <div className="flex-1">
                  <h3 className="text-2xl font-bold mb-1">
                    {sourceMovie.title}
                    <span className="text-zinc-500 font-normal ml-2">
                      ({sourceMovie.year})
                    </span>
                  </h3>
                  <p className="text-purple-300 italic mb-4">
                    {sourceMovie.vibeSummary}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {sourceMovie.vibeProfile.mood.map(m => (
                      <span key={m} className="px-3 py-1 bg-purple-900/40 rounded-full text-sm text-purple-200">
                        {m}
                      </span>
                    ))}
                    {sourceMovie.vibeProfile.themes.slice(0, 3).map(t => (
                      <span key={t} className="px-3 py-1 bg-pink-900/40 rounded-full text-sm text-pink-200">
                        {t}
                      </span>
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
            <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
              <Heart className="w-5 h-5 text-pink-400" />
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

        {/* Empty State */}
        {!loading && !sourceMovie && !error && (
          <div className="text-center text-zinc-500 mt-12">
            <Search className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Enter a movie title to discover vibe matches</p>
          </div>
        )}
      </div>
    </main>
  )
}
