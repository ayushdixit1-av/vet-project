import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Search, Stethoscope, ChevronLeft, ChevronRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import api from '../lib/api'
import type { Procedure } from '../types'

const speciesOptions = ['All', 'Canine', 'Feline', 'Bovine', 'Equine', 'Ovine', 'Caprine', 'Porcine', 'Avian']
const categoryOptions = ['All', 'Surgery', 'Diagnostic', 'Therapeutic', 'Preventive', 'Emergency']

export default function Procedures() {
  const [search, setSearch] = useState('')
  const [species, setSpecies] = useState('')
  const [category, setCategory] = useState('')
  const [page, setPage] = useState(1)
  const limit = 12

  const { data, isLoading, error } = useQuery({
    queryKey: ['procedures', search, species, category, page],
    queryFn: () => {
      let url = `/procedures?page=${page}&limit=${limit}`
      if (search) url += `&search=${encodeURIComponent(search)}`
      if (species) url += `&species=${species}`
      if (category) url += `&category=${category}`
      return api.get(url).then(r => r.data)
    },
  })

  const procedures = Array.isArray(data) ? data : (data as any)?.data ?? []
  const totalPages = (data as any)?.last_page ?? Math.ceil(((data as any)?.total ?? procedures.length) / limit)

  if (error) return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="text-center">
        <p className="text-red-400 text-lg">Failed to load procedures</p>
        <p className="text-gray-500 mt-2">Please try again later</p>
      </div>
    </div>
  )

  return (
    <div>
      {/* Header */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-900 via-teal-900 to-green-900" />
        <div className="relative max-w-7xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
          <div className="text-center">
            <Stethoscope className="w-12 h-12 mx-auto text-emerald-400 mb-4" />
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">Procedures</h1>
            <p className="text-lg text-emerald-100/80 max-w-2xl mx-auto">
              Veterinary clinical procedures, surgical techniques, and medical interventions
            </p>
          </div>
        </div>
      </section>

      {/* Filters */}
      <div className="border-b border-gray-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="text"
                placeholder="Search procedures..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1) }}
                className="w-full pl-10 pr-4 py-2 bg-gray-900/60 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all text-sm"
              />
            </div>
            <select
              value={species}
              onChange={(e) => { setSpecies(e.target.value); setPage(1) }}
              className="bg-gray-900/60 border border-gray-700 rounded-xl text-white px-4 py-2 text-sm focus:border-emerald-500 outline-none"
            >
              {speciesOptions.map(s => <option key={s} value={s === 'All' ? '' : s}>{s}</option>)}
            </select>
            <select
              value={category}
              onChange={(e) => { setCategory(e.target.value); setPage(1) }}
              className="bg-gray-900/60 border border-gray-700 rounded-xl text-white px-4 py-2 text-sm focus:border-emerald-500 outline-none"
            >
              {categoryOptions.map(c => <option key={c} value={c === 'All' ? '' : c}>{c}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="animate-pulse bg-gray-800/50 rounded-2xl h-40" />
            ))}
          </div>
        ) : procedures?.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {(procedures as Procedure[]).map((proc) => (
              <Link
                key={proc.id}
                to={`/procedures/${proc.slug}`}
                className="group relative overflow-hidden rounded-2xl bg-gray-900/60 border border-gray-800 hover:border-emerald-500/40 transition-all p-6"
              >
                <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-emerald-500/10 to-transparent rounded-bl-full" />
                <div className="relative">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 flex items-center justify-center text-emerald-400 mb-3 group-hover:scale-110 transition-transform">
                    <Stethoscope className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-1 group-hover:text-emerald-400 transition-colors">
                    {proc.name}
                  </h3>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {proc.species && (
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-teal-500/10 text-teal-300 border border-teal-500/20">
                        {proc.species}
                      </span>
                    )}
                    {proc.category && (
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                        {proc.category}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-400 line-clamp-2">{proc.description}</p>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <Stethoscope className="w-16 h-16 mx-auto text-gray-600 mb-4" />
            <p className="text-gray-400 text-lg">No procedures found</p>
            <p className="text-gray-500 text-sm mt-2">Try adjusting your search or filters</p>
          </div>
        )}

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
