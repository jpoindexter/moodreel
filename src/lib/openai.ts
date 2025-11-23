import OpenAI from 'openai'
import { validateEnv } from './env'

// Validate environment on module load
if (typeof window === 'undefined') {
  validateEnv()
}

export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

/**
 * Generate a vector embedding for vibe profile text using OpenAI's embedding model.
 * @param text - The vibe profile text to embed
 * @returns Array of 1536 floating point numbers representing the embedding
 * @throws Error if OpenAI API fails or returns no embedding
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  const response = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: text,
  })

  if (!response.data || response.data.length === 0) {
    throw new Error('No embedding returned from OpenAI')
  }

  return response.data[0].embedding
}

/**
 * Analyze a movie's vibe using GPT to generate a structured vibe profile.
 * @param title - The movie title to analyze
 * @param year - Optional release year for disambiguation
 * @returns Object containing vibeProfile and vibeSummary
 * @throws Error if OpenAI API fails or returns invalid JSON
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

Be specific and evocative. Focus on the feeling and aesthetic, not plot summary.`

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: prompt }],
    response_format: { type: 'json_object' },
    temperature: 0.7,
  })

  const content = response.choices[0]?.message?.content
  if (!content) {
    throw new Error('No response content from OpenAI')
  }

  try {
    const parsed = JSON.parse(content)

    // Validate required structure
    if (!parsed.vibeProfile || !parsed.vibeSummary) {
      throw new Error('Invalid response structure from OpenAI')
    }

    // Validate vibeProfile arrays
    const vp = parsed.vibeProfile
    if (!Array.isArray(vp.mood) || !Array.isArray(vp.visualStyle) || !Array.isArray(vp.themes)) {
      throw new Error('Invalid vibeProfile arrays from OpenAI')
    }

    return parsed
  } catch (error) {
    if (error instanceof Error && error.message.includes('Invalid response')) {
      throw error
    }
    throw new Error('Invalid JSON response from OpenAI')
  }
}

/**
 * Generate a natural language explanation for why two movies have similar vibes.
 * @param sourceTitle - The original movie the user searched for
 * @param targetTitle - The recommended movie
 * @param sourceVibe - Vibe summary of the source movie
 * @param targetVibe - Vibe summary of the target movie
 * @returns 1-2 sentence explanation of the vibe connection
 * @throws Error if OpenAI API fails
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

Write 1-2 sentences explaining the vibe connection. Focus on feeling, not plot. Be specific about shared aesthetic qualities.`

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.8,
    max_tokens: 100,
  })

  const content = response.choices[0]?.message?.content
  if (!content) {
    throw new Error('No response content from OpenAI')
  }

  return content.trim()
}
