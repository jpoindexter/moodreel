'use client'

export function VibeLoader() {
  return (
    <div className="flex flex-col items-center justify-center py-16">
      <div className="relative">
        <div className="w-16 h-16 rounded-full border-4 border-purple-500/20 border-t-purple-500 animate-spin" />
      </div>
      <p className="mt-6 text-zinc-400 animate-pulse">
        Analyzing vibes...
      </p>
    </div>
  )
}
