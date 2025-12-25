import { NextRequest, NextResponse } from 'next/server'
import { getAllMovies } from '@/lib/db'
import { buildMoodGraph, filterGraph, getGraphStats } from '@/lib/graph'
import type { GraphFilters } from '@/lib/types'

export async function GET(req: NextRequest) {
  try {
    // Parse query parameters for filters
    const searchParams = req.nextUrl.searchParams

    const filters: GraphFilters = {}

    // Year range filter
    const yearFrom = searchParams.get('yearFrom')
    const yearTo = searchParams.get('yearTo')
    if (yearFrom || yearTo) {
      filters.yearRange = [
        yearFrom ? parseInt(yearFrom, 10) : 1900,
        yearTo ? parseInt(yearTo, 10) : new Date().getFullYear(),
      ]
    }

    // Media type filter
    const mediaTypes = searchParams.get('mediaTypes')
    if (mediaTypes) {
      filters.mediaTypes = mediaTypes.split(',') as GraphFilters['mediaTypes']
    }

    // Status filter
    const status = searchParams.get('status')
    if (status) {
      filters.status = status.split(',') as GraphFilters['status']
    }

    // Mood filters
    const includeMoods = searchParams.get('includeMoods')
    if (includeMoods) {
      filters.includeMoods = includeMoods.split(',')
    }

    const excludeMoods = searchParams.get('excludeMoods')
    if (excludeMoods) {
      filters.excludeMoods = excludeMoods.split(',')
    }

    // Get all movies from database
    const movies = await getAllMovies()

    if (movies.length === 0) {
      return NextResponse.json({
        graph: { nodes: [], links: [] },
        stats: {
          totalTitles: 0,
          totalMoods: 0,
          totalTitleMoodConnections: 0,
          totalSimilarityConnections: 0,
          avgMoodsPerTitle: 0,
        },
      })
    }

    // Build the full graph
    const fullGraph = buildMoodGraph(movies)

    // Apply filters if any
    const hasFilters = Object.keys(filters).length > 0
    const graph = hasFilters ? filterGraph(fullGraph, filters) : fullGraph

    // Get stats
    const stats = getGraphStats(graph)

    return NextResponse.json(
      { graph, stats },
      {
        headers: {
          'Cache-Control': 'public, max-age=300', // Cache for 5 minutes
        },
      }
    )
  } catch (error) {
    console.error('Graph generation error:', error)
    return NextResponse.json(
      { error: 'Failed to generate graph data' },
      { status: 500 }
    )
  }
}
