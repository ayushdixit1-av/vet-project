import { useSearchParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  Search as SearchIcon, FileText, Pill, Bug, PawPrint,
  Syringe, Stethoscope, ArrowRight
} from 'lucide-react'
import api from '../lib/api'
import ArticleCard from '../components/ArticleCard'
import DrugCard from '../components/DrugCard'
import DiseaseCard from '../components/DiseaseCard'
import type { SearchResults } from '../types'

const typeConfig: Record<string, { label: string; icon: React.ElementType; link: string; count: (r: SearchResults) => number; items: (r: SearchResults) => any[] }> = {
  articles: { label: 'Articles', icon: FileText, link: '/search?type=articles', count: r => r.articles?.length ?? 0, items: r => r.articles ?? [] },
  drugs: { label: 'Drugs', icon: Pill, link: '/drugs', count: r => r.drugs?.length ?? 0, items: r => r.drugs ?? [] },
  diseases: { label: 'Diseases', icon: Bug, link: '/diseases', count: r => r.diseases?.length ?? 0, items: r => r.diseases ?? [] },
  breeds: { label: 'Breeds', icon: PawPrint, link: '/breeds', count: r => r.breeds?.length ?? 0, items: r => r.breeds ?? [] },
  vaccines: { label: 'Vaccines', icon: Syringe, link: '/vaccines', count: r => r.vaccines?.length ?? 0, items: r => r.vaccines ?? [] },
  procedures: { label: 'Procedures', icon: Stethoscope, link: '/procedures', count: r => r.procedures?.length ?? 0, items: r => r.procedures ?? [] },
}

export default function Search() {
  const [searchParams, setSearchParams] = useSearchParams()
  const query = searchParams.get('q') || ''

  const { data, isLoading, error } = useQuery({
    queryKey: ['search', query],
    queryFn: () => api.get(`/search?q=${encodeURIComponent(query)}`).then(r => r.data),
    enabled: !!query,
  })

  const results = data as SearchResults
  const hasResults = results && Object.values(typeConfig).some(tc => tc.count(results) > 0)

  const activeTypes = Object.entries(typeConfig).filter(([, tc]) => tc.count(results) > 0)

  return (
    <div>
      {/* Header */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-900 via-teal-900 to-green-900" />
        <div className="relative max-w-7xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
          <div className="text-center">
            <SearchIcon className="w-12 h-12 mx-auto text-emerald-400 mb-4" />
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">Search Results</h1>
            <div className="max-w-2xl mx-auto">
              <div className="relative">
                <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setSearchParams({ q: e.target.value })}
                  placeholder="Search..."
                  className="w-full pl-12 pr-4 py-3 bg-gray-900/60 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/30 outline-none transition-all text-lg"
                  autoFocus
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Results */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {!query ? (
          <div className="text-center py-20">
            <SearchIcon className="w-16 h-16 mx-auto text-gray-600 mb-4" />
            <p className="text-gray-400 text-lg">Enter a search term to find veterinary knowledge</p>
          </div>
        ) : isLoading ? (
          <div className="space-y-8">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i}>
                <div className="animate-pulse bg-gray-800/50 h-8 w-48 rounded mb-4" />
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {Array.from({ length: 3 }).map((_, j) => (
                    <div key={j} className="animate-pulse bg-gray-800/50 rounded-2xl h-48" />
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-20">
            <p className="text-red-400 text-lg">Search failed</p>
            <p className="text-gray-500 mt-2">Please try again later</p>
          </div>
        ) : !hasResults ? (
          <div className="text-center py-20 max-w-lg mx-auto">
            <SearchIcon className="w-16 h-16 mx-auto text-gray-600 mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">No results found</h2>
            <p className="text-gray-400 mb-8">No results found for "{query}"</p>
            <div className="text-left bg-gray-900/60 border border-gray-800 rounded-2xl p-6">
              <h3 className="text-sm font-semibold text-gray-300 mb-3">Suggestions:</h3>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>• Check your spelling</li>
                <li>• Try more general keywords</li>
                <li>• Try different keywords</li>
                <li>• Browse the <Link to="/knowledge" className="text-emerald-400 hover:text-emerald-300">Knowledge Base</Link> instead</li>
              </ul>
            </div>
          </div>
        ) : (
          <div className="space-y-12">
            {activeTypes.map(([type, tc]) => {
              const items = tc.items(results)
              const showCount = Math.min(items.length, 5)

              return (
                <section key={type}>
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <tc.icon className="w-6 h-6 text-emerald-400" />
                      <h2 className="text-2xl font-bold text-white">{tc.label}</h2>
                      <span className="text-sm text-gray-500">({items.length})</span>
                    </div>
                    {items.length > 5 && (
                      <Link
                        to={`${tc.link}${query ? `?q=${encodeURIComponent(query)}` : ''}`}
                        className="flex items-center gap-1 text-sm text-emerald-400 hover:text-emerald-300 transition-colors"
                      >
                        See all <ArrowRight className="w-4 h-4" />
                      </Link>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {type === 'articles' && items.slice(0, showCount).map((item: any) => (
                      <ArticleCard key={item.id} article={item} />
                    ))}
                    {type === 'drugs' && items.slice(0, showCount).map((item: any) => (
                      <DrugCard key={item.id} drug={item} />
                    ))}
                    {type === 'diseases' && items.slice(0, showCount).map((item: any) => (
                      <DiseaseCard key={item.id} disease={item} />
                    ))}
                    {(type === 'breeds' || type === 'vaccines' || type === 'procedures') && (
                      items.slice(0, showCount).map((item: any) => (
                        <Link
                          key={item.id}
                          to={`/${type}/${item.slug}`}
                          className="group relative overflow-hidden rounded-2xl bg-gray-900/60 border border-gray-800 hover:border-emerald-500/40 transition-all p-6"
                        >
                          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-emerald-500/10 to-transparent rounded-bl-full" />
                          <div className="relative">
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 flex items-center justify-center text-emerald-400 mb-3 group-hover:scale-110 transition-transform">
                              <tc.icon className="w-6 h-6" />
                            </div>
                            <h3 className="text-lg font-semibold text-white mb-1 group-hover:text-emerald-400 transition-colors">
                              {item.name}
                            </h3>
                            {item.species && (
                              <span className="inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-teal-500/10 text-teal-300 border border-teal-500/20 mb-2">
                                {item.species}
                              </span>
                            )}
                            <p className="text-sm text-gray-400 line-clamp-2">{item.description}</p>
                          </div>
                        </Link>
                      ))
                    )}
                  </div>
                </section>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
