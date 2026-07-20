import Footer from '@/components/layout/Footer'
import Header from '@/components/layout/Header'
import { SEO } from '@/lib/seo'

export default function Privacy() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      <SEO
        title="Privacy Policy | PartyGo"
        description="PartyGo Privacy Policy: how we collect, use, and protect your data."
        canonicalPath="/privacy"
        ogImagePath="/placeholder.svg"
      />
      <Header />
      <main id="main-content" className="container mx-auto px-4 py-10">
        <header className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
            Privacy Policy
          </h1>
          <p className="mt-2 text-muted-foreground">Updated: August 2025</p>
        </header>

        <section className="prose prose-slate dark:prose-invert max-w-none">
          <h2>What we collect</h2>
          <p>
            Account info (name, email), booking details, and vendor
            communications. We may use cookies to improve your experience.
          </p>

          <h2>How we use it</h2>
          <p>
            To operate the marketplace, enable messaging, support bookings, and
            improve the product. We do not sell your data.
          </p>

          <h2>Sharing</h2>
          <p>
            We share information with vendors you book with, and service
            providers we use to run PartyGo.
          </p>

          <h2>Security</h2>
          <p>
            We take reasonable measures to protect your data. No method is 100%
            secure. Please use a strong, unique password.
          </p>

          <h2>Your choices</h2>
          <p>
            Contact us to request access, correction, or deletion of your data
            as permitted by law.
          </p>

          <h2>Contact</h2>
          <p>
            Email <a href="mailto:support@partygo.app">support@partygo.app</a>{' '}
            for privacy questions.
          </p>
        </section>
      </main>
      <Footer />
    </div>
  )
}
