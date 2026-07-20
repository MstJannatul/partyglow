import { useState } from 'react'
import { Clock, MapPin, MessageSquare, Plus, Truck } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { Textarea } from '@/components/ui/textarea'
import { getVendorDisplayName, getVendorInitials } from '@/lib/vendorUtils'

interface BookingCustomizerProps {
  cartItems: any[]
  vendorGroups: any[]
  selectedDate: Date | null
  onCustomizationChange: (data: any) => void
  customizations: Record<string, any>
}

export function BookingCustomizer({
  cartItems,
  vendorGroups,
  selectedDate,
  onCustomizationChange,
  customizations
}: BookingCustomizerProps) {
  const [notes, setNotes] = useState(customizations.notes || '')
  const [deliveryPreferences, setDeliveryPreferences] = useState(
    customizations.deliveryPreferences || {}
  )

  const handleNotesChange = (value: string) => {
    setNotes(value)
    onCustomizationChange({
      ...customizations,
      notes: value
    })
  }

  const handleDeliveryChange = (vendorId: string, preference: any) => {
    const newPreferences = { ...deliveryPreferences, [vendorId]: preference }
    setDeliveryPreferences(newPreferences)
    onCustomizationChange({
      ...customizations,
      deliveryPreferences: newPreferences
    })
  }

  return (
    <div className="space-y-6 p-6">
      <div className="text-center">
        <h3 className="mb-2 text-lg font-semibold">Customize Your Event</h3>
        <p className="text-muted-foreground">
          Add special requirements, delivery preferences, and timeline details
        </p>
      </div>

      <div className="space-y-6">
        {/* Vendor-specific customizations */}
        {vendorGroups.map((group) => (
          <Card key={group.vendor.user_id} className="p-4">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-full bg-primary/10">
                <span className="text-sm font-medium text-primary">
                  {getVendorInitials(group.vendor)}
                </span>
              </div>
              <div>
                <h4 className="font-medium">
                  {getVendorDisplayName(group.vendor)}
                </h4>
                <p className="text-sm text-muted-foreground">
                  {group.items.length} service
                  {group.items.length !== 1 ? 's' : ''}
                </p>
              </div>
            </div>

            <div className="space-y-4">
              {/* Timeline preferences */}
              <div>
                <h5 className="mb-2 flex items-center gap-2 font-medium">
                  <Clock className="size-4" />
                  Setup & Timeline
                </h5>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-auto justify-start p-3"
                  >
                    <div className="text-left">
                      <div className="text-xs font-medium">Setup Time</div>
                      <div className="text-xs text-muted-foreground">
                        30 min before
                      </div>
                    </div>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-auto justify-start p-3"
                  >
                    <div className="text-left">
                      <div className="text-xs font-medium">Breakdown</div>
                      <div className="text-xs text-muted-foreground">
                        30 min after
                      </div>
                    </div>
                  </Button>
                </div>
              </div>

              {/* Delivery preferences */}
              <div>
                <h5 className="mb-2 flex items-center gap-2 font-medium">
                  <Truck className="size-4" />
                  Delivery & Setup
                </h5>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="radio"
                      id={`delivery-${group.vendor.user_id}`}
                      name={`delivery-${group.vendor.user_id}`}
                      className="size-4"
                      defaultChecked
                    />
                    <label
                      htmlFor={`delivery-${group.vendor.user_id}`}
                      className="text-sm"
                    >
                      Standard delivery & setup included
                    </label>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="radio"
                      id={`pickup-${group.vendor.user_id}`}
                      name={`delivery-${group.vendor.user_id}`}
                      className="size-4"
                    />
                    <label
                      htmlFor={`pickup-${group.vendor.user_id}`}
                      className="text-sm"
                    >
                      Self pickup (discount may apply)
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        ))}

        {/* Event location & access */}
        <Card className="p-4">
          <h4 className="mb-3 flex items-center gap-2 font-medium">
            <MapPin className="size-4" />
            Event Location & Access
          </h4>
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium">Event Address</label>
              <Input
                type="text"
                placeholder="Enter your event address..."
                className="mobile-input-stable mt-1"
                autoComplete="street-address"
                inputMode="text"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium">
                  Access instructions
                </label>
                <Input
                  type="text"
                  placeholder="Gate code, parking, etc."
                  className="mobile-input-stable mt-1"
                  autoComplete="off"
                  inputMode="text"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Contact person</label>
                <Input
                  type="text"
                  placeholder="Name & phone number"
                  className="mobile-input-stable mt-1"
                  autoComplete="name tel"
                  inputMode="text"
                />
              </div>
            </div>
          </div>
        </Card>

        {/* Special requirements */}
        <Card className="p-4">
          <h4 className="mb-3 flex items-center gap-2 font-medium">
            <MessageSquare className="size-4" />
            Special Requirements & Notes
          </h4>
          <Textarea
            placeholder="Any special requirements, dietary restrictions, theme details, or other important information for your vendors..."
            value={notes}
            onChange={(e) => handleNotesChange(e.target.value)}
            className="mobile-input-stable min-h-[100px]"
            autoComplete="off"
            inputMode="text"
          />
          <p className="mt-2 text-xs text-muted-foreground">
            These notes will be shared with all your vendors to ensure they're
            fully prepared
          </p>
        </Card>

        {/* Add-ons */}
        <Card className="p-4">
          <h4 className="mb-3 flex items-center gap-2 font-medium">
            <Plus className="size-4" />
            Popular Add-ons
          </h4>
          <div className="grid grid-cols-2 gap-3">
            <Button variant="outline" className="h-auto justify-start p-3">
              <div className="text-left">
                <div className="text-sm font-medium">Event Coordinator</div>
                <div className="text-xs text-muted-foreground">+ $150</div>
              </div>
            </Button>
            <Button variant="outline" className="h-auto justify-start p-3">
              <div className="text-left">
                <div className="text-sm font-medium">Cleanup Service</div>
                <div className="text-xs text-muted-foreground">+ $75</div>
              </div>
            </Button>
          </div>
        </Card>
      </div>
    </div>
  )
}
