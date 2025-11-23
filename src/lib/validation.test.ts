import { describe, it, expect } from 'vitest'
import { validateTitle, validateLimit, validateYear, validateUUID, sanitizeForPrompt } from './validation'

describe('validateTitle', () => {
  it('should accept valid titles', () => {
    expect(validateTitle('The Matrix')).toEqual({ valid: true })
    expect(validateTitle('Inception')).toEqual({ valid: true })
    expect(validateTitle("Schindler's List")).toEqual({ valid: true })
  })

  it('should reject non-string values', () => {
    expect(validateTitle(123 as unknown as string)).toEqual({ valid: false, error: 'Title must be a string' })
    expect(validateTitle(null as unknown as string)).toEqual({ valid: false, error: 'Title must be a string' })
  })

  it('should reject empty strings', () => {
    expect(validateTitle('')).toEqual({ valid: false, error: 'Title is required' })
    expect(validateTitle('   ')).toEqual({ valid: false, error: 'Title is required' })
  })

  it('should reject titles over 200 characters', () => {
    const longTitle = 'A'.repeat(201)
    expect(validateTitle(longTitle)).toEqual({ valid: false, error: 'Title must be under 200 characters' })
  })

  it('should reject titles with too many special characters', () => {
    expect(validateTitle('$$$%%%^^^&&&***')).toEqual({ valid: false, error: 'Title contains too many special characters' })
  })
})

describe('validateLimit', () => {
  it('should accept valid limits', () => {
    expect(validateLimit(1)).toEqual({ valid: true })
    expect(validateLimit(10)).toEqual({ valid: true })
    expect(validateLimit(50)).toEqual({ valid: true })
  })

  it('should accept undefined/null (uses default)', () => {
    expect(validateLimit(undefined)).toEqual({ valid: true })
    expect(validateLimit(null as unknown as number)).toEqual({ valid: true })
  })

  it('should reject values less than 1', () => {
    expect(validateLimit(0)).toEqual({ valid: false, error: 'Limit must be at least 1' })
    expect(validateLimit(-5)).toEqual({ valid: false, error: 'Limit must be at least 1' })
  })

  it('should reject values greater than 50', () => {
    expect(validateLimit(51)).toEqual({ valid: false, error: 'Limit cannot exceed 50' })
  })
})

describe('validateYear', () => {
  it('should accept valid years', () => {
    expect(validateYear(1999)).toEqual({ valid: true })
    expect(validateYear(2020)).toEqual({ valid: true })
    expect(validateYear(1800)).toEqual({ valid: true })
  })

  it('should accept undefined/null (optional parameter)', () => {
    expect(validateYear(undefined)).toEqual({ valid: true })
    expect(validateYear(null)).toEqual({ valid: true })
  })

  it('should reject non-integer values', () => {
    expect(validateYear('2020')).toEqual({ valid: true }) // String coerced to number
    expect(validateYear(2020.5)).toEqual({ valid: false, error: 'Year must be an integer' })
    expect(validateYear(NaN)).toEqual({ valid: false, error: 'Year must be an integer' })
  })

  it('should reject years below 1800', () => {
    expect(validateYear(1799)).toEqual({ valid: false, error: expect.stringContaining('Year must be between 1800') })
    expect(validateYear(0)).toEqual({ valid: false, error: expect.stringContaining('Year must be between 1800') })
  })

  it('should reject years too far in future', () => {
    const farFuture = new Date().getFullYear() + 10
    expect(validateYear(farFuture)).toEqual({ valid: false, error: expect.stringContaining('Year must be between 1800') })
  })
})

describe('validateUUID', () => {
  it('should accept valid UUIDs', () => {
    expect(validateUUID('123e4567-e89b-12d3-a456-426614174000')).toEqual({ valid: true })
  })

  it('should reject non-string values', () => {
    expect(validateUUID(123 as unknown as string)).toEqual({ valid: false, error: 'ID must be a string' })
  })

  it('should reject invalid UUID formats', () => {
    expect(validateUUID('not-a-uuid')).toEqual({ valid: false, error: 'Invalid movie ID format' })
    expect(validateUUID('')).toEqual({ valid: false, error: 'Invalid movie ID format' })
  })
})

describe('sanitizeForPrompt', () => {
  it('should replace double quotes with single quotes', () => {
    expect(sanitizeForPrompt('Say "hello"')).toBe("Say 'hello'")
  })

  it('should remove backslashes', () => {
    expect(sanitizeForPrompt('path\\to\\file')).toBe('pathtofile')
  })

  it('should trim whitespace', () => {
    expect(sanitizeForPrompt('  hello world  ')).toBe('hello world')
  })

  it('should truncate to 200 characters', () => {
    const longText = 'A'.repeat(250)
    expect(sanitizeForPrompt(longText)).toHaveLength(200)
  })
})
