import type {
  Movie,
  VibeProfile,
  GraphNode,
  GraphEdge,
  TitleNode,
  MoodNode,
  TitleMoodEdge,
  TitleSimilarityEdge,
  MoodGraph,
  GraphFilters,
} from './types'

// Color palette for mood categories
const MOOD_COLORS: Record<string, string> = {
  // Tones
  melancholic: '#6366f1',
  euphoric: '#f59e0b',
  tense: '#ef4444',
  serene: '#10b981',
  anxious: '#f97316',
  dreamy: '#8b5cf6',
  cozy: '#f59e0b',
  bleak: '#6b7280',
  chaotic: '#ec4899',

  // Atmospheres
  intimate: '#ec4899',
  epic: '#3b82f6',
  claustrophobic: '#78716c',
  expansive: '#06b6d4',

  // Pacing
  'slow-burn': '#a855f7',
  frenetic: '#f43f5e',
  meditative: '#14b8a6',
  propulsive: '#f97316',
  languid: '#8b5cf6',
  snappy: '#22c55e',
  rhythmic: '#3b82f6',
  erratic: '#ef4444',

  // Default
  default: '#64748b',
}

function getMoodColor(mood: string): string {
  return MOOD_COLORS[mood.toLowerCase()] || MOOD_COLORS.default
}

function getMoodCategory(mood: string, source: keyof VibeProfile): MoodNode['data']['category'] {
  switch (source) {
    case 'mood':
    case 'emotionalColor':
      return 'tone'
    case 'atmosphere':
      return 'atmosphere'
    case 'pacing':
    case 'narrativeEnergy':
      return 'pacing'
    case 'themes':
      return 'theme'
    case 'visualStyle':
      return 'style'
    default:
      return 'tone'
  }
}

/**
 * Convert a movie's vibe profile into graph edges connecting to mood nodes
 */
export function vibeProfileToEdges(movieId: string, vibe: VibeProfile): TitleMoodEdge[] {
  const edges: TitleMoodEdge[] = []

  // Primary moods (weight 1.0)
  for (const mood of vibe.mood) {
    edges.push({
      source: movieId,
      target: `mood:${mood.toLowerCase()}`,
      type: 'title_mood',
      weight: 1.0,
      isPrimary: true,
    })
  }

  // Atmosphere (weight 0.9)
  if (vibe.atmosphere) {
    edges.push({
      source: movieId,
      target: `mood:${vibe.atmosphere.toLowerCase()}`,
      type: 'title_mood',
      weight: 0.9,
      isPrimary: true,
    })
  }

  // Emotional color (weight 0.85)
  if (vibe.emotionalColor) {
    edges.push({
      source: movieId,
      target: `mood:${vibe.emotionalColor.toLowerCase()}`,
      type: 'title_mood',
      weight: 0.85,
      isPrimary: true,
    })
  }

  // Pacing (weight 0.7)
  if (vibe.pacing) {
    edges.push({
      source: movieId,
      target: `mood:${vibe.pacing.toLowerCase()}`,
      type: 'title_mood',
      weight: 0.7,
      isPrimary: false,
    })
  }

  // Narrative energy (weight 0.7)
  if (vibe.narrativeEnergy) {
    edges.push({
      source: movieId,
      target: `mood:${vibe.narrativeEnergy.toLowerCase()}`,
      type: 'title_mood',
      weight: 0.7,
      isPrimary: false,
    })
  }

  // Themes (weight 0.6)
  for (const theme of vibe.themes) {
    edges.push({
      source: movieId,
      target: `mood:${theme.toLowerCase()}`,
      type: 'title_mood',
      weight: 0.6,
      isPrimary: false,
    })
  }

  // Visual style (weight 0.5)
  for (const style of vibe.visualStyle) {
    edges.push({
      source: movieId,
      target: `mood:${style.toLowerCase()}`,
      type: 'title_mood',
      weight: 0.5,
      isPrimary: false,
    })
  }

  return edges
}

/**
 * Compute similarity weight between two titles based on shared moods
 */
