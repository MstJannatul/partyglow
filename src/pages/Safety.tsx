import Footer from '@/components/layout/Footer'
import Header from '@/components/layout/Header'
import { SEO } from '@/lib/seo'

export default function Safety() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      <SEO
        title="Safety Guidelines | PartyGo"
        description="Safety tips for booking vendors and handling payments during the PartyGo beta."
        canonicalPath="/safety"
        ogImagePath="/placeholder.svg"
      />
      <Header />
      <main id="main-content" className="container mx-auto px-4 py-10">
        <header className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
            Safety Guidelines
          </h1>
          <p className="mt-2 text-muted-foreground">
            Best practices for a smooth booking experience
          </p>
        </header>

        <section className="prose prose-slate dark:prose-invert max-w-none">
          <h2>Before you pay</h2>
          <ul>
            <li>
              Confirm details with vendors in Messages (date, time, location,
              setup/delivery).
            </li>
            <li>
              Ask vendors to re-state the total and payment method you selected.
            </li>
            <li>Use your payment reference in the payment memo.</li>
          </ul>

          <h2>Payment</h2>
          <ul>
            <li>
              Pay vendors directly using the method you prefer (bank transfer,
              Venmo, Zelle, etc.).
            </li>
            <li>Keep proof of payment (receipt or screenshot).</li>
            <li>Do not send payment to anyone outside your Messages thread.</li>
          </ul>

          <h2>Day of event</h2>
          <ul>
            <li>
              Share any access instructions and contact info with vendors ahead
              of time.
            </li>
            <li>For rentals, take photos at pickup and return.</li>
          </ul>

          <h2>Need help?</h2>
          <p>
            Email <a href="mailto:support@partygo.app">support@partygo.app</a>.
            Include your booking reference.
          </p>
        </section>
      </main>
      <Footer />
    </div>
  )
}
