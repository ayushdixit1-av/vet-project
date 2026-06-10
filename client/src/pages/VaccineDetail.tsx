import { Link, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  Syringe, ChevronRight, FileText, AlertTriangle,
  BookOpen, FlaskConical, Calendar, Building,
  Stethoscope
} from 'lucide-react'
import api from '../lib/api'
import type { Vaccine } from '../types'

function Section({ title, icon: Icon, children }: { title: string; icon?: React.ElementType; children: React.ReactNode }) {
  return (
    <div className="mb-8">
      <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
        {Icon && <Icon className="w-5 h-5 text-emerald-400" />}
        {title}
      </h2>
      <div className="bg-gray-900/60 border border-gray-800 rounded-2xl p-6">
        {children}
      </div>
    </div>
  )
}

export default function VaccineDetail() {
  const { slug } = useParams<{ slug: string }>()

  const { data: vaccine, isLoading, error } = useQuery({
    queryKey: ['vaccine', slug],
    queryFn: () => api.get(`/vaccines/${slug}`).then(r => r.data),
    enabled: !!slug,
  })

  const vac = vaccine as Vaccine

  if (error) return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="text-center">
        <p className="text-red-400 text-lg">Failed to load vaccine</p>
        <p className="text-gray-500 mt-2">Please try again later</p>
      </div>
    </div>
  )

  if (isLoading) return (
    <div className="min-h-screen">
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-4">
        <div className="animate-pulse bg-gray-800/50 h-10 w-1/2 rounded" />
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="animate-pulse bg-gray-800/50 h-32 rounded-2xl" />
        ))}
      </div>
    </div>
  )

  return (
    <div>
      {/* Breadcrumbs */}
      <div className="bg-gray-900/50 border-b border-gray-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <Link to="/" className="hover:text-emerald-400 transition-colors">Home</Link>
            <ChevronRight className="w-3 h-3" />
            <Link to="/vaccines" className="hover:text-emerald-400 transition-colors">Vaccines</Link>
            <ChevronRight className="w-3 h-3" />
            <span className="text-white">{vac?.name}</span>
          </div>
        </div>
      </div>

      {/* Header */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-900 via-teal-900 to-green-900" />
        <div className="relative max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
          <div className="flex items-start gap-6">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 flex items-center justify-center text-emerald-400 shrink-0">
              <Syringe className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">{vac?.name}</h1>
              {vac?.species && (
                <span className="px-3 py-1 rounded-full text-xs font-medium bg-teal-500/10 text-teal-300 border border-teal-500/20">{vac.species}</span>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
        {vac?.description && (
          <Section title="Description" icon={BookOpen}>
            <p className="text-gray-300 leading-relaxed whitespace-pre-wrap">{vac.description}</p>
          </Section>
        )}

        {vac?.indications && (
          <Section title="Indications" icon={Stethoscope}>
            <p className="text-gray-300 leading-relaxed whitespace-pre-wrap">{vac.indications}</p>
          </Section>
        )}

        {vac?.contraindications && (
          <Section title="Contraindications" icon={AlertTriangle}>
            <p className="text-gray-300 leading-relaxed whitespace-pre-wrap">{vac.contraindications}</p>
          </Section>
        )}

        {vac?.dosage && (
          <Section title="Dosage" icon={FlaskConical}>
            <p className="text-gray-300 leading-relaxed whitespace-pre-wrap">{vac.dosage}</p>
          </Section>
        )}

        {vac?.schedule && (
          <Section title="Schedule" icon={Calendar}>
            <p className="text-gray-300 leading-relaxed whitespace-pre-wrap">{vac.schedule}</p>
          </Section>
        )}

        {vac?.route && (
          <Section title="Route of Administration" icon={Syringe}>
            <p className="text-gray-300">{vac.route}</p>
          </Section>
        )}

        {vac?.manufacturer && (
          <Section title="Manufacturer" icon={Building}>
            <p className="text-gray-300">{vac.manufacturer}</p>
          </Section>
        )}

        {vac?.references && (
          <Section title="References" icon={FileText}>
            <p className="text-gray-300 whitespace-pre-wrap">{vac.references}</p>
          </Section>
        )}
      </div>
    </div>
  )
}
