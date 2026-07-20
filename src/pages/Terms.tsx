import Footer from '@/components/layout/Footer'
import Header from '@/components/layout/Header'
import { SEO } from '@/lib/seo'

export default function Terms() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      <SEO
        title="Terms of Service | PartyGo"
        description="PartyGo Terms of Service: learn the rules for using our party planning marketplace."
        canonicalPath="/terms"
        ogImagePath="/placeholder.svg"
      />
      <Header />
      <main id="main-content" className="container mx-auto px-4 py-10">
        <header className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
            Terms of Service
          </h1>
          <p className="mt-2 text-muted-foreground">Updated: August 2025</p>
        </header>

        <section className="prose prose-slate dark:prose-invert max-w-none">
          <h2>Overview</h2>
          <p>
            PartyGo connects customers with independent vendors offering
            party-related products and services. By using PartyGo, you agree to
            these Terms.
          </p>

          <h2>Accounts</h2>
          <p>
            You are responsible for your account credentials and activity.
            Vendors must provide accurate business information.
          </p>

          <h2>Bookings</h2>
          <p>
            Bookings are requests until vendors confirm. Details, delivery, and
            on-site logistics are coordinated directly between customers and
            vendors in Messages.
          </p>

          <h2>Payments</h2>
          <p>
            During beta, payments are handled directly between customers and
            vendors. PartyGo does not process payments and is not a party to
            transactions. Always use your provided payment reference and keep
            proof of payment.
          </p>

          <h2>Policies</h2>
          <p>
            Each vendor sets their own cancellation, refund, and damage
            policies. Review these carefully before paying.
          </p>

          <h2>Prohibited Conduct</h2>
          <p>
            Do not engage in fraud, spam, harassment, or activities that violate
            applicable laws or third-party rights.
          </p>

          <h2>Liability</h2>
          <p>
            PartyGo is provided “as is.” To the fullest extent permitted by law,
            PartyGo is not liable for vendor performance, payment issues, or
            damages arising from bookings.
          </p>

          <h2>Contact</h2>
          <p>
            Questions? Email{' '}
            <a href="mailto:support@partygo.app">support@partygo.app</a>.
          </p>
        </section>
      </main>
      <Footer />
    </div>
  )
}
