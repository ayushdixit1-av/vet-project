import { Link, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  BookOpen, Pill, Bug, PawPrint, FlaskConical,
  Syringe, Stethoscope, Blocks, FileText, Shield, Sparkles,
  ArrowRight, FolderOpen
} from 'lucide-react'
import api from '../lib/api'
import ArticleCard from '../components/ArticleCard'
import type { Category, Subcategory, Article } from '../types'

const iconMap: Record<string, React.ElementType> = {
  book: BookOpen, pill: Pill, bug: Bug, paw: PawPrint,
  flask: FlaskConical, syringe: Syringe, stethoscope: Stethoscope,
  blocks: Blocks, file: FileText, shield: Shield, sparkles: Sparkles,
}

function CategoryIcon(icon: string) {
  const Icon = iconMap[icon] || BookOpen
  return <Icon className="w-8 h-8" />
}

export default function KnowledgeCategory() {
  const { slug } = useParams<{ slug: string }>()

  const { data: category, isLoading: catLoading, error: catError } = useQuery({
    queryKey: ['knowledge-category', slug],
    queryFn: () => api.get(`/knowledge-categories/${slug}`).then(r => r.data),
    enabled: !!slug,
  })

  const { data: subcategories } = useQuery({
    queryKey: ['knowledge-subcategories', slug],
    queryFn: () => api.get(`/knowledge-subcategories/by-category/${slug}`).then(r => r.data),
    enabled: !!slug,
  })

  const { data: recentArticles } = useQuery({
    queryKey: ['articles', 'by-category', slug],
    queryFn: () => api.get(`/articles/by-category/${slug}?limit=5`).then(r => r.data),
    enabled: !!slug,
  })

  if (catError) return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="text-center">
        <p className="text-red-400 text-lg">Failed to load category</p>
        <p className="text-gray-500 mt-2">Please try again later</p>
      </div>
    </div>
  )

  if (catLoading) return (
    <div className="min-h-[60vh]">
      <div className="animate-pulse bg-gray-800/50 h-64" />
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="animate-pulse bg-gray-800/50 rounded-2xl h-8 w-64 mb-8" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="animate-pulse bg-gray-800/50 rounded-2xl h-48" />
          ))}
        </div>
      </div>
    </div>
  )

  const cat = category as Category

  return (
    <div>
      {/* Banner */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-900 via-teal-900 to-green-900" />
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%2300ff88' fill-opacity='0.15'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")` }}
        />
        <div className="relative max-w-7xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
          <div className="flex items-start gap-6">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 flex items-center justify-center text-emerald-400 shrink-0">
              {CategoryIcon(cat.icon)}
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">{cat.name}</h1>
              <p className="text-lg text-emerald-100/80 max-w-3xl">{cat.description}</p>
              <div className="flex items-center gap-4 mt-4 text-sm text-emerald-200/60">
                <span className="flex items-center gap-1"><FolderOpen className="w-4 h-4" /> {cat.subcategory_count ?? 0} subcategories</span>
                <span className="flex items-center gap-1"><FileText className="w-4 h-4" /> {cat.article_count ?? 0} articles</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Breadcrumbs */}
      <div className="bg-gray-900/50 border-b border-gray-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <Link to="/" className="hover:text-emerald-400 transition-colors">Home</Link>
            <span>/</span>
            <Link to="/knowledge" className="hover:text-emerald-400 transition-colors">Knowledge</Link>
            <span>/</span>
            <span className="text-white">{cat.name}</span>
          </div>
        </div>
      </div>

      {/* Subcategories */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h2 className="text-2xl font-bold text-white mb-8">Subcategories</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {(subcategories as Subcategory[])?.map((sub) => (
            <Link
              key={sub.id}
              to={`/knowledge/${slug}/${sub.slug}`}
              className="group relative overflow-hidden rounded-2xl bg-gray-900/60 border border-gray-800 hover:border-emerald-500/40 transition-all p-6"
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-emerald-500/10 to-transparent rounded-bl-full" />
              <div className="relative">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-teal-500/20 to-emerald-500/20 flex items-center justify-center text-teal-400 mb-3 group-hover:scale-110 transition-transform">
                  <BookOpen className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-emerald-400 transition-colors">
                  {sub.name}
                </h3>
                <p className="text-sm text-gray-400 line-clamp-2 mb-3">{sub.description}</p>
                <span className="text-xs text-gray-500">{sub.article_count ?? 0} articles</span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Recent Articles */}
      <section className="bg-gray-900/30 border-y border-gray-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold text-white">Recent Articles</h2>
            <Link
              to={`/search?q=${cat.name}`}
              className="flex items-center gap-2 text-emerald-400 hover:text-emerald-300 font-medium transition-colors text-sm"
            >
              View All <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {(recentArticles as Article[])?.map((article) => (
              <ArticleCard key={article.id} article={article} />
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
