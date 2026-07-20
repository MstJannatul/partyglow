import { useCallback, useEffect, useState } from 'react'
import { useLocation, useSearchParams } from 'react-router-dom'

import { AuthModal } from '@/components/auth/AuthModal'
import Footer from '@/components/layout/Footer'
import Header from '@/components/layout/Header'
import FAQSection from '@/components/sections/FAQSection'
import FeaturedVendorsSection from '@/components/sections/FeaturedVendorsSection'
import HeroSection from '@/components/sections/HeroSection'
import HowItWorksSection from '@/components/sections/HowItWorksSection'
import TestimonialsSection from '@/components/sections/TestimonialsSection'
import { safeRpc } from '@/integrations/supabase/supabaseSafe'
import { queryKeys } from '@/lib/queryKeys'
import { SEO } from '@/lib/seo'
import { useQueryClient } from '@tanstack/react-query'

const Index = () => {
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [defaultRole, setDefaultRole] = useState<'customer' | 'vendor'>(
    'customer'
  )
  const queryClient = useQueryClient()

  useEffect(() => {
    // Check if we should open the auth modal based on navigation state or URL parameters
    const signupParam = searchParams.get('signup')

    if (location.state?.openAuth) {
      // TODO: will remove timeout and handle it properly
      // Use setTimeout to avoid synchronous state updates in effect
      setTimeout(() => {
        setShowAuthModal(true)
        // Clear the state to prevent re-opening on page refresh
        window.history.replaceState({}, document.title)
      }, 0)
    } else if (signupParam === 'vendor') {
      setTimeout(() => {
        setDefaultRole('vendor')
        setShowAuthModal(true)
      }, 0)
    }
  }, [location.state, searchParams])

  // Prefetch browse listings after initial sections load to speed up /browse navigation
  useEffect(() => {
    const run = () => {
      queryClient.prefetchQuery({
        queryKey: queryKeys.listings({}),
        queryFn: async () => {
          try {
            const data = await safeRpc<any[]>('get_optimized_listings', {
              p_limit: 24,
              p_offset: 0
            })
            return data ?? []
          } catch (_) {
            return []
          }
        },
        staleTime: 30 * 1000
      })
    }

    if (typeof (window as any).requestIdleCallback === 'function') {
      ;(window as any).requestIdleCallback(run)
    } else {
      setTimeout(run, 500)
    }
  }, [queryClient])

  const handleBecomeVendorClick = useCallback(() => {
    setDefaultRole('vendor')
    setShowAuthModal(true)
  }, [])

  return (
    <div className="min-h-screen">
      <SEO
        title="PartyGo – Book trusted party vendors, services, and supplies"
        description="Transform your celebrations with PartyGo - connect with verified vendors for tables, DJ services, photo booths, catering and everything you need for unforgettable parties"
        canonicalPath="/"
        ogImagePath="/placeholder.svg"
        jsonLd={[
          {
            '@context': 'https://schema.org',
            '@type': 'Organization',
            name: 'PartyGo',
            url: typeof window !== 'undefined' ? window.location.origin : '',
            logo:
              typeof window !== 'undefined'
                ? `${window.location.origin}/favicon.ico`
                : ''
          },
          {
            '@context': 'https://schema.org',
            '@type': 'WebSite',
            name: 'PartyGo',
            url: typeof window !== 'undefined' ? window.location.origin : '',
            potentialAction: {
              '@type': 'SearchAction',
              target:
                typeof window !== 'undefined'
                  ? `${window.location.origin}/browse?search={search_term_string}`
                  : '/browse?search={search_term_string}',
              'query-input': 'required name=search_term_string'
            }
          }
        ]}
      />
      <Header />
      <main id="main-content">
        <HeroSection onBecomeVendorClick={handleBecomeVendorClick} />

        <FeaturedVendorsSection />
        <HowItWorksSection onBecomeVendorClick={handleBecomeVendorClick} />
        <TestimonialsSection />
        <FAQSection />
      </main>
      <Footer />

      {/* Auth Modal for protected route redirects */}
      <AuthModal
        open={showAuthModal}
        onOpenChange={setShowAuthModal}
        defaultRole={defaultRole}
      />
    </div>
  )
}

export default Index
