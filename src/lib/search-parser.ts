/**
 * Natural language search parser
 * Converts queries like "90s horror miniseries" into TMDB-compatible filters
 */

export interface SearchFilters {
  yearStart?: number
  yearEnd?: number
  genres?: number[]
  keywords?: string[]
  sortBy?: 'popularity.desc' | 'vote_average.desc' | 'release_date.desc'
  voteCountMin?: number
}

// TMDB genre IDs
const GENRE_MAP: Record<string, number> = {
  // Core genres
  action: 28,
  adventure: 12,
  animation: 16,
  comedy: 35,
  crime: 80,
  documentary: 99,
  drama: 18,
  family: 10751,
  fantasy: 14,
  history: 36,
  horror: 27,
  music: 10402,
  mystery: 9648,
  romance: 10749,
  'sci-fi': 878,
  'science fiction': 878,
  scifi: 878,
  thriller: 53,
  war: 10752,
  western: 37,
}

// Mood/vibe to genre mapping
const MOOD_TO_GENRES: Record<string, number[]> = {
  'feel-good': [35, 10751, 10749], // Comedy, Family, Romance
  'feel good': [35, 10751, 10749],
  'cozy': [35, 10751],
  'dark': [27, 80, 53], // Horror, Crime, Thriller
  'scary': [27],
  'terrifying': [27],
  'creepy': [27, 9648],
  'intense': [28, 53],
  'thrilling': [53, 28],
  'emotional': [18, 10749],
  'epic': [12, 14, 36], // Adventure, Fantasy, History
  'funny': [35],
  'romantic': [10749],
  'mysterious': [9648, 53],
  'suspenseful': [53, 9648],
  'heartwarming': [18, 10751],
  'nostalgic': [18, 10751],
  'mind-bending': [878, 9648],
  'mind bending': [878, 9648],
  'trippy': [878, 14],
  'weird': [878, 14],
  'sad': [18],
  'uplifting': [35, 10751, 18],
}

// Decade patterns
const DECADE_PATTERNS: Record<string, { start: number; end: number }> = {
  '20s': { start: 2020, end: 2029 },
  '2020s': { start: 2020, end: 2029 },
  '10s': { start: 2010, end: 2019 },
  '2010s': { start: 2010, end: 2019 },
  '00s': { start: 2000, end: 2009 },
  '2000s': { start: 2000, end: 2009 },
  '90s': { start: 1990, end: 1999 },
  '1990s': { start: 1990, end: 1999 },
  '80s': { start: 1980, end: 1989 },
  '1980s': { start: 1980, end: 1989 },
  '70s': { start: 1970, end: 1979 },
  '1970s': { start: 1970, end: 1979 },
  '60s': { start: 1960, end: 1969 },
  '1960s': { start: 1960, end: 1969 },
  '50s': { start: 1950, end: 1959 },
  '1950s': { start: 1950, end: 1959 },
}

// Sort keywords
const SORT_KEYWORDS: Record<string, 'popularity.desc' | 'vote_average.desc' | 'release_date.desc'> = {
  popular: 'popularity.desc',
  trending: 'popularity.desc',
  best: 'vote_average.desc',
  'highest rated': 'vote_average.desc',
  'top rated': 'vote_average.desc',
  new: 'release_date.desc',
  recent: 'release_date.desc',
  latest: 'release_date.desc',
}

/**
 * Parse natural language search query into TMDB-compatible filters
 */
