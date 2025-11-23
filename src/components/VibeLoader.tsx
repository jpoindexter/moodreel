'use client'

export function VibeLoader() {
  return (
    <div
      className="flex flex-col items-center justify-center py-16"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="relative">
        <div
          className="w-16 h-16 rounded-full border-4 border-purple-500/20 border-t-purple-500 animate-spin"
          aria-hidden="true"
        />
      </div>
      <p className="mt-6 text-zinc-400 animate-pulse">
        Analyzing vibes...
      </p>
    </div>
  )
}