export function computeTitleSimilarity(
  titleAId: string,
  titleBId: string,
  titleMoodEdges: TitleMoodEdge[]
): TitleSimilarityEdge | null {
  const moodsA = new Map<string, number>()
  const moodsB = new Map<string, number>()

  for (const edge of titleMoodEdges) {
    if (edge.source === titleAId) moodsA.set(edge.target, edge.weight)
    if (edge.source === titleBId) moodsB.set(edge.target, edge.weight)
  }

  // Compute weighted intersection
  let similarity = 0
  const sharedMoods: string[] = []

  for (const [mood, weightA] of moodsA) {
    const weightB = moodsB.get(mood)
    if (weightB) {
      // Geometric mean of weights for shared mood
      similarity += Math.sqrt(weightA * weightB)
      sharedMoods.push(mood.replace('mood:', ''))
    }
  }

  // Only create edge if there's meaningful similarity
  if (similarity < 0.5 || sharedMoods.length < 2) {
    return null
  }

  return {
    source: titleAId,
    target: titleBId,
    type: 'title_similarity',
    weight: similarity,
    sharedMoods,
  }
}

/**
 * Build a complete mood graph from a list of movies
 */
export function buildMoodGraph(movies: Movie[]): MoodGraph {
  const nodes: GraphNode[] = []
  const links: GraphEdge[] = []
  const moodNodes = new Map<string, MoodNode>()

  // Process each movie
  for (const movie of movies) {
    // Create title node
    const titleNode: TitleNode = {
      id: movie.id,
      type: 'title',
      data: {
        title: movie.title,
        year: movie.year,
        mediaType: 'movie', // Default, could be extended
        status: 'complete',
        posterUrl: movie.posterUrl,
        vibeSummary: movie.vibeSummary,
      },
    }
    nodes.push(titleNode)

    // Create edges to moods
    const moodEdges = vibeProfileToEdges(movie.id, movie.vibeProfile)
    links.push(...moodEdges)

    // Track unique mood nodes
    for (const edge of moodEdges) {
      const moodId = edge.target
      if (!moodNodes.has(moodId)) {
        const moodName = moodId.replace('mood:', '')
        // Determine category based on where it came from
        let category: MoodNode['data']['category'] = 'tone'
        if (movie.vibeProfile.mood.some(m => m.toLowerCase() === moodName)) {
          category = 'tone'
        } else if (movie.vibeProfile.atmosphere?.toLowerCase() === moodName) {
          category = 'atmosphere'
        } else if (movie.vibeProfile.pacing?.toLowerCase() === moodName) {
          category = 'pacing'
        } else if (movie.vibeProfile.themes.some(t => t.toLowerCase() === moodName)) {
          category = 'theme'
        } else if (movie.vibeProfile.visualStyle.some(s => s.toLowerCase() === moodName)) {
          category = 'style'
        }

        moodNodes.set(moodId, {
          id: moodId,
          type: 'mood',
          data: {
            name: moodName,
            category,
            color: getMoodColor(moodName),
          },
        })
      }
    }
  }

  // Add mood nodes to graph
  nodes.push(...moodNodes.values())

  // Compute title-to-title similarity edges
  const titleMoodEdges = links.filter((e): e is TitleMoodEdge => e.type === 'title_mood')
  const titleIds = movies.map(m => m.id)

  for (let i = 0; i < titleIds.length; i++) {
    for (let j = i + 1; j < titleIds.length; j++) {
      const simEdge = computeTitleSimilarity(titleIds[i], titleIds[j], titleMoodEdges)
      if (simEdge) {
        links.push(simEdge)
      }
    }
  }

  return { nodes, links }
}

/**
 * Filter graph based on criteria
 */
