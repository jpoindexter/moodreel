import postgres from 'postgres'
import type { Movie, VibeProfile } from './types'

const connectionString = process.env.DATABASE_URL!

if (!connectionString) {
  throw new Error('DATABASE_URL environment variable is required')
}

export const sql = postgres(connectionString, {
  ssl: 'require',
  max: 10,
  idle_timeout: 20,
  connect_timeout: 10,
})

// Database row type (snake_case from PostgreSQL)
interface MovieRow {
  id: string
  title: string
  year: number
  poster_url: string | null
  overview: string | null
  vibe_profile: VibeProfile
  vibe_summary: string
  embedding: number[]
  tmdb_id: number | null
  imdb_id: string | null
  created_at: Date
}

// Convert database row to application Movie type
function toMovie(row: MovieRow): Movie {
  // Parse vibeProfile if it's a string (JSONB can come back as string in some cases)
  let vibeProfile = row.vibe_profile
  if (typeof vibeProfile === 'string') {
    vibeProfile = JSON.parse(vibeProfile)
  }

  // Parse embedding if it's a string (vector type returns as string)
  let embedding = row.embedding
  if (typeof embedding === 'string') {
    embedding = JSON.parse(embedding)
  }

  return {
    id: row.id,
    title: row.title,
    year: row.year,
    posterUrl: row.poster_url,
    overview: row.overview || '',
    vibeProfile,
    vibeSummary: row.vibe_summary,
    embedding,
    tmdbId: row.tmdb_id ?? undefined,
    imdbId: row.imdb_id ?? undefined,
  }
}

// Find movie by title (case-insensitive)
export async function findMovieByTitle(title: string): Promise<Movie | null> {
  const rows = await sql<MovieRow[]>`
    SELECT * FROM movies
    WHERE LOWER(title) = LOWER(${title})
    LIMIT 1
  `
  return rows.length > 0 ? toMovie(rows[0]) : null
}

// Get movie by ID
export async function getMovieById(id: string): Promise<Movie | null> {
  const rows = await sql<MovieRow[]>`
    SELECT * FROM movies WHERE id = ${id}
  `
  return rows.length > 0 ? toMovie(rows[0]) : null
}

// Find movie by TMDB ID
export async function findMovieByTmdbId(tmdbId: number): Promise<Movie | null> {
  const rows = await sql<MovieRow[]>`
    SELECT * FROM movies WHERE tmdb_id = ${tmdbId}
  `
  return rows.length > 0 ? toMovie(rows[0]) : null
}

// Insert a new movie (or return existing if tmdb_id conflicts)
export async function insertMovie(movie: Omit<Movie, 'id'>): Promise<Movie> {
  const tmdbId = movie.tmdbId ?? null
  const imdbId = movie.imdbId ?? null
  const posterUrl = movie.posterUrl ?? null

  const rows = await sql<MovieRow[]>`
    INSERT INTO movies (
      title, year, poster_url, overview,
      vibe_profile, vibe_summary, embedding,
      tmdb_id, imdb_id
    ) VALUES (
      ${movie.title},
      ${movie.year},
      ${posterUrl},
      ${movie.overview},
      ${JSON.stringify(movie.vibeProfile)},
      ${movie.vibeSummary},
      ${JSON.stringify(movie.embedding)}::vector,
      ${tmdbId},
      ${imdbId}
    )
    ON CONFLICT (tmdb_id) DO UPDATE SET
      title = EXCLUDED.title,
      year = EXCLUDED.year,
      poster_url = EXCLUDED.poster_url,
      overview = EXCLUDED.overview,
      vibe_profile = EXCLUDED.vibe_profile,
      vibe_summary = EXCLUDED.vibe_summary,
      embedding = EXCLUDED.embedding
    RETURNING *
  `
  return toMovie(rows[0])
}

// Find similar movies using vector similarity
export async function findSimilarMovies(
  embedding: number[],
  matchThreshold: number = 0.5,
  matchCount: number = 10
): Promise<(Movie & { similarity: number })[]> {
  const rows = await sql<(MovieRow & { similarity: number })[]>`
    SELECT
      m.*,
      1 - (m.embedding <=> ${JSON.stringify(embedding)}::vector) as similarity
    FROM movies m
    WHERE 1 - (m.embedding <=> ${JSON.stringify(embedding)}::vector) > ${matchThreshold}
    ORDER BY m.embedding <=> ${JSON.stringify(embedding)}::vector
    LIMIT ${matchCount}
  `
  return rows.map(row => ({
    ...toMovie(row),
    similarity: row.similarity,
  }))
}

// Get all movies (for graph visualization)
export async function getAllMovies(): Promise<Movie[]> {
  const rows = await sql<MovieRow[]>`
    SELECT * FROM movies
    ORDER BY year DESC, title ASC
  `
  return rows.map(toMovie)
}
