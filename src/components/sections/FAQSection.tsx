import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from '@/components/ui/accordion'
import { Button } from '@/components/ui/button'
import { GlassCard } from '@/components/ui/glass-card'

const faqs = [
  {
    question: 'How does PartyGo work?',
    answer:
      'PartyGo is a marketplace that connects party hosts with verified vendors. Simply search for what you need, browse vendor profiles, read reviews, and book directly through our platform. We handle the communication and booking process to make party planning stress-free.'
  },
  {
    question: 'Are all vendors verified?',
    answer:
      "Yes! Every vendor on PartyGo goes through our rigorous verification process. We check their business licenses, insurance, references, and past customer reviews. Our verified badge ensures you're working with legitimate, professional vendors."
  },
  {
    question: 'What types of events do you support?',
    answer:
      'PartyGo supports all types of celebrations - birthday parties, weddings, corporate events, baby showers, anniversaries, graduations, holiday parties, and more. Our vendors cater to events of all sizes, from intimate gatherings to large celebrations.'
  },
  {
    question: 'How do payments work?',
    answer:
      'Payments are processed securely through our platform. You can pay with credit cards, debit cards, or other accepted payment methods. Many vendors require a deposit to secure your booking, with the remaining balance due closer to your event date.'
  },
  {
    question: 'What if I need to cancel or reschedule?',
    answer:
      "Cancellation and rescheduling policies vary by vendor. Each vendor's specific policy is clearly stated on their profile. We recommend reviewing these policies before booking. Our customer support team is always available to help facilitate any necessary changes."
  },
  {
    question: 'Do you offer customer support?',
    answer:
      "Absolutely! Our customer support team is available to help with any questions or issues. You can reach us through our platform messaging, email, or phone. We're here to ensure your party planning experience is smooth and successful."
  },
  {
    question: 'Can I book multiple vendors for one event?',
    answer:
      'Yes! Many customers book multiple vendors for their events - for example, tables and chairs from one vendor, a DJ from another, and catering from a third. Our platform makes it easy to coordinate multiple bookings for your event.'
  },
  {
    question: 'How far in advance should I book?',
    answer:
      'We recommend booking as early as possible, especially for popular dates like weekends and holidays. Many vendors book up 2-6 months in advance for peak seasons. However, you can often find great options even with shorter notice, depending on your location and requirements.'
  }
]

export default function FAQSection() {
  return (
    <section className="bg-gradient-to-b from-white to-muted/30 py-16">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mb-12 text-center">
          <h2 className="mb-4 font-poppins text-3xl font-bold text-primary md:text-4xl lg:text-5xl">
            Frequently Asked
            <span className="block bg-gradient-to-r from-pastel-pink to-pastel-blue bg-clip-text text-transparent">
              Questions
            </span>
          </h2>
          <p className="mx-auto max-w-3xl text-lg text-muted-foreground">
            Get answers to common questions about using PartyGo for your next
            celebration
          </p>
        </div>

        {/* FAQ Accordion */}
        <div className="mx-auto max-w-4xl">
          <GlassCard variant="frosted" className="rounded-2xl p-8">
            <Accordion type="single" collapsible className="space-y-4">
              {faqs.map((faq, index) => (
                <AccordionItem
                  key={index}
                  value={`item-${index}`}
                  className="rounded-xl border border-white/20 px-6 backdrop-blur-sm"
                >
                  <AccordionTrigger className="py-6 text-left font-poppins font-semibold text-primary hover:no-underline">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="pb-6 font-inter leading-relaxed text-muted-foreground">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </GlassCard>
        </div>

        {/* Bottom CTA */}
        <div className="mt-12 text-center">
          <GlassCard
            variant="frosted"
            className="mx-auto max-w-2xl rounded-2xl p-8"
          >
            <h3 className="mb-4 font-poppins text-2xl font-semibold text-primary">
              Still Have Questions?
            </h3>
            <p className="mb-6 text-muted-foreground">
              Our friendly customer support team is here to help you every step
              of the way
            </p>
            <div className="flex flex-col justify-center gap-4 sm:flex-row">
              <Button
                variant="gradient"
                className="px-8 py-3 font-poppins font-semibold"
              >
                Contact Support
              </Button>
              <button className="rounded-lg border border-primary px-8 py-3 font-poppins font-semibold text-primary transition-all duration-300 hover:bg-primary hover:text-white">
                Browse Help Center
              </button>
            </div>
          </GlassCard>
        </div>
      </div>
    </section>
  )
}
