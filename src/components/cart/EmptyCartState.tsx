import { ArrowRight, ShoppingBag, Sparkles } from 'lucide-react'

import { Button } from '@/components/ui/button'

interface EmptyCartStateProps {
  onContinueShopping: () => void
}

export function EmptyCartState({ onContinueShopping }: EmptyCartStateProps) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center p-8 text-center">
      <div className="mb-6 flex size-24 items-center justify-center rounded-full bg-gradient-primary">
        <ShoppingBag className="size-12 text-white" />
      </div>

      <h3 className="mb-2 text-xl font-semibold">Your cart is empty</h3>
      <p className="mb-6 max-w-sm text-muted-foreground">
        Add vendors and services to start planning your party.
      </p>

      <div className="w-full max-w-sm space-y-3">
        <Button
          onClick={onContinueShopping}
          variant="gradient"
          className="w-full"
        >
          <Sparkles className="mr-2 size-4" />
          Discover Party Essentials
          <ArrowRight className="ml-2 size-4" />
        </Button>

        <div className="text-xs text-muted-foreground">
          <p>Popular categories:</p>
          <div className="mt-1 flex flex-wrap justify-center gap-1">
            <span className="rounded bg-muted px-2 py-1 text-xs">
              DJ Services
            </span>
            <span className="rounded bg-muted px-2 py-1 text-xs">Catering</span>
            <span className="rounded bg-muted px-2 py-1 text-xs">
              Photography
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
