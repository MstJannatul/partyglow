import { Quote, Star } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { GlassCard } from '@/components/ui/glass-card'

const testimonials = [
  {
    id: 1,
    name: 'Sarah Johnson',
    role: 'Birthday Party Host',
    content:
      "PartyGo made planning my daughter's 16th birthday so easy! We found an amazing DJ and photo booth through the platform. Everything was seamless and the vendors were professional.",
    rating: 5,
    image:
      'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=100&h=100&fit=crop&crop=face',
    event: 'Sweet 16 Birthday Party'
  },
  {
    id: 2,
    name: 'Michael Chen',
    role: 'Corporate Event Manager',
    content:
      "We used PartyGo for our company's annual celebration. The variety of vendors and the quality of service exceeded our expectations. Highly recommend!",
    rating: 5,
    image:
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face',
    event: 'Corporate Annual Party'
  },
  {
    id: 3,
    name: 'Emily Rodriguez',
    role: 'Wedding Planner',
    content:
      'As a professional planner, I love how PartyGo connects me with reliable vendors. The platform is user-friendly and the vendor quality is consistently excellent.',
    rating: 5,
    image:
      'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face',
    event: 'Wedding Reception'
  },
  {
    id: 4,
    name: 'David Thompson',
    role: 'Anniversary Celebration',
    content:
      'Finding the perfect caterer for our 25th anniversary was a breeze with PartyGo. The food was incredible and the service was impeccable. Thank you!',
    rating: 5,
    image:
      'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face',
    event: '25th Anniversary Party'
  }
]

export default function TestimonialsSection() {
  return (
    <section className="bg-white py-16">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mb-16 text-center">
          <h2 className="mb-4 font-poppins text-3xl font-bold text-primary md:text-4xl lg:text-5xl">
            What Our Customers
            <span className="block bg-gradient-to-r from-pastel-blue to-pastel-lavender bg-clip-text text-transparent">
              Are Saying
            </span>
          </h2>
          <p className="mx-auto max-w-3xl text-lg text-muted-foreground">
            Real stories from real customers who created unforgettable
            celebrations with PartyGo
          </p>
        </div>

        {/* Testimonials Grid */}
        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-2">
          {testimonials.map((testimonial, index) => (
            <GlassCard
              key={testimonial.id}
              variant="frosted"
              className="hover-scale group cursor-pointer rounded-2xl p-8 transition-all duration-300"
              style={{ animationDelay: `${index * 150}ms` }}
            >
              {/* Quote Icon */}
              <div className="mb-6 flex items-start justify-between">
                <Quote className="size-8 text-pastel-blue opacity-50" />
                <div className="flex gap-1">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star
                      key={i}
                      className="size-4 fill-current text-yellow-400"
                    />
                  ))}
                </div>
              </div>

              {/* Content */}
              <blockquote className="mb-6 font-inter leading-relaxed text-foreground">
                "{testimonial.content}"
              </blockquote>

              {/* Author Info */}
              <div className="flex items-center gap-4">
                <img
                  src={testimonial.image}
                  alt={testimonial.name}
                  className="size-12 rounded-full object-cover"
                />
                <div>
                  <h4 className="font-poppins font-semibold text-primary">
                    {testimonial.name}
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    {testimonial.event}
                  </p>
                </div>
              </div>

              {/* Decorative Gradient Line */}
              <div className="mt-6 h-1 scale-x-0 transform rounded-full bg-gradient-to-r from-pastel-pink to-pastel-blue transition-transform duration-500 group-hover:scale-x-100"></div>
            </GlassCard>
          ))}
        </div>

        {/* Customer Stats */}
        <div className="mx-auto mt-16 grid max-w-4xl grid-cols-1 gap-8 md:grid-cols-3">
          <div className="text-center">
            <div className="mb-2 font-poppins text-4xl font-bold text-primary">
              4.9/5
            </div>
            <div className="text-muted-foreground">Average Rating</div>
            <div className="mt-2 flex justify-center gap-1">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="size-4 fill-current text-yellow-400" />
              ))}
            </div>
          </div>
          <div className="text-center">
            <div className="mb-2 font-poppins text-4xl font-bold text-primary">
              2,500+
            </div>
            <div className="text-muted-foreground">Happy Reviews</div>
          </div>
          <div className="text-center">
            <div className="mb-2 font-poppins text-4xl font-bold text-primary">
              98%
            </div>
            <div className="text-muted-foreground">Would Recommend</div>
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="mt-12 text-center">
          <GlassCard
            variant="frosted"
            className="mx-auto max-w-md rounded-2xl p-6"
          >
            <h3 className="mb-3 font-poppins text-xl font-semibold text-primary">
              Join Our Happy Customers
            </h3>
            <Button
              variant="gradient"
              className="w-full font-poppins font-medium"
            >
              Start Planning Today
            </Button>
          </GlassCard>
        </div>
      </div>
    </section>
  )
}
