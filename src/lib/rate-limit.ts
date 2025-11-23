// Simple in-memory rate limiter (use Redis for production)
const rateLimit = new Map<string, { count: number; resetTime: number }>()

interface RateLimitConfig {
  windowMs: number  // Time window in milliseconds
  max: number       // Max requests per window
}

export function checkRateLimit(
  key: string,
  config: RateLimitConfig
): { allowed: boolean; remaining: number; resetIn: number } {
  const now = Date.now()
  const record = rateLimit.get(key)

  // Clean up old entries periodically
  if (rateLimit.size > 10000) {
    for (const [k, v] of rateLimit) {
      if (v.resetTime < now) rateLimit.delete(k)
    }
  }

  if (!record || record.resetTime < now) {
    // New window
    rateLimit.set(key, { count: 1, resetTime: now + config.windowMs })
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

// Pre-configured limiters
export const RATE_LIMITS = {
  analyze: { windowMs: 60000, max: 10 },   // 10 per minute
  recommend: { windowMs: 60000, max: 30 }, // 30 per minute
}
