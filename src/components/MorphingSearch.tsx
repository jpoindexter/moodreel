'use client'

import { useState, useRef, useEffect } from 'react'
import { Search } from 'lucide-react'

interface MorphingSearchProps {
  onSearch: (query: string) => void
  isLoading: boolean
  placeholder?: string
  suggestions?: string[]
}

export function MorphingSearch({
  onSearch,
  isLoading,
  placeholder = 'Search a movie or mood...',
  suggestions = ['90s horror', 'cozy rainy day', 'mind-bending sci-fi', 'feel-good 80s'],
}: MorphingSearchProps) {
  const [query, setQuery] = useState('')
  const [isFocused, setIsFocused] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (query.trim() && !isLoading) {
      onSearch(query.trim())
    }
  }

  const handleSuggestionClick = (suggestion: string) => {
    setQuery(suggestion)
    onSearch(suggestion)
  }

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  return (
    <div className="flex flex-col items-center gap-8 w-full max-w-2xl mx-auto">
      {/* Search Container */}
      <div
        className={`relative transition-all duration-500 ease-out ${
          isLoading
            ? 'w-16 h-16'
            : 'w-full'
        }`}
      >
        {isLoading ? (
          /* Spinner State */
          <div className="w-16 h-16 rounded-full border-2 border-white/20 border-t-white animate-spin" />
        ) : (
          /* Search Input State */
          <form onSubmit={handleSubmit} className="relative">
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              placeholder={placeholder}
              className={`
                w-full px-6 py-4 pl-14
                bg-white/5 backdrop-blur-sm
                border border-white/10
                rounded-full
                text-white text-lg
                placeholder:text-white/30
                focus:outline-none focus:border-white/30 focus:bg-white/10
                transition-all duration-300
              `}
            />
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />

            {query && (
              <button
                type="submit"
                className="absolute right-3 top-1/2 -translate-y-1/2 px-5 py-2 bg-white text-black font-medium rounded-full text-sm hover:bg-white/90 transition-colors"
              >
                Search
              </button>
            )}
          </form>
        )}
      </div>

      {/* Helper Text / Suggestions */}
      {!isLoading && (
        <div className={`text-center transition-opacity duration-300 ${isFocused || query ? 'opacity-50' : 'opacity-100'}`}>
          <p className="text-white/40 text-sm mb-3">Try searching for:</p>
          <div className="flex flex-wrap justify-center gap-2">
            {suggestions.map((suggestion) => (
              <button
                key={suggestion}
                onClick={() => handleSuggestionClick(suggestion)}
                className="px-4 py-1.5 text-sm text-white/50 border border-white/10 rounded-full hover:border-white/30 hover:text-white/80 hover:bg-white/5 transition-all"
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
