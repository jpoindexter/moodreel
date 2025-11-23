// API Configuration
export const API_CONFIG = {
  // OpenAI Models
  EMBEDDING_MODEL: 'text-embedding-3-small',
  CHAT_MODEL: 'gpt-4o-mini',

  // Embedding dimensions
  EMBEDDING_DIMENSIONS: 1536,

  // Recommendation settings
  SIMILARITY_THRESHOLD: 0.5,
  RECOMMENDATION_LIMITS: {
    min: 1,
    default: 8,
    max: 50,
  },

  // Rate limiting (per minute)
  RATE_LIMITS: {
    analyze: { windowMs: 60000, max: 10 },
    recommend: { windowMs: 60000, max: 30 },
  },

  // Timeouts (milliseconds)
  TIMEOUTS: {
    openai: 30000,
    tmdb: 10000,
    database: 10000,
  },

  // Retry configuration
  RETRY: {
    maxAttempts: 3,
    baseDelayMs: 1000,
  },
}

// TMDB Configuration
export const TMDB_CONFIG = {
  BASE_URL: 'https://api.themoviedb.org/3',
  IMAGE_BASE_URL: 'https://image.tmdb.org/t/p',
  POSTER_SIZES: {
    small: 'w200',
    medium: 'w500',
  } as const,
}
