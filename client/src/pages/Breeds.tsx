import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Search, PawPrint, ChevronLeft, ChevronRight } from 'lucide-react'
import api from '../lib/api'
import BreedCard from '../components/BreedCard'
import type { Breed } from '../types'

const speciesOptions = ['All', 'Canine', 'Feline', 'Bovine', 'Equine', 'Ovine', 'Caprine', 'Porcine', 'Avian']

export default function Breeds() {
  const [search, setSearch] = useState('')
  const [species, setSpecies] = useState('')
  const [page, setPage] = useState(1)
  const limit = 12

  const { data, isLoading, error } = useQuery({
    queryKey: ['breeds', search, species, page],
    queryFn: () => {
      let url = `/breeds?page=${page}&limit=${limit}`
      if (search) url += `&search=${encodeURIComponent(search)}`
      if (species) url += `&species=${species}`
      return api.get(url).then(r => r.data)
    },
  })

  const breeds = Array.isArray(data) ? data : (data as any)?.data ?? []
  const totalPages = (data as any)?.last_page ?? Math.ceil(((data as any)?.total ?? breeds.length) / limit)

  if (error) return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="text-center">
        <p className="text-red-400 text-lg">Failed to load breeds</p>
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
            <PawPrint className="w-12 h-12 mx-auto text-emerald-400 mb-4" />
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">Breeds</h1>
            <p className="text-lg text-emerald-100/80 max-w-2xl mx-auto">
              Explore animal breeds with detailed characteristics and management information
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
                placeholder="Search breeds..."
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
          </div>
        </div>
      </div>

      {/* Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="animate-pulse bg-gray-800/50 rounded-2xl h-48" />
            ))}
          </div>
        ) : breeds?.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {(breeds as Breed[]).map((breed) => (
              <BreedCard key={breed.id} breed={breed} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <PawPrint className="w-16 h-16 mx-auto text-gray-600 mb-4" />
            <p className="text-gray-400 text-lg">No breeds found</p>
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
