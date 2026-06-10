import { Link, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  Pill, ChevronRight, FileText, AlertTriangle,
  FlaskConical, Syringe, Stethoscope, Shield, BookOpen,
  Image as ImageIcon
} from 'lucide-react'
import api from '../lib/api'
import ArticleCard from '../components/ArticleCard'
import type { Drug, Article } from '../types'

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

export default function DrugDetail() {
  const { slug } = useParams<{ slug: string }>()
  const id = isNaN(Number(slug)) ? undefined : Number(slug)

  const { data: drug, isLoading, error } = useQuery({
    queryKey: ['medicine', id],
    queryFn: () => api.get(`/medicines/${id}`).then(r => r.data),
    enabled: !!id,
  })

  const { data: relatedArticles } = useQuery({
    queryKey: ['articles', 'search', drug?.name],
    queryFn: () => api.get(`/articles/search?q=${encodeURIComponent((drug as Drug)?.name || '')}`).then(r => r.data),
    enabled: !!drug,
  })

  const med = drug as Drug

  if (error) return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="text-center">
        <p className="text-red-400 text-lg">Failed to load drug</p>
        <p className="text-gray-500 mt-2">Please try again later</p>
      </div>
    </div>
  )

  if (isLoading) return (
    <div className="min-h-screen">
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-4">
        <div className="animate-pulse bg-gray-800/50 h-10 w-1/2 rounded" />
        <div className="animate-pulse bg-gray-800/50 h-4 w-1/3 rounded" />
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="animate-pulse bg-gray-800/50 h-32 rounded-2xl" />
        ))}
      </div>
    </div>
  )

  const images = med?.images ?? []
  const articles = Array.isArray(relatedArticles) ? relatedArticles : []

  return (
    <div>
      {/* Breadcrumbs */}
      <div className="bg-gray-900/50 border-b border-gray-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <Link to="/" className="hover:text-emerald-400 transition-colors">Home</Link>
            <ChevronRight className="w-3 h-3" />
            <Link to="/drugs" className="hover:text-emerald-400 transition-colors">Drugs</Link>
            <ChevronRight className="w-3 h-3" />
            <span className="text-white">{med?.name}</span>
          </div>
        </div>
      </div>

      {/* Header */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-900 via-teal-900 to-green-900" />
        <div className="relative max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
          <div className="flex items-start gap-6">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 flex items-center justify-center text-emerald-400 shrink-0">
              <Pill className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">{med?.name}</h1>
              <p className="text-emerald-200/80 text-lg">{med?.generic_name}</p>
              <div className="flex flex-wrap gap-3 mt-4">
                {med?.category && (
                  <span className="px-3 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">{med.category}</span>
                )}
                {med?.species && (
                  <span className="px-3 py-1 rounded-full text-xs font-medium bg-teal-500/10 text-teal-300 border border-teal-500/20">{med.species}</span>
                )}
                {med?.drug_class && (
                  <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-500/10 text-blue-300 border border-blue-500/20">{med.drug_class}</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            {med?.description && (
              <Section title="Description" icon={BookOpen}>
                <p className="text-gray-300 leading-relaxed whitespace-pre-wrap">{med.description}</p>
              </Section>
            )}

            {med?.brand_names && (
              <Section title="Brand Names" icon={Pill}>
                <p className="text-gray-300">{med.brand_names}</p>
              </Section>
            )}

            {med?.indications && (
              <Section title="Indications / Uses" icon={Stethoscope}>
                <p className="text-gray-300 leading-relaxed whitespace-pre-wrap">{med.indications}</p>
              </Section>
            )}

            {med?.dosage && (
              <Section title="Dosage" icon={Syringe}>
                <p className="text-gray-300 leading-relaxed whitespace-pre-wrap">{med.dosage}</p>
              </Section>
            )}

            {med?.route && (
              <Section title="Route of Administration" icon={FlaskConical}>
                <p className="text-gray-300">{med.route}</p>
              </Section>
            )}

            {med?.contraindications && (
              <Section title="Contraindications" icon={AlertTriangle}>
                <p className="text-gray-300 leading-relaxed whitespace-pre-wrap">{med.contraindications}</p>
              </Section>
            )}

            {med?.side_effects && (
              <Section title="Side Effects" icon={AlertTriangle}>
                <p className="text-gray-300 leading-relaxed whitespace-pre-wrap">{med.side_effects}</p>
              </Section>
            )}

            {med?.prescription_status && (
              <Section title="Prescription Status" icon={Shield}>
                <p className="text-gray-300">{med.prescription_status}</p>
              </Section>
            )}

            {med?.references && (
              <Section title="References" icon={FileText}>
                <p className="text-gray-300 whitespace-pre-wrap">{med.references}</p>
              </Section>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Images */}
            {images.length > 0 && (
              <div className="bg-gray-900/60 border border-gray-800 rounded-2xl p-6">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <ImageIcon className="w-5 h-5 text-emerald-400" />
                  Images
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  {images.map((img, i) => (
                    <img
                      key={i}
                      src={img}
                      alt={`${med?.name} - ${i + 1}`}
                      className="rounded-xl w-full h-24 object-cover"
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Quick Info */}
            <div className="bg-gray-900/60 border border-gray-800 rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Quick Info</h3>
              <dl className="space-y-3 text-sm">
                {med?.category && (
                  <div className="flex justify-between">
                    <dt className="text-gray-500">Category</dt>
                    <dd className="text-white">{med.category}</dd>
                  </div>
                )}
                {med?.species && (
                  <div className="flex justify-between">
                    <dt className="text-gray-500">Species</dt>
                    <dd className="text-white">{med.species}</dd>
                  </div>
                )}
                {med?.drug_class && (
                  <div className="flex justify-between">
                    <dt className="text-gray-500">Class</dt>
                    <dd className="text-white">{med.drug_class}</dd>
                  </div>
                )}
                {med?.route && (
                  <div className="flex justify-between">
                    <dt className="text-gray-500">Route</dt>
                    <dd className="text-white">{med.route}</dd>
                  </div>
                )}
              </dl>
            </div>
          </div>
        </div>
      </div>

      {/* Related Articles */}
      {articles.length > 0 && (
        <section className="bg-gray-900/30 border-t border-gray-800/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <h2 className="text-2xl font-bold text-white mb-8">Related Articles</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {(articles as Article[]).slice(0, 3).map((article) => (
                <ArticleCard key={article.id} article={article} />
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  )
}
