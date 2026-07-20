import { useNavigate } from 'react-router-dom'
import {
  Calendar,
  CalendarClock,
  MapPin,
  Search,
  ShieldCheck,
  Sparkles
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import GlassCard from '@/components/ui/glass-card'
import { Input } from '@/components/ui/input'
const heroImage = '/lovable-uploads/3a45c547-fe2c-42f1-9465-b90cd6372ebe.png'

interface HeroSectionProps {
  onBecomeVendorClick?: () => void
}

export default function HeroSection({ onBecomeVendorClick }: HeroSectionProps) {
  const navigate = useNavigate()
  return (
    <section className="relative flex min-h-screen items-center justify-center overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <img
          src={heroImage}
          alt="Friends celebrating at a colorful outdoor party with balloons"
          className="saturate-125 size-full object-cover object-[center_40%] brightness-105 filter md:object-center"
          loading="eager"
          decoding="async"
          fetchPriority="high"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-pastel-pink/35 via-pastel-lavender/25 to-transparent"></div>
      </div>

      {/* Content */}
      <div className="container relative z-10 mx-auto px-4 text-center">
        <div className="mx-auto max-w-4xl space-y-8">
          {/* Headline */}
          <div className="animate-fade-in space-y-4">
            <h1 className="font-poppins text-4xl font-bold leading-tight text-foreground md:text-6xl lg:text-7xl">
              Make Every
              <span className="block text-pastel-blue">Celebration</span>
              Unforgettable
            </h1>
            <p className="mx-auto max-w-3xl font-inter text-xl leading-relaxed text-foreground/90 md:text-2xl">
              Connect with verified vendors for tables, DJ services, photo
              booths, catering, and everything you need for the perfect party.
            </p>
          </div>

          {/* Search Bar */}
          <GlassCard
            variant="white"
            className="mx-auto max-w-4xl animate-scale-in rounded-2xl p-6 md:p-8"
          >
            <div className="grid grid-cols-1 gap-4 md:grid-cols-4 md:gap-2">
              {/* What */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 size-5 -translate-y-1/2 transform text-muted-foreground" />
                <Input
                  variant="glass"
                  placeholder="Tables, DJ, Photo Booth..."
                  className="h-12 pl-10 placeholder:text-muted-foreground"
                />
              </div>

              {/* Where */}
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 size-5 -translate-y-1/2 transform text-muted-foreground" />
                <Input
                  variant="glass"
                  placeholder="Enter location"
                  className="h-12 pl-10 placeholder:text-muted-foreground"
                />
              </div>

              {/* When */}
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 size-5 -translate-y-1/2 transform text-muted-foreground" />
                <Input variant="glass" type="date" className="h-12 pl-10" />
              </div>

              {/* Search Button */}
              <Button
                variant="gradient"
                className="btn-gradient h-12 font-poppins text-lg font-semibold"
                onClick={() => navigate('/browse')}
              >
                Find Vendors
              </Button>
            </div>
          </GlassCard>

          {/* Benefits */}
          <div className="mx-auto mt-12 grid max-w-3xl grid-cols-1 gap-6 md:grid-cols-3">
            <GlassCard variant="white" className="rounded-xl p-6">
              <div className="flex items-start gap-3 text-left">
                <ShieldCheck
                  className="size-6 text-primary"
                  aria-hidden="true"
                />
                <div>
                  <div className="font-poppins text-lg font-semibold text-foreground">
                    Trusted Vendors
                  </div>
                  <p className="text-muted-foreground">
                    Only verified professionals — curated for your peace of
                    mind.
                  </p>
                </div>
              </div>
            </GlassCard>
            <GlassCard variant="white" className="rounded-xl p-6">
              <div className="flex items-start gap-3 text-left">
                <Sparkles className="size-6 text-primary" aria-hidden="true" />
                <div>
                  <div className="font-poppins text-lg font-semibold text-foreground">
                    Curated for Celebrations
                  </div>
                  <p className="text-muted-foreground">
                    Designed for birthdays, baby showers, backyard bashes &
                    beyond.
                  </p>
                </div>
              </div>
            </GlassCard>
            <GlassCard variant="white" className="rounded-xl p-6">
              <div className="flex items-start gap-3 text-left">
                <CalendarClock
                  className="size-6 text-primary"
                  aria-hidden="true"
                />
                <div>
                  <div className="font-poppins text-lg font-semibold text-foreground">
                    Book in Minutes
                  </div>
                  <p className="text-muted-foreground">
                    Fast, flexible booking — no phone tag or back-and-forth.
                  </p>
                </div>
              </div>
            </GlassCard>
          </div>

          {/* CTA Buttons */}
          <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Button
              variant="gradient"
              className="btn-gradient px-8 py-3 font-poppins text-lg font-semibold"
              onClick={() => navigate('/browse')}
            >
              Start Planning
            </Button>
            <Button
              variant="outline"
              className="border-white/30 bg-white/20 px-8 py-3 font-poppins text-lg font-semibold text-white hover:bg-white/30"
              onClick={onBecomeVendorClick}
            >
              Become a Vendor
            </Button>
          </div>
        </div>
      </div>

      {/* Floating Elements */}
      <div className="absolute left-10 top-20 animate-float">
        <div className="size-16 rounded-full bg-pastel-pink/30 blur-xl"></div>
      </div>
      <div
        className="absolute bottom-20 right-10 animate-float"
        style={{ animationDelay: '1s' }}
      >
        <div className="size-24 rounded-full bg-pastel-blue/30 blur-xl"></div>
      </div>
      <div
        className="absolute right-20 top-1/2 animate-float"
        style={{ animationDelay: '2s' }}
      >
        <div className="size-12 rounded-full bg-pastel-lavender/30 blur-xl"></div>
      </div>
    </section>
  )
}
