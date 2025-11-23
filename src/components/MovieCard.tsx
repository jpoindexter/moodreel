'use client'

import { memo } from 'react'
import { Heart } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Movie } from '@/lib/types'

interface MovieCardProps {
  movie: Movie
  explanation: string
  similarity: number
  isFavorite: boolean
  onToggleFavorite: () => void
}

export const MovieCard = memo(function MovieCard({
  movie,
  explanation,
  similarity,
  isFavorite,
  onToggleFavorite,
}: MovieCardProps) {
  const matchPercent = Math.round(similarity * 100)

  return (
    <div className="group relative bg-zinc-900 rounded-xl overflow-hidden border border-zinc-800 hover:border-purple-500/50 transition-all">
      {/* Poster */}
      <div className="aspect-[2/3] relative">
        {movie.posterUrl ? (
          <img
            src={movie.posterUrl}
            alt={`${movie.title} (${movie.year}) poster`}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-zinc-800 flex items-center justify-center text-zinc-600">
            No poster
          </div>
        )}

        {/* Match badge */}
        <div
          className="absolute top-3 left-3 px-2 py-1 bg-black/70 rounded-lg text-sm font-medium"
          aria-label={`${matchPercent}% vibe match`}
        >
          <span className="text-purple-400">{matchPercent}%</span>
          <span className="text-zinc-400 ml-1">match</span>
        </div>

        {/* Favorite button */}
        <button
          onClick={onToggleFavorite}
          aria-label={isFavorite ? `Remove ${movie.title} from favorites` : `Add ${movie.title} to favorites`}
          aria-pressed={isFavorite}
          className={cn(
            "absolute top-3 right-3 p-2 rounded-full",
            "bg-black/70 hover:bg-black/90 transition-colors",
            "focus:outline-none focus:ring-2 focus:ring-purple-500",
            isFavorite && "text-pink-500"
          )}
        >
          <Heart
            className={cn("w-4 h-4", isFavorite && "fill-current")}
            aria-hidden="true"
          />
        </button>
      </div>

      {/* Info */}
      <div className="p-4">
        <h3 className="font-semibold text-white truncate" title={movie.title}>
          {movie.title}
        </h3>
        <p className="text-zinc-500 text-sm mb-2">{movie.year}</p>

        {/* Vibe summary */}
        <p className="text-zinc-400 text-sm italic mb-3 line-clamp-2">
          {movie.vibeSummary}
        </p>

        {/* Why recommended */}
        <div className="text-xs text-purple-300/80 line-clamp-3">
          {explanation}
        </div>
      </div>
    </div>
  )
})
