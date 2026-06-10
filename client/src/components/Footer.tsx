import { Link } from 'react-router-dom'
import { PawPrint, Mail, Phone, MapPin, Globe, MessageCircle, Camera } from 'lucide-react'

const quickLinks = [
  { label: 'Knowledge', path: '/knowledge' },
  { label: 'Drugs', path: '/drugs' },
  { label: 'Diseases', path: '/diseases' },
  { label: 'Breeds', path: '/breeds' },
  { label: 'Courses', path: '/courses' },
  { label: 'Articles', path: '/knowledge' },
]

const socialLinks = [
  { icon: Globe, href: '#', label: 'Facebook' },
  { icon: MessageCircle, href: '#', label: 'Twitter' },
  { icon: Camera, href: '#', label: 'Instagram' },
  { icon: Globe, href: '#', label: 'LinkedIn' },
  { icon: Globe, href: '#', label: 'YouTube' },
]

export default function Footer() {
  return (
    <footer className="relative bg-gradient-to-br from-gray-950 via-emerald-950 to-teal-950 border-t border-white/10">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-500/5 via-transparent to-transparent pointer-events-none" />
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-500/25">
                <PawPrint className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-emerald-300 to-teal-300 bg-clip-text text-transparent">
                VetCrack
              </span>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed mb-6">
              Your comprehensive veterinary knowledge platform. Empowering veterinarians, students, and pet owners with accurate, up-to-date information.
            </p>
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-gray-400 text-sm">
                <Mail className="w-4 h-4 text-emerald-400" />
                <span>contact@vetcrack.com</span>
              </div>
              <div className="flex items-center gap-3 text-gray-400 text-sm">
                <Phone className="w-4 h-4 text-emerald-400" />
                <span>+1 (555) 123-4567</span>
              </div>
              <div className="flex items-center gap-3 text-gray-400 text-sm">
                <MapPin className="w-4 h-4 text-emerald-400" />
                <span>Veterinary Medical Center</span>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-3">
              {quickLinks.map((link) => (
                <li key={link.label}>
                  <Link
                    to={link.path}
                    className="text-gray-400 hover:text-emerald-400 text-sm transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-4">Contact</h3>
            <ul className="space-y-3 text-gray-400 text-sm">
              <li>123 Veterinary Street</li>
              <li>Suite 456</li>
              <li>New York, NY 10001</li>
              <li>United States</li>
              <li className="pt-2">
                <span className="text-emerald-400">Mon - Fri:</span> 9:00 AM - 6:00 PM
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-4">Follow Us</h3>
            <p className="text-gray-400 text-sm mb-4">
              Stay connected for the latest veterinary updates and resources.
            </p>
            <div className="flex gap-3">
              {socialLinks.map((social) => {
                const Icon = social.icon
                return (
                  <a
                    key={social.label}
                    href={social.href}
                    className="w-10 h-10 rounded-lg bg-white/5 hover:bg-gradient-to-br hover:from-emerald-500 hover:to-teal-500 flex items-center justify-center text-gray-400 hover:text-white transition-all"
                    aria-label={social.label}
                  >
                    <Icon className="w-5 h-5" />
                  </a>
                )
              })}
            </div>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-gray-500 text-sm">
            &copy; {new Date().getFullYear()} VetCrack. All rights reserved.
          </p>
          <div className="flex gap-6">
            <Link to="/privacy" className="text-gray-500 hover:text-emerald-400 text-sm transition-colors">
              Privacy Policy
            </Link>
            <Link to="/terms" className="text-gray-500 hover:text-emerald-400 text-sm transition-colors">
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
