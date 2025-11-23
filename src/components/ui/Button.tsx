'use client'

import { forwardRef } from 'react'
import { cn } from '@/lib/utils'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          // Base styles
          'inline-flex items-center justify-center font-medium transition-all',
          'focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-zinc-900',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          'active:scale-95',
          // Variants
          variant === 'primary' && 'bg-purple-600 hover:bg-purple-500 text-white rounded-xl',
          variant === 'secondary' && 'bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl border border-zinc-700',
          variant === 'ghost' && 'bg-transparent hover:bg-zinc-800/50 text-purple-400 hover:text-purple-300 rounded',
          // Sizes
          size === 'sm' && 'px-3 py-1.5 text-sm gap-1',
          size === 'md' && 'px-4 py-2 text-sm gap-2',
          size === 'lg' && 'px-6 py-3 text-base gap-2',
          className
        )}
        {...props}
      >
        {children}
      </button>
    )
  }
)

Button.displayName = 'Button'
