# Vibe Extraction Prompt

Used by `src/lib/ollama.ts` for analyzing movie vibes with Mistral.

## Prompt Template

```
Analyze the vibe of the movie "{title}" ({year}).

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
IMPORTANT: Return ONLY valid JSON, no other text.
```

## VibeProfile Dimensions

| Dimension | Type | Options |
|-----------|------|---------|
| mood | array | melancholic, euphoric, tense, serene, anxious, hopeful, etc. |
| visualStyle | array | neon-noir, sun-drenched, muted, gritty, ethereal, etc. |
| narrativeEnergy | string | slow-burn, frenetic, meditative, propulsive, rhythmic |
| themes | array | isolation, redemption, obsession, identity, grief, etc. |
| emotionalColor | string | cozy, bleak, chaotic, dreamy, anxious, melancholic, euphoric |
| pacing | string | languid, snappy, rhythmic, erratic, measured |
| atmosphere | string | intimate, epic, claustrophobic, expansive, surreal |
| era | string | retro, contemporary, timeless, futuristic |

## Model Configuration

```typescript
{
  model: 'mistral:latest',
  stream: false,
  format: 'json'
}
```

## Fallback: Genre-Based Vibe

When Ollama is unavailable, genre IDs map to moods:

```typescript
const GENRE_TO_MOOD = {
  28: ['intense', 'thrilling'],      // Action
  27: ['terrifying', 'disturbing'],  // Horror
  35: ['lighthearted', 'funny'],     // Comedy
  18: ['emotional', 'moving'],       // Drama
  878: ['futuristic', 'cerebral'],   // Sci-Fi
  10749: ['romantic', 'tender'],     // Romance
  // ... etc
}
```
