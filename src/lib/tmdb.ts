import type { SearchFilters } from './search-parser'

const TMDB_API_KEY = process.env.TMDB_API_KEY
const TMDB_BASE_URL = 'https://api.themoviedb.org/3'

interface TMDBMovie {
  id: number
  title: string
  release_date: string
  poster_path: string | null
  overview: string
  imdb_id?: string
  genre_ids?: number[]
}

// TMDB genre ID to mood/vibe mapping
const GENRE_TO_MOOD: Record<number, string[]> = {
  28: ['intense', 'thrilling'],      // Action
  12: ['adventurous', 'exciting'],   // Adventure
  16: ['whimsical', 'imaginative'],  // Animation
  35: ['lighthearted', 'funny'],     // Comedy
  80: ['dark', 'tense'],             // Crime
  99: ['thoughtful', 'informative'], // Documentary
  18: ['emotional', 'moving'],       // Drama
  10751: ['warm', 'heartfelt'],      // Family
  14: ['magical', 'epic'],           // Fantasy
  36: ['epic', 'dramatic'],          // History
  27: ['terrifying', 'disturbing'],  // Horror
  10402: ['rhythmic', 'emotional'],  // Music
  9648: ['mysterious', 'suspenseful'], // Mystery
  10749: ['romantic', 'tender'],     // Romance
  878: ['futuristic', 'cerebral'],   // Science Fiction
  10770: ['dramatic'],               // TV Movie
  53: ['tense', 'gripping'],         // Thriller
  10752: ['intense', 'somber'],      // War
  37: ['rugged', 'atmospheric'],     // Western
}

export function getVibeFromGenres(genreIds: number[]): { mood: string[], atmosphere: string } {
  const moods = new Set<string>()
  genreIds.forEach(id => {
    const genreMoods = GENRE_TO_MOOD[id]
    if (genreMoods) {
      genreMoods.forEach(m => moods.add(m))
    }
  })

  const moodArray = Array.from(moods).slice(0, 3)
  const atmosphere = moodArray[0] || 'cinematic'

  return { mood: moodArray, atmosphere }
}

export async function searchMovie(title: string, year?: number): Promise<TMDBMovie | null> {
  const params = new URLSearchParams({
    api_key: TMDB_API_KEY!,
    query: title,
    ...(year && { year: year.toString() }),
  })

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 10000) // 10s timeout

  try {
    const response = await fetch(`${TMDB_BASE_URL}/search/movie?${params}`, {
      signal: controller.signal
    })
    clearTimeout(timeoutId)
    if (!response.ok) return null
    const data = await response.json()

    if (data.results && data.results.length > 0) {
      const movie = data.results[0]
      // Get additional details including IMDB ID
      const details = await getMovieDetails(movie.id)
      return { ...movie, imdb_id: details?.imdb_id }
    }

    return null
  } catch (error) {
    clearTimeout(timeoutId)
    console.error('TMDB search error:', error)
    return null
  }
}

export async function getMovieDetails(tmdbId: number): Promise<TMDBMovie | null> {
  const params = new URLSearchParams({
    api_key: TMDB_API_KEY!,
  })

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 10000) // 10s timeout

  try {
    const response = await fetch(
      `${TMDB_BASE_URL}/movie/${tmdbId}?${params}`,
      { signal: controller.signal }
    )
    clearTimeout(timeoutId)

    if (!response.ok) return null
    return response.json()
  } catch (error) {
    clearTimeout(timeoutId)
    console.error('TMDB getMovieDetails error:', error)
    return null
  }
}

export function getPosterUrl(posterPath: string | null, size: 'w200' | 'w500' = 'w500'): string | null {
  if (!posterPath) return null
  return `https://image.tmdb.org/t/p/${size}${posterPath}`
}

