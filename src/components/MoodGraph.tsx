'use client'

import { useCallback, useState, useEffect } from 'react'
import type { MoodGraph, GraphNode, TitleNode, MoodNode } from '@/lib/types'

// Only import on client side
let ForceGraph2D: any = null
if (typeof window !== 'undefined') {
  import('react-force-graph-2d').then(mod => {
    ForceGraph2D = mod.default
  })
}

interface MoodGraphProps {
  graph: MoodGraph
  onNodeClick?: (node: GraphNode) => void
  onNodeHover?: (node: GraphNode | null) => void
  width?: number
  height?: number
}

// Node sizing
const NODE_SIZE = {
  title: 8,
  mood: 12,
}

export function MoodGraphVisualization({
  graph,
  onNodeClick,
  onNodeHover,
  width = 800,
  height = 600,
}: MoodGraphProps) {
  const [ForceGraphComponent, setForceGraphComponent] = useState<any>(null)
  const [graphInstance, setGraphInstance] = useState<any>(null)
  const [hoveredNode, setHoveredNode] = useState<string | null>(null)
  const [selectedNode, setSelectedNode] = useState<string | null>(null)
  const [isClient, setIsClient] = useState(false)

  // Load ForceGraph2D on client
  useEffect(() => {
    setIsClient(true)
    import('react-force-graph-2d').then(mod => {
      setForceGraphComponent(() => mod.default)
    })
  }, [])

  // Transform graph data for react-force-graph format
  const graphData = {
    nodes: graph.nodes.map(node => ({
      ...node,
      val: node.type === 'mood' ? NODE_SIZE.mood : NODE_SIZE.title,
    })),
    links: graph.links.map(link => ({
      ...link,
      value: link.weight,
    })),
  }

  // Handle node click
  const handleNodeClick = useCallback(
    (node: any) => {
      setSelectedNode(node.id)
      if (onNodeClick) {
        onNodeClick(node as GraphNode)
      }

      // Zoom to node
      if (graphInstance) {
        graphInstance.centerAt(node.x, node.y, 500)
        graphInstance.zoom(2, 500)
      }
    },
    [onNodeClick, graphInstance]
  )

  // Handle node hover
  const handleNodeHover = useCallback(
    (node: any) => {
      setHoveredNode(node?.id || null)
      if (onNodeHover) {
        onNodeHover(node as GraphNode | null)
      }
    },
    [onNodeHover]
  )

  // Custom node rendering
  const nodeCanvasObject = useCallback(
    (node: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
      const isMood = node.type === 'mood'
      const isHovered = node.id === hoveredNode
      const isSelected = node.id === selectedNode

      const size = isMood ? NODE_SIZE.mood : NODE_SIZE.title
      const label = isMood ? node.data?.name : node.data?.title

      if (!label) return

      // Draw node circle
      ctx.beginPath()
      ctx.arc(node.x, node.y, size, 0, 2 * Math.PI)

      if (isMood) {
        ctx.fillStyle = node.data?.color || '#64748b'
        ctx.fill()

        if (isHovered || isSelected) {
          ctx.strokeStyle = '#ffffff'
          ctx.lineWidth = 2
          ctx.stroke()
        }
      } else {
        ctx.fillStyle = isSelected ? '#8b5cf6' : isHovered ? '#a78bfa' : '#1e1b4b'
        ctx.fill()
        ctx.strokeStyle = isHovered || isSelected ? '#a78bfa' : '#4c1d95'
        ctx.lineWidth = 1.5
        ctx.stroke()
      }

      // Draw label
      const fontSize = isMood ? 10 / globalScale : 8 / globalScale
      const showLabel = isMood || isHovered || isSelected || globalScale > 1.5

      if (showLabel && fontSize > 2) {
        ctx.font = `${fontSize}px Inter, system-ui, sans-serif`
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'

        const textWidth = ctx.measureText(label).width
        const padding = 2 / globalScale

        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)'
        ctx.fillRect(
          node.x - textWidth / 2 - padding,
          node.y + size + 2 - fontSize / 2,
          textWidth + padding * 2,
          fontSize + padding
        )

        ctx.fillStyle = isMood ? (node.data?.color || '#e2e8f0') : '#e2e8f0'
        ctx.fillText(label, node.x, node.y + size + 4)
      }
    },
    [hoveredNode, selectedNode]
  )

  // Link styling
  const linkColor = useCallback((link: any) => {
    if (link.type === 'title_similarity') {
      const opacity = Math.min(0.3 + link.weight * 0.2, 0.7)
      return `rgba(139, 92, 246, ${opacity})`
    }
    const opacity = 0.2 + link.weight * 0.3
    return `rgba(100, 116, 139, ${opacity})`
  }, [])

  const linkWidth = useCallback((link: any) => {
    if (link.type === 'title_similarity') {
      return Math.max(0.5, link.weight * 0.5)
    }
    return link.weight * 1.5
  }, [])

  // Zoom controls
  const handleZoomIn = () => {
    if (graphInstance) {
      const currentZoom = graphInstance.zoom()
      graphInstance.zoom(currentZoom * 1.5, 300)
    }
  }

  const handleZoomOut = () => {
    if (graphInstance) {
      const currentZoom = graphInstance.zoom()
      graphInstance.zoom(currentZoom / 1.5, 300)
    }
  }

  const handleResetView = () => {
    if (graphInstance) {
      graphInstance.zoomToFit(400, 50)
      setSelectedNode(null)
    }
  }

  // Store graph instance when ready
  const handleEngineStop = useCallback(() => {
    if (graphInstance) {
      graphInstance.zoomToFit(400, 50)
    }
  }, [graphInstance])

  if (!isClient || !ForceGraphComponent) {
    return (
      <div className="flex items-center justify-center h-full bg-[#0f0f23] rounded-xl">
        <div className="text-zinc-400">Loading graph...</div>
      </div>
    )
  }

  return (
    <div className="relative w-full h-full bg-[#0f0f23] rounded-xl overflow-hidden">
      <ForceGraphComponent
        ref={(el: any) => {
          if (el && !graphInstance) {
            setGraphInstance(el)
          }
        }}
        graphData={graphData}
        width={width}
        height={height}
        backgroundColor="#0f0f23"
        nodeCanvasObject={nodeCanvasObject}
        nodePointerAreaPaint={(node: any, color: string, ctx: CanvasRenderingContext2D) => {
          const size = node.type === 'mood' ? NODE_SIZE.mood : NODE_SIZE.title
          ctx.beginPath()
          ctx.arc(node.x, node.y, size + 4, 0, 2 * Math.PI)
          ctx.fillStyle = color
          ctx.fill()
        }}
        linkColor={linkColor}
        linkWidth={linkWidth}
        linkDirectionalParticles={0}
        onNodeClick={handleNodeClick}
        onNodeHover={handleNodeHover}
        d3AlphaDecay={0.02}
        d3VelocityDecay={0.3}
        cooldownTicks={100}
        onEngineStop={handleEngineStop}
      />

      {/* Zoom Controls */}
      <div className="absolute bottom-4 right-4 flex flex-col gap-2">
        <button
          onClick={handleZoomIn}
          className="p-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-white transition-colors"
          aria-label="Zoom in"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v12M6 12h12" />
          </svg>
        </button>
        <button
          onClick={handleZoomOut}
          className="p-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-white transition-colors"
          aria-label="Zoom out"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 12h12" />
          </svg>
        </button>
        <button
          onClick={handleResetView}
          className="p-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-white transition-colors"
          aria-label="Reset view"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
          </svg>
        </button>
      </div>

      {/* Legend */}
      <div className="absolute top-4 left-4 bg-zinc-900/90 backdrop-blur-sm rounded-lg p-3 text-sm">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-3 h-3 rounded-full bg-[#8b5cf6]" />
          <span className="text-zinc-400">Mood</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-[#1e1b4b] border border-[#4c1d95]" />
          <span className="text-zinc-400">Title</span>
        </div>
      </div>
    </div>
  )
}
