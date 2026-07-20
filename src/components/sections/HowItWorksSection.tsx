import { Link } from 'react-router-dom'
import { Calendar, MessageCircle, Search, Star } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { GlassCard } from '@/components/ui/glass-card'

interface HowItWorksSectionProps {
  onBecomeVendorClick?: () => void
}

const steps = [
  {
    icon: Search,
    title: 'Discover & Browse',
    description:
      'Search through our curated selection of verified vendors. Filter by category, location, price, and ratings to find exactly what you need.',
    color: 'from-pastel-pink to-pastel-lavender'
  },
  {
    icon: MessageCircle,
    title: 'Connect & Quote',
    description:
      'Message vendors directly through our platform. Get personalized quotes, ask questions, and discuss your specific party requirements.',
    color: 'from-pastel-blue to-pastel-pink'
  },
  {
    icon: Calendar,
    title: 'Book & Secure',
    description:
      "Once you've found the perfect vendor, book their services securely. Schedule delivery, setup times, and manage all details in one place.",
    color: 'from-pastel-lavender to-pastel-blue'
  },
  {
    icon: Star,
    title: 'Celebrate & Review',
    description:
      'Enjoy your amazing party! After the event, share your experience by leaving a review to help other party planners.',
    color: 'from-pastel-pink to-pastel-blue'
  }
]

export default function HowItWorksSection({
  onBecomeVendorClick
}: HowItWorksSectionProps) {
  return (
    <section className="bg-gradient-to-b from-muted/30 to-white py-16">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mb-16 text-center">
          <h2 className="mb-4 font-poppins text-3xl font-bold text-primary md:text-4xl lg:text-5xl">
            How PartyGo
            <span className="block bg-gradient-to-r from-pastel-lavender to-pastel-pink bg-clip-text text-transparent">
              Works for You
            </span>
          </h2>
          <p className="mx-auto max-w-3xl text-lg text-muted-foreground">
            Planning your perfect party is just four simple steps away. Our
            streamlined process makes it easy and stress-free.
          </p>
        </div>

        {/* Steps */}
        <div className="relative">
          {/* Connection Line - Desktop */}
          <div className="absolute left-1/2 top-16 hidden h-0.5 w-3/4 -translate-x-1/2 transform bg-gradient-to-r from-pastel-pink via-pastel-blue to-pastel-lavender opacity-30 lg:block"></div>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
            {steps.map((step, index) => {
              const IconComponent = step.icon
              return (
                <div
                  key={index}
                  className="group relative text-center"
                  style={{ animationDelay: `${index * 200}ms` }}
                >
                  {/* Step Number - Mobile/Tablet */}
                  <div className="mb-4 text-center lg:hidden">
                    <span className="inline-flex size-8 items-center justify-center rounded-full bg-gradient-primary font-poppins text-sm font-bold text-white">
                      {index + 1}
                    </span>
                  </div>

                  {/* Icon Container */}
                  <div className="relative mb-6">
                    <div
                      className={`size-20 bg-gradient-to-br ${step.color} mx-auto flex items-center justify-center rounded-2xl shadow-lg transition-transform duration-300 group-hover:scale-110`}
                    >
                      <IconComponent className="size-10 text-white" />
                    </div>

                    {/* Step Number - Desktop */}
                    {/* <div className="absolute -right-3 -top-3 flex hidden h-8 w-8 items-center justify-center rounded-full bg-gradient-primary lg:block"> */}
                    <div className="absolute -right-3 -top-3 hidden size-8 items-center justify-center rounded-full bg-gradient-primary lg:flex">
                      <span className="font-poppins text-sm font-bold text-white">
                        {index + 1}
                      </span>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="space-y-3">
                    <h3 className="font-poppins text-xl font-semibold text-primary">
                      {step.title}
                    </h3>
                    <p className="text-sm leading-relaxed text-muted-foreground">
                      {step.description}
                    </p>
                  </div>

                  {/* Arrow - Desktop */}
                  {index < steps.length - 1 && (
                    <div className="absolute -right-4 top-8 hidden text-pastel-blue opacity-50 lg:block">
                      <svg
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M5 12H19M19 12L12 5M19 12L12 19"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="mt-16 text-center">
          <GlassCard
            variant="frosted"
            className="mx-auto max-w-2xl rounded-2xl p-8"
          >
            <h3 className="mb-4 font-poppins text-2xl font-semibold text-primary">
              Ready to Start Planning?
            </h3>
            <p className="mb-6 text-muted-foreground">
              Join thousands of happy customers who've created unforgettable
              celebrations with PartyGo
            </p>
            <div className="flex flex-col justify-center gap-4 sm:flex-row">
              <Button
                asChild
                variant="gradient"
                className="px-8 py-3 font-poppins font-semibold"
              >
                <Link to="/browse">Find Vendors Now</Link>
              </Button>
              <Button
                variant="outline"
                className="px-8 py-3 font-poppins font-semibold"
                onClick={onBecomeVendorClick}
              >
                Become a Vendor
              </Button>
            </div>
          </GlassCard>
        </div>
      </div>
    </section>
  )
}
