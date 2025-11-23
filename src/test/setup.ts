import '@testing-library/jest-dom'
import { vi } from 'vitest'

// Mock OpenAI
vi.mock('openai', () => ({
  default: vi.fn().mockImplementation(() => ({
    chat: {
      completions: {
        create: vi.fn().mockResolvedValue({
          choices: [{ message: { content: 'mocked response' } }],
        }),
      },
    },
  })),
}))

// Mock Supabase
vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
    })),
  })),
}))

// Mock fetch for TMDB API calls
global.fetch = vi.fn()

// Mock environment variables
vi.stubEnv('OPENAI_API_KEY', 'test-openai-key')
vi.stubEnv('TMDB_API_KEY', 'test-tmdb-key')
vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://test.supabase.co')
vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'test-anon-key')

// Reset mocks between tests
beforeEach(() => {
  vi.clearAllMocks()
})
