import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  BarChart3,
  Heart,
  LogOut,
  Menu,
  MessageCircle,
  Settings,
  User,
  X
} from 'lucide-react'

import { AuthModal } from '@/components/auth/AuthModal'
import { EnhancedCartDrawer } from '@/components/cart/EnhancedCartDrawer'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { useAuth } from '@/contexts/AuthContext'
import { useCartTotal } from '@/hooks/useCart'
import { useFavorites } from '@/hooks/useFavorites'
import { useMessageThreads } from '@/hooks/useMessageThreads'
import { safeRpc } from '@/integrations/supabase/supabaseSafe'
import { queryKeys } from '@/lib/queryKeys'
import { useQueryClient } from '@tanstack/react-query'

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)
  const { itemCount } = useCartTotal()
  const { user, profile, signOut } = useAuth()
  const { data: messageThreads = [] } = useMessageThreads()
  const { data: favorites = [] } = useFavorites()

  const unreadMessagesCount = messageThreads.reduce((total, thread) => {
    const userIsVendor = profile?.role === 'vendor'
    return (
      total +
      (userIsVendor ? thread.unread_count_vendor : thread.unread_count_customer)
    )
  }, 0)
  const favoritesCount = favorites.length || 0

  const queryClient = useQueryClient()

  const prefetchBrowse = () => {
    queryClient.prefetchQuery({
      queryKey: queryKeys.listings({}),
      queryFn: async () => {
        try {
          const data = await safeRpc<any[]>('get_optimized_listings', {
            p_limit: 24,
            p_offset: 0
          })
          return data ?? []
        } catch {
          return []
        }
      },
      staleTime: 30 * 1000
    })
  }

  const handleSignOut = async () => {
    await signOut()
    setIsMenuOpen(false)
  }

  return (
    <header className="glass-nav sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <div className="flex items-center space-x-2">
            <Link to="/" className="flex items-center space-x-2">
              <img
                src="/lovable-uploads/b7197ce2-87b9-487f-8a82-38f1c30a5355.png"
                alt="PartyGo Logo"
                className="size-10 rounded-full object-cover"
              />
              <span className="font-poppins text-xl font-bold text-primary">
                PartyGo
              </span>
            </Link>
            <Link
              to="/contact"
              className="ml-2 rounded-full border border-white/20 px-2 py-0.5 text-[10px] leading-none text-muted-foreground transition-colors hover:text-foreground"
            >
              Beta
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden items-center space-x-8 md:flex">
            <Link
              to="/browse"
              className="font-medium text-foreground transition-colors hover:text-primary"
              onMouseEnter={prefetchBrowse}
              onFocus={prefetchBrowse}
              onTouchStart={prefetchBrowse}
            >
              Browse
            </Link>
            {user && profile && (
              <Link
                to={
                  profile.role === 'vendor'
                    ? '/dashboard/vendor'
                    : '/dashboard/customer'
                }
                className="flex items-center gap-1 font-medium text-foreground transition-colors hover:text-primary"
              >
                <BarChart3 className="size-4" />
                Dashboard
              </Link>
            )}
            <Link
              to="/how-it-works"
              className="font-medium text-foreground transition-colors hover:text-primary"
            >
              How It Works
            </Link>
            <Link
              to="/become-vendor"
              className="font-medium text-foreground transition-colors hover:text-primary"
            >
              Become a Vendor
            </Link>
          </nav>

          {/* User Actions */}
          <div className="flex items-center space-x-4">
            <EnhancedCartDrawer />

            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="relative">
                    <Avatar className="size-8">
                      <AvatarImage src={profile?.avatar_url} />
                      <AvatarFallback>
                        {profile?.full_name
                          ?.split(' ')
                          .map((n) => n[0])
                          .join('')
                          .toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <div className="px-2 py-1.5 text-sm font-medium">
                    {profile?.full_name || 'User'}
                  </div>
                  <div className="px-2 py-1.5 text-xs text-muted-foreground">
                    {user.email}
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link
                      to={
                        profile?.role === 'vendor'
                          ? '/dashboard/vendor'
                          : '/dashboard/customer'
                      }
                      className="flex items-center"
                    >
                      <BarChart3 className="mr-2 size-4" />
                      Dashboard
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/messages" className="flex items-center">
                      <MessageCircle className="mr-2 size-4" />
                      Messages
                      {unreadMessagesCount > 0 && (
                        <span className="ml-auto flex size-5 items-center justify-center rounded-full bg-secondary text-xs font-medium text-primary">
                          {unreadMessagesCount}
                        </span>
                      )}
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/settings" className="flex w-full items-center">
                      <Settings className="mr-2 size-4" />
                      Settings
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={handleSignOut}
                    className="text-destructive"
                  >
                    <LogOut className="mr-2 size-4" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button
                variant="gradient"
                className="font-medium"
                onClick={() => setIsAuthModalOpen(true)}
              >
                Sign In
              </Button>
            )}

            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? (
                <X className="size-5" />
              ) : (
                <Menu className="size-5" />
              )}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="mt-4 border-t border-white/20 py-4 md:hidden">
            <nav className="flex flex-col space-y-4">
              <Link
                to="/browse"
                className="font-medium text-foreground transition-colors hover:text-primary"
                onMouseEnter={prefetchBrowse}
                onFocus={prefetchBrowse}
                onTouchStart={prefetchBrowse}
              >
                Browse
              </Link>
              {user && profile && (
                <>
                  <Link
                    to={
                      profile.role === 'vendor'
                        ? '/dashboard/vendor'
                        : '/dashboard/customer'
                    }
                    className="flex items-center gap-1 font-medium text-foreground transition-colors hover:text-primary"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <BarChart3 className="size-4" />
                    Dashboard
                  </Link>
                  <Link
                    to="/messages"
                    className="flex items-center gap-1 font-medium text-foreground transition-colors hover:text-primary"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <MessageCircle className="size-4" />
                    Messages
                    {unreadMessagesCount > 0 && (
                      <span className="ml-auto flex size-5 items-center justify-center rounded-full bg-secondary text-xs font-medium text-primary">
                        {unreadMessagesCount}
                      </span>
                    )}
                  </Link>
                  <Link
                    to="/dashboard/customer#favorites"
                    className="flex items-center gap-1 font-medium text-foreground transition-colors hover:text-primary"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <Heart className="size-4" />
                    Favorites
                    {favoritesCount > 0 && (
                      <span className="ml-auto flex size-5 items-center justify-center rounded-full bg-secondary text-xs font-medium text-primary">
                        {favoritesCount}
                      </span>
                    )}
                  </Link>
                </>
              )}
              <Link
                to="/how-it-works"
                className="font-medium text-foreground transition-colors hover:text-primary"
              >
                How It Works
              </Link>
              <Link
                to="/become-vendor"
                className="font-medium text-foreground transition-colors hover:text-primary"
              >
                Become a Vendor
              </Link>
              {user ? (
                <div className="flex flex-col space-y-4 border-t border-white/20 pt-4">
                  <div className="text-sm font-medium text-foreground">
                    {profile?.full_name || 'User'}
                  </div>
                  <Button
                    variant="ghost"
                    className="h-auto justify-start p-0 text-foreground hover:text-primary"
                    onClick={handleSignOut}
                  >
                    <LogOut className="mr-2 size-4" />
                    Sign Out
                  </Button>
                </div>
              ) : (
                <Button
                  variant="gradient"
                  className="mt-4 font-medium"
                  onClick={() => {
                    setIsAuthModalOpen(true)
                    setIsMenuOpen(false)
                  }}
                >
                  Sign In
                </Button>
              )}
            </nav>
          </div>
        )}
      </div>

      {/* Auth Modal */}
      <AuthModal open={isAuthModalOpen} onOpenChange={setIsAuthModalOpen} />
    </header>
  )
}
