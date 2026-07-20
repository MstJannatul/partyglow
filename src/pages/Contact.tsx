import { useMemo } from 'react'

import Footer from '@/components/layout/Footer'
import Header from '@/components/layout/Header'
import { useAuth } from '@/contexts/AuthContext'
import { SEO } from '@/lib/seo'

export default function Contact() {
  const { user } = useAuth()

  const mailtoHref = useMemo(() => {
    const subject = encodeURIComponent('PartyGo Beta Feedback')
    const body = encodeURIComponent(
      `Hello PartyGo Team,%0D%0A%0D%0AHere is my feedback:%0D%0A%0D%0A- What I was doing:%0D%0A- What went well:%0D%0A- What was confusing:%0D%0A- Any bugs:%0D%0A%0D%0APage: ${window.location.href}%0D%0AUser: ${user?.email ?? 'Guest'}%0D%0A`
    )
    return `mailto:support@partygo.app?subject=${subject}&body=${body}`
  }, [user?.email])

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      <SEO
        title="Contact & Feedback | PartyGo"
        description="Contact PartyGo support and send feedback about your beta experience."
        canonicalPath="/contact"
        ogImagePath="/placeholder.svg"
      />
      <Header />
      <main id="main-content" className="container mx-auto px-4 py-10">
        <header className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
            Contact & Feedback
          </h1>
          <p className="mt-2 text-muted-foreground">
            We read every message and typically respond within 1–2 business
            days.
          </p>
        </header>

        <section className="grid gap-6 md:grid-cols-2">
          <article className="rounded-lg border bg-card/50 p-6">
            <h2 className="mb-2 text-xl font-semibold">Send Feedback</h2>
            <p className="mb-4 text-sm text-muted-foreground">
              Tell us what’s working, what’s confusing, or report a bug. Your
              current page and email will be included automatically.
            </p>
            <a
              href={mailtoHref}
              className="inline-flex items-center justify-center rounded-md border bg-gradient-to-r from-primary to-secondary px-4 py-2 text-primary-foreground shadow-sm transition-colors"
            >
              Email support@partygo.app
            </a>
          </article>

          <aside className="rounded-lg border bg-card/50 p-6">
            <h2 className="mb-2 text-xl font-semibold">
              Other ways to reach us
            </h2>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                • Email:{' '}
                <a href="mailto:support@partygo.app" className="underline">
                  support@partygo.app
                </a>
              </li>
              <li>• Availability: Mon–Fri, 9am–6pm PT</li>
              <li>• Responses may be delayed on holidays/weekends</li>
            </ul>
          </aside>
        </section>
      </main>
      <Footer />
    </div>
  )
}
