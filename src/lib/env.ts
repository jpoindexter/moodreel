// Environment variable validation - run at startup
export function validateEnv() {
  const required = [
    'DATABASE_URL',
    'OPENAI_API_KEY',
    'TMDB_API_KEY',
  ]

  const missing = required.filter(key => !process.env[key])

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables:\n${missing.map(k => `  - ${k}`).join('\n')}\n\nSee .env.example for required variables.`
    )
  }
}

// Type-safe env access
export const env = {
  database: {
    url: process.env.DATABASE_URL!,
  },
  openai: {
    apiKey: process.env.OPENAI_API_KEY!,
  },
  tmdb: {
    apiKey: process.env.TMDB_API_KEY!,
  },
}
