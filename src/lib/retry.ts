import { API_CONFIG } from './constants'

interface RetryOptions {
  maxAttempts?: number
  baseDelayMs?: number
  shouldRetry?: (error: unknown) => boolean
}

// Default retry condition - retry on network errors and rate limits
function defaultShouldRetry(error: unknown): boolean {
  if (error instanceof Error) {
    const message = error.message.toLowerCase()
    // Retry on network errors, timeouts, and rate limits
    if (
      message.includes('network') ||
      message.includes('timeout') ||
      message.includes('econnreset') ||
      message.includes('429') ||
      message.includes('rate limit')
    ) {
      return true
    }
  }
  return false
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxAttempts = API_CONFIG.RETRY.maxAttempts,
    baseDelayMs = API_CONFIG.RETRY.baseDelayMs,
    shouldRetry = defaultShouldRetry,
  } = options

  let lastError: unknown

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error

      if (attempt === maxAttempts || !shouldRetry(error)) {
        throw error
      }

      // Exponential backoff with jitter
      const delay = baseDelayMs * Math.pow(2, attempt - 1) + Math.random() * 100
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }

  throw lastError
}
