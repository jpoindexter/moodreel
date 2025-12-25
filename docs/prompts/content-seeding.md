# Content Seeding Guide

How to populate the MoodReel database with movies.

## Current Approach: Zero Database Dependency

MoodReel now works entirely without pre-seeded content:

1. **Search**: Uses TMDB's search/discover API directly
2. **Recommendations**: Uses TMDB's similar/recommended endpoints
3. **Vibes**: Genre-based extraction (free, instant)

This means the app works immediately without any database population.

## Optional: Deep Vibe Analysis

For richer vibe profiles, you can optionally run Ollama analysis:

### Prerequisites

1. Install Ollama: https://ollama.ai
2. Pull the model: `ollama pull mistral:latest`
3. Ensure Ollama is running on localhost:11434

### Vibe Analysis Flow

```typescript
import { analyzeMovieVibe } from '@/lib/ollama'

const vibe = await analyzeMovieVibe('Blade Runner', 1982)
// Returns full VibeProfile with 8 dimensions
```

## Optional: Embedding-Based Similarity

For semantic similarity search (beyond TMDB recommendations):

### Using Ollama Embeddings

```typescript
import { generateEmbedding } from '@/lib/ollama'

const embedding = await generateEmbedding('neon-noir cyberpunk melancholic')
// Returns 768-dim vector (nomic-embed-text)
```

### Database Schema for Embeddings

```sql
-- Add to movies table
embedding vector(768)  -- For Ollama nomic-embed-text
-- or
embedding vector(1536) -- For OpenAI text-embedding-3-small
```

## Batch Seeding Script (Optional)

```typescript
// scripts/seed-movies.ts
const SEED_MOVIES = [
  { title: 'Blade Runner', year: 1982 },
  { title: 'Hereditary', year: 2018 },
  // ... more movies
]

for (const movie of SEED_MOVIES) {
  const tmdb = await searchMovie(movie.title, movie.year)
  const vibe = await analyzeMovieVibe(movie.title, movie.year)
  // Store in database with embedding
}
```

## Cost Comparison

| Method | Cost | Speed | Quality |
|--------|------|-------|---------|
| TMDB Genre Mapping | Free | Instant | Good |
| Ollama (Mistral) | Free | ~2s/movie | Great |
| OpenAI GPT-4o-mini | ~$0.01/movie | ~1s/movie | Excellent |

## Recommendation

Start with genre-based vibes (free, instant). Only add LLM analysis for:
- Featured/curated movies
- User-requested deep analysis
- Building a seed collection for similarity search
