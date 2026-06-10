import { Link } from 'react-router-dom'
import { Activity } from 'lucide-react'
import { cn } from '../lib/utils'
import type { Disease } from '../types'

interface DiseaseCardProps {
  disease: Disease
  className?: string
}

export default function DiseaseCard({ disease, className }: DiseaseCardProps) {
  const description = disease.overview || disease.seo_description || ''

  return (
    <Link
      to={`/diseases/${disease.slug}`}
      className={cn(
        'group block rounded-2xl bg-white/5 border border-white/10 p-5 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl hover:shadow-emerald-500/10 hover:border-emerald-500/30',
        className
      )}
    >
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-rose-400/20 to-pink-400/20 border border-rose-500/20 flex items-center justify-center shrink-0">
          <Activity className="w-6 h-6 text-rose-400" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold text-white group-hover:text-emerald-300 transition-colors truncate">
            {disease.name}
          </h3>
          {disease.species && (
            <span className="inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-medium bg-blue-500/10 text-blue-300 border border-blue-500/20">
              {disease.species}
            </span>
          )}
        </div>
      </div>

      {description && (
        <p className="mt-3 text-sm text-gray-400 line-clamp-2 leading-relaxed">
          {description}
        </p>
      )}
    </Link>
  )
}
