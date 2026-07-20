import Footer from '@/components/layout/Footer'
import Header from '@/components/layout/Header'
import HowItWorksSection from '@/components/sections/HowItWorksSection'
import { SEO } from '@/lib/seo'

const HowItWorks = () => {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SEO
        title="How PartyGo Works – Plan your perfect party"
        description="Discover how PartyGo connects customers with vendors in 4 simple steps: browse, message, book, celebrate."
        canonicalPath="/how-it-works"
        ogImagePath="/placeholder.svg"
        jsonLd={{
          '@context': 'https://schema.org',
          '@type': 'WebPage',
          name: 'How PartyGo Works',
          description:
            'Discover how PartyGo connects customers with vendors in 4 simple steps: browse, message, book, celebrate.',
          url: typeof window !== 'undefined' ? window.location.href : undefined
        }}
      />
      <Header />
      <main id="main-content" className="flex-1">
        <header className="container mx-auto px-4 py-10">
          <h1 className="font-poppins text-3xl font-bold text-foreground md:text-4xl">
            How It Works
          </h1>
          <p className="mt-2 text-muted-foreground">
            A simple, guided journey for customers and vendors.
          </p>
        </header>
        <HowItWorksSection />
      </main>
      <Footer />
    </div>
  )
}

export default HowItWorks
