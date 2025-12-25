'use client'

import { useState, useCallback, useEffect, useMemo } from 'react'
import type { Movie, VibeProfile } from '@/lib/types'

interface GraphNode {
  id: string
  type: 'movie' | 'mood'
  label: string
  data: any
  x: number
  y: number
  expanded: boolean
  depth: number
}

interface GraphLink {
  source: string
  target: string
  type: 'movie-mood' | 'movie-movie'
}

interface ExplorableGraphProps {
  rootMovie: Movie
  width: number
  height: number
}

// Mood colors by category
const MOOD_COLORS: Record<string, string> = {
  melancholic: '#6366f1',
  euphoric: '#f59e0b',
  tense: '#ef4444',
  serene: '#10b981',
  anxious: '#f97316',
  dreamy: '#8b5cf6',
  cozy: '#f59e0b',
  bleak: '#6b7280',
  intimate: '#ec4899',
  epic: '#3b82f6',
  default: '#a855f7',
}

function getMoodColor(mood: string): string {
  return MOOD_COLORS[mood.toLowerCase()] || MOOD_COLORS.default
}

// Extract moods from vibe profile
function extractMoods(vibe: VibeProfile): string[] {
  const moods: string[] = [...vibe.mood]
  if (vibe.atmosphere) moods.push(vibe.atmosphere)
  if (vibe.emotionalColor) moods.push(vibe.emotionalColor)
  return [...new Set(moods)].slice(0, 6) // Limit to 6 most important
}

