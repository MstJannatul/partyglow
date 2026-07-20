import { Link } from 'react-router-dom'
import {
  CalendarDays,
  CheckCircle2,
  MessageCircle,
  Rocket,
  Sparkles
} from 'lucide-react'

import Footer from '@/components/layout/Footer'
import Header from '@/components/layout/Header'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { SEO } from '@/lib/seo'

const BecomeVendor = () => {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SEO
        title="Become a Vendor – Earn with PartyGo"
        description="Join PartyGo to reach customers, manage bookings, and grow your party services business."
        canonicalPath="/become-vendor"
        ogImagePath="/placeholder.svg"
        jsonLd={{
          '@context': 'https://schema.org',
          '@type': 'WebPage',
          name: 'Become a Vendor',
          description:
            'Join PartyGo to reach customers, manage bookings, and grow your party services business.',
          url: typeof window !== 'undefined' ? window.location.href : undefined
        }}
      />
      <Header />
      <main id="main-content" className="flex-1">
        <header className="container mx-auto px-4 py-10">
          <h1 className="font-poppins text-3xl font-bold text-foreground md:text-4xl">
            Become a Vendor
          </h1>
          <p className="mt-2 max-w-2xl text-muted-foreground">
            Showcase your services, talk to customers, and manage bookings in
            one place.
          </p>
        </header>

        <section className="container mx-auto grid gap-6 px-4 pb-12 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="size-5 text-primary" />
                Why join PartyGo?
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              <ul className="list-disc space-y-2 pl-5">
                <li>Get discovered by ready-to-book customers</li>
                <li>In-platform messaging to keep details organized</li>
                <li>Simple booking workflow with clear timelines</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Rocket className="size-5 text-primary" />
                Getting started is easy
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              <ol className="list-decimal space-y-2 pl-5">
                <li>Create your listing with photos and pricing</li>
                <li>Set your availability and response time</li>
                <li>Respond to requests and confirm bookings</li>
              </ol>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="size-5 text-primary" />
                Ready to go
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button asChild variant="gradient" className="w-full">
                <Link to="/dashboard/vendor#listings">
                  Create your first listing
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full">
                <Link to="/?signup=vendor">Sign up as Vendor</Link>
              </Button>
              <Button asChild variant="ghost" className="w-full">
                <Link to="/messages" className="flex items-center gap-2">
                  <MessageCircle className="size-4" />
                  Talk to customers
                </Link>
              </Button>
            </CardContent>
          </Card>
        </section>

        <section className="container mx-auto px-4 pb-16">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarDays className="size-5 text-primary" />
                What vendors say
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              <p>
                “PartyGo makes it simple to communicate and book – I spend more
                time serving clients and less time juggling apps.”
              </p>
            </CardContent>
          </Card>
        </section>
      </main>
      <Footer />
    </div>
  )
}

export default BecomeVendor
