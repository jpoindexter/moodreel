# MoodReel User Flows

## FLOW 1: NATURAL LANGUAGE SEARCH

```
Entry: User types "90s horror miniseries"
  ↓
Parse query into filters (src/lib/search-parser.ts)
  - Decade: 1990-1999
  - Genre: Horror (27)
  - Keywords: ["miniseries"]
  ↓
Fetch from TMDB /discover/movie
  ↓
Show 4-6 preview chips with:
  - Poster image
  - Title
  - Year
  - Primary mood tag
  ↓
User clicks chip
  ↓
Chip becomes root node in mind map

Success: User exploring similar movies from their vibe search
```

## FLOW 2: DIRECT MOVIE SEARCH

```
Entry: User types "Blade Runner"
  ↓
Search parsed as title (not natural language)
  ↓
TMDB exact match search
  ↓
Single result returned
  ↓
Movie becomes root card in mind map
  ↓
User can click to expand children
  ↓
Each expansion adds 2 similar movies

Success: User exploring vibe-similar movies from a known title
```

## FLOW 3: NODE EXPLORATION

```
Entry: User clicks any node (root or child)
  ↓
Fetch /api/recommend with movie ID
  - Handles both UUID and tmdb-{id} formats
  ↓
TMDB returns similar + recommended movies
  ↓
Add 2 new child nodes with:
  - Connecting lines animate in
  - Nodes float with subtle animation
  - Poster thumbnail
  - Title label
  ↓
New nodes are expandable
  ↓
User can continue expanding infinitely

Success: Infinite depth exploration of movie vibes
```

## FLOW 4: CANVAS INTERACTION

```
Entry: User on mind map canvas
  ↓
Available interactions:
  - Drag any node to reposition
  - Mouse wheel to zoom in/out
  - Click + drag background to pan
  - Bottom-right controls: +/- zoom, reset
  ↓
All nodes are draggable
  - Stop floating animation while dragging
  - Update position on release
  - Lines follow parent nodes
  ↓
Zoom indicator shows current percentage

Success: User can arrange and navigate the map freely
```

## FLOW 5: PREVIEW TO MAP TRANSITION

```
Entry: User on preview chips grid
  ↓
User hovers chip
  - Poster scales up slightly
  - Expand icon appears
  ↓
User clicks chip
  - Chip highlights with ring
  - Loading state appears
  ↓
Transition to mind map
  - Selected movie becomes root
  - Map fades in
  - "Back to results" button available
  ↓
User can return to preview grid

Success: Seamless transition between search results and exploration
```

## STATE MACHINE

```
┌─────────┐    search    ┌─────────┐
│ SEARCH  │ ───────────> │ LOADING │
└─────────┘              └─────────┘
     ↑                        │
     │                        ├──── natural query ────> ┌─────────┐
     │                        │                         │ PREVIEW │
     │                        │                         └─────────┘
     │                        │                              │
     │                        ↓                              ↓
     │   reset          ┌─────────┐    click chip     ┌─────────┐
     └─────────────────>│ LOADING │ <──────────────── │ RESULT  │
                        └─────────┘                   └─────────┘
```

## VIBE EXTRACTION

Two modes of vibe extraction:

### 1. Genre-Based (Free, Fast)
Used for recommendations and discover results:
- Maps TMDB genre IDs to mood descriptors
- Example: Horror (27) → ["terrifying", "disturbing"]
- No API costs, instant results

### 2. LLM-Based (Ollama - Free, Local)
Used for deep vibe analysis (optional):
- Uses mistral:latest model
- Generates full VibeProfile with 8 dimensions
- Runs locally, no API costs
- Falls back to genre-based if unavailable
