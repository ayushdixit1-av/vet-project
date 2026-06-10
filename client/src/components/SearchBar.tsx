import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search } from 'lucide-react'
import { cn } from '../lib/utils'

const categories = [
  { label: 'All', value: '' },
  { label: 'Articles', value: 'articles' },
  { label: 'Drugs', value: 'drugs' },
  { label: 'Diseases', value: 'diseases' },
  { label: 'Breeds', value: 'breeds' },
  { label: 'Procedures', value: 'procedures' },
]

interface SearchBarProps {
  placeholder?: string
  className?: string
}

export default function SearchBar({ placeholder = 'Search drugs, diseases, breeds...', className }: SearchBarProps) {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState('')

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (!query.trim()) return
    const params = new URLSearchParams()
    params.set('q', query.trim())
    if (activeCategory) params.set('type', activeCategory)
    navigate(`/search?${params.toString()}`)
  }

  const handleCategoryClick = (value: string) => {
    setActiveCategory(value)
    if (query.trim()) {
      const params = new URLSearchParams()
      params.set('q', query.trim())
      if (value) params.set('type', value)
      navigate(`/search?${params.toString()}`)
    }
  }

  return (
    <div className={cn('w-full', className)}>
      <form onSubmit={handleSubmit} className="relative">
        <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-6 h-6 text-gray-400" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          className="w-full pl-14 pr-6 py-4 rounded-2xl bg-white/5 border border-white/10 text-white placeholder-gray-500 text-lg focus:outline-none focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20 transition-all backdrop-blur-sm"
        />
      </form>

      <div className="flex flex-wrap gap-2 mt-4">
        {categories.map((cat) => (
          <button
            key={cat.value}
            onClick={() => handleCategoryClick(cat.value)}
            className={cn(
              'px-4 py-1.5 rounded-full text-sm font-medium transition-all',
              activeCategory === cat.value
                ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/25'
                : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 border border-white/10'
            )}
          >
            {cat.label}
          </button>
        ))}
      </div>
    </div>
  )
}