export function parseNaturalSearch(query: string): SearchFilters {
  const filters: SearchFilters = {
    sortBy: 'popularity.desc',
    voteCountMin: 100, // Filter out obscure movies
  }

  const lowered = query.toLowerCase().trim()
  const words = lowered.split(/\s+/)
  const keywords: string[] = []

  // Extract decades
  for (const [pattern, range] of Object.entries(DECADE_PATTERNS)) {
    if (lowered.includes(pattern)) {
      filters.yearStart = range.start
      filters.yearEnd = range.end
      break
    }
  }

  // Extract specific year (e.g., "from 1995" or just "1995")
  const yearMatch = lowered.match(/\b(19|20)\d{2}\b/)
  if (yearMatch && !filters.yearStart) {
    const year = parseInt(yearMatch[0], 10)
    if (lowered.includes('after') || lowered.includes('since')) {
      filters.yearStart = year
    } else if (lowered.includes('before')) {
      filters.yearEnd = year
    } else {
      // Exact year or around that year
      filters.yearStart = year
      filters.yearEnd = year
    }
  }

  // Extract genres
  const genres = new Set<number>()

  for (const [keyword, genreId] of Object.entries(GENRE_MAP)) {
    if (lowered.includes(keyword)) {
      genres.add(genreId)
    }
  }

  // Extract mood-based genres
  for (const [mood, genreIds] of Object.entries(MOOD_TO_GENRES)) {
    if (lowered.includes(mood)) {
      genreIds.forEach(id => genres.add(id))
    }
  }

  if (genres.size > 0) {
    filters.genres = Array.from(genres)
  }

  // Extract sort preference
  for (const [keyword, sortValue] of Object.entries(SORT_KEYWORDS)) {
    if (lowered.includes(keyword)) {
      filters.sortBy = sortValue
      break
    }
  }

  // Collect remaining keywords for text search
  for (const word of words) {
    // Skip if it's a genre, decade, or common word
    const isGenre = Object.keys(GENRE_MAP).some(g => g.includes(word))
    const isMood = Object.keys(MOOD_TO_GENRES).some(m => m.includes(word))
    const isDecade = Object.keys(DECADE_PATTERNS).some(d => d.includes(word))
    const isSort = Object.keys(SORT_KEYWORDS).some(s => s.includes(word))
    const isCommon = ['a', 'an', 'the', 'from', 'in', 'with', 'movie', 'movies', 'film', 'films'].includes(word)
    const isYear = /^(19|20)\d{2}$/.test(word)

    if (!isGenre && !isMood && !isDecade && !isSort && !isCommon && !isYear && word.length > 2) {
      keywords.push(word)
    }
  }

  if (keywords.length > 0) {
    filters.keywords = keywords
  }

  return filters
}

/**
 * Check if a query is likely a natural language search vs a movie title
 */
export function isNaturalLanguageQuery(query: string): boolean {
  const lowered = query.toLowerCase()

  // Check for decade patterns
  for (const pattern of Object.keys(DECADE_PATTERNS)) {
    if (lowered.includes(pattern)) return true
  }

  // Check for genre keywords
  for (const genre of Object.keys(GENRE_MAP)) {
    if (lowered.includes(genre)) return true
  }

  // Check for mood keywords
  for (const mood of Object.keys(MOOD_TO_GENRES)) {
    if (lowered.includes(mood)) return true
  }

  // Check for sort keywords
  for (const sort of Object.keys(SORT_KEYWORDS)) {
    if (lowered.includes(sort)) return true
  }

  return false
}

/**
 * Generate a human-readable description of the filters
 */
export function describeFilters(filters: SearchFilters): string {
  const parts: string[] = []

  if (filters.yearStart && filters.yearEnd && filters.yearStart === filters.yearEnd) {
    parts.push(`from ${filters.yearStart}`)
  } else if (filters.yearStart && filters.yearEnd) {
    parts.push(`from ${filters.yearStart}-${filters.yearEnd}`)
  } else if (filters.yearStart) {
    parts.push(`after ${filters.yearStart}`)
  } else if (filters.yearEnd) {
    parts.push(`before ${filters.yearEnd}`)
  }

  if (filters.genres && filters.genres.length > 0) {
    // Reverse lookup genre names
    const genreNames = filters.genres.map(id => {
      const entry = Object.entries(GENRE_MAP).find(([, v]) => v === id)
      return entry ? entry[0] : null
    }).filter(Boolean)

    if (genreNames.length > 0) {
      parts.push(genreNames.join(', '))
    }
  }

  if (filters.keywords && filters.keywords.length > 0) {
    parts.push(`"${filters.keywords.join(' ')}"`)
  }

  return parts.length > 0 ? parts.join(' • ') : 'All movies'
}