// Get similar movies from TMDB's recommendation engine
export async function getSimilarMovies(tmdbId: number, limit: number = 20): Promise<TMDBMovie[]> {
  const params = new URLSearchParams({
    api_key: TMDB_API_KEY!,
  })

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 10000)

  try {
    const response = await fetch(
      `${TMDB_BASE_URL}/movie/${tmdbId}/similar?${params}`,
      { signal: controller.signal }
    )
    clearTimeout(timeoutId)

    if (!response.ok) return []
    const data = await response.json()

    // Get details for each movie (for IMDB IDs) - limit to avoid too many requests
    const movies = (data.results || []).slice(0, limit)

    // Fetch details in parallel with concurrency limit
    const detailedMovies = await Promise.all(
      movies.map(async (movie: TMDBMovie) => {
        const details = await getMovieDetails(movie.id)
        return {
          ...movie,
          imdb_id: details?.imdb_id
        }
      })
    )

    return detailedMovies
  } catch (error) {
    clearTimeout(timeoutId)
    console.error('TMDB getSimilarMovies error:', error)
    return []
  }
}

// Get TMDB recommendations (different algorithm than similar)
export async function getRecommendedMovies(tmdbId: number, limit: number = 20): Promise<TMDBMovie[]> {
  const params = new URLSearchParams({
    api_key: TMDB_API_KEY!,
  })

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 10000)

  try {
    const response = await fetch(
      `${TMDB_BASE_URL}/movie/${tmdbId}/recommendations?${params}`,
      { signal: controller.signal }
    )
    clearTimeout(timeoutId)

    if (!response.ok) return []
    const data = await response.json()

    const movies = (data.results || []).slice(0, limit)

    const detailedMovies = await Promise.all(
      movies.map(async (movie: TMDBMovie) => {
        const details = await getMovieDetails(movie.id)
        return {
          ...movie,
          imdb_id: details?.imdb_id
        }
      })
    )

    return detailedMovies
  } catch (error) {
    clearTimeout(timeoutId)
    console.error('TMDB getRecommendedMovies error:', error)
    return []
  }
}

/**
 * Discover movies using filters from natural language search
 * Uses TMDB's /discover/movie endpoint
 */
export async function discoverMovies(filters: SearchFilters, limit: number = 6): Promise<TMDBMovie[]> {
  const params = new URLSearchParams({
    api_key: TMDB_API_KEY!,
    include_adult: 'false',
    include_video: 'false',
    language: 'en-US',
    page: '1',
    sort_by: filters.sortBy || 'popularity.desc',
  })

  // Add year filters
  if (filters.yearStart) {
    params.append('primary_release_date.gte', `${filters.yearStart}-01-01`)
  }
  if (filters.yearEnd) {
    params.append('primary_release_date.lte', `${filters.yearEnd}-12-31`)
  }

  // Add genre filter (comma-separated for AND logic)
  if (filters.genres && filters.genres.length > 0) {
    params.append('with_genres', filters.genres.join(','))
  }

  // Add minimum vote count to filter out obscure movies
  if (filters.voteCountMin) {
    params.append('vote_count.gte', String(filters.voteCountMin))
  }

  // Add keyword text search if present
  if (filters.keywords && filters.keywords.length > 0) {
    params.append('with_keywords', filters.keywords.join('|'))
  }

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 10000)

  try {
    const response = await fetch(
      `${TMDB_BASE_URL}/discover/movie?${params}`,
      { signal: controller.signal }
    )
    clearTimeout(timeoutId)

    if (!response.ok) {
      console.error('TMDB discover error:', response.status)
      return []
    }

    const data = await response.json()
    const movies = (data.results || []).slice(0, limit)

    // Fetch details for each movie (includes IMDB ID)
    const detailedMovies = await Promise.all(
      movies.map(async (movie: TMDBMovie) => {
        const details = await getMovieDetails(movie.id)
        return {
          ...movie,
          imdb_id: details?.imdb_id
        }
      })
    )

    return detailedMovies
  } catch (error) {
    clearTimeout(timeoutId)
    console.error('TMDB discoverMovies error:', error)
    return []
  }
}