export function ExplorableGraph({ rootMovie, width, height }: ExplorableGraphProps) {
  const [nodes, setNodes] = useState<GraphNode[]>([])
  const [links, setLinks] = useState<GraphLink[]>([])
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null)
  const [loadingNode, setLoadingNode] = useState<string | null>(null)
  const [ForceGraphComponent, setForceGraphComponent] = useState<any>(null)
  const [graphInstance, setGraphInstance] = useState<any>(null)

  // Load ForceGraph on client
  useEffect(() => {
    import('react-force-graph-2d').then(mod => {
      setForceGraphComponent(() => mod.default)
    })
  }, [])

  // Initialize with root movie
  useEffect(() => {
    const centerX = width / 2
    const centerY = height / 2

    const rootNode: GraphNode = {
      id: rootMovie.id,
      type: 'movie',
      label: rootMovie.title,
      data: rootMovie,
      x: centerX,
      y: centerY,
      expanded: false,
      depth: 0,
    }

    setNodes([rootNode])
    setLinks([])
    setSelectedNode(rootNode)
  }, [rootMovie, width, height])

  // Expand a movie node to show its moods
  const expandMovieNode = useCallback((node: GraphNode) => {
    if (node.type !== 'movie' || node.expanded) return

    const movie = node.data as Movie
    const moods = extractMoods(movie.vibeProfile)

    const angleStep = (2 * Math.PI) / moods.length
    const radius = 100 + node.depth * 50

    const newMoodNodes: GraphNode[] = moods.map((mood, i) => {
      const angle = angleStep * i - Math.PI / 2
      return {
        id: `mood-${mood}-${node.id}`,
        type: 'mood' as const,
        label: mood,
        data: { name: mood, color: getMoodColor(mood) },
        x: node.x + Math.cos(angle) * radius,
        y: node.y + Math.sin(angle) * radius,
        expanded: false,
        depth: node.depth + 1,
      }
    })

    const newLinks: GraphLink[] = moods.map(mood => ({
      source: node.id,
      target: `mood-${mood}-${node.id}`,
      type: 'movie-mood' as const,
    }))

    setNodes(prev => [
      ...prev.map(n => n.id === node.id ? { ...n, expanded: true } : n),
      ...newMoodNodes,
    ])
    setLinks(prev => [...prev, ...newLinks])
  }, [])

  // Expand a mood node to fetch similar movies
  const expandMoodNode = useCallback(async (node: GraphNode) => {
    if (node.type !== 'mood' || node.expanded) return

    setLoadingNode(node.id)

    try {
      // Find the parent movie
      const parentLink = links.find(l => l.target === node.id)
      const parentNode = parentLink ? nodes.find(n => n.id === parentLink.source) : null

      if (!parentNode || parentNode.type !== 'movie') {
        setLoadingNode(null)
        return
      }

      const parentMovie = parentNode.data as Movie

      // Get recommendations based on this movie
      const response = await fetch('/api/recommend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ movieId: parentMovie.id, limit: 4 }),
      })

      if (!response.ok) {
        setLoadingNode(null)
        return
      }

      const data = await response.json()
      const recommendations = data.recommendations || []

      // Filter to movies that share this mood (approximation - check title keywords)
      const moodName = node.data.name.toLowerCase()

      const angleStep = (2 * Math.PI) / Math.max(recommendations.length, 1)
      const radius = 80
      const existingIds = new Set(nodes.map(n => n.id))

      const newMovieNodes: GraphNode[] = recommendations
        .slice(0, 3) // Limit to 3 similar movies
        .filter((rec: any) => !existingIds.has(rec.movie.id) && !existingIds.has(`tmdb-${rec.movie.tmdbId}`))
        .map((rec: any, i: number) => {
          const angle = angleStep * i - Math.PI / 2
          return {
            id: rec.movie.id,
            type: 'movie' as const,
            label: rec.movie.title,
            data: rec.movie,
            x: node.x + Math.cos(angle) * radius,
            y: node.y + Math.sin(angle) * radius,
            expanded: false,
            depth: node.depth + 1,
          }
        })

      const newLinks: GraphLink[] = newMovieNodes.map(movieNode => ({
        source: node.id,
        target: movieNode.id,
        type: 'movie-movie' as const,
      }))

      setNodes(prev => [
        ...prev.map(n => n.id === node.id ? { ...n, expanded: true } : n),
        ...newMovieNodes,
      ])
      setLinks(prev => [...prev, ...newLinks])
    } catch (error) {
      console.error('Failed to expand mood node:', error)
    } finally {
      setLoadingNode(null)
    }
  }, [nodes, links])

  // Handle node click
  const handleNodeClick = useCallback((node: any) => {
    const graphNode = nodes.find(n => n.id === node.id)
    if (!graphNode) return

    setSelectedNode(graphNode)

    if (graphNode.type === 'movie') {
      expandMovieNode(graphNode)
    } else if (graphNode.type === 'mood') {
      expandMoodNode(graphNode)
    }

    // Center on clicked node
    if (graphInstance) {
      graphInstance.centerAt(node.x, node.y, 500)
    }
  }, [nodes, expandMovieNode, expandMoodNode, graphInstance])

  // Graph data for react-force-graph
  const graphData = useMemo(() => ({
    nodes: nodes.map(n => ({
      ...n,
      val: n.type === 'movie' ? (n.depth === 0 ? 20 : 12) : 8,
    })),
    links: links.map(l => ({ ...l })),
  }), [nodes, links])

  // Custom node rendering
  const nodeCanvasObject = useCallback((node: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
    const isMovie = node.type === 'movie'
    const isRoot = node.depth === 0
    const isSelected = selectedNode?.id === node.id
    const isLoading = loadingNode === node.id

    const size = isMovie ? (isRoot ? 20 : 12) : 8
    const label = node.label

    // Pulsing animation for loading
    let animatedSize = size
    if (isLoading) {
      animatedSize = size + Math.sin(Date.now() / 200) * 3
    }

    // Draw node
    ctx.beginPath()
    ctx.arc(node.x, node.y, animatedSize, 0, 2 * Math.PI)

    if (isMovie) {
      // Movie nodes - gradient purple
      const gradient = ctx.createRadialGradient(node.x, node.y, 0, node.x, node.y, animatedSize)
      gradient.addColorStop(0, isRoot ? '#a855f7' : '#7c3aed')
      gradient.addColorStop(1, isRoot ? '#7c3aed' : '#5b21b6')
      ctx.fillStyle = gradient
      ctx.fill()

      if (isSelected) {
        ctx.strokeStyle = '#ffffff'
        ctx.lineWidth = 2
        ctx.stroke()
      }

      // Expand indicator if not expanded
      if (!node.expanded) {
        ctx.fillStyle = '#ffffff'
        ctx.beginPath()
        ctx.arc(node.x, node.y, 3, 0, 2 * Math.PI)
        ctx.fill()
      }
    } else {
      // Mood nodes - colored by mood
      ctx.fillStyle = node.data?.color || '#a855f7'
      ctx.fill()

      if (isSelected) {
        ctx.strokeStyle = '#ffffff'
        ctx.lineWidth = 2
        ctx.stroke()
      }
    }

    // Draw label
    const fontSize = Math.max(10 / globalScale, 8)
    ctx.font = `${isMovie && isRoot ? 'bold ' : ''}${fontSize}px Inter, system-ui, sans-serif`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'top'

    // Background for label
    const textWidth = ctx.measureText(label).width
    const padding = 4 / globalScale
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)'
    ctx.fillRect(
      node.x - textWidth / 2 - padding,
      node.y + animatedSize + 4,
      textWidth + padding * 2,
      fontSize + padding
    )

    // Label text
    ctx.fillStyle = isMovie ? '#ffffff' : (node.data?.color || '#a855f7')
    ctx.fillText(label, node.x, node.y + animatedSize + 6)
  }, [selectedNode, loadingNode])

  // Link styling
  const linkColor = useCallback((link: any) => {
    return link.type === 'movie-mood'
      ? 'rgba(139, 92, 246, 0.4)'
      : 'rgba(168, 85, 247, 0.6)'
  }, [])

  if (!ForceGraphComponent) {
    return (
      <div className="flex items-center justify-center h-full bg-[#0a0a1a]">
        <div className="text-zinc-400">Loading...</div>
      </div>
    )
  }

  return (
    <div className="relative w-full h-full">
      <ForceGraphComponent
        ref={(el: any) => el && !graphInstance && setGraphInstance(el)}
        graphData={graphData}
        width={width}
        height={height}
        backgroundColor="#0a0a1a"
        nodeCanvasObject={nodeCanvasObject}
        nodePointerAreaPaint={(node: any, color: string, ctx: CanvasRenderingContext2D) => {
          const size = node.type === 'movie' ? (node.depth === 0 ? 20 : 12) : 8
          ctx.beginPath()
          ctx.arc(node.x, node.y, size + 5, 0, 2 * Math.PI)
          ctx.fillStyle = color
          ctx.fill()
        }}
        linkColor={linkColor}
        linkWidth={1.5}
        onNodeClick={handleNodeClick}
        d3AlphaDecay={0.05}
        d3VelocityDecay={0.4}
        cooldownTicks={50}
        onEngineStop={() => graphInstance?.zoomToFit(400, 100)}
      />

      {/* Instructions */}
      <div className="absolute bottom-4 left-4 bg-zinc-900/90 backdrop-blur-sm rounded-lg p-3 text-sm max-w-xs">
        <p className="text-zinc-300 mb-2">Click nodes to explore:</p>
        <div className="space-y-1 text-zinc-400 text-xs">
          <p>• Click a <span className="text-purple-400">movie</span> to see its moods</p>
          <p>• Click a <span className="text-purple-300">mood</span> to find similar films</p>
        </div>
      </div>

      {/* Selected Node Info */}
      {selectedNode && (
        <div className="absolute top-4 right-4 bg-zinc-900/90 backdrop-blur-sm rounded-lg p-4 max-w-sm">
          {selectedNode.type === 'movie' ? (
            <div>
              <h3 className="font-semibold text-white mb-1">{selectedNode.label}</h3>
              <p className="text-zinc-400 text-sm mb-2">
                {(selectedNode.data as Movie).year}
              </p>
              <p className="text-purple-300 text-sm italic">
                {(selectedNode.data as Movie).vibeSummary}
              </p>
              {!selectedNode.expanded && (
                <p className="text-zinc-500 text-xs mt-2">
                  Click to reveal mood connections
                </p>
              )}
            </div>
          ) : (
            <div>
              <h3 className="font-semibold text-white mb-1 capitalize">
                {selectedNode.label}
              </h3>
              <p className="text-zinc-400 text-sm">Mood</p>
              {!selectedNode.expanded && (
                <p className="text-zinc-500 text-xs mt-2">
                  Click to find similar films
                </p>
              )}
              {loadingNode === selectedNode.id && (
                <p className="text-purple-400 text-xs mt-2">
                  Finding similar films...
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
