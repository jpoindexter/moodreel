# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # Start development server on localhost:3000
npm run build        # Production build
npm run lint         # Run ESLint
npm run seed         # Seed database with 20 sample movies
npm run db:migrate   # Push Supabase schema changes
```

## Architecture

MoodReel is a vibe-based movie recommender using vector embeddings for similarity matching.

### Data Flow

1. **User searches for a movie** → `/api/analyze` fetches from TMDB, generates vibe analysis via OpenAI GPT-4o-mini, creates 1536-dim embedding via text-embedding-3-small, stores in Supabase
2. **Get recommendations** → `/api/recommend` performs pgvector cosine similarity search, generates LLM explanations for each match

### Key Patterns

- **Rate limiting**: In-memory Map-based limiter in `src/lib/rate-limit.ts` (10/min analyze, 30/min recommend)
- **Graceful degradation**: `Promise.allSettled` for batch LLM calls with fallback explanations
- **Input validation**: All API inputs validated via `src/lib/validation.ts` before processing
- **Security headers**: Middleware at `src/middleware.ts` adds CORS, CSP, HSTS

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

## Type Definitions

Core types in `src/lib/types.ts`:
- `VibeProfile` - 8 vibe dimensions (mood, visualStyle, themes, etc.)
- `Movie` - Full movie record with embedding
- `Recommendation` - Movie with similarity score and explanation
