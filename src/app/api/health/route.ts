import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

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
    const supabase = createServerClient()
    const { error } = await supabase
      .from('movies')
      .select('id')
      .limit(1)

    checks.services.database.status = error ? 'error' : 'healthy'
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
