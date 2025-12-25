'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import type { Movie } from '@/lib/types'
import { MovieDetailsModal } from './MovieDetailsModal'

interface MapNode {
  id: string
  movie: Movie
  x: number
  y: number
  depth: number
  parentId: string | null
  expanded: boolean
}

interface MindMapProps {
  rootMovie: Movie
  onFetchSimilar: (movieId: string) => Promise<{ movie: Movie; similarity: number }[]>
}

export function MindMap({ rootMovie, onFetchSimilar }: MindMapProps) {
  const [nodes, setNodes] = useState<Map<string, MapNode>>(new Map())
  const [loadingNode, setLoadingNode] = useState<string | null>(null)
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [draggingNode, setDraggingNode] = useState<string | null>(null)
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null)
  const [similarMovies, setSimilarMovies] = useState<{ movie: Movie; similarity: number }[]>([])
  const [focusedNodeId, setFocusedNodeId] = useState<string | null>(null)

  const containerRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLDivElement>(null)
  const nodesRef = useRef<Map<string, HTMLDivElement>>(new Map())
  const linesRef = useRef<SVGSVGElement>(null)

  // Initialize root
  useEffect(() => {
    const initial = new Map<string, MapNode>()
    initial.set(rootMovie.id, {
      id: rootMovie.id,
      movie: rootMovie,
      x: 0,
      y: 0,
      depth: 0,
      parentId: null,
      expanded: false,
    })
    setNodes(initial)
    setFocusedNodeId(rootMovie.id)
  }, [rootMovie])

  // Animate new nodes with GSAP
  useEffect(() => {
    nodes.forEach((node) => {
      const el = nodesRef.current.get(node.id)
      if (!el || el.dataset.animated) return

      el.dataset.animated = 'true'

      // Pop-in animation
      gsap.fromTo(el,
        { scale: 0, opacity: 0 },
        { scale: 1, opacity: 1, duration: 0.5, ease: 'back.out(1.7)' }
      )

      // Floating animation (only if not dragging)
      gsap.to(el, {
        y: '+=8',
        duration: 2 + Math.random(),
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
        delay: Math.random() * 2
      })
    })
  }, [nodes])

  // Update lines between nodes
  const updateLines = useCallback(() => {
    if (!linesRef.current || !canvasRef.current) return

    const svg = linesRef.current
    const canvasRect = canvasRef.current.getBoundingClientRect()

    svg.innerHTML = ''

    nodes.forEach((node) => {
      if (!node.parentId) return
      const parent = nodes.get(node.parentId)
      if (!parent) return

      const nodeEl = nodesRef.current.get(node.id)
      const parentEl = nodesRef.current.get(parent.id)
      if (!nodeEl || !parentEl) return

      const nodeRect = nodeEl.getBoundingClientRect()
      const parentRect = parentEl.getBoundingClientRect()

      const x1 = parentRect.left - canvasRect.left + parentRect.width / 2
      const y1 = parentRect.top - canvasRect.top + parentRect.height / 2
      const x2 = nodeRect.left - canvasRect.left + nodeRect.width / 2
      const y2 = nodeRect.top - canvasRect.top + nodeRect.height / 2

      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line')
      line.setAttribute('x1', String(x1))
      line.setAttribute('y1', String(y1))
      line.setAttribute('x2', String(x2))
      line.setAttribute('y2', String(y2))
      line.setAttribute('stroke', 'rgba(34, 211, 238, 0.3)')
      line.setAttribute('stroke-width', '2')
      line.setAttribute('stroke-dasharray', '6 4')

      svg.appendChild(line)
    })
  }, [nodes])

  useEffect(() => {
    const timer = setTimeout(updateLines, 100)
    return () => clearTimeout(timer)
  }, [nodes, updateLines])

  // Expand node
  const expand = useCallback(async (nodeId: string) => {
    const node = nodes.get(nodeId)
    if (!node || node.expanded || loadingNode) return

    setLoadingNode(nodeId)

    try {
      const similar = await onFetchSimilar(node.movie.id)
      const count = 2
      const items = similar.slice(0, count)

      setNodes((prev) => {
        const next = new Map(prev)
        const parent = next.get(nodeId)!

        const baseAngle = parent.parentId
          ? Math.atan2(parent.y - (next.get(parent.parentId)?.y ?? 0), parent.x - (next.get(parent.parentId)?.x ?? 0))
          : -Math.PI / 2

        const spread = Math.PI * 0.6
        const radius = 200

        items.forEach((item, i) => {
          if (next.has(item.movie.id)) return
          const angle = baseAngle + (i - (count - 1) / 2) * (spread / Math.max(count - 1, 1))
          next.set(item.movie.id, {
            id: item.movie.id,
            movie: item.movie,
            x: parent.x + Math.cos(angle) * radius,
            y: parent.y + Math.sin(angle) * radius,
            depth: parent.depth + 1,
            parentId: nodeId,
            expanded: false,
          })
        })

        next.set(nodeId, { ...parent, expanded: true })
        return next
      })
    } catch (e) {
      console.error(e)
    } finally {
      setLoadingNode(null)
    }
  }, [nodes, loadingNode, onFetchSimilar])

  const cx = typeof window !== 'undefined' ? window.innerWidth / 2 : 500
  const cy = typeof window !== 'undefined' ? (window.innerHeight - 64) / 2 : 300

  // Zoom handlers
  const handleZoomIn = () => setZoom(z => Math.min(z + 0.25, 2))
  const handleZoomOut = () => setZoom(z => Math.max(z - 0.25, 0.5))
  const handleReset = () => { setZoom(1); setPan({ x: 0, y: 0 }) }

  // Wheel zoom
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault()
    const delta = e.deltaY > 0 ? -0.1 : 0.1
    setZoom(z => Math.min(Math.max(z + delta, 0.5), 2))
  }

  // Canvas pan (when not dragging a node)
  const handleCanvasMouseMove = (e: React.MouseEvent) => {
    if (e.buttons !== 1 || draggingNode) return
    setPan(p => ({
      x: p.x + e.movementX,
      y: p.y + e.movementY
    }))
  }

  // Node drag handlers
  const handleNodeDrag = (e: React.MouseEvent, nodeId: string) => {
    if (e.buttons !== 1) return
    e.stopPropagation()

    setNodes(prev => {
      const next = new Map(prev)
      const node = next.get(nodeId)
      if (node) {
        next.set(nodeId, {
          ...node,
          x: node.x + e.movementX / zoom,
          y: node.y + e.movementY / zoom
        })
      }
      return next
    })

    updateLines()
  }

  // Handle focus swap - clicked node becomes the main card
  const handleFocusSwap = useCallback((nodeId: string) => {
    if (nodeId === focusedNodeId || draggingNode) return

    const clickedEl = nodesRef.current.get(nodeId)
    const currentFocusedEl = focusedNodeId ? nodesRef.current.get(focusedNodeId) : null

    // Animate current focused shrinking
    if (currentFocusedEl) {
      gsap.to(currentFocusedEl, {
        scale: 0.3,
        duration: 0.4,
        ease: 'power2.inOut',
        onComplete: () => {
          gsap.set(currentFocusedEl, { scale: 1 })
        }
      })
    }

    // Animate clicked node growing
    if (clickedEl) {
      gsap.fromTo(clickedEl,
        { scale: 1.5 },
        { scale: 1, duration: 0.4, ease: 'back.out(1.4)' }
      )
    }

    setFocusedNodeId(nodeId)

    // If the node hasn't been expanded yet, fetch similar movies
    const node = nodes.get(nodeId)
    if (node && !node.expanded) {
      expand(nodeId)
    }
  }, [focusedNodeId, draggingNode, nodes, expand])

  // Handle card click to open modal (for the focused/main card)
  const handleCardClick = async (movie: Movie) => {
    setSelectedMovie(movie)
    // Fetch similar movies for the modal
    try {
      const similar = await onFetchSimilar(movie.id)
      setSimilarMovies(similar.slice(0, 3))
    } catch (e) {
      setSimilarMovies([])
    }
  }

  // Handle explore from modal
  const handleExploreFromModal = (movie: Movie) => {
    setSelectedMovie(null)
    // Find or create node for this movie and expand it
    const existingNode = nodes.get(movie.id)
    if (existingNode) {
      handleFocusSwap(movie.id)
    }
  }

  return (
    <div
      ref={containerRef}
      className="w-full h-full relative overflow-hidden cursor-grab active:cursor-grabbing bg-zinc-950"
      onWheel={handleWheel}
      onMouseMove={handleCanvasMouseMove}
    >
      {/* Canvas */}
      <div
        ref={canvasRef}
        className="absolute inset-0"
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          transformOrigin: 'center center',
        }}
      >
        {/* Lines */}
        <svg ref={linesRef} className="absolute inset-0 w-full h-full pointer-events-none" />

        {/* Nodes */}
        {Array.from(nodes.values()).map((node) => {
          const isFocused = node.id === focusedNodeId
          const isLoading = loadingNode === node.id

          return (
            <div
              key={node.id}
              ref={(el) => { if (el) nodesRef.current.set(node.id, el) }}
              className="absolute cursor-grab active:cursor-grabbing"
              style={{
                left: node.x + cx,
                top: node.y + cy,
                transform: 'translate(-50%, -50%)',
                zIndex: isFocused ? 10 : 5,
              }}
              onMouseDown={() => setDraggingNode(node.id)}
              onMouseUp={() => setDraggingNode(null)}
              onMouseLeave={() => setDraggingNode(null)}
              onMouseMove={(e) => draggingNode === node.id && handleNodeDrag(e, node.id)}
            >
              {isFocused ? (
                // Focused main card
                <div className="group">
                  <div
                    onClick={() => !draggingNode && handleCardClick(node.movie)}
                    className="w-56 rounded-2xl overflow-hidden bg-zinc-900/90 backdrop-blur-md border border-cyan-500/50 shadow-xl shadow-cyan-500/20 hover:shadow-cyan-500/30 transition-all cursor-pointer"
                  >
                    <div className="relative aspect-[2/3]">
                      {node.movie.posterUrl ? (
                        <img src={node.movie.posterUrl} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-zinc-800 flex items-center justify-center text-zinc-600 text-4xl">
                          {node.movie.title[0]}
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-transparent to-transparent" />

                      {/* Expand button */}
                      {!node.expanded && (
                        <button
                          onClick={(e) => { e.stopPropagation(); !draggingNode && expand(node.id) }}
                          className="absolute bottom-3 right-3 w-8 h-8 rounded-full bg-cyan-500 flex items-center justify-center text-black text-sm font-bold shadow-lg shadow-cyan-500/30 hover:bg-cyan-400 hover:scale-110 transition-all"
                        >
                          +
                        </button>
                      )}
                    </div>
                    <div className="p-3 bg-zinc-900">
                      <div className="text-white font-medium truncate">{node.movie.title}</div>
                      <div className="text-zinc-500 text-sm">{node.movie.year}</div>
                    </div>
                  </div>

                  {isLoading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/70 backdrop-blur-sm rounded-2xl">
                      <div className="w-5 h-5 border-2 border-zinc-700 border-t-cyan-500 rounded-full animate-spin" />
                    </div>
                  )}
                </div>
              ) : (
                // Non-focused node (small circle) - click to swap focus
                <div className="flex flex-col items-center gap-2 group">
                  <button
                    onClick={() => !draggingNode && handleFocusSwap(node.id)}
                    className="w-16 h-16 rounded-full overflow-hidden border-2 border-zinc-700 group-hover:border-cyan-500 group-hover:scale-110 transition-all bg-zinc-900 shadow-lg shadow-black/50 relative"
                  >
                    {node.movie.posterUrl ? (
                      <img src={node.movie.posterUrl} alt="" className="w-full h-full object-cover scale-150" />
                    ) : (
                      <div className="w-full h-full bg-zinc-800 flex items-center justify-center text-zinc-500 text-xs font-medium">
                        {node.movie.title.slice(0, 2)}
                      </div>
                    )}

                    {isLoading && (
                      <div className="absolute inset-0 bg-black/80 flex items-center justify-center">
                        <div className="w-3 h-3 border border-zinc-600 border-t-cyan-500 rounded-full animate-spin" />
                      </div>
                    )}
                  </button>
                  <span className="text-zinc-400 text-[10px] max-w-[80px] truncate group-hover:text-white transition-colors font-medium bg-zinc-900/90 px-2 py-0.5 rounded-full border border-zinc-800">
                    {node.movie.title}
                  </span>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Controls */}
      <div className="absolute bottom-4 right-4 flex flex-col gap-2 z-20">
        <button
          onClick={handleZoomIn}
          className="w-10 h-10 rounded-full bg-zinc-900/80 backdrop-blur-sm border border-zinc-800 shadow-lg flex items-center justify-center text-zinc-400 hover:bg-zinc-800 hover:text-white hover:border-zinc-700 transition-all"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v12m6-6H6" />
          </svg>
        </button>
        <button
          onClick={handleZoomOut}
          className="w-10 h-10 rounded-full bg-zinc-900/80 backdrop-blur-sm border border-zinc-800 shadow-lg flex items-center justify-center text-zinc-400 hover:bg-zinc-800 hover:text-white hover:border-zinc-700 transition-all"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 12H6" />
          </svg>
        </button>
        <button
          onClick={handleReset}
          className="w-10 h-10 rounded-full bg-zinc-900/80 backdrop-blur-sm border border-zinc-800 shadow-lg flex items-center justify-center text-zinc-400 hover:bg-zinc-800 hover:text-white hover:border-zinc-700 transition-all"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
          </svg>
        </button>
      </div>

      {/* Zoom indicator */}
      <div className="absolute bottom-4 right-20 bg-zinc-900/60 backdrop-blur-sm border border-zinc-800 px-3 py-1.5 rounded-full text-zinc-400 text-xs">
        {Math.round(zoom * 100)}%
      </div>

      {/* Instructions */}
      <div className="absolute bottom-4 left-4 text-zinc-500 text-xs bg-zinc-900/60 backdrop-blur-sm px-3 py-1.5 rounded-full border border-zinc-800">
        Click card for details • Drag nodes • Scroll to zoom
      </div>

      {/* Movie Details Modal */}
      <MovieDetailsModal
        movie={selectedMovie}
        isOpen={!!selectedMovie}
        onClose={() => setSelectedMovie(null)}
        onExplore={handleExploreFromModal}
        similarMovies={similarMovies}
      />
    </div>
  )
}
