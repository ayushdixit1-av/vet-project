import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  BookOpen, Pill, Bug, PawPrint, Search,
  ArrowRight, Sparkles, GraduationCap, FlaskConical,
  Syringe, Stethoscope, Blocks, FileText, Shield
} from 'lucide-react'
import api from '../lib/api'
import SearchBar from '../components/SearchBar'
import ArticleCard from '../components/ArticleCard'
import DrugCard from '../components/DrugCard'
import DiseaseCard from '../components/DiseaseCard'
import type { Category, Article, Drug, Disease, DashboardStats } from '../types'

const iconMap: Record<string, React.ElementType> = {
  book: BookOpen, pill: Pill, bug: Bug, paw: PawPrint,
  flask: FlaskConical, syringe: Syringe, stethoscope: Stethoscope,
  blocks: Blocks, file: FileText, shield: Shield, sparkles: Sparkles,
  search: Search, graduation: GraduationCap
}

const popularTags = [
  { label: 'rabies', to: '/search?q=rabies' },
  { label: 'canine distemper', to: '/search?q=canine+distemper' },
  { label: 'amoxicillin', to: '/search?q=amoxicillin' },
  { label: 'gir cow', to: '/search?q=gir+cow' },
]

export default function Home() {
  const { data: categories, isLoading: catLoading } = useQuery({
    queryKey: ['knowledge-categories', 'active'],
    queryFn: () => api.get('/knowledge-categories?status=active').then(r => r.data.categories),
  })

  const { data: featuredArticles } = useQuery({
    queryKey: ['articles', 'featured'],
    queryFn: () => api.get('/articles/featured').then(r => r.data.articles),
  })

  const { data: featuredDrugs } = useQuery({
    queryKey: ['medicines', 'featured'],
    queryFn: () => api.get('/medicines?limit=6').then(r => r.data.medicines),
  })

  const { data: popularDiseases } = useQuery({
    queryKey: ['diseases', 'popular'],
    queryFn: () => api.get('/diseases/popular').then(r => r.data.diseases),
  })

  const { data: stats } = useQuery({
    queryKey: ['analytics', 'dashboard'],
    queryFn: () => api.get('/analytics/dashboard').then(r => r.data),
  })

  const statItems = [
    { label: 'Total Articles', value: (stats as DashboardStats)?.total_articles ?? 0, icon: FileText, color: 'from-emerald-500 to-green-600' },
    { label: 'Total Drugs', value: (stats as DashboardStats)?.total_drugs ?? 0, icon: Pill, color: 'from-teal-500 to-cyan-600' },
    { label: 'Total Diseases', value: (stats as DashboardStats)?.total_diseases ?? 0, icon: Bug, color: 'from-green-500 to-emerald-600' },
    { label: 'Total Breeds', value: (stats as DashboardStats)?.total_breeds ?? 0, icon: PawPrint, color: 'from-emerald-400 to-teal-500' },
  ]

  const CategoryIcon = (icon: string) => {
    const Icon = iconMap[icon] || BookOpen
    return <Icon className="w-8 h-8" />
  }

  return (
    <div>
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-900 via-teal-900 to-green-900" />
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%2300ff88' fill-opacity='0.15'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")` }}
        />
        <div className="relative max-w-7xl mx-auto px-4 py-24 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 mb-8">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <span className="text-sm font-medium text-emerald-200">Premium Veterinary Knowledge Platform</span>
            </div>
            <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">
              Search Veterinary
              <span className="bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent"> Knowledge</span>
            </h1>
            <p className="text-xl text-emerald-100/80 mb-12 max-w-2xl mx-auto">
              Your comprehensive veterinary knowledge platform
            </p>
            <div className="max-w-3xl mx-auto mb-8">
              <SearchBar className="w-full" />
            </div>
            <div className="flex flex-wrap justify-center gap-3">
              <span className="text-emerald-200 text-sm font-medium mt-1">Popular:</span>
              {popularTags.map((tag) => (
                <Link
                  key={tag.label}
                  to={tag.to}
                  className="px-4 py-1.5 rounded-full text-sm font-medium bg-white/10 text-emerald-200 border border-white/20 hover:bg-white/20 hover:text-white transition-all backdrop-blur-sm"
                >
                  {tag.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-gray-950 to-transparent" />
      </section>

      {/* Stats Section */}
      <section className="relative -mt-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 z-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {statItems.map((stat) => (
            <div
              key={stat.label}
              className="relative group cursor-pointer"
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${stat.color} rounded-2xl opacity-20 group-hover:opacity-30 transition-opacity`} />
              <div className="relative bg-gray-900/80 backdrop-blur-xl border border-gray-800 rounded-2xl p-6 text-center hover:border-emerald-500/30 transition-all">
                <stat.icon className="w-8 h-8 mx-auto mb-3 text-emerald-400" />
                <div className="text-3xl font-bold text-white mb-1">{stat.value.toLocaleString()}</div>
                <div className="text-sm text-gray-400">{stat.label}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Knowledge Base Categories */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="flex items-center justify-between mb-12">
          <div>
            <h2 className="text-3xl font-bold text-white">Knowledge Base</h2>
            <p className="text-gray-400 mt-2">Browse veterinary knowledge by category</p>
          </div>
          <Link
            to="/knowledge"
            className="hidden sm:flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-medium hover:from-emerald-600 hover:to-teal-600 transition-all"
          >
            View All <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {catLoading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="animate-pulse bg-gray-800/50 rounded-2xl h-48" />
            ))
          ) : (
            (categories as Category[])?.map((cat) => (
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
                  <p className="text-sm text-gray-400 line-clamp-2 mb-4">{cat.description}</p>
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <span>{cat.article_count ?? 0} articles</span>
                    <span>{cat.subcategory_count ?? 0} subcategories</span>
                  </div>
                </div>
              </Link>
            ))
          )}
        </div>
        <div className="mt-8 text-center sm:hidden">
          <Link
            to="/knowledge"
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-medium hover:from-emerald-600 hover:to-teal-600 transition-all"
          >
            View All <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* Featured Articles */}
      <section className="bg-gray-900/30 border-y border-gray-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="flex items-center justify-between mb-12">
            <div>
              <h2 className="text-3xl font-bold text-white">Featured Articles</h2>
              <p className="text-gray-400 mt-2">Curated veterinary knowledge</p>
            </div>
            <Link
              to="/search"
              className="hidden sm:flex items-center gap-2 text-emerald-400 hover:text-emerald-300 font-medium transition-colors"
            >
              View All Articles <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {(featuredArticles as Article[])?.map((article) => (
              <ArticleCard key={article.id} article={article} />
            ))}
          </div>
        </div>
      </section>

      {/* Featured Drugs */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="flex items-center justify-between mb-12">
          <div>
            <h2 className="text-3xl font-bold text-white">Drug Database</h2>
            <p className="text-gray-400 mt-2">Comprehensive veterinary pharmaceutical reference</p>
          </div>
          <Link
            to="/drugs"
            className="hidden sm:flex items-center gap-2 text-emerald-400 hover:text-emerald-300 font-medium transition-colors"
          >
            View All Drugs <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {(featuredDrugs as Drug[])?.map((drug) => (
            <DrugCard key={drug.id} drug={drug} />
          ))}
        </div>
      </section>

      {/* Popular Diseases */}
      <section className="bg-gray-900/30 border-y border-gray-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="flex items-center justify-between mb-12">
            <div>
              <h2 className="text-3xl font-bold text-white">Popular Diseases</h2>
              <p className="text-gray-400 mt-2">Common veterinary conditions and treatments</p>
            </div>
            <Link
              to="/diseases"
              className="hidden sm:flex items-center gap-2 text-emerald-400 hover:text-emerald-300 font-medium transition-colors"
            >
              View All Diseases <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {(popularDiseases as Disease[])?.map((disease) => (
              <DiseaseCard key={disease.id} disease={disease} />
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-800 p-12 md:p-20 text-center">
          <div className="absolute inset-0 opacity-10"
            style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%2300ff88' fill-opacity='0.2'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")` }}
          />
          <div className="relative">
            <GraduationCap className="w-16 h-16 mx-auto mb-6 text-emerald-200" />
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">Start Your Learning Journey</h2>
            <p className="text-xl text-emerald-100/80 mb-10 max-w-2xl mx-auto">
              Access thousands of veterinary articles, drug information, and clinical resources
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link
                to="/knowledge"
                className="px-8 py-3.5 rounded-xl bg-white text-emerald-700 font-semibold hover:bg-emerald-50 transition-all shadow-lg shadow-emerald-900/30"
              >
                Explore Knowledge Base
              </Link>
              <Link
                to="/drugs"
                className="px-8 py-3.5 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 text-white font-semibold hover:bg-white/20 transition-all"
              >
                Browse Drugs
              </Link>
              <Link
                to="/diseases"
                className="px-8 py-3.5 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 text-white font-semibold hover:bg-white/20 transition-all"
              >
                View Diseases
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
