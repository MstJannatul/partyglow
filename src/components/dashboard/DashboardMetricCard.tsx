import React from 'react'
import { Minus, TrendingDown, TrendingUp } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface TrendData {
  value: number
  direction: 'up' | 'down' | 'neutral'
  label: string
}

interface DashboardMetricCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon?: React.ComponentType<{ className?: string }>
  trend?: TrendData
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'destructive'
  className?: string
}

export function DashboardMetricCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  color = 'primary',
  className
}: DashboardMetricCardProps) {
  const getTrendIcon = () => {
    switch (trend?.direction) {
      case 'up':
        return <TrendingUp className="size-3" />
      case 'down':
        return <TrendingDown className="size-3" />
      default:
        return <Minus className="size-3" />
    }
  }

  const getTrendColor = () => {
    switch (trend?.direction) {
      case 'up':
        return 'text-success'
      case 'down':
        return 'text-destructive'
      default:
        return 'text-muted-foreground'
    }
  }

  return (
    <Card className={cn('transition-all hover:shadow-md', className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        {Icon && (
          <Icon
            className={cn(
              'h-4 w-4',
              color === 'primary' && 'text-primary',
              color === 'secondary' && 'text-secondary',
              color === 'success' && 'text-success',
              color === 'warning' && 'text-warning',
              color === 'destructive' && 'text-destructive'
            )}
          />
        )}
      </CardHeader>
      <CardContent>
        <div className="mb-1 text-2xl font-bold">
          {typeof value === 'number' ? value.toLocaleString() : value}
        </div>
        {subtitle && (
          <p className="mb-2 text-sm text-muted-foreground">{subtitle}</p>
        )}
        {trend && (
          <Badge variant="secondary" className={cn('text-xs', getTrendColor())}>
            {getTrendIcon()}
            <span className="ml-1">
              {trend.value > 0 ? '+' : ''}
              {trend.value}% {trend.label}
            </span>
          </Badge>
        )}
      </CardContent>
    </Card>
  )
}
