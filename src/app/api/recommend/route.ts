import { NextRequest, NextResponse } from 'next/server'
import { getMovieById } from '@/lib/db'
import { getSimilarMovies, getRecommendedMovies, getPosterUrl, getVibeFromGenres } from '@/lib/tmdb'
import { checkRateLimit, getClientIP, RATE_LIMITS } from '@/lib/rate-limit'
import { validateUUID, validateLimit } from '@/lib/validation'
import { API_CONFIG } from '@/lib/constants'
import type { Recommendation } from '@/lib/types'

export async function POST(req: NextRequest) {
  try {
    // Rate limiting
    const ip = getClientIP(req.headers)
    const rateLimitResult = await checkRateLimit(`recommend:${ip}`, RATE_LIMITS.recommend)

    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: 'Too many requests. Please wait before trying again.' },
        {
          status: 429,
          headers: {
            'Retry-After': String(Math.ceil(rateLimitResult.resetIn / 1000))
          }
        }
      )
    }

    let body
    try {
      body = await req.json()
    } catch {
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      )
    }

    const { movieId, limit = 8 } = body

    // Validate inputs
    const idValidation = validateUUID(movieId)
    if (!idValidation.valid) {
      return NextResponse.json(
        { error: idValidation.error },
        { status: 400 }
      )
    }

    const limitValidation = validateLimit(limit)
    if (!limitValidation.valid) {
      return NextResponse.json(
        { error: limitValidation.error },
        { status: 400 }
      )
    }

    const { min, default: defaultLimit, max } = API_CONFIG.RECOMMENDATION_LIMITS
    const safeLimit = Math.min(Math.max(Number(limit) || defaultLimit, min), max)

    // Handle tmdb-{id} format IDs (from TMDB recommendations not in our DB)
    let tmdbIdToUse: number
    let sourceTitle: string

    if (movieId.startsWith('tmdb-')) {
      // Extract TMDB ID directly from the temporary ID
      const tmdbId = parseInt(movieId.replace('tmdb-', ''), 10)
      if (isNaN(tmdbId)) {
        return NextResponse.json(
          { error: 'Invalid TMDB ID format' },
          { status: 400 }
        )
      }
      tmdbIdToUse = tmdbId
      sourceTitle = 'this movie' // We don't have the title for tmdb-prefixed IDs
    } else {
      // Get the source movie from our database
      const sourceMovie = await getMovieById(movieId)

      if (!sourceMovie) {
        return NextResponse.json(
          { error: 'Source movie not found' },
          { status: 404 }
        )
      }

      if (!sourceMovie.tmdbId) {
        return NextResponse.json(
          { error: 'Source movie has no TMDB ID for fetching similar movies' },
          { status: 400 }
        )
      }

      tmdbIdToUse = sourceMovie.tmdbId
      sourceTitle = sourceMovie.title
    }

    // Fetch similar movies from TMDB - fast, no OpenAI calls
    const [tmdbSimilar, tmdbRecommended] = await Promise.all([
      getSimilarMovies(tmdbIdToUse, safeLimit),
      getRecommendedMovies(tmdbIdToUse, safeLimit)
    ])

    // Combine and dedupe by TMDB ID
    const seenIds = new Set<number>()
    const candidateMovies = [...tmdbSimilar, ...tmdbRecommended].filter(m => {
      if (seenIds.has(m.id) || m.id === tmdbIdToUse) return false
      seenIds.add(m.id)
      return true
    }).slice(0, safeLimit)

    if (candidateMovies.length === 0) {
      return NextResponse.json({ recommendations: [] })
    }

    // Build recommendations from TMDB data with genre-based vibe extraction
    const recommendations: Recommendation[] = candidateMovies.map((tmdbMovie, index) => {
      const movieYear = tmdbMovie.release_date
        ? new Date(tmdbMovie.release_date).getFullYear()
        : new Date().getFullYear()

      // Use position-based "similarity" since TMDB already ranked them
      const similarity = 0.95 - (index * 0.05)

      // Extract mood from genres
      const genreVibe = getVibeFromGenres(tmdbMovie.genre_ids || [])

      return {
        movie: {
          id: `tmdb-${tmdbMovie.id}`, // Temporary ID since not in our DB
          title: tmdbMovie.title,
          year: movieYear,
          posterUrl: getPosterUrl(tmdbMovie.poster_path),
          overview: tmdbMovie.overview,
          vibeProfile: {
            mood: genreVibe.mood,
            visualStyle: [],
            narrativeEnergy: '',
            themes: [],
            emotionalColor: '',
            pacing: '',
            atmosphere: genreVibe.atmosphere,
            era: ''
          },
          vibeSummary: tmdbMovie.overview?.slice(0, 150) + '...' || '',
          embedding: [],
          tmdbId: tmdbMovie.id,
          imdbId: tmdbMovie.imdb_id,
        },
        similarityScore: similarity,
        vibeExplanation: `Recommended based on similar themes and style to ${sourceTitle}`,
      }
    })

    return NextResponse.json(
      { recommendations },
      {
        headers: {
          'Cache-Control': 'public, max-age=3600',
          'X-RateLimit-Remaining': String(rateLimitResult.remaining),
        }
      }
    )
  } catch (error) {
    console.error('Recommendation error:', error)
    return NextResponse.json(
      { error: 'Failed to generate recommendations' },
      { status: 500 }
    )
  }
}
