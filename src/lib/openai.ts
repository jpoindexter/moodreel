import OpenAI from 'openai'

export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

// Generate embedding for vibe profile text
export async function generateEmbedding(text: string): Promise<number[]> {
  const response = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: text,
  })
  return response.data[0].embedding
}

// Analyze a movie's vibe using GPT
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

  return JSON.parse(response.choices[0].message.content!)
}

// Generate explanation for why a movie matches
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

  return response.choices[0].message.content!.trim()
}
