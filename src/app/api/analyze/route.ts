import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { analyzeMovieVibe, generateEmbedding } from '@/lib/openai'
import { searchMovie, getPosterUrl } from '@/lib/tmdb'
import type { Movie, VibeProfile } from '@/lib/types'

export async function POST(req: NextRequest) {
  try {
    const { title, year } = await req.json()

    if (!title) {
      return NextResponse.json(
        { error: 'Title is required' },
        { status: 400 }
      )
    }

    const supabase = createServerClient()

    // Check if we already have this movie
    const { data: existing } = await supabase
      .from('movies')
      .select('*')
      .ilike('title', title)
      .limit(1)
      .single()

    if (existing) {
      return NextResponse.json({ movie: existing })
    }

    // Search TMDB for movie data
    const tmdbMovie = await searchMovie(title, year)

    if (!tmdbMovie) {
      return NextResponse.json(
        { error: 'Movie not found' },
        { status: 404 }
      )
    }

    // Analyze the movie's vibe using GPT
    const vibeAnalysis = await analyzeMovieVibe(
      tmdbMovie.title,
      new Date(tmdbMovie.release_date).getFullYear()
    )

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
      year: new Date(tmdbMovie.release_date).getFullYear(),
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
