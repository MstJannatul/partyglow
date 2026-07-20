import * as React from 'react'

import { cn } from '@/lib/utils'

export interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'bright' | 'soft' | 'frosted' | 'default' | 'white'
}

export const GlassCard = React.forwardRef<HTMLDivElement, GlassCardProps>(
  ({ className, variant = 'frosted', ...props }, ref) => {
    const variantClass =
      variant === 'bright'
        ? 'glass-card glass-card-bright'
        : variant === 'soft'
          ? 'glass-card glass-card-soft'
          : variant === 'white'
            ? 'glass-card glass-card-white'
            : variant === 'frosted'
              ? 'glass-card glass-card-frosted'
              : 'glass-card'

    return (
      <div
        ref={ref}
        className={cn('shadow-card', variantClass, className)}
        {...props}
      >
        {props.children}
      </div>
    )
  }
)
GlassCard.displayName = 'GlassCard'

export default GlassCard
