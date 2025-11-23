import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { analyzeMovieVibe, generateEmbedding } from '@/lib/openai'
import { searchMovie, getPosterUrl } from '@/lib/tmdb'
import { checkRateLimit, getClientIP, RATE_LIMITS } from '@/lib/rate-limit'
import { validateTitle, sanitizeForPrompt } from '@/lib/validation'
import type { Movie, VibeProfile } from '@/lib/types'

export async function POST(req: NextRequest) {
  try {
    // Rate limiting
    const ip = getClientIP(req.headers)
    const rateLimitResult = checkRateLimit(`analyze:${ip}`, RATE_LIMITS.analyze)

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

    const { title, year } = body

    // Validate input
    const titleValidation = validateTitle(title)
    if (!titleValidation.valid) {
      return NextResponse.json(
        { error: titleValidation.error },
        { status: 400 }
      )
    }

    const sanitizedTitle = sanitizeForPrompt(title)

    const supabase = createServerClient()

    // Check if we already have this movie
    const { data: existing } = await supabase
      .from('movies')
      .select('*')
      .ilike('title', sanitizedTitle)
      .limit(1)
      .single()

    if (existing) {
      return NextResponse.json({ movie: existing })
    }

    // Search TMDB for movie data
    const tmdbMovie = await searchMovie(sanitizedTitle, year)

    if (!tmdbMovie) {
      return NextResponse.json(
        { error: 'Movie not found' },
        { status: 404 }
      )
    }

    // Safe date parsing
    const movieYear = tmdbMovie.release_date
      ? new Date(tmdbMovie.release_date).getFullYear()
      : new Date().getFullYear()

    // Analyze the movie's vibe using GPT
    const vibeAnalysis = await analyzeMovieVibe(tmdbMovie.title, movieYear)

    const vibeProfile: VibeProfile = vibeAnalysis.vibeProfile
    const vibeSummary: string = vibeAnalysis.vibeSummary

    // Generate embedding from vibe profile text
    const vibeText = `
      Mood: ${vibeProfile.mood.join(', ')}
      Visual style: ${vibeProfile.visualStyle.join(', ')}
      Narrative energy: ${vibeProfile.narrativeEnergy}
      Themes: ${vibeProfile.themes.join(', ')}
      Emotional color: ${vibeProfile.emotionalColor}
      Pacing: ${vibeProfile.pacing}
      Atmosphere: ${vibeProfile.atmosphere}
      Era: ${vibeProfile.era}
      Summary: ${vibeSummary}
    `.trim()

    const embedding = await generateEmbedding(vibeText)

    // Create movie record
    const movie: Omit<Movie, 'id'> = {
      title: tmdbMovie.title,
      year: movieYear,
      posterUrl: getPosterUrl(tmdbMovie.poster_path),
      overview: tmdbMovie.overview,
      vibeProfile,
      vibeSummary,
      embedding,
      tmdbId: tmdbMovie.id,
      imdbId: tmdbMovie.imdb_id,
    }

    // Store in database
    const { data: newMovie, error } = await supabase
      .from('movies')
      .insert(movie)
      .select()
      .single()

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: 'Failed to save movie' },
        { status: 500 }
      )
    }

    return NextResponse.json({ movie: newMovie })
  } catch (error) {
    console.error('Analysis error:', error)
    return NextResponse.json(
      { error: 'Failed to analyze movie' },
      { status: 500 }
    )
  }
}
