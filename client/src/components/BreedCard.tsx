import { Link } from 'react-router-dom'
import { Dog } from 'lucide-react'
import { cn } from '../lib/utils'
import type { Breed } from '../types'

interface BreedCardProps {
  breed: Breed
  className?: string
}

export default function BreedCard({ breed, className }: BreedCardProps) {
  return (
    <Link
      to={`/breeds/${breed.slug}`}
      className={cn(
        'group block rounded-2xl bg-white/5 border border-white/10 p-5 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl hover:shadow-emerald-500/10 hover:border-emerald-500/30',
        className
      )}
    >
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-400/20 to-orange-400/20 border border-amber-500/20 flex items-center justify-center shrink-0">
          <Dog className="w-6 h-6 text-amber-400" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold text-white group-hover:text-emerald-300 transition-colors truncate">
            {breed.name}
          </h3>
          {breed.species && (
            <span className="inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-medium bg-blue-500/10 text-blue-300 border border-blue-500/20">
              {breed.species}
            </span>
          )}
        </div>
      </div>

      <div className="mt-3 space-y-1.5">
        {breed.origin && (
          <p className="text-sm text-gray-400">
            <span className="text-gray-500">Origin:</span> {breed.origin}
          </p>
        )}
        {breed.characteristics && (
          <p className="text-sm text-gray-400 line-clamp-2 leading-relaxed">
            <span className="text-gray-500">Characteristics:</span> {breed.characteristics}
          </p>
        )}
      </div>
    </Link>
  )
}
