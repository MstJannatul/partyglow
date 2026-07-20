import React from 'react'
import { Music, Package, Settings } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

interface ListingTypeSelectionProps {
  onTypeSelect: (type: 'service' | 'equipment' | 'package') => void
  onCancel?: () => void
}

export const ListingTypeSelection: React.FC<ListingTypeSelectionProps> = ({
  onTypeSelect,
  onCancel
}) => {
  const listingTypes = [
    {
      type: 'service' as const,
      icon: Music,
      title: 'Offer a Service',
      subtitle:
        'DJ services, catering, photography, and other professional services',
      gradient: 'from-primary/10 to-primary/5'
    },
    {
      type: 'equipment' as const,
      icon: Settings,
      title: 'Rent Equipment',
      subtitle:
        'Party supplies, sound equipment, lighting, tables, and rental items',
      gradient: 'from-secondary/10 to-secondary/5'
    },
    {
      type: 'package' as const,
      icon: Package,
      title: 'Create Packages',
      subtitle: 'Bundle multiple items together for convenient booking',
      gradient: 'from-accent/10 to-accent/5'
    }
  ]

  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center">
        <h2 className="text-2xl font-semibold">What would you like to list?</h2>
        <p className="text-muted-foreground">
          Choose the type of listing you want to create
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {listingTypes.map((item) => {
          const IconComponent = item.icon

          return (
            <Card
              key={item.type}
              className="cursor-pointer border-2 transition-all duration-200 hover:scale-105 hover:border-primary/50 hover:shadow-lg"
              onClick={() => onTypeSelect(item.type)}
            >
              <CardContent className="space-y-4 p-6 text-center">
                <div
                  className={`mx-auto size-16 rounded-full bg-gradient-to-br ${item.gradient} flex items-center justify-center`}
                >
                  <IconComponent className="size-8 text-primary" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold">{item.title}</h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {item.subtitle}
                  </p>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {onCancel && (
        <div className="flex justify-center pt-4">
          <Button
            variant="outline"
            onClick={onCancel}
            size="lg"
            className="min-w-[120px]"
          >
            Cancel
          </Button>
        </div>
      )}
    </div>
  )
}
