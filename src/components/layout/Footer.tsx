import { Link } from 'react-router-dom'
import {
  Facebook,
  Heart,
  Instagram,
  Mail,
  MapPin,
  Phone,
  Twitter
} from 'lucide-react'

export default function Footer() {
  return (
    <footer className="bg-primary text-primary-foreground">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
          {/* Brand Section */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <div className="flex size-10 items-center justify-center rounded-full bg-gradient-primary">
                <span className="font-poppins text-lg font-bold text-white">
                  P
                </span>
              </div>
              <span className="font-poppins text-xl font-bold">PartyGo</span>
            </div>
            <p className="text-sm leading-relaxed text-primary-foreground/80">
              Transform your celebrations with PartyGo - your trusted
              marketplace for party essentials, connecting you with verified
              vendors for unforgettable events.
            </p>
            <div className="flex space-x-4">
              <a
                href="#"
                className="text-primary-foreground/60 transition-colors hover:text-primary-foreground"
              >
                <Facebook className="size-5" />
              </a>
              <a
                href="#"
                className="text-primary-foreground/60 transition-colors hover:text-primary-foreground"
              >
                <Instagram className="size-5" />
              </a>
              <a
                href="#"
                className="text-primary-foreground/60 transition-colors hover:text-primary-foreground"
              >
                <Twitter className="size-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h3 className="font-poppins text-lg font-semibold">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link
                  to="/browse"
                  className="text-sm text-primary-foreground/80 transition-colors hover:text-primary-foreground"
                >
                  Browse Categories
                </Link>
              </li>
              <li>
                <Link
                  to="/browse"
                  className="text-sm text-primary-foreground/80 transition-colors hover:text-primary-foreground"
                >
                  Find Vendors
                </Link>
              </li>
              <li>
                <Link
                  to="/how-it-works"
                  className="text-sm text-primary-foreground/80 transition-colors hover:text-primary-foreground"
                >
                  How It Works
                </Link>
              </li>
              <li>
                <Link
                  to="/become-vendor"
                  className="text-sm text-primary-foreground/80 transition-colors hover:text-primary-foreground"
                >
                  Become a Vendor
                </Link>
              </li>
              <li>
                <Link
                  to="/how-it-works"
                  className="text-sm text-primary-foreground/80 transition-colors hover:text-primary-foreground"
                >
                  Pricing
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div className="space-y-4">
            <h3 className="font-poppins text-lg font-semibold">Support</h3>
            <ul className="space-y-2">
              <li>
                <Link
                  to="/contact"
                  className="text-sm text-primary-foreground/80 transition-colors hover:text-primary-foreground"
                >
                  Help Center
                </Link>
              </li>
              <li>
                <Link
                  to="/contact"
                  className="text-sm text-primary-foreground/80 transition-colors hover:text-primary-foreground"
                >
                  Contact Us
                </Link>
              </li>
              <li>
                <Link
                  to="/safety"
                  className="text-sm text-primary-foreground/80 transition-colors hover:text-primary-foreground"
                >
                  Safety Guidelines
                </Link>
              </li>
              <li>
                <Link
                  to="/terms"
                  className="text-sm text-primary-foreground/80 transition-colors hover:text-primary-foreground"
                >
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link
                  to="/privacy"
                  className="text-sm text-primary-foreground/80 transition-colors hover:text-primary-foreground"
                >
                  Privacy Policy
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div className="space-y-4">
            <h3 className="font-poppins text-lg font-semibold">Get in Touch</h3>
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <Mail className="size-4 text-primary-foreground/60" />
                <a
                  href="mailto:support@partygo.app"
                  className="text-sm text-primary-foreground/80 underline underline-offset-2"
                >
                  support@partygo.app
                </a>
              </div>
              <div className="flex items-center space-x-3">
                <Phone className="size-4 text-primary-foreground/60" />
                <span className="text-sm text-primary-foreground/80">
                  1-800-PARTYGO
                </span>
              </div>
              <div className="flex items-center space-x-3">
                <MapPin className="size-4 text-primary-foreground/60" />
                <span className="text-sm text-primary-foreground/80">
                  Available Nationwide
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="mt-8 flex flex-col items-center justify-between border-t border-primary-foreground/20 pt-8 md:flex-row">
          <p className="text-sm text-primary-foreground/60">
            © 2024 PartyGo. All rights reserved.
          </p>
          <p className="mt-4 flex items-center text-sm text-primary-foreground/60 md:mt-0">
            Made with <Heart className="mx-1 size-4 text-secondary" /> for party
            planners everywhere
          </p>
        </div>
      </div>
    </footer>
  )
}
