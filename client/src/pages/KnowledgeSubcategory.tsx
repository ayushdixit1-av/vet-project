import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  BookOpen, Search, SortAsc, ChevronLeft, ChevronRight
} from 'lucide-react'
import api from '../lib/api'
import ArticleCard from '../components/ArticleCard'
import type { Subcategory, Article } from '../types'

export default function KnowledgeSubcategory() {
  const { categorySlug, subSlug } = useParams<{ categorySlug: string; subSlug: string }>()
  const [page, setPage] = useState(1)
  const [sort, setSort] = useState('recent')
  const [searchQuery, setSearchQuery] = useState('')
  const limit = 12

  const { data: subcategory, isLoading: subLoading, error: subError } = useQuery({
    queryKey: ['knowledge-subcategory', subSlug],
    queryFn: () => api.get(`/knowledge-subcategories/${subSlug}`).then(r => r.data),
    enabled: !!subSlug,
  })

  const { data: articlesData, isLoading: articlesLoading } = useQuery({
    queryKey: ['articles', 'by-subcategory', subSlug, page, sort, searchQuery],
    queryFn: () => {
      let url = `/articles/by-subcategory/${subSlug}?page=${page}&limit=${limit}&sort=${sort}`
      if (searchQuery) url += `&search=${encodeURIComponent(searchQuery)}`
      return api.get(url).then(r => r.data)
    },
    enabled: !!subSlug,
  })

  if (subError) return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="text-center">
        <p className="text-red-400 text-lg">Failed to load subcategory</p>
        <p className="text-gray-500 mt-2">Please try again later</p>
      </div>
    </div>
  )

  const sub = subcategory as Subcategory
  const articles = Array.isArray(articlesData) ? articlesData : (articlesData as any)?.data ?? []
  const totalPages = (articlesData as any)?.last_page ?? Math.ceil(((articlesData as any)?.total ?? articles.length) / limit)

  return (
    <div>
      {/* Header */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-900 via-teal-900 to-green-900" />
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%2300ff88' fill-opacity='0.15'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")` }}
        />
        <div className="relative max-w-7xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
          <div className="flex items-start gap-6">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 flex items-center justify-center text-emerald-400 shrink-0">
              <BookOpen className="w-8 h-8" />
            </div>
            <div>
              {subLoading ? (
                <div className="animate-pulse space-y-3">
                  <div className="h-8 bg-gray-700 rounded w-64" />
                  <div className="h-4 bg-gray-700 rounded w-96" />
                </div>
              ) : (
                <>
                  <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">{sub?.name}</h1>
                  <p className="text-lg text-emerald-100/80 max-w-3xl">{sub?.description}</p>
                  <p className="text-sm text-emerald-200/60 mt-2">
                    Parent: <Link to={`/knowledge/${categorySlug}`} className="text-emerald-400 hover:text-emerald-300 underline">{sub?.category_name}</Link>
                  </p>
                </>
              )}
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
            {sub && (
              <>
                <Link to={`/knowledge/${categorySlug}`} className="hover:text-emerald-400 transition-colors">{sub.category_name}</Link>
                <span>/</span>
              </>
            )}
            <span className="text-white">{sub?.name}</span>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="border-b border-gray-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="text"
                placeholder="Search articles..."
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setPage(1) }}
                className="w-full pl-10 pr-4 py-2 bg-gray-900/60 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all text-sm"
              />
            </div>
            <div className="flex items-center gap-2">
              <SortAsc className="w-4 h-4 text-gray-400" />
              <select
                value={sort}
                onChange={(e) => { setSort(e.target.value); setPage(1) }}
                className="bg-gray-900/60 border border-gray-700 rounded-xl text-white px-3 py-2 text-sm focus:border-emerald-500 outline-none"
              >
                <option value="recent">Most Recent</option>
                <option value="popular">Most Popular</option>
                <option value="title">By Title</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Articles Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {articlesLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="animate-pulse bg-gray-800/50 rounded-2xl h-72" />
            ))}
          </div>
        ) : articles?.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {(articles as Article[]).map((article) => (
              <ArticleCard key={article.id} article={article} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <BookOpen className="w-16 h-16 mx-auto text-gray-600 mb-4" />
            <p className="text-gray-400 text-lg">No articles found</p>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-12">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="p-2 rounded-xl bg-gray-900/60 border border-gray-700 text-gray-400 hover:text-white hover:border-emerald-500/40 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            {Array.from({ length: Math.min(totalPages, 5) }).map((_, i) => {
              const p = i + 1
              return (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`w-10 h-10 rounded-xl text-sm font-medium transition-all ${
                    page === p
                      ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white'
                      : 'bg-gray-900/60 border border-gray-700 text-gray-400 hover:text-white hover:border-emerald-500/40'
                  }`}
                >
                  {p}
                </button>
              )
            })}
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="p-2 rounded-xl bg-gray-900/60 border border-gray-700 text-gray-400 hover:text-white hover:border-emerald-500/40 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        )}
      </section>
    </div>
  )
}
