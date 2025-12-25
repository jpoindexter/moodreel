'use client'

import { useEffect, useRef, useCallback } from 'react'
import { gsap } from 'gsap'
import { X, Play, Plus, Star, Clock, Calendar } from 'lucide-react'
import type { Movie } from '@/lib/types'

interface MovieDetailsModalProps {
  movie: Movie | null
  isOpen: boolean
  onClose: () => void
  onExplore?: (movie: Movie) => void
  similarMovies?: { movie: Movie; similarity: number }[]
}

// Mood to color mapping
const MOOD_COLORS: Record<string, string> = {
  // Emotional
  melancholic: 'bg-indigo-500/20 border-indigo-500/40 text-indigo-300',
  nostalgic: 'bg-amber-500/20 border-amber-500/40 text-amber-300',
  hopeful: 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300',
  tense: 'bg-red-500/20 border-red-500/40 text-red-300',
  dreamy: 'bg-purple-500/20 border-purple-500/40 text-purple-300',
  dark: 'bg-slate-500/20 border-slate-500/40 text-slate-300',
  eerie: 'bg-violet-500/20 border-violet-500/40 text-violet-300',
  uplifting: 'bg-yellow-500/20 border-yellow-500/40 text-yellow-300',
  romantic: 'bg-pink-500/20 border-pink-500/40 text-pink-300',
  mysterious: 'bg-cyan-500/20 border-cyan-500/40 text-cyan-300',
  
  // Themes
  dystopian: 'bg-orange-500/20 border-orange-500/40 text-orange-300',
  cyberpunk: 'bg-cyan-500/20 border-cyan-500/40 text-cyan-300',
  philosophical: 'bg-blue-500/20 border-blue-500/40 text-blue-300',
  existential: 'bg-violet-500/20 border-violet-500/40 text-violet-300',
  
  // Atmosphere
  atmospheric: 'bg-teal-500/20 border-teal-500/40 text-teal-300',
  'slow burn': 'bg-amber-500/20 border-amber-500/40 text-amber-300',
  synthwave: 'bg-fuchsia-500/20 border-fuchsia-500/40 text-fuchsia-300',
  noir: 'bg-zinc-500/20 border-zinc-500/40 text-zinc-300',
  gritty: 'bg-stone-500/20 border-stone-500/40 text-stone-300',
}

function getTagColor(tag: string): string {
  const normalized = tag.toLowerCase()
  return MOOD_COLORS[normalized] || 'bg-slate-700/50 border-slate-600/50 text-slate-300'
}

