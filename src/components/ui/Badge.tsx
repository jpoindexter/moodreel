'use client'

import { forwardRef } from 'react'
import { cn } from '@/lib/utils'

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'purple' | 'pink' | 'success'
}

export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = 'default', children, ...props }, ref) => {
    return (
      <span
        ref={ref}
        className={cn(
          // Base styles
          'inline-flex items-center px-3 py-1 rounded-full text-sm',
          // Variants
          variant === 'default' && 'bg-zinc-800 text-zinc-200',
          variant === 'purple' && 'bg-purple-900/40 text-purple-200',
          variant === 'pink' && 'bg-pink-900/40 text-pink-200',
          variant === 'success' && 'bg-green-900/40 text-green-200',
          className
        )}
        {...props}
      >
        {children}
      </span>
    )
  }
)

Badge.displayName = 'Badge'
