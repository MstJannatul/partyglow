import { useEffect, useState } from 'react'
import {
  AlertCircle,
  Banknote,
  CheckCircle,
  Clock,
  Copy,
  CreditCard,
  Info,
  Smartphone
} from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Separator } from '@/components/ui/separator'
import { Textarea } from '@/components/ui/textarea'
import { useBookingFlow } from '@/contexts/BookingFlowContext'
import { useToast } from '@/hooks/use-toast'
import { getVendorDisplayName } from '@/lib/vendorUtils'

export function UserHandledPaymentStep() {
  const { state, updateBookingData, generatePaymentReference } =
    useBookingFlow()
  const { toast } = useToast()
  const [paymentMethod, setPaymentMethod] = useState('bank_transfer')
  const [specialInstructions, setSpecialInstructions] = useState('')
  const [paymentReference, setPaymentReference] = useState('')

  useEffect(() => {
    if (!paymentReference) {
      const ref = generatePaymentReference()
      // TODO: will use better approach later other than setTimeout
      setTimeout(() => {
        setPaymentReference(ref)
      }, 0)
    }
  }, [paymentReference, generatePaymentReference])

  useEffect(() => {
    updateBookingData({
      paymentMethod,
      paymentReference
    })
  }, [paymentMethod, paymentReference, updateBookingData])

  const totalPrice = state.cartItems.reduce(
    (sum, item) => sum + item.listing.price * item.duration_hours,
    0
  )
  const platformFee = totalPrice * 0.05
  const estimatedTax = totalPrice * 0.08
  const grandTotal = totalPrice + platformFee + estimatedTax

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    toast({
      title: 'Copied!',
      description: `${label} copied to clipboard`
    })
  }

  const paymentMethods = [
    {
      id: 'bank_transfer',
      name: 'Bank Transfer',
      icon: Banknote,
      description: 'Direct bank transfer (preferred)',
      processingTime: '1-2 business days'
    },
    {
      id: 'venmo',
      name: 'Venmo',
      icon: Smartphone,
      description: 'Send via Venmo app',
      processingTime: 'Instant'
    },
    {
      id: 'zelle',
      name: 'Zelle',
      icon: CreditCard,
      description: 'Quick bank-to-bank transfer',
      processingTime: 'Instant'
    }
  ]

  const selectedMethod = paymentMethods.find((m) => m.id === paymentMethod)

  return (
    <div className="space-y-6 p-6">
      <div className="text-center">
        <h3 className="mb-2 text-lg font-semibold">Payment Instructions</h3>
        <p className="text-muted-foreground">
          Complete your ${grandTotal.toFixed(2)} party booking with secure
          payment
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Payment Methods */}
        <div className="space-y-4">
          <h4 className="font-medium">Choose Payment Method</h4>

          <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod}>
            <div className="space-y-3">
              {paymentMethods.map((method) => {
                const Icon = method.icon
                return (
                  <Card
                    key={method.id}
                    className="p-4 transition-colors hover:bg-accent/50"
                  >
                    <div className="flex items-center space-x-3">
                      <RadioGroupItem value={method.id} id={method.id} />
                      <Label
                        htmlFor={method.id}
                        className="flex-1 cursor-pointer"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Icon className="size-5 text-primary" />
                            <div>
                              <div className="font-medium">{method.name}</div>
                              <div className="text-sm text-muted-foreground">
                                {method.description}
                              </div>
                            </div>
                          </div>
                          <Badge variant="outline" className="ml-2">
                            <Clock className="mr-1 size-3" />
                            {method.processingTime}
                          </Badge>
                        </div>
                      </Label>
                    </div>
                  </Card>
                )
              })}
            </div>
          </RadioGroup>

          {/* Payment Instructions */}
          <Card className="border-blue-200 bg-blue-50 p-4">
            <div className="flex items-start gap-3">
              <Info className="mt-0.5 size-5 text-blue-600" />
              <div className="flex-1 space-y-3">
                <h5 className="font-medium text-blue-800">
                  {selectedMethod?.name} Instructions
                </h5>
                <div className="space-y-2 text-sm text-blue-700">
                  <p>
                    During our public beta, payments are handled directly with
                    your vendors. They will share their exact{' '}
                    {selectedMethod?.name.toLowerCase()} details with you in the
                    Messages thread for this booking.
                  </p>
                  <ul className="list-disc space-y-1 pl-5">
                    <li>
                      Only send payment to your vendor inside the Messages
                      thread
                    </li>
                    <li>
                      Include your payment reference in the memo:{' '}
                      <span className="font-mono font-medium">
                        {paymentReference}
                      </span>
                    </li>
                    <li>Keep your receipt or screenshot as proof of payment</li>
                  </ul>
                </div>
              </div>
            </div>
          </Card>

          {/* Special Instructions */}
          <div className="space-y-2">
            <Label htmlFor="instructions">
              Special Instructions (Optional)
            </Label>
            <Textarea
              id="instructions"
              placeholder="Any special requests or delivery instructions..."
              value={specialInstructions}
              onChange={(e) => setSpecialInstructions(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        {/* Order Summary */}
        <div className="space-y-4">
          <h4 className="font-medium">Order Summary</h4>

          <Card className="p-4">
            <div className="space-y-3">
              {state.vendorGroups.map((group) => (
                <div key={group.vendor.user_id}>
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-sm font-medium">
                      {getVendorDisplayName(group.vendor)}
                    </span>
                    <span className="text-sm">
                      ${group.totalPrice.toFixed(2)}
                    </span>
                  </div>
                  {group.items.map((item: any) => (
                    <div
                      key={item.id}
                      className="ml-2 text-xs text-muted-foreground"
                    >
                      {item.listing.title} × {item.duration_hours}h
                    </div>
                  ))}
                </div>
              ))}

              <Separator />

              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>${totalPrice.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Platform fee</span>
                  <span>${platformFee.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Estimated tax</span>
                  <span>${estimatedTax.toFixed(2)}</span>
                </div>
                <Separator />
                <div className="flex justify-between font-semibold">
                  <span>Total</span>
                  <span className="text-primary">${grandTotal.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </Card>

          {/* Payment Reference */}
          <Card className="border-green-200 bg-green-50 p-4">
            <div className="mb-2 flex items-center gap-2">
              <CheckCircle className="size-4 text-green-600" />
              <span className="font-medium text-green-800">
                Payment Reference
              </span>
            </div>
            <div className="text-sm text-green-700">
              <p className="mb-2">Your unique payment reference:</p>
              <div className="flex items-center gap-2 rounded border bg-white p-2">
                <code className="font-mono font-medium">
                  {paymentReference}
                </code>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    copyToClipboard(paymentReference, 'Payment reference')
                  }
                >
                  <Copy className="size-3" />
                </Button>
              </div>
              <p className="mt-2 text-xs">
                Include this reference with your payment so we can match it to
                your booking.
              </p>
            </div>
          </Card>

          {/* Important Notice */}
          <Card className="border-amber-200 bg-amber-50 p-4">
            <div className="flex items-start gap-2">
              <AlertCircle className="mt-0.5 size-4 text-amber-600" />
              <div className="text-xs text-amber-700">
                <p className="mb-1 font-medium">Important:</p>
                <ul className="space-y-1">
                  <li>• Payment must be received within 24 hours</li>
                  <li>• Always include your payment reference</li>
                  <li>• We'll confirm payment and notify vendors</li>
                  <li>• You'll receive updates via messages</li>
                </ul>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
