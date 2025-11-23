'use client'

import { Search } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SearchInputProps {
  value: string
  onChange: (value: string) => void
  onSubmit: (value: string) => void
  disabled?: boolean
}

export function SearchInput({ value, onChange, onSubmit, disabled }: SearchInputProps) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(value)
  }

  return (
    <form onSubmit={handleSubmit} className="relative">
      <label htmlFor="movie-search" className="sr-only">
        Search for a movie
      </label>
      <input
        id="movie-search"
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Enter a movie title..."
        disabled={disabled}
        aria-describedby="search-help"
        className={cn(
          "w-full px-6 py-4 pl-14 rounded-2xl",
          "bg-zinc-900 border border-zinc-700",
          "text-white placeholder:text-zinc-500",
          "focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          "transition-all"
        )}
      />
      <Search
        className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500"
        aria-hidden="true"
      />
      <button
        type="submit"
        disabled={disabled || !value.trim()}
        aria-label="Find movies with similar vibes"
        className={cn(
          "absolute right-3 top-1/2 -translate-y-1/2",
          "px-4 py-2 rounded-xl",
          "bg-purple-600 hover:bg-purple-500",
          "text-white font-medium text-sm",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          "transition-colors"
        )}
      >
        Find vibes
      </button>
      <span id="search-help" className="sr-only">
        Press Enter or click Find vibes to search
      </span>
    </form>
  )
}
