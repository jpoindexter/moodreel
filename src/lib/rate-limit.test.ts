import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { checkRateLimit, getClientIP, RATE_LIMITS } from './rate-limit'

describe('checkRateLimit', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('should allow first request', async () => {
    const result = await checkRateLimit('test-key-1', { windowMs: 60000, max: 10 })
    expect(result.allowed).toBe(true)
    expect(result.remaining).toBe(9)
  })

  it('should track multiple requests within window', async () => {
    const config = { windowMs: 60000, max: 5 }
    const key = 'test-key-2'

    const result1 = await checkRateLimit(key, config)
    expect(result1.remaining).toBe(4)

    const result2 = await checkRateLimit(key, config)
    expect(result2.remaining).toBe(3)
  })

  it('should block requests when limit is exceeded', async () => {
    const config = { windowMs: 60000, max: 2 }
    const key = 'test-key-3'

    await checkRateLimit(key, config)
    await checkRateLimit(key, config)
    const result = await checkRateLimit(key, config)

    expect(result.allowed).toBe(false)
    expect(result.remaining).toBe(0)
  })

  it('should reset after window expires', async () => {
    const config = { windowMs: 60000, max: 2 }
    const key = 'test-key-4'

    await checkRateLimit(key, config)
    await checkRateLimit(key, config)

    let result = await checkRateLimit(key, config)
    expect(result.allowed).toBe(false)

    vi.advanceTimersByTime(60001)

    result = await checkRateLimit(key, config)
    expect(result.allowed).toBe(true)
  })

  it('should track different keys independently', async () => {
    const config = { windowMs: 60000, max: 1 }

    const result1 = await checkRateLimit('user-1', config)
    const result2 = await checkRateLimit('user-2', config)

    expect(result1.allowed).toBe(true)
    expect(result2.allowed).toBe(true)
  })
})

describe('getClientIP', () => {
  it('should extract IP from x-forwarded-for header', () => {
    const headers = new Headers()
    headers.set('x-forwarded-for', '192.168.1.1, 10.0.0.1')
    expect(getClientIP(headers)).toBe('192.168.1.1')
  })

  it('should extract IP from cf-connecting-ip header', () => {
    const headers = new Headers()
    headers.set('cf-connecting-ip', '203.0.113.1')
    expect(getClientIP(headers)).toBe('203.0.113.1')
  })

  it('should extract IP from x-real-ip header', () => {
    const headers = new Headers()
    headers.set('x-real-ip', '198.51.100.1')
    expect(getClientIP(headers)).toBe('198.51.100.1')
  })

  it('should return "anonymous" when no IP headers present', () => {
    const headers = new Headers()
    expect(getClientIP(headers)).toBe('anonymous')
  })

  it('should trim whitespace from IP addresses', () => {
    const headers = new Headers()
    headers.set('x-forwarded-for', '  192.168.1.1  ')
    expect(getClientIP(headers)).toBe('192.168.1.1')
  })
})

describe('RATE_LIMITS', () => {
  it('should have correct analyze config', () => {
    expect(RATE_LIMITS.analyze).toEqual({ windowMs: 60000, max: 10 })
  })

  it('should have correct recommend config', () => {
    expect(RATE_LIMITS.recommend).toEqual({ windowMs: 60000, max: 30 })
  })
})
