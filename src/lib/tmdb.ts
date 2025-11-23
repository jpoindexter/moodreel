const TMDB_API_KEY = process.env.TMDB_API_KEY
const TMDB_BASE_URL = 'https://api.themoviedb.org/3'

interface TMDBMovie {
  id: number
  title: string
  release_date: string
  poster_path: string | null
  overview: string
  imdb_id?: string
}

export async function searchMovie(title: string, year?: number): Promise<TMDBMovie | null> {
  const params = new URLSearchParams({
    api_key: TMDB_API_KEY!,
    query: title,
    ...(year && { year: year.toString() }),
  })

  const response = await fetch(`${TMDB_BASE_URL}/search/movie?${params}`)
  if (!response.ok) return null
  const data = await response.json()

  if (data.results && data.results.length > 0) {
    const movie = data.results[0]
    // Get additional details including IMDB ID
    const details = await getMovieDetails(movie.id)
    return { ...movie, imdb_id: details?.imdb_id }
  }

  return null
}

export async function getMovieDetails(tmdbId: number): Promise<TMDBMovie | null> {
  const response = await fetch(
    `${TMDB_BASE_URL}/movie/${tmdbId}?api_key=${TMDB_API_KEY}`
  )

  if (!response.ok) return null
  return response.json()
}

export function getPosterUrl(posterPath: string | null, size: 'w200' | 'w500' = 'w500'): string | null {
  if (!posterPath) return null
  return `https://image.tmdb.org/t/p/${size}${posterPath}`
}
