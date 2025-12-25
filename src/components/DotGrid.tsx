'use client'

interface DotGridProps {
  dotColor?: string
  dotSize?: number
  gap?: number
  className?: string
}

export function DotGrid({
  dotColor = 'rgba(255, 255, 255, 0.15)',
  dotSize = 1,
  gap = 24,
  className = '',
}: DotGridProps) {
  return (
    <div
      className={`absolute inset-0 pointer-events-none ${className}`}
      style={{
        backgroundImage: `radial-gradient(circle, ${dotColor} ${dotSize}px, transparent ${dotSize}px)`,
        backgroundSize: `${gap}px ${gap}px`,
      }}
    />
  )
}
