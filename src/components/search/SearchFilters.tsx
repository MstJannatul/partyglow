import { useState } from 'react'
import { MapPin, Shield, Star, Truck } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import { ListingFilters } from '@/pages/Browse'

interface SearchFiltersProps {
  filters: ListingFilters
  onFiltersChange: (filters: Partial<ListingFilters>) => void
}

export const SearchFilters = ({
  filters,
  onFiltersChange
}: SearchFiltersProps) => {
  const [priceRange, setPriceRange] = useState([
    filters.minPrice || 0,
    filters.maxPrice || 1000
  ])

  const handlePriceChange = (values: number[]) => {
    setPriceRange(values)
    onFiltersChange({
      minPrice: values[0],
      maxPrice: values[1]
    })
  }

  const radiusOptions = [
    { value: '5', label: '5 miles' },
    { value: '10', label: '10 miles' },
    { value: '25', label: '25 miles' },
    { value: '50', label: '50 miles' },
    { value: '100', label: '100 miles' }
  ]

  const deliveryOptions = [
    { value: 'pickup', label: 'Pickup Only' },
    { value: 'delivery', label: 'Delivery Available' },
    { value: 'both', label: 'Both Options' }
  ]

  const ratingOptions = [
    { value: '4', label: '4+ Stars' },
    { value: '4.5', label: '4.5+ Stars' },
    { value: '4.8', label: '4.8+ Stars' }
  ]

  return (
    <div className="rounded-xl border border-border/50 bg-card/50 p-6 backdrop-blur-sm">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        {/* Location & Radius */}
        <div className="space-y-3">
          <Label className="flex items-center gap-2 text-sm font-medium">
            <MapPin className="size-4" />
            Location and distance
          </Label>
          <div className="space-y-2">
            <input
              type="text"
              placeholder="Enter location..."
              value={filters.location || ''}
              onChange={(e) => onFiltersChange({ location: e.target.value })}
              className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
            <Select
              value={filters.radius?.toString()}
              onValueChange={(value) =>
                onFiltersChange({ radius: parseInt(value) })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select radius" />
              </SelectTrigger>
              <SelectContent>
                {radiusOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Price Range */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">
            Price: ${priceRange[0]} - ${priceRange[1]}
          </Label>
          <div className="px-2">
            <Slider
              value={priceRange}
              onValueChange={handlePriceChange}
              max={2000}
              min={0}
              step={25}
              className="w-full"
            />
          </div>
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>$0</span>
            <span>$2000+</span>
          </div>
        </div>

        {/* Rating & Delivery */}
        <div className="space-y-3">
          <Label className="flex items-center gap-2 text-sm font-medium">
            <Star className="size-4" />
            Rating and delivery
          </Label>
          <div className="space-y-2">
            <Select
              value={filters.rating?.toString()}
              onValueChange={(value) =>
                onFiltersChange({ rating: parseFloat(value) })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Minimum rating" />
              </SelectTrigger>
              <SelectContent>
                {ratingOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={filters.delivery_type}
              onValueChange={(value) =>
                onFiltersChange({ delivery_type: value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Delivery options" />
              </SelectTrigger>
              <SelectContent>
                {deliveryOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    <div className="flex items-center gap-2">
                      <Truck className="size-4" />
                      {option.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Verified Vendors & Quick Filters */}
        <div className="space-y-3">
          <Label className="flex items-center gap-2 text-sm font-medium">
            <Shield className="size-4" />
            Vendor Options
          </Label>
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Switch
                id="verified-only"
                checked={filters.verified_only || false}
                onCheckedChange={(checked) =>
                  onFiltersChange({ verified_only: checked })
                }
              />
              <Label htmlFor="verified-only" className="text-sm">
                Verified vendors only
              </Label>
            </div>
          </div>

          {/* Active Filters */}
          <div className="space-y-2">
            <Label className="text-xs font-medium text-muted-foreground">
              Active Filters
            </Label>
            <div className="flex flex-wrap gap-1">
              {filters.location && (
                <Badge variant="secondary" className="text-xs">
                  📍 {filters.location}
                </Badge>
              )}
              {filters.radius && (
                <Badge variant="secondary" className="text-xs">
                  📏 {filters.radius} miles
                </Badge>
              )}
              {filters.rating && (
                <Badge variant="secondary" className="text-xs">
                  ⭐ {filters.rating}+ stars
                </Badge>
              )}
              {filters.verified_only && (
                <Badge variant="secondary" className="text-xs">
                  ✅ Verified
                </Badge>
              )}
              {filters.delivery_type && (
                <Badge variant="secondary" className="text-xs">
                  🚚 {filters.delivery_type}
                </Badge>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
