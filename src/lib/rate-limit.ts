import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

// In-memory fallback rate limiter
const inMemoryRateLimit = new Map<string, { count: number; resetTime: number }>()

interface RateLimitConfig {
  windowMs: number  // Time window in milliseconds
  max: number       // Max requests per window
}

// Initialize Redis client if environment variables are configured
let redis: Redis | null = null
let rateLimiters: Map<string, Ratelimit> = new Map()

function getRedisClient(): Redis | null {
  if (redis) return redis

  const url = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN

  if (url && token) {
    try {
      redis = new Redis({ url, token })
      return redis
    } catch (error) {
      console.warn('Failed to initialize Upstash Redis:', error)
      return null
    }
  }

  return null
}

function getRateLimiter(config: RateLimitConfig): Ratelimit | null {
  const client = getRedisClient()
  if (!client) return null

  const configKey = `${config.windowMs}-${config.max}`

  if (!rateLimiters.has(configKey)) {
    const limiter = new Ratelimit({
      redis: client,
      limiter: Ratelimit.slidingWindow(config.max, `${config.windowMs} ms`),
      analytics: true,
      prefix: 'moodreel:ratelimit',
    })
    rateLimiters.set(configKey, limiter)
  }

  return rateLimiters.get(configKey)!
}

// In-memory fallback implementation
function checkRateLimitInMemory(
  key: string,
  config: RateLimitConfig
): { allowed: boolean; remaining: number; resetIn: number } {
  const now = Date.now()
  const record = inMemoryRateLimit.get(key)

  // Clean up old entries periodically
  if (inMemoryRateLimit.size > 10000) {
    for (const [k, v] of inMemoryRateLimit) {
      if (v.resetTime < now) inMemoryRateLimit.delete(k)
    }
  }

  if (!record || record.resetTime < now) {
    inMemoryRateLimit.set(key, { count: 1, resetTime: now + config.windowMs })
    return { allowed: true, remaining: config.max - 1, resetIn: config.windowMs }
  }

  if (record.count >= config.max) {
    return {
      allowed: false,
      remaining: 0,
      resetIn: record.resetTime - now
    }
  }

  record.count++
  return {
    allowed: true,
    remaining: config.max - record.count,
    resetIn: record.resetTime - now
  }
}

// Async rate limit check (uses Redis if available, falls back to in-memory)
export async function checkRateLimit(
  key: string,
  config: RateLimitConfig
): Promise<{ allowed: boolean; remaining: number; resetIn: number }> {
  const limiter = getRateLimiter(config)

  if (!limiter) {
    return checkRateLimitInMemory(key, config)
  }

  try {
    const result = await limiter.limit(key)
    return {
      allowed: result.success,
      remaining: result.remaining,
      resetIn: Math.max(0, result.reset - Date.now())
    }
  } catch (error) {
    console.warn('Redis rate limit failed, falling back to in-memory:', error)
    return checkRateLimitInMemory(key, config)
  }
}

// Extract client IP from request headers
export function getClientIP(headers: Headers): string {
  const forwardedFor = headers.get('x-forwarded-for')
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim()
  }

  const cfConnectingIP = headers.get('cf-connecting-ip')
  if (cfConnectingIP) {
    return cfConnectingIP.trim()
  }

  const xRealIP = headers.get('x-real-ip')
  if (xRealIP) {
    return xRealIP.trim()
  }

  return 'anonymous'
}

// Re-export from constants for single source of truth
export { API_CONFIG } from './constants'
export const RATE_LIMITS = {
  analyze: { windowMs: 60000, max: 10 },   // 10 per minute
  recommend: { windowMs: 60000, max: 30 }, // 30 per minute
} as const
