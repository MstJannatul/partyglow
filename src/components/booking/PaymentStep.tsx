import { useState } from 'react'
import {
  Banknote,
  CheckCircle,
  CreditCard,
  Lock,
  Shield,
  Smartphone
} from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Separator } from '@/components/ui/separator'
import { getVendorDisplayName } from '@/lib/vendorUtils'
import { trackEvent } from '@/services/clientAnalytics'

interface PaymentStepProps {
  bookingData: any
  cartItems: any[]
  vendorGroups: any[]
  onPaymentComplete: () => void
}

export function PaymentStep({
  bookingData,
  cartItems,
  vendorGroups,
  onPaymentComplete
}: PaymentStepProps) {
  const [paymentMethod, setPaymentMethod] = useState('card')
  const [isProcessing, setIsProcessing] = useState(false)
  const [cardDetails, setCardDetails] = useState({
    number: '',
    expiry: '',
    cvv: '',
    name: ''
  })

  const totalPrice = cartItems.reduce(
    (sum, item) => sum + item.listing.price * item.duration_hours,
    0
  )
  const platformFee = totalPrice * 0.05
  const estimatedTax = totalPrice * 0.08
  const grandTotal = totalPrice + platformFee + estimatedTax

  const handlePayment = async () => {
    setIsProcessing(true)

    // Mock payment processing
    await new Promise((resolve) => setTimeout(resolve, 2000))

    // Track payment completion
    trackEvent('payment_completed', {
      amount: grandTotal,
      paymentMethod: paymentMethod,
      currency: 'USD',
      vendorCount: vendorGroups.length,
      itemCount: cartItems.length
    })

    setIsProcessing(false)
    onPaymentComplete()
  }

  const paymentMethods = [
    {
      id: 'card',
      name: 'Credit/Debit Card',
      icon: CreditCard,
      description: 'Visa, Mastercard, American Express'
    },
    {
      id: 'bank',
      name: 'Bank Transfer',
      icon: Banknote,
      description: 'Direct bank transfer (ACH)'
    },
    {
      id: 'digital',
      name: 'Digital Wallet',
      icon: Smartphone,
      description: 'Apple Pay, Google Pay, PayPal'
    }
  ]

  return (
    <div className="space-y-6 p-6">
      <div className="text-center">
        <h3 className="mb-2 text-lg font-semibold">Complete Your Payment</h3>
        <p className="text-muted-foreground">
          Secure checkout for your ${grandTotal.toFixed(2)} party booking
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
                  <Card key={method.id} className="p-4">
                    <div className="flex items-center space-x-3">
                      <RadioGroupItem value={method.id} id={method.id} />
                      <Label
                        htmlFor={method.id}
                        className="flex-1 cursor-pointer"
                      >
                        <div className="flex items-center gap-3">
                          <Icon className="size-5 text-primary" />
                          <div>
                            <div className="font-medium">{method.name}</div>
                            <div className="text-sm text-muted-foreground">
                              {method.description}
                            </div>
                          </div>
                        </div>
                      </Label>
                    </div>
                  </Card>
                )
              })}
            </div>
          </RadioGroup>

          {/* Payment Form */}
          {paymentMethod === 'card' && (
            <Card className="p-4">
              <h5 className="mb-3 font-medium">Card Details</h5>
              <div className="space-y-3">
                <div>
                  <Label htmlFor="cardName">Cardholder Name</Label>
                  <Input
                    id="cardName"
                    placeholder="John Doe"
                    value={cardDetails.name}
                    onChange={(e) =>
                      setCardDetails({ ...cardDetails, name: e.target.value })
                    }
                    className="mobile-input-stable"
                    autoComplete="cc-name"
                    inputMode="text"
                  />
                </div>
                <div>
                  <Label htmlFor="cardNumber">Card Number</Label>
                  <Input
                    id="cardNumber"
                    placeholder="1234 5678 9012 3456"
                    value={cardDetails.number}
                    onChange={(e) =>
                      setCardDetails({ ...cardDetails, number: e.target.value })
                    }
                    className="mobile-input-stable"
                    autoComplete="cc-number"
                    inputMode="numeric"
                    pattern="[0-9\s]{13,19}"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="expiry">Expiry Date</Label>
                    <Input
                      id="expiry"
                      placeholder="MM/YY"
                      value={cardDetails.expiry}
                      onChange={(e) =>
                        setCardDetails({
                          ...cardDetails,
                          expiry: e.target.value
                        })
                      }
                      className="mobile-input-stable"
                      autoComplete="cc-exp"
                      inputMode="numeric"
                      pattern="[0-9/]*"
                      maxLength={5}
                    />
                  </div>
                  <div>
                    <Label htmlFor="cvv">CVV</Label>
                    <Input
                      id="cvv"
                      placeholder="123"
                      value={cardDetails.cvv}
                      onChange={(e) =>
                        setCardDetails({ ...cardDetails, cvv: e.target.value })
                      }
                      className="mobile-input-stable"
                      autoComplete="cc-csc"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={4}
                    />
                  </div>
                </div>
              </div>
            </Card>
          )}

          {paymentMethod === 'bank' && (
            <Card className="border-blue-200 bg-blue-50 p-4">
              <h5 className="mb-2 font-medium text-blue-800">
                Bank Transfer Instructions
              </h5>
              <div className="space-y-1 text-sm text-blue-700">
                <p>Account: PartyGo Events LLC</p>
                <p>Routing: 123456789</p>
                <p>Account: 987654321</p>
                <p>Reference: Your booking confirmation number</p>
              </div>
            </Card>
          )}

          {paymentMethod === 'digital' && (
            <Card className="p-4">
              <h5 className="mb-3 font-medium">Digital Wallet</h5>
              <div className="space-y-2">
                <Button variant="outline" className="w-full justify-start">
                  <img
                    src="/apple-pay.svg"
                    alt="Apple Pay"
                    className="mr-2 size-6"
                  />
                  Apple Pay
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <img
                    src="/google-pay.svg"
                    alt="Google Pay"
                    className="mr-2 size-6"
                  />
                  Google Pay
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <img src="/paypal.svg" alt="PayPal" className="mr-2 size-6" />
                  PayPal
                </Button>
              </div>
            </Card>
          )}
        </div>

        {/* Order Summary */}
        <div className="space-y-4">
          <h4 className="font-medium">Order Summary</h4>

          <Card className="p-4">
            <div className="space-y-3">
              {vendorGroups.map((group) => (
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

          {/* Security Notice */}
          <Card className="border-green-200 bg-green-50 p-4">
            <div className="mb-2 flex items-center gap-2">
              <Shield className="size-4 text-green-600" />
              <span className="font-medium text-green-800">Secure Payment</span>
            </div>
            <div className="space-y-1 text-xs text-green-700">
              <p>• Your payment is protected by 256-bit SSL encryption</p>
              <p>• We never store your card details</p>
              <p>• Full refund protection for qualified cancellations</p>
            </div>
          </Card>

          {/* Complete Payment Button */}
          <Button
            onClick={handlePayment}
            disabled={isProcessing}
            variant="gradient"
            className="h-12 w-full text-base font-medium"
          >
            {isProcessing ? (
              <div className="flex items-center gap-2">
                <div className="size-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Processing Payment...
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Lock className="size-4" />
                Complete Payment ${grandTotal.toFixed(2)}
              </div>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
