// Input validation utilities

export interface ValidationResult {
  valid: boolean
  error?: string
}

export function validateTitle(title: unknown): ValidationResult {
  if (typeof title !== 'string') {
    return { valid: false, error: 'Title must be a string' }
  }

  const trimmed = title.trim()

  if (trimmed.length === 0) {
    return { valid: false, error: 'Title is required' }
  }

  if (trimmed.length > 200) {
    return { valid: false, error: 'Title must be under 200 characters' }
  }

  // Basic sanitization - allow alphanumeric, spaces, common punctuation
  const sanitized = trimmed.replace(/[^\w\s\-':,.!?&()]/g, '')

  if (sanitized.length < trimmed.length * 0.8) {
    return { valid: false, error: 'Title contains too many special characters' }
  }

  return { valid: true }
}

export function validateLimit(limit: unknown): ValidationResult {
  if (limit === undefined || limit === null) {
    return { valid: true } // Will use default
  }

  const num = Number(limit)

  if (isNaN(num) || !Number.isInteger(num)) {
    return { valid: false, error: 'Limit must be an integer' }
  }

  if (num < 1) {
    return { valid: false, error: 'Limit must be at least 1' }
  }

  if (num > 50) {
    return { valid: false, error: 'Limit cannot exceed 50' }
  }

  return { valid: true }
}

export function validateYear(year: unknown): ValidationResult {
  if (year === undefined || year === null) {
    return { valid: true } // Optional parameter
  }

  const num = Number(year)

  if (isNaN(num) || !Number.isInteger(num)) {
    return { valid: false, error: 'Year must be an integer' }
  }

  if (num < 1800 || num > new Date().getFullYear() + 5) {
    return { valid: false, error: 'Year must be between 1800 and ' + (new Date().getFullYear() + 5) }
  }

  return { valid: true }
}

export function validateMovieId(id: unknown): ValidationResult {
  if (typeof id !== 'string') {
    return { valid: false, error: 'ID must be a string' }
  }

  // Accept UUID format (from analyze API)
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

  // Accept tmdb-{number} format (from seed data)
  const tmdbRegex = /^tmdb-\d+$/

  if (!uuidRegex.test(id) && !tmdbRegex.test(id)) {
    return { valid: false, error: 'Invalid movie ID format' }
  }

  return { valid: true }
}

// Alias for backwards compatibility
export const validateUUID = validateMovieId

// Sanitize title for use in prompts
export function sanitizeForPrompt(text: string): string {
  return text
    .replace(/"/g, "'")
    .replace(/\\/g, '')
    .trim()
    .slice(0, 200)
}
