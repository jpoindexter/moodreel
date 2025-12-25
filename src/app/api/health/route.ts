import { NextResponse } from 'next/server'
import { sql } from '@/lib/db'

export async function GET() {
  const checks = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    services: {
      database: { status: 'unknown' as string },
      openai: { status: 'configured' as string },
      tmdb: { status: 'configured' as string },
    },
  }

  // Check database connectivity
  try {
    await sql`SELECT 1`
    checks.services.database.status = 'healthy'
  } catch {
    checks.services.database.status = 'error'
    checks.status = 'degraded'
  }

  // Check API keys are configured (don't expose specifics)
  checks.services.openai.status = process.env.OPENAI_API_KEY ? 'ok' : 'error'
  checks.services.tmdb.status = process.env.TMDB_API_KEY ? 'ok' : 'error'

  const statusCode = checks.status === 'healthy' ? 200 : 503

  return NextResponse.json(checks, { status: statusCode })
}
