import { config } from 'dotenv'
import postgres from 'postgres'
import OpenAI from 'openai'

// Load environment variables from .env.local
config({ path: '.env.local' })

const sql = postgres(process.env.DATABASE_URL!, {
  ssl: 'require',
})

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

// Seed movies with diverse vibes
const seedMovies = [
  { title: 'Lost in Translation', year: 2003 },
  { title: 'Blade Runner 2049', year: 2017 },
  { title: 'Moonlight', year: 2016 },
  { title: 'The Grand Budapest Hotel', year: 2014 },
  { title: 'Drive', year: 2011 },
  { title: 'Her', year: 2013 },
  { title: 'Eternal Sunshine of the Spotless Mind', year: 2004 },
  { title: 'The Virgin Suicides', year: 1999 },
  { title: 'In the Mood for Love', year: 2000 },
  { title: 'Mulholland Drive', year: 2001 },
  { title: 'Amélie', year: 2001 },
  { title: 'The Royal Tenenbaums', year: 2001 },
  { title: 'Interstellar', year: 2014 },
  { title: 'A Ghost Story', year: 2017 },
  { title: 'Under the Skin', year: 2013 },
  { title: 'Only God Forgives', year: 2013 },
  { title: 'The Neon Demon', year: 2016 },
  { title: 'Spring Breakers', year: 2012 },
  { title: 'Enemy', year: 2013 },
  { title: 'Ex Machina', year: 2014 },
]

async function analyzeAndEmbed(title: string, year: number) {
  // Analyze vibe
  const vibeResponse = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{
      role: 'user',
      content: `Analyze the vibe of "${title}" (${year}). Return JSON:
{
  "vibeProfile": {
    "mood": ["2-4 moods"],
    "visualStyle": ["2-3 visual descriptors"],
    "narrativeEnergy": "single word",
    "themes": ["3-5 themes"],
    "emotionalColor": "single word",
    "pacing": "single word",
    "atmosphere": "single word",
    "era": "single word"
  },
  "vibeSummary": "One evocative sentence"
}`
    }],
    response_format: { type: 'json_object' },
    temperature: 0.7,
  })

  const analysis = JSON.parse(vibeResponse.choices[0].message.content!)

  // Generate embedding
  const vibeText = `
    Mood: ${analysis.vibeProfile.mood.join(', ')}
    Visual style: ${analysis.vibeProfile.visualStyle.join(', ')}
    Themes: ${analysis.vibeProfile.themes.join(', ')}
    ${analysis.vibeSummary}
  `.trim()

  const embeddingResponse = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: vibeText,
  })

  return {
    ...analysis,
    embedding: embeddingResponse.data[0].embedding,
  }
}

async function seed() {
  console.log('Seeding database with movies...')

  for (const movie of seedMovies) {
    console.log(`Processing: ${movie.title}`)

    try {
      const { vibeProfile, vibeSummary, embedding } = await analyzeAndEmbed(
        movie.title,
        movie.year
      )

      await sql`
        INSERT INTO movies (title, year, poster_url, overview, vibe_profile, vibe_summary, embedding)
        VALUES (
          ${movie.title},
          ${movie.year},
          ${null},
          ${''},
          ${JSON.stringify(vibeProfile)},
          ${vibeSummary},
          ${JSON.stringify(embedding)}::vector
        )
        ON CONFLICT (tmdb_id) DO UPDATE SET
          vibe_profile = EXCLUDED.vibe_profile,
          vibe_summary = EXCLUDED.vibe_summary,
          embedding = EXCLUDED.embedding
      `

      console.log(`Seeded: ${movie.title}`)

      // Rate limiting
      await new Promise(r => setTimeout(r, 500))
    } catch (err) {
      console.error(`Failed to process ${movie.title}:`, err)
    }
  }

  console.log('Seeding complete!')
}

seed()
