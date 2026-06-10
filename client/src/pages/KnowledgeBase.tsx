import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  BookOpen, Pill, Bug, PawPrint, FlaskConical,
  Syringe, Stethoscope, Blocks, FileText, Shield, Sparkles
} from 'lucide-react'
import api from '../lib/api'
import type { Category } from '../types'

const iconMap: Record<string, React.ElementType> = {
  book: BookOpen, pill: Pill, bug: Bug, paw: PawPrint,
  flask: FlaskConical, syringe: Syringe, stethoscope: Stethoscope,
  blocks: Blocks, file: FileText, shield: Shield, sparkles: Sparkles,
}

function CategoryIcon(icon: string) {
  const Icon = iconMap[icon] || BookOpen
  return <Icon className="w-8 h-8" />
}

export default function KnowledgeBase() {
  const { data: categories, isLoading, error } = useQuery({
    queryKey: ['knowledge-categories', 'active'],
    queryFn: () => api.get('/knowledge-categories?status=active').then(r => r.data),
  })

  if (error) return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="text-center">
        <p className="text-red-400 text-lg">Failed to load categories</p>
        <p className="text-gray-500 mt-2">Please try again later</p>
      </div>
    </div>
  )

  return (
    <div>
      {/* Banner */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-900 via-teal-900 to-green-900" />
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%2300ff88' fill-opacity='0.15'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")` }}
        />
        <div className="relative max-w-7xl mx-auto px-4 py-20 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">Knowledge Base</h1>
            <p className="text-xl text-emerald-100/80 max-w-3xl mx-auto">
              Explore our comprehensive veterinary knowledge base covering diseases, treatments, procedures, and more
            </p>
          </div>
        </div>
      </section>

      {/* Breadcrumbs */}
      <div className="bg-gray-900/50 border-b border-gray-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <Link to="/" className="hover:text-emerald-400 transition-colors">Home</Link>
            <span>/</span>
            <span className="text-white">Knowledge</span>
          </div>
        </div>
      </div>

      {/* Categories Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="animate-pulse bg-gray-800/50 rounded-2xl h-56" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {(categories as Category[])?.map((cat) => (
              <Link
                key={cat.id}
                to={`/knowledge/${cat.slug}`}
                className="group relative overflow-hidden rounded-2xl bg-gray-900/60 border border-gray-800 hover:border-emerald-500/40 transition-all p-6"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-emerald-500/10 to-transparent rounded-bl-full" />
                <div className="relative">
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 flex items-center justify-center text-emerald-400 mb-4 group-hover:scale-110 transition-transform">
                    {CategoryIcon(cat.icon)}
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-emerald-400 transition-colors">
                    {cat.name}
                  </h3>
                  <p className="text-sm text-gray-400 line-clamp-3 mb-4">{cat.description}</p>
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <span>{cat.article_count ?? 0} articles</span>
                    <span>{cat.subcategory_count ?? 0} subcategories</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
