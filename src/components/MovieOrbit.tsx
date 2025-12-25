'use client'

import { useEffect, useState, useMemo } from 'react'
import type { Movie } from '@/lib/types'

interface SimilarMovie {
  movie: Movie
  similarity: number
  explanation?: string
}

interface MovieOrbitProps {
  movie: Movie
  similarMovies: SimilarMovie[]
  onMovieClick?: (movie: Movie) => void
  isLoading?: boolean
}

// Extract top tags from vibe profile
function extractTags(movie: Movie): string[] {
  const tags: string[] = []
  const vibe = movie.vibeProfile

  if (vibe.mood?.length) tags.push(...vibe.mood.slice(0, 2))
  if (vibe.atmosphere) tags.push(vibe.atmosphere)
  if (vibe.themes?.length) tags.push(vibe.themes[0])

  return [...new Set(tags)].slice(0, 4)
}

export function MovieOrbit({
  movie,
  similarMovies,
  onMovieClick,
  isLoading = false,
}: MovieOrbitProps) {
  const [mounted, setMounted] = useState(false)
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)

  useEffect(() => {
    // Trigger mount animation
    const timer = setTimeout(() => setMounted(true), 100)
    return () => clearTimeout(timer)
  }, [])

  // Calculate orbital positions with depth
  const orbitalPositions = useMemo(() => {
    const positions: { x: number; y: number; scale: number; opacity: number; delay: number }[] = []
    const count = Math.min(similarMovies.length, 8)

    for (let i = 0; i < count; i++) {
      // Distribute in a semi-random orbital pattern
      const angle = (i / count) * Math.PI * 2 - Math.PI / 2
      const radiusVariance = 0.8 + Math.random() * 0.4
      const baseRadius = 180 + (i % 2) * 60

      // Depth simulation - items at top are "further", items at bottom are "closer"
      const depthFactor = (Math.sin(angle) + 1) / 2 // 0 at top, 1 at bottom
      const scale = 0.6 + depthFactor * 0.4
      const opacity = 0.4 + depthFactor * 0.6

      positions.push({
        x: Math.cos(angle) * baseRadius * radiusVariance,
        y: Math.sin(angle) * baseRadius * radiusVariance * 0.7, // Flatten vertically for perspective
        scale,
        opacity,
        delay: i * 0.1,
      })
    }

    // Sort by scale so "closer" items render on top
    return positions.map((pos, i) => ({ ...pos, index: i })).sort((a, b) => a.scale - b.scale)
  }, [similarMovies.length])

  const tags = extractTags(movie)

  return (
    <div className="relative w-full h-full flex items-center justify-center">
      {/* Orbital Similar Movies - render first (behind) */}
      {orbitalPositions.map(({ x, y, scale, opacity, delay, index }) => {
        const similar = similarMovies[index]
        if (!similar) return null

        const isHovered = hoveredIndex === index

        return (
          <button
            key={similar.movie.id}
            onClick={() => onMovieClick?.(similar.movie)}
            onMouseEnter={() => setHoveredIndex(index)}
            onMouseLeave={() => setHoveredIndex(null)}
            className="absolute transition-all duration-500 ease-out group"
            style={{
              transform: `translate(${x}px, ${y}px) scale(${mounted ? scale : 0})`,
              opacity: mounted ? (isHovered ? 1 : opacity) : 0,
              transitionDelay: `${delay}s`,
              zIndex: Math.round(scale * 10),
            }}
          >
            {/* Circular movie thumbnail */}
            <div
              className={`
                relative w-20 h-20 rounded-full overflow-hidden
                border-2 transition-all duration-300
                ${isHovered ? 'border-white shadow-lg shadow-white/20' : 'border-white/20'}
              `}
            >
              {similar.movie.posterUrl ? (
                <img
                  src={similar.movie.posterUrl}
                  alt={similar.movie.title}
                  className="w-full h-full object-cover scale-150"
                />
              ) : (
                <div className="w-full h-full bg-white/10 flex items-center justify-center text-white/40 text-xs">
                  {similar.movie.title.slice(0, 2)}
                </div>
              )}

              {/* Match percentage overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end justify-center pb-1">
                <span className="text-white text-xs font-medium">
                  {Math.round(similar.similarity * 100)}%
                </span>
              </div>
            </div>

            {/* Hover tooltip */}
            <div
              className={`
                absolute left-1/2 -translate-x-1/2 -bottom-12
                px-3 py-1.5 bg-black/90 backdrop-blur-sm rounded-lg
                whitespace-nowrap text-sm text-white
                transition-all duration-200
                ${isHovered ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2 pointer-events-none'}
              `}
            >
              {similar.movie.title}
              <span className="text-white/50 ml-2">{similar.movie.year}</span>
            </div>

            {/* Connection line to center */}
            <svg
              className="absolute top-1/2 left-1/2 pointer-events-none"
              style={{
                width: Math.abs(x) + 40,
                height: Math.abs(y) + 40,
                transform: `translate(${x > 0 ? '-100%' : '0'}, ${y > 0 ? '-100%' : '0'})`,
              }}
            >
              <line
                x1={x > 0 ? '100%' : '0'}
                y1={y > 0 ? '100%' : '0'}
                x2={x > 0 ? '0' : '100%'}
                y2={y > 0 ? '0' : '100%'}
                stroke="white"
                strokeOpacity={isHovered ? 0.3 : 0.1}
                strokeWidth="1"
                strokeDasharray="4 4"
              />
            </svg>
          </button>
        )
      })}

      {/* Main Movie Card - render last (on top) */}
      <div
        className={`
          relative z-20 transition-all duration-700 ease-out
          ${mounted ? 'scale-100 opacity-100' : 'scale-90 opacity-0'}
        `}
      >
        {/* Card Container */}
        <div className="relative w-72 bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
          {/* Poster */}
          <div className="relative aspect-[2/3] overflow-hidden">
            {movie.posterUrl ? (
              <img
                src={movie.posterUrl}
                alt={movie.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-purple-900 to-indigo-900 flex items-center justify-center">
                <span className="text-6xl text-white/20">{movie.title.charAt(0)}</span>
              </div>
            )}

            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />

            {/* Tags floating on poster */}
            <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="px-2.5 py-1 text-xs font-medium bg-black/50 backdrop-blur-sm text-white rounded-full border border-white/10"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>

          {/* Info */}
          <div className="p-4">
            <h2 className="text-xl font-semibold text-white mb-1">{movie.title}</h2>
            <p className="text-white/50 text-sm mb-3">{movie.year}</p>
            <p className="text-white/70 text-sm leading-relaxed line-clamp-3">
              {movie.vibeSummary}
            </p>
          </div>
        </div>

        {/* Glow effect behind card */}
        <div className="absolute inset-0 -z-10 blur-3xl opacity-30 bg-gradient-to-br from-purple-500 to-cyan-500 rounded-full scale-150" />
      </div>

      {/* Loading overlay for similar movies */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-8 h-8 rounded-full border-2 border-white/20 border-t-white animate-spin" />
        </div>
      )}
    </div>
  )
}
