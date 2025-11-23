'use client'

import { useEffect } from 'react'
import { AlertCircle, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Application error:', error)
  }, [error])

  return (
    <div className="min-h-screen flex items-center justify-center px-4" role="alert" aria-live="assertive">
      <div className="max-w-md w-full text-center">
        <AlertCircle className="w-16 h-16 mx-auto mb-6 text-red-400" aria-hidden="true" />
        <h2 className="text-2xl font-bold text-white mb-2">
          Something went wrong
        </h2>
        <p className="text-zinc-400 mb-6">
          An unexpected error occurred. Please try again.
        </p>
        <Button size="lg" onClick={reset}>
          <RefreshCw className="w-4 h-4" aria-hidden="true" />
          Try again
        </Button>
      </div>
    </div>
  )
}