export function MovieDetailsModal({
  movie,
  isOpen,
  onClose,
  onExplore,
  similarMovies = [],
}: MovieDetailsModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)

  // Animate in/out
  useEffect(() => {
    if (!overlayRef.current || !panelRef.current) return

    if (isOpen && movie) {
      // Animate in
      const tl = gsap.timeline()

      tl.set(overlayRef.current, { display: 'block' })
        .fromTo(
          overlayRef.current,
          { opacity: 0 },
          { opacity: 1, duration: 0.3, ease: 'power2.out' }
        )
        .fromTo(
          panelRef.current,
          { x: '100%' },
          { x: '0%', duration: 0.4, ease: 'power3.out' },
          '-=0.2'
        )

      // Stagger content in
      if (contentRef.current) {
        const elements = contentRef.current.querySelectorAll('.animate-in')
        tl.fromTo(
          elements,
          { opacity: 0, y: 20 },
          { opacity: 1, y: 0, stagger: 0.05, duration: 0.3, ease: 'power2.out' },
          '-=0.2'
        )
      }
    } else {
      // Animate out
      const tl = gsap.timeline()

      tl.to(panelRef.current, {
        x: '100%',
        duration: 0.3,
        ease: 'power2.in',
      })
        .to(
          overlayRef.current,
          { opacity: 0, duration: 0.2, ease: 'power2.in' },
          '-=0.1'
        )
        .set(overlayRef.current, { display: 'none' })
    }
  }, [isOpen, movie])

  // Close on escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [onClose])

  // Click outside to close
  const handleOverlayClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === overlayRef.current) onClose()
    },
    [onClose]
  )

  if (!movie) return null

  const vibeProfile = movie.vibeProfile
  const allTags = [
    ...(vibeProfile?.mood || []),
    ...(vibeProfile?.themes || []),
    vibeProfile?.atmosphere,
    vibeProfile?.pacing,
  ].filter(Boolean) as string[]

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 hidden"
      onClick={handleOverlayClick}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-md" />

      {/* Panel */}
      <div
        ref={panelRef}
        className="absolute top-0 right-0 h-full w-full max-w-lg bg-zinc-950 border-l border-zinc-800 shadow-2xl overflow-hidden"
        style={{ transform: 'translateX(100%)' }}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-zinc-900/80 backdrop-blur-sm border border-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white hover:bg-zinc-800 transition-all"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Content */}
        <div
          ref={contentRef}
          className="h-full overflow-y-auto"
        >
          {/* Hero poster */}
          <div className="animate-in relative aspect-[16/10] bg-zinc-900">
            {movie.posterUrl ? (
              <>
                <img
                  src={movie.posterUrl}
                  alt={movie.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/50 to-transparent" />
              </>
            ) : (
              <div className="w-full h-full flex items-center justify-center text-zinc-700 text-6xl font-bold">
                {movie.title[0]}
              </div>
            )}

            {/* Match badge */}
            <div className="absolute top-4 left-4 px-3 py-1 bg-emerald-500/90 backdrop-blur-sm rounded-full text-black text-xs font-semibold">
              98% Match
            </div>
          </div>

          {/* Info */}
          <div className="p-6 -mt-12 relative">
            {/* Title */}
            <h2 className="animate-in text-2xl font-semibold text-white mb-2">
              {movie.title}
            </h2>

            {/* Meta row */}
            <div className="animate-in flex items-center gap-4 text-sm text-zinc-500 mb-4">
              {movie.year && (
                <span className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  {movie.year}
                </span>
              )}
              <span className="flex items-center gap-1">
                <Star className="w-4 h-4 text-yellow-500" />
                8.0
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                2h 44m
              </span>
            </div>

            {/* Vibe tags - COLORED */}
            {allTags.length > 0 && (
              <div className="animate-in mb-6">
                <h3 className="text-xs uppercase tracking-wider text-zinc-600 mb-2">
                  Vibe Profile
                </h3>
                <div className="flex flex-wrap gap-2">
                  {allTags.slice(0, 6).map((tag, i) => (
                    <span
                      key={i}
                      className={`px-3 py-1 border rounded-full text-xs font-medium cursor-pointer transition-all hover:scale-105 ${getTagColor(tag)}`}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Description */}
            <div className="animate-in mb-6">
              <p className="text-zinc-400 text-sm leading-relaxed">
                {movie.overview ||
                  movie.vibeSummary ||
                  'A captivating film that explores unique themes and delivers an unforgettable cinematic experience.'}
              </p>
            </div>

            {/* Action buttons */}
            <div className="animate-in flex gap-3 mb-8">
              <button
                onClick={() => onExplore?.(movie)}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-cyan-500 hover:bg-cyan-400 text-black font-semibold rounded-xl transition-all hover:scale-[1.02]"
              >
                <Play className="w-4 h-4" />
                Explore Similar Vibes
              </button>
              <button className="w-12 h-12 flex items-center justify-center bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 rounded-xl transition-colors">
                <Plus className="w-5 h-5" />
              </button>
            </div>

            {/* Similar movies */}
            {similarMovies.length > 0 && (
              <div className="animate-in">
                <h3 className="text-sm font-medium text-white mb-4">
                  Closest Matches
                </h3>
                <div className="grid grid-cols-3 gap-3">
                  {similarMovies.slice(0, 3).map(({ movie: similar, similarity }) => (
                    <button
                      key={similar.id}
                      onClick={() => onExplore?.(similar)}
                      className="group relative aspect-[2/3] rounded-lg overflow-hidden bg-zinc-900 border border-zinc-800 hover:border-cyan-500/50 transition-all"
                    >
                      {similar.posterUrl ? (
                        <img
                          src={similar.posterUrl}
                          alt={similar.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-zinc-700">
                          {similar.title[0]}
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
                      <div className="absolute bottom-0 left-0 right-0 p-2">
                        <div className="text-xs text-white font-medium truncate">
                          {similar.title}
                        </div>
                        <div className="text-[10px] text-cyan-400">
                          {Math.round(similarity * 100)}% Match
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Credits section */}
            <div className="animate-in mt-8 pt-6 border-t border-zinc-800">
              <h3 className="text-xs uppercase tracking-wider text-zinc-600 mb-4">
                Title Details
              </h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-zinc-500">Director</span>
                  <span className="text-zinc-300">Denis Villeneuve</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Genres</span>
                  <span className="text-zinc-300">Sci-Fi • Thriller • Drama</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Language</span>
                  <span className="text-zinc-300">English</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
