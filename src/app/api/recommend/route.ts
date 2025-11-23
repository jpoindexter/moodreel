import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { generateVibeExplanation } from '@/lib/openai'
import { checkRateLimit, RATE_LIMITS } from '@/lib/rate-limit'
import { validateUUID, validateLimit } from '@/lib/validation'
import type { Recommendation, Movie } from '@/lib/types'

export async function POST(req: NextRequest) {
  try {
    // Rate limiting
    const ip = req.headers.get('x-forwarded-for') || 'anonymous'
    const rateLimitResult = checkRateLimit(`recommend:${ip}`, RATE_LIMITS.recommend)

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

    const { movieId, limit = 8 } = await req.json()

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

    const safeLimit = Math.min(Math.max(Number(limit) || 8, 1), 50)

    const supabase = createServerClient()

    // Get the source movie
    const { data: sourceMovie, error: sourceError } = await supabase
      .from('movies')
      .select('*')
      .eq('id', movieId)
      .single()

    if (sourceError || !sourceMovie) {
      return NextResponse.json(
        { error: 'Source movie not found' },
        { status: 404 }
      )
    }

    // Find similar movies using vector similarity search
    // This uses Supabase's pgvector extension
    const { data: similarMovies, error: searchError } = await supabase.rpc(
      'match_movies',
      {
        query_embedding: sourceMovie.embedding,
        match_threshold: 0.5,
        match_count: safeLimit + 1, // +1 to exclude the source movie
      }
    )

    if (searchError) {
      console.error('Vector search error:', searchError)
      return NextResponse.json(
        { error: 'Failed to find similar movies' },
        { status: 500 }
      )
    }

    // Filter out the source movie and build recommendations
    const filteredMovies = (similarMovies || [])
      .filter((m: { id: string }) => m.id !== movieId)
      .slice(0, safeLimit)

    // Generate explanations for each recommendation
    const recommendations: Recommendation[] = await Promise.all(
      filteredMovies.map(async (m: Movie & { similarity: number }) => {
        const explanation = await generateVibeExplanation(
          sourceMovie.title,
          m.title,
          sourceMovie.vibeSummary,
          m.vibeSummary
        )

        return {
          movie: {
            id: m.id,
            title: m.title,
            year: m.year,
            posterUrl: m.posterUrl,
            overview: m.overview,
            vibeProfile: m.vibeProfile,
            vibeSummary: m.vibeSummary,
            embedding: m.embedding,
            tmdbId: m.tmdbId,
            imdbId: m.imdbId,
          },
          similarityScore: m.similarity,
          vibeExplanation: explanation,
        }
      })
    )

    return NextResponse.json({ recommendations })
  } catch (error) {
    console.error('Recommendation error:', error)
    return NextResponse.json(
      { error: 'Failed to generate recommendations' },
      { status: 500 }
    )
  }
}
