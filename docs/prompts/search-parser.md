# Natural Language Search Parser

Used by `src/lib/search-parser.ts` to convert queries into TMDB filters.

## Supported Patterns

### Decades

| Pattern | Year Range |
|---------|------------|
| 90s, 1990s | 1990-1999 |
| 80s, 1980s | 1980-1989 |
| 70s, 1970s | 1970-1979 |
| 00s, 2000s | 2000-2009 |
| 10s, 2010s | 2010-2019 |
| 20s, 2020s | 2020-2029 |

### Genres

| Keyword | TMDB Genre ID |
|---------|---------------|
| action | 28 |
| adventure | 12 |
| animation | 16 |
| comedy | 35 |
| crime | 80 |
| documentary | 99 |
| drama | 18 |
| family | 10751 |
| fantasy | 14 |
| history | 36 |
| horror | 27 |
| music | 10402 |
| mystery | 9648 |
| romance | 10749 |
| sci-fi, scifi, science fiction | 878 |
| thriller | 53 |
| war | 10752 |
| western | 37 |

### Moods (map to genres)

| Mood | Genres |
|------|--------|
| feel-good | Comedy, Family, Romance |
| cozy | Comedy, Family |
| dark | Horror, Crime, Thriller |
| scary, terrifying | Horror |
| intense, thrilling | Action, Thriller |
| emotional | Drama, Romance |
| epic | Adventure, Fantasy, History |
| funny | Comedy |
| romantic | Romance |
| mysterious, suspenseful | Mystery, Thriller |
| mind-bending, trippy | Sci-Fi, Fantasy |
| sad | Drama |
| uplifting | Comedy, Family, Drama |

### Sort Keywords

| Keyword | Sort Value |
|---------|------------|
| popular, trending | popularity.desc |
| best, highest rated, top rated | vote_average.desc |
| new, recent, latest | release_date.desc |

## Example Queries

```
"90s horror"
→ { yearStart: 1990, yearEnd: 1999, genres: [27] }

"feel-good 80s comedy"
→ { yearStart: 1980, yearEnd: 1989, genres: [35, 10751, 10749] }

"dark thriller best rated"
→ { genres: [27, 80, 53], sortBy: 'vote_average.desc' }

"new sci-fi"
→ { genres: [878], sortBy: 'release_date.desc' }
```

## Detection Logic

A query is classified as natural language if it contains:
- Any decade pattern (90s, 1980s, etc.)
- Any genre keyword
- Any mood keyword
- Any sort keyword

Otherwise, it's treated as a direct movie title search.
