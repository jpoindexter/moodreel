// Core vibe dimensions for similarity matching
export interface VibeProfile {
  mood: string[]           // melancholic, euphoric, tense, serene
  visualStyle: string[]    // neon-noir, sun-drenched, muted, vibrant
  narrativeEnergy: string  // slow-burn, frenetic, meditative, propulsive
  themes: string[]         // isolation, redemption, obsession, identity
  emotionalColor: string   // cozy, bleak, chaotic, dreamy, anxious
  pacing: string           // languid, snappy, rhythmic, erratic
  atmosphere: string       // intimate, epic, claustrophobic, expansive
  era: string              // retro, contemporary, timeless, futuristic
}

export interface Movie {
  id: string
  title: string
  year: number
  posterUrl: string | null
  overview: string
  vibeProfile: VibeProfile
  vibeSummary: string      // One-sentence vibe description
  embedding: number[]      // 1536-dim vector for similarity
  tmdbId?: number
  imdbId?: string
}

export interface Recommendation {
  movie: Movie
  similarityScore: number
  vibeExplanation: string  // LLM-generated "why this matches"
}

export interface FavoriteMovie {
  id: string
  movieId: string
  userId: string
  createdAt: string
}

// API request/response types
export interface AnalyzeRequest {
  title: string
  year?: number
}

export interface RecommendRequest {
  movieId: string
  limit?: number
}

// Graph types for force-directed visualization
export interface TitleNode {
  id: string
  type: 'title'
  data: {
    title: string
    year: number
    mediaType: 'movie' | 'tv_miniseries' | 'limited_series'
    status: 'complete' | 'canceled' | 'ongoing'
    episodeCount?: number
    posterUrl: string | null
    vibeSummary: string
  }
}

export interface MoodNode {
  id: string
  type: 'mood'
  data: {
    name: string
    category: 'tone' | 'atmosphere' | 'emotion' | 'pacing' | 'theme' | 'style'
    color: string
  }
}

export type GraphNode = TitleNode | MoodNode

export interface TitleMoodEdge {
  source: string
  target: string
  type: 'title_mood'
  weight: number
  isPrimary: boolean
}

export interface TitleSimilarityEdge {
  source: string
  target: string
  type: 'title_similarity'
  weight: number
  sharedMoods: string[]
}

export type GraphEdge = TitleMoodEdge | TitleSimilarityEdge

export interface MoodGraph {
  nodes: GraphNode[]
  links: GraphEdge[]
}

export interface GraphFilters {
  yearRange?: [number, number]
  mediaTypes?: ('movie' | 'tv_miniseries' | 'limited_series')[]
  status?: ('complete' | 'canceled' | 'ongoing')[]
  includeMoods?: string[]
  excludeMoods?: string[]
  minSharedMoods?: number
}
