import { Link } from 'react-router-dom'
import { Pill } from 'lucide-react'
import { cn } from '../lib/utils'
import type { Drug } from '../types'

interface DrugCardProps {
  drug: Drug
  className?: string
}

export default function DrugCard({ drug, className }: DrugCardProps) {
  return (
    <Link
      to={`/drugs/${drug.slug || drug.id}`}
      className={cn(
        'group block rounded-2xl bg-white/5 border border-white/10 p-5 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl hover:shadow-emerald-500/10 hover:border-emerald-500/30',
        className
      )}
    >
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-400/20 to-teal-400/20 border border-emerald-500/20 flex items-center justify-center shrink-0">
          <Pill className="w-6 h-6 text-emerald-400" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold text-white group-hover:text-emerald-300 transition-colors truncate">
            {drug.name}
          </h3>
          {drug.generic_name && (
            <p className="text-sm text-gray-400 truncate">{drug.generic_name}</p>
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mt-4">
        {drug.category && (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
            {drug.category}
          </span>
        )}
        {drug.species && (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-500/10 text-blue-300 border border-blue-500/20">
            {drug.species}
          </span>
        )}
        {drug.prescription_status && (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-500/10 text-amber-300 border border-amber-500/20">
            {drug.prescription_status}
          </span>
        )}
      </div>
    </Link>
  )
}
