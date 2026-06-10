import { Link, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  Stethoscope, ChevronRight, FileText, AlertTriangle,
  BookOpen, Syringe, Activity, Bandage,
  ClipboardList
} from 'lucide-react'
import api from '../lib/api'
import type { Procedure } from '../types'

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

export default function ProcedureDetail() {
  const { slug } = useParams<{ slug: string }>()

  const { data: procedure, isLoading, error } = useQuery({
    queryKey: ['procedure', slug],
    queryFn: () => api.get(`/procedures/${slug}`).then(r => r.data),
    enabled: !!slug,
  })

  const proc = procedure as Procedure

  if (error) return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="text-center">
        <p className="text-red-400 text-lg">Failed to load procedure</p>
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
            <Link to="/procedures" className="hover:text-emerald-400 transition-colors">Procedures</Link>
            <ChevronRight className="w-3 h-3" />
            <span className="text-white">{proc?.name}</span>
          </div>
        </div>
      </div>

      {/* Header */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-900 via-teal-900 to-green-900" />
        <div className="relative max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
          <div className="flex items-start gap-6">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 flex items-center justify-center text-emerald-400 shrink-0">
              <Stethoscope className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">{proc?.name}</h1>
              <div className="flex flex-wrap gap-3 mt-3">
                {proc?.species && (
                  <span className="px-3 py-1 rounded-full text-xs font-medium bg-teal-500/10 text-teal-300 border border-teal-500/20">{proc.species}</span>
                )}
                {proc?.category && (
                  <span className="px-3 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">{proc.category}</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
        {proc?.description && (
          <Section title="Description" icon={BookOpen}>
            <p className="text-gray-300 leading-relaxed whitespace-pre-wrap">{proc.description}</p>
          </Section>
        )}

        {proc?.indications && (
          <Section title="Indications" icon={Activity}>
            <p className="text-gray-300 leading-relaxed whitespace-pre-wrap">{proc.indications}</p>
          </Section>
        )}

        {proc?.contraindications && (
          <Section title="Contraindications" icon={AlertTriangle}>
            <p className="text-gray-300 leading-relaxed whitespace-pre-wrap">{proc.contraindications}</p>
          </Section>
        )}

        {proc?.preparation && (
          <Section title="Preparation" icon={ClipboardList}>
            <p className="text-gray-300 leading-relaxed whitespace-pre-wrap">{proc.preparation}</p>
          </Section>
        )}

        {proc?.technique && (
          <Section title="Technique" icon={Syringe}>
            <p className="text-gray-300 leading-relaxed whitespace-pre-wrap">{proc.technique}</p>
          </Section>
        )}

        {proc?.aftercare && (
          <Section title="Aftercare" icon={Bandage}>
            <p className="text-gray-300 leading-relaxed whitespace-pre-wrap">{proc.aftercare}</p>
          </Section>
        )}

        {proc?.complications && (
          <Section title="Complications" icon={AlertTriangle}>
            <p className="text-gray-300 leading-relaxed whitespace-pre-wrap">{proc.complications}</p>
          </Section>
        )}

        {proc?.references && (
          <Section title="References" icon={FileText}>
            <p className="text-gray-300 whitespace-pre-wrap">{proc.references}</p>
          </Section>
        )}
      </div>
    </div>
  )
}
