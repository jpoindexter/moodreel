# MoodReel API Documentation

## Base URL

```
http://localhost:3000/api
```

## Endpoints

### POST /api/analyze

Analyze a movie's vibe and store it in the database.

#### Request

```json
{
  "title": "Blade Runner 2049",
  "year": 2017  // optional
}
```

#### Response (200 OK)

```json
{
  "movie": {
    "id": "uuid",
    "title": "Blade Runner 2049",
    "year": 2017,
    "posterUrl": "https://image.tmdb.org/t/p/w500/...",
    "overview": "...",
    "vibeProfile": {
      "mood": ["melancholic", "contemplative", "lonely"],
      "visualStyle": ["neon-noir", "dystopian", "minimalist"],
      "narrativeEnergy": "slow-burn",
      "themes": ["identity", "humanity", "isolation", "memory"],
      "emotionalColor": "melancholic",
      "pacing": "languid",
      "atmosphere": "expansive",
      "era": "futuristic"
    },
    "vibeSummary": "A hauntingly beautiful meditation on what it means to be human...",
    "tmdbId": 335984,
    "imdbId": "tt1856101"
  }
}
```

#### Error Responses

- `400 Bad Request` - Invalid title or JSON
- `404 Not Found` - Movie not found on TMDB
- `429 Too Many Requests` - Rate limit exceeded (10/minute)
- `500 Internal Server Error` - Analysis failed

---

### POST /api/recommend

Get movie recommendations based on vibe similarity.

#### Request

```json
{
  "movieId": "uuid-of-analyzed-movie",
  "limit": 8  // optional, default 8, max 50
}
```

#### Response (200 OK)

```json
{
  "recommendations": [
    {
      "movie": {
        "id": "uuid",
        "title": "Her",
        "year": 2013,
        "posterUrl": "https://image.tmdb.org/t/p/w500/...",
        "overview": "...",
        "vibeProfile": { ... },
        "vibeSummary": "..."
      },
      "similarityScore": 0.89,
      "vibeExplanation": "Like Blade Runner 2049, Her explores loneliness and connection through a melancholic, futuristic lens with stunning visual poetry."
    }
  ]
}
```

#### Error Responses

- `400 Bad Request` - Invalid UUID or limit
- `404 Not Found` - Source movie not found
- `429 Too Many Requests` - Rate limit exceeded (30/minute)
- `500 Internal Server Error` - Recommendation failed

---

### GET /api/health

Check service health status.

#### Response (200 OK)

```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "database": "connected",
  "services": {
    "openai": true,
    "tmdb": true
  }
}
```

#### Response (503 Service Unavailable)

```json
{
  "status": "degraded",
  "timestamp": "...",
  "database": "error",
  "error": "Database connection failed"
}
```

---

## Rate Limiting

All endpoints are rate limited per IP address:

| Endpoint | Limit | Window |
|----------|-------|--------|
| /api/analyze | 10 requests | 1 minute |
| /api/recommend | 30 requests | 1 minute |

Rate limit headers on success responses:
- `X-RateLimit-Remaining`: Requests remaining in window

When rate limited, response includes:
- `Retry-After`: Seconds until rate limit resets

---

## Response Headers

All API responses include:

- `Cache-Control`: Caching directives
  - `/api/analyze`: `public, max-age=86400` (24 hours)
  - `/api/recommend`: `public, max-age=3600` (1 hour)

---

## Error Format

All errors follow this format:

```json
{
  "error": "Human-readable error message"
}
```

---

## Authentication

Currently, the API is public with rate limiting. No authentication required.
