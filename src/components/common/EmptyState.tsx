import React from 'react'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface EmptyStateProps {
  icon?: React.ReactNode
  title: string
  description?: string
  primaryAction?: { label: string; onClick: () => void }
  className?: string
}

export function EmptyState({
  icon,
  title,
  description,
  primaryAction,
  className
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center py-12 space-y-4',
        className
      )}
    >
      {icon && <div className="text-muted-foreground">{icon}</div>}
      <div className="space-y-2 text-center">
        <h3 className="text-lg font-semibold">{title}</h3>
        {description && (
          <p className="mx-auto max-w-md text-muted-foreground">
            {description}
          </p>
        )}
      </div>
      {primaryAction && (
        <Button onClick={primaryAction.onClick} variant="outline">
          {primaryAction.label}
        </Button>
      )}
    </div>
  )
}
