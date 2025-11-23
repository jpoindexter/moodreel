# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # Start development server on localhost:3000
npm run build        # Production build
npm run lint         # Run ESLint
npm run test         # Run Vitest in watch mode
npm run test:run     # Run Vitest once (CI mode)
npm run seed         # Seed database with 20 sample movies
npm run db:migrate   # Push Supabase schema changes
```

## Architecture

MoodReel is a vibe-based movie recommender using vector embeddings for similarity matching.

### Data Flow

1. **User searches for a movie** → `/api/analyze` fetches from TMDB, generates vibe analysis via OpenAI GPT-4o-mini, creates 1536-dim embedding via text-embedding-3-small, stores in Supabase
2. **Get recommendations** → `/api/recommend` performs pgvector cosine similarity search, generates LLM explanations for each match

### Key Patterns

- **Rate limiting**: Upstash Redis sliding window limiter with in-memory fallback in `src/lib/rate-limit.ts` (10/min analyze, 30/min recommend)
- **Graceful degradation**: `Promise.allSettled` for batch LLM calls with fallback explanations
- **Input validation**: All API inputs validated via `src/lib/validation.ts` before processing
- **Security headers**: Middleware at `src/middleware.ts` adds CORS, CSP (stricter in production), HSTS
- **Error monitoring**: Sentry integration at `src/instrumentation.ts` (enabled in production only)
- **Constants**: API configuration centralized in `src/lib/constants.ts` (limits, thresholds, timeouts)

### Database

Supabase PostgreSQL with pgvector extension. Schema in `supabase/schema.sql`.

- `movies` table stores vibe profiles and 1536-dim embeddings
- `match_movies()` RPC function performs vector similarity search
- Embeddings indexed with IVFFlat for performance

### External APIs

- **OpenAI**: Vibe analysis (GPT-4o-mini) and embeddings (text-embedding-3-small)
- **TMDB**: Movie metadata and poster URLs (10s timeout on fetch calls)

## Environment Variables

Required in `.env`:
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
- `OPENAI_API_KEY`
- `TMDB_API_KEY`

Production:
- `ALLOWED_ORIGINS` - Comma-separated CORS origins
- `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` - Redis rate limiting

Optional (Sentry monitoring):
- `NEXT_PUBLIC_SENTRY_DSN`, `SENTRY_DSN`, `SENTRY_ORG`, `SENTRY_PROJECT`

## Type Definitions

Core types in `src/lib/types.ts`:
- `VibeProfile` - 8 vibe dimensions (mood, visualStyle, themes, etc.)
- `Movie` - Full movie record with embedding
- `Recommendation` - Movie with similarity score and explanation
- `AnalyzeRequest`, `RecommendRequest` - API request types

## Testing

Tests use Vitest with React Testing Library. Run with `npm test`.

Test files:
- `src/lib/validation.test.ts` - Input validation tests (21 tests)
- `src/lib/rate-limit.test.ts` - Rate limiting tests (12 tests)

## Design System

### Typography
- **Font**: Inter from Google Fonts (`next/font/google`)
- Consistent use of Tailwind typography classes

### Colors
- Primary: Purple (`purple-500`, `purple-600`)
- Accent: Pink (`pink-500`)
- Neutrals: Zinc scale (`zinc-400` for text, `zinc-800` for borders, `zinc-900` for backgrounds)

### Components
- `MovieCard` - Displays movie with poster, match %, vibe summary
- `SearchInput` - Search form with validation
- `MoodSelector` - Grid of mood buttons with diverse international film examples
- `VibeLoader` - Loading state with spinner

### Visual Polish
- Box shadows on cards and inputs (`shadow-lg`, `shadow-md`)
- Consistent border radius (`rounded-xl`)
- Focus rings with offset for accessibility
- Active states with scale transform (`active:scale-95`)
- Custom fade-in animation in `globals.css`

## Accessibility

- All images have descriptive alt text
- Decorative icons marked with `aria-hidden="true"`
- Form inputs have `aria-required` and `aria-describedby`
- Error states use `role="alert"` with `aria-live="assertive"`
- Loading states use `role="status"` with `aria-live="polite"`
- Focus visible rings on all interactive elements
- WCAG AA compliant color contrast (zinc-400 minimum)
