import { Link, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  PawPrint, ChevronRight, FileText, MapPin,
  Ruler, Clock, Milk, Activity,
  Stethoscope, Weight
} from 'lucide-react'
import api from '../lib/api'
import type { Breed } from '../types'

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

export default function BreedDetail() {
  const { slug } = useParams<{ slug: string }>()

  const { data: breed, isLoading, error } = useQuery({
    queryKey: ['breed', slug],
    queryFn: () => api.get(`/breeds/${slug}`).then(r => r.data),
    enabled: !!slug,
  })

  const br = breed as Breed

  if (error) return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="text-center">
        <p className="text-red-400 text-lg">Failed to load breed</p>
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

  const images = br?.images ?? []

  return (
    <div>
      {/* Breadcrumbs */}
      <div className="bg-gray-900/50 border-b border-gray-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <Link to="/" className="hover:text-emerald-400 transition-colors">Home</Link>
            <ChevronRight className="w-3 h-3" />
            <Link to="/breeds" className="hover:text-emerald-400 transition-colors">Breeds</Link>
            <ChevronRight className="w-3 h-3" />
            <span className="text-white">{br?.name}</span>
          </div>
        </div>
      </div>

      {/* Header */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-900 via-teal-900 to-green-900" />
        <div className="relative max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
          <div className="flex items-start gap-6">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 flex items-center justify-center text-emerald-400 shrink-0">
              <PawPrint className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">{br?.name}</h1>
              {br?.species && (
                <span className="px-3 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">{br.species}</span>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Images Gallery */}
      {images.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 mb-12">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {images.map((img, i) => (
              <img
                key={i}
                src={img}
                alt={`${br?.name} - ${i + 1}`}
                className="rounded-2xl w-full h-64 object-cover"
              />
            ))}
          </div>
        </section>
      )}

      {/* Quick Stats */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {br?.origin && (
            <div className="bg-gray-900/60 border border-gray-800 rounded-2xl p-4 text-center">
              <MapPin className="w-6 h-6 mx-auto text-emerald-400 mb-2" />
              <div className="text-xs text-gray-500">Origin</div>
              <div className="text-sm text-white font-medium">{br.origin}</div>
            </div>
          )}
          {br?.weight_range && (
            <div className="bg-gray-900/60 border border-gray-800 rounded-2xl p-4 text-center">
              <Weight className="w-6 h-6 mx-auto text-teal-400 mb-2" />
              <div className="text-xs text-gray-500">Weight</div>
              <div className="text-sm text-white font-medium">{br.weight_range}</div>
            </div>
          )}
          {br?.height_range && (
            <div className="bg-gray-900/60 border border-gray-800 rounded-2xl p-4 text-center">
              <Ruler className="w-6 h-6 mx-auto text-emerald-400 mb-2" />
              <div className="text-xs text-gray-500">Height</div>
              <div className="text-sm text-white font-medium">{br.height_range}</div>
            </div>
          )}
          {br?.lifespan && (
            <div className="bg-gray-900/60 border border-gray-800 rounded-2xl p-4 text-center">
              <Clock className="w-6 h-6 mx-auto text-teal-400 mb-2" />
              <div className="text-xs text-gray-500">Lifespan</div>
              <div className="text-sm text-white font-medium">{br.lifespan}</div>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 space-y-8">
        {br?.characteristics && (
          <Section title="Characteristics" icon={Activity}>
            <p className="text-gray-300 leading-relaxed whitespace-pre-wrap">{br.characteristics}</p>
          </Section>
        )}

        {br?.milk_yield && (
          <Section title="Milk Yield" icon={Milk}>
            <p className="text-gray-300 leading-relaxed whitespace-pre-wrap">{br.milk_yield}</p>
          </Section>
        )}

        {br?.management && (
          <Section title="Management" icon={Stethoscope}>
            <p className="text-gray-300 leading-relaxed whitespace-pre-wrap">{br.management}</p>
          </Section>
        )}

        {br?.common_diseases && (
          <Section title="Common Diseases" icon={Activity}>
            <p className="text-gray-300 leading-relaxed whitespace-pre-wrap">{br.common_diseases}</p>
          </Section>
        )}

        {br?.references && (
          <Section title="References" icon={FileText}>
            <p className="text-gray-300 whitespace-pre-wrap">{br.references}</p>
          </Section>
        )}
      </div>
    </div>
  )
}
