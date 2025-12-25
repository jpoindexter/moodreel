/**
 * Ollama client for local LLM inference
 * Uses mistral:latest for vibe analysis (free, no API costs)
 */

const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434'
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'mistral:latest'
const EMBEDDING_MODEL = 'nomic-embed-text:latest'

interface OllamaGenerateResponse {
  model: string
  response: string
  done: boolean
}

interface OllamaEmbeddingResponse {
  embedding: number[]
}

/**
 * Check if Ollama is available
 */
export async function isOllamaAvailable(): Promise<boolean> {
  try {
    const response = await fetch(`${OLLAMA_URL}/api/tags`, {
      method: 'GET',
      signal: AbortSignal.timeout(2000),
    })
    return response.ok
  } catch {
    return false
  }
}

/**
 * Analyze a movie's vibe using Ollama (mistral)
 * Same interface as OpenAI version for easy swapping
 */
export async function analyzeMovieVibe(title: string, year?: number) {
  const prompt = `Analyze the vibe of the movie "${title}"${year ? ` (${year})` : ''}.

Return a JSON object with this exact structure:
{
  "vibeProfile": {
    "mood": ["array of 2-4 mood descriptors like melancholic, euphoric, tense, serene, anxious, hopeful"],
    "visualStyle": ["array of 2-3 visual descriptors like neon-noir, sun-drenched, muted, gritty, ethereal"],
    "narrativeEnergy": "single word: slow-burn, frenetic, meditative, propulsive, or rhythmic",
    "themes": ["array of 3-5 core themes like isolation, redemption, obsession, identity, grief"],
    "emotionalColor": "single word: cozy, bleak, chaotic, dreamy, anxious, melancholic, euphoric",
    "pacing": "single word: languid, snappy, rhythmic, erratic, or measured",
    "atmosphere": "single word: intimate, epic, claustrophobic, expansive, or surreal",
    "era": "single word: retro, contemporary, timeless, or futuristic"
  },
  "vibeSummary": "One evocative sentence capturing the movie's essential vibe and feeling"
}

Be specific and evocative. Focus on the feeling and aesthetic, not plot summary.
IMPORTANT: Return ONLY valid JSON, no other text.`

  const response = await fetch(`${OLLAMA_URL}/api/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: OLLAMA_MODEL,
      prompt,
      stream: false,
      format: 'json',
    }),
  })

  if (!response.ok) {
    throw new Error(`Ollama request failed: ${response.status}`)
  }

  const data: OllamaGenerateResponse = await response.json()

  try {
    const parsed = JSON.parse(data.response)

    // Validate required structure
    if (!parsed.vibeProfile || !parsed.vibeSummary) {
      throw new Error('Invalid response structure from Ollama')
    }

    // Validate vibeProfile arrays
    const vp = parsed.vibeProfile
    if (!Array.isArray(vp.mood) || !Array.isArray(vp.visualStyle) || !Array.isArray(vp.themes)) {
      throw new Error('Invalid vibeProfile arrays from Ollama')
    }

    return parsed
  } catch (error) {
    if (error instanceof Error && error.message.includes('Invalid response')) {
      throw error
    }
    throw new Error(`Invalid JSON response from Ollama: ${data.response.slice(0, 100)}`)
  }
}

/**
 * Generate embedding using nomic-embed-text (768 dimensions)
 * Note: Different dimension than OpenAI's 1536
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  const response = await fetch(`${OLLAMA_URL}/api/embeddings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: EMBEDDING_MODEL,
      prompt: text,
    }),
  })

  if (!response.ok) {
    throw new Error(`Ollama embedding request failed: ${response.status}`)
  }

  const data: OllamaEmbeddingResponse = await response.json()

  if (!data.embedding || data.embedding.length === 0) {
    throw new Error('No embedding returned from Ollama')
  }

  return data.embedding
}

/**
 * Generate a vibe explanation for why two movies match
 */
export async function generateVibeExplanation(
  sourceTitle: string,
  targetTitle: string,
  sourceVibe: string,
  targetVibe: string
): Promise<string> {
  const prompt = `You're explaining why "${targetTitle}" is a vibe match for someone who loved "${sourceTitle}".

Source vibe: ${sourceVibe}
Target vibe: ${targetVibe}

Write 1-2 sentences explaining the vibe connection. Focus on feeling, not plot. Be specific about shared aesthetic qualities.
Return ONLY the explanation, no quotes or extra formatting.`

  const response = await fetch(`${OLLAMA_URL}/api/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: OLLAMA_MODEL,
      prompt,
      stream: false,
    }),
  })

  if (!response.ok) {
    throw new Error(`Ollama request failed: ${response.status}`)
  }

  const data: OllamaGenerateResponse = await response.json()
  return data.response.trim()
}
