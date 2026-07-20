import { supabase } from '@/integrations/supabase/client'

export interface GuestCartItem {
  id: string
  listingId: string
  vendorId: string
  durationHours: number
  addedAt: Date
}

export class CartService {
  private static GUEST_CART_KEY = 'partygo_guest_cart'

  /**
   * Get guest cart from localStorage with expiration cleanup
   */
  static getGuestCart(): GuestCartItem[] {
    try {
      const cartData = localStorage.getItem(this.GUEST_CART_KEY)
      if (!cartData) return []

      const items = JSON.parse(cartData)
      const now = new Date()

      // Filter out expired items (90 minutes from addedAt)
      const validItems = items.filter((item: any) => {
        const addedAt = new Date(item.addedAt)
        const expiresAt = new Date(addedAt.getTime() + 90 * 60 * 1000) // 90 minutes
        return now < expiresAt
      })

      // Save cleaned cart back if any items were removed
      if (validItems.length !== items.length) {
        this.saveGuestCart(
          validItems.map((item: any) => ({
            ...item,
            addedAt: new Date(item.addedAt)
          }))
        )
      }

      return validItems.map((item: any) => ({
        ...item,
        addedAt: new Date(item.addedAt)
      }))
    } catch (error) {
      console.error('Error reading guest cart:', error)
      return []
    }
  }

  /**
   * Save guest cart to localStorage
   */
  static saveGuestCart(items: GuestCartItem[]): void {
    try {
      localStorage.setItem(this.GUEST_CART_KEY, JSON.stringify(items))
    } catch (error) {
      console.error('Error saving guest cart:', error)
    }
  }

  /**
   * Add item to guest cart
   */
  static addToGuestCart(item: Omit<GuestCartItem, 'id' | 'addedAt'>): void {
    const guestCart = this.getGuestCart()

    // Check if item already exists
    const existingIndex = guestCart.findIndex(
      (cartItem) =>
        cartItem.listingId === item.listingId &&
        cartItem.vendorId === item.vendorId
    )

    if (existingIndex !== -1) {
      // Update existing item
      guestCart[existingIndex].durationHours = item.durationHours
    } else {
      // Add new item
      guestCart.push({
        ...item,
        id: `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        addedAt: new Date()
      })
    }

    this.saveGuestCart(guestCart)
  }

  /**
   * Remove item from guest cart
   */
  static removeFromGuestCart(itemId: string): void {
    const guestCart = this.getGuestCart()
    const filteredCart = guestCart.filter((item) => item.id !== itemId)
    this.saveGuestCart(filteredCart)
  }

  /**
   * Clear guest cart
   */
  static clearGuestCart(): void {
    localStorage.removeItem(this.GUEST_CART_KEY)
  }

  /**
   * Merge guest cart with authenticated user cart
   */
  static async mergeGuestCartWithUserCart(userId: string): Promise<void> {
    const guestCart = this.getGuestCart()

    if (guestCart.length === 0) return

    try {
      // Add each guest cart item to the user's cart
      for (const item of guestCart) {
        await supabase.rpc('insert_cart_item', {
          p_customer_id: userId,
          p_listing_id: item.listingId,
          p_vendor_id: item.vendorId,
          p_duration_hours: item.durationHours
        })
      }

      // Clear guest cart after successful merge
      this.clearGuestCart()
    } catch (error) {
      console.error('Error merging guest cart:', error)
      throw error
    }
  }

  /**
   * Validate cart items against availability
   */
  static async validateCartAvailability(cartItems: any[]): Promise<{
    valid: boolean
    conflicts: Array<{ itemId: string; reason: string }>
  }> {
    const conflicts: Array<{ itemId: string; reason: string }> = []

    for (const item of cartItems) {
      // For now, we'll just return valid since we don't have a specific date
      // In a real implementation, this would check against the selected booking date
    }

    return {
      valid: conflicts.length === 0,
      conflicts
    }
  }

  /**
   * Calculate cart totals with fees and taxes on the server (Edge Function)
   */
  static async calculateCartTotalsServer(cartItems: any[]): Promise<{
    subtotal: number
    platformFee: number
    estimatedTax: number
    total: number
  }> {
    try {
      const { data, error } = await supabase.functions.invoke(
        'pricing-engine',
        {
          body: { items: cartItems }
        }
      )
      if (error) throw error as any
      return (
        (data as any) ?? {
          subtotal: 0,
          platformFee: 0,
          estimatedTax: 0,
          total: 0
        }
      )
    } catch (e) {
      console.warn('pricing-engine failed, falling back to local totals', e)
      return this.calculateCartTotalsLocal(cartItems)
    }
  }

  /**
   * Local fallback totals calculation (kept for resilience)
   */
  static calculateCartTotalsLocal(cartItems: any[]): {
    subtotal: number
    platformFee: number
    estimatedTax: number
    total: number
  } {
    const subtotal = cartItems.reduce((sum: number, item: any) => {
      const price = item?.listing?.price ?? item?.price ?? 0
      const duration = item?.duration_hours ?? item?.durationHours ?? 1
      const quantity = item?.quantity ?? 1
      return sum + price * duration * quantity
    }, 0)

    const platformFee = subtotal * 0.05 // 5% platform fee
    const estimatedTax = subtotal * 0.08 // 8% estimated tax
    const total = subtotal + platformFee + estimatedTax

    return {
      subtotal,
      platformFee,
      estimatedTax,
      total
    }
  }
}

export default CartService
