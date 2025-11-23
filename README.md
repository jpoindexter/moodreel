# MoodReel - Vibe-Based Movie Recommendations

Find movies that match your vibe, not just your genre. MoodReel analyzes the aesthetic, mood, and emotional texture of films to recommend titles with similar vibes.

## Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Next.js App   │────▶│   API Routes    │────▶│    Supabase     │
│   (React UI)    │     │  /api/analyze   │     │  (PostgreSQL +  │
│                 │     │  /api/recommend │     │   pgvector)     │
└─────────────────┘     └────────┬────────┘     └─────────────────┘
                                 │
                        ┌────────┴────────┐
                        │                 │
                   ┌────┴────┐      ┌─────┴─────┐
                   │  TMDB   │      │  OpenAI   │
                   │  (data) │      │ (vibes +  │
                   │         │      │ embeddings)│
                   └─────────┘      └───────────┘
```

## Tech Stack

- **Frontend**: Next.js 14 (App Router), React, Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: Supabase (PostgreSQL + pgvector)
- **AI**: OpenAI GPT-4o-mini (vibe analysis) + text-embedding-3-small
- **Data**: TMDB API (movie metadata and posters)

## Vibe Similarity System

Movies are represented as vectors based on:
- **Mood & tone** (melancholic, euphoric, tense, serene)
- **Visual aesthetics** (neon-noir, sun-drenched, muted, ethereal)
- **Narrative energy** (slow-burn, frenetic, meditative)
- **Themes** (isolation, redemption, obsession, identity)
- **Emotional color** (cozy, bleak, chaotic, dreamy)
- **Pacing** (languid, snappy, rhythmic)
- **Atmosphere** (intimate, epic, claustrophobic)
- **Era feel** (retro, contemporary, timeless)

Similarity is computed using cosine distance on 1536-dimensional embeddings.

## Setup Instructions

### 1. Clone and Install

```bash
git clone <repo-url>
cd moodreel
npm install
```

### 2. Set Up Supabase

1. Create a new Supabase project at [supabase.com](https://supabase.com)
2. Enable the pgvector extension: Database → Extensions → Enable "vector"
3. Run the schema: Copy `supabase/schema.sql` into the SQL Editor and execute

### 3. Configure Environment

```bash
cp .env.example .env
```

Fill in your keys:
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anon/public key
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key
- `OPENAI_API_KEY` - OpenAI API key
- `TMDB_API_KEY` - TMDB API key (get at themoviedb.org)

### 4. Seed Initial Data (Optional)

```bash
npm run seed
```

This adds 20 diverse movies to bootstrap the recommendation engine.

### 5. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## API Endpoints

### POST /api/analyze
Analyzes a movie's vibe and stores it.

```json
{
  "title": "Lost in Translation",
  "year": 2003
}
```

### POST /api/recommend
Gets vibe-matched recommendations.

```json
{
  "movieId": "uuid",
  "limit": 8
}
```

## 7-Day Build Plan

### Day 1: Foundation
- [x] Set up Next.js project with Tailwind
- [x] Create Supabase project and schema
- [x] Configure environment variables

### Day 2: Core Pipeline
- [ ] Implement vibe analysis with OpenAI
- [ ] Set up embedding generation
- [ ] Create vector search function

### Day 3: API Routes
- [ ] Build /api/analyze endpoint
- [ ] Build /api/recommend endpoint
- [ ] Add TMDB integration

### Day 4: Basic UI
- [ ] Create search input component
- [ ] Build movie card component
- [ ] Implement main page layout

### Day 5: Recommendation Flow
- [ ] Connect UI to API
- [ ] Display vibe analysis results
- [ ] Show recommendation grid

### Day 6: Polish
- [ ] Add loading states
- [ ] Implement favorites
- [ ] Error handling
- [ ] Mobile responsiveness

### Day 7: Deploy
- [ ] Deploy to Vercel
- [ ] Configure production env
- [ ] Seed production database
- [ ] Test end-to-end flow

## File Structure

```
moodreel/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── analyze/route.ts
│   │   │   └── recommend/route.ts
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── components/
│   │   ├── MovieCard.tsx
│   │   ├── SearchInput.tsx
│   │   └── VibeLoader.tsx
│   └── lib/
│       ├── openai.ts
│       ├── supabase.ts
│       ├── tmdb.ts
│       ├── types.ts
│       └── utils.ts
├── supabase/
│   └── schema.sql
├── scripts/
│   └── seed-movies.ts
└── package.json
```

## Future Enhancements

- **Letterboxd/IMDb URL parsing** - Paste a link instead of typing
- **Poster-based analysis** - Use multimodal models to analyze visual style
- **User accounts** - Persistent favorites and history
- **Vibe playlists** - Curated collections by vibe type
- **Social features** - Share and discuss vibe matches

## License

MIT
