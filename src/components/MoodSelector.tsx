'use client'

import { cn } from '@/lib/utils'

interface MoodSelectorProps {
  onSelectMood: (mood: string) => void
}

const MOOD_OPTIONS = [
  { id: 'melancholic', label: 'Melancholic', emoji: '🌧️', examples: 'Lost in Translation, Her' },
  { id: 'dreamy', label: 'Dreamy', emoji: '✨', examples: 'Amélie, Spirited Away' },
  { id: 'tense', label: 'Tense', emoji: '😰', examples: 'Sicario, Prisoners' },
  { id: 'cozy', label: 'Cozy', emoji: '☕', examples: "You've Got Mail, Paddington" },
  { id: 'euphoric', label: 'Euphoric', emoji: '🎉', examples: 'La La Land, Mamma Mia' },
  { id: 'bleak', label: 'Bleak', emoji: '🖤', examples: 'The Road, Requiem for a Dream' },
]

export function MoodSelector({ onSelectMood }: MoodSelectorProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
      {MOOD_OPTIONS.map(mood => (
        <button
          key={mood.id}
          onClick={() => onSelectMood(mood.examples.split(', ')[0])}
          className={cn(
            "p-4 rounded-xl text-left transition-all",
            "bg-zinc-900 border border-zinc-800",
            "hover:border-purple-500/50 hover:bg-zinc-800/50",
            "focus:outline-none focus:ring-2 focus:ring-purple-500"
          )}
          aria-label={`Find ${mood.label} movies like ${mood.examples}`}
        >
          <div className="text-2xl mb-2">{mood.emoji}</div>
          <div className="font-medium text-white">{mood.label}</div>
          <div className="text-xs text-zinc-500 mt-1">
            e.g. {mood.examples}
          </div>
        </button>
      ))}
    </div>
  )
}