export function filterGraph(graph: MoodGraph, filters: GraphFilters): MoodGraph {
  // 1. Filter title nodes
  const filteredNodes = graph.nodes.filter(node => {
    if (node.type !== 'title') return true // Keep all mood nodes initially

    const { data } = node

    // Year range filter
    if (filters.yearRange) {
      if (data.year < filters.yearRange[0] || data.year > filters.yearRange[1]) {
        return false
      }
    }

    // Media type filter
    if (filters.mediaTypes && filters.mediaTypes.length > 0) {
      if (!filters.mediaTypes.includes(data.mediaType)) {
        return false
      }
    }

    // Status filter
    if (filters.status && filters.status.length > 0) {
      if (!filters.status.includes(data.status)) {
        return false
      }
    }

    return true
  })

  const titleIds = new Set(
    filteredNodes.filter(n => n.type === 'title').map(n => n.id)
  )

  // 2. Filter edges to only include surviving titles
  let filteredLinks = graph.links.filter(edge => {
    // For title-mood edges, source is title
    if (edge.type === 'title_mood') {
      return titleIds.has(edge.source)
    }
    // For title-similarity edges, both must survive
    if (edge.type === 'title_similarity') {
      return titleIds.has(edge.source) && titleIds.has(edge.target)
    }
    return true
  })

  // 3. Apply mood filters
  if (filters.includeMoods && filters.includeMoods.length > 0) {
    const includeMoodIds = new Set(filters.includeMoods.map(m => `mood:${m.toLowerCase()}`))

    // Find titles that have at least one of the included moods
    const titlesWithMoods = new Set<string>()
    for (const edge of filteredLinks) {
      if (edge.type === 'title_mood' && includeMoodIds.has(edge.target)) {
        titlesWithMoods.add(edge.source)
      }
    }

    // Filter to only those titles
    const finalTitleIds = titlesWithMoods
    filteredLinks = filteredLinks.filter(edge => {
      if (edge.type === 'title_mood') {
        return finalTitleIds.has(edge.source)
      }
      if (edge.type === 'title_similarity') {
        return finalTitleIds.has(edge.source) && finalTitleIds.has(edge.target)
      }
      return true
    })
  }

  if (filters.excludeMoods && filters.excludeMoods.length > 0) {
    const excludeMoodIds = new Set(filters.excludeMoods.map(m => `mood:${m.toLowerCase()}`))

    // Find titles that have any of the excluded moods
    const titlesToExclude = new Set<string>()
    for (const edge of filteredLinks) {
      if (edge.type === 'title_mood' && excludeMoodIds.has(edge.target)) {
        titlesToExclude.add(edge.source)
      }
    }

    // Remove those titles
    filteredLinks = filteredLinks.filter(edge => {
      if (edge.type === 'title_mood') {
        return !titlesToExclude.has(edge.source)
      }
      if (edge.type === 'title_similarity') {
        return !titlesToExclude.has(edge.source) && !titlesToExclude.has(edge.target)
      }
      return true
    })
  }

  // 4. Remove orphaned mood nodes (no connected titles)
  const connectedMoodIds = new Set<string>()
  for (const edge of filteredLinks) {
    if (edge.type === 'title_mood') {
      connectedMoodIds.add(edge.target)
    }
  }

  const finalNodes = filteredNodes.filter(node => {
    if (node.type === 'mood') {
      return connectedMoodIds.has(node.id)
    }
    // For titles, check they still have edges
    if (node.type === 'title') {
      return filteredLinks.some(
        e => e.source === node.id || e.target === node.id
      )
    }
    return true
  })

  return { nodes: finalNodes, links: filteredLinks }
}

/**
 * Get all unique moods from the graph
 */
export function extractMoods(graph: MoodGraph): MoodNode[] {
  return graph.nodes.filter((n): n is MoodNode => n.type === 'mood')
}

/**
 * Get statistics about the graph
 */
export function getGraphStats(graph: MoodGraph) {
  const titleNodes = graph.nodes.filter(n => n.type === 'title')
  const moodNodes = graph.nodes.filter(n => n.type === 'mood')
  const titleMoodEdges = graph.links.filter(e => e.type === 'title_mood')
  const similarityEdges = graph.links.filter(e => e.type === 'title_similarity')

  return {
    totalTitles: titleNodes.length,
    totalMoods: moodNodes.length,
    totalTitleMoodConnections: titleMoodEdges.length,
    totalSimilarityConnections: similarityEdges.length,
    avgMoodsPerTitle: titleMoodEdges.length / (titleNodes.length || 1),
  }
}
