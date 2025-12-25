import { NextRequest, NextResponse } from 'next/server'
import { parseNaturalSearch, isNaturalLanguageQuery, describeFilters } from '@/lib/search-parser'
import { discoverMovies, getPosterUrl, getVibeFromGenres, searchMovie } from '@/lib/tmdb'
import { checkRateLimit, getClientIP, RATE_LIMITS } from '@/lib/rate-limit'
import { validateTitle, validateLimit } from '@/lib/validation'

interface DiscoverResult {
  id: string
  title: string
  year: number
  posterUrl: string | null
  overview: string
  mood: string[]
  atmosphere: string
  tmdbId: number
}

export async function POST(req: NextRequest) {
  try {
    // Rate limiting
    const ip = getClientIP(req.headers)
    const rateLimitResult = await checkRateLimit(`discover:${ip}`, RATE_LIMITS.recommend)

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

    const { query, limit = 6 } = body

    // Validate inputs
    const queryValidation = validateTitle(query)
    if (!queryValidation.valid) {
      return NextResponse.json(
        { error: queryValidation.error },
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

    const safeLimit = Math.min(Math.max(Number(limit) || 6, 1), 20)
    const trimmedQuery = query.trim()

    // Check if this is a natural language query or a direct title search
    const isNaturalQuery = isNaturalLanguageQuery(trimmedQuery)

    let results: DiscoverResult[] = []
    let filterDescription = ''

    if (isNaturalQuery) {
      // Parse natural language into filters
      const filters = parseNaturalSearch(trimmedQuery)
      filterDescription = describeFilters(filters)

      // Fetch from TMDB discover
      const movies = await discoverMovies(filters, safeLimit)

      results = movies.map(movie => {
        const year = movie.release_date
          ? new Date(movie.release_date).getFullYear()
          : new Date().getFullYear()

        const vibeInfo = getVibeFromGenres(movie.genre_ids || [])

        return {
          id: `tmdb-${movie.id}`,
          title: movie.title,
          year,
          posterUrl: getPosterUrl(movie.poster_path),
          overview: movie.overview || '',
          mood: vibeInfo.mood,
          atmosphere: vibeInfo.atmosphere,
          tmdbId: movie.id,
        }
      })
    } else {
      // Direct title search - find the exact movie
      const movie = await searchMovie(trimmedQuery)

      if (movie) {
        const year = movie.release_date
          ? new Date(movie.release_date).getFullYear()
          : new Date().getFullYear()

        const vibeInfo = getVibeFromGenres(movie.genre_ids || [])

        results = [{
          id: `tmdb-${movie.id}`,
          title: movie.title,
          year,
          posterUrl: getPosterUrl(movie.poster_path),
          overview: movie.overview || '',
          mood: vibeInfo.mood,
          atmosphere: vibeInfo.atmosphere,
          tmdbId: movie.id,
        }]
      }

      filterDescription = `"${trimmedQuery}"`
    }

    return NextResponse.json(
      {
        results,
        isNaturalQuery,
        filterDescription,
        query: trimmedQuery,
      },
      {
        headers: {
          'Cache-Control': 'public, max-age=3600',
          'X-RateLimit-Remaining': String(rateLimitResult.remaining),
        }
      }
    )
  } catch (error) {
    console.error('Discover error:', error)
    return NextResponse.json(
      { error: 'Failed to discover movies' },
      { status: 500 }
    )
  }
}
