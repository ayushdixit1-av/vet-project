import { Link } from 'react-router-dom'
import { Clock, User } from 'lucide-react'
import { cn } from '../lib/utils'
import type { Article } from '../types'

interface ArticleCardProps {
  article: Article
  className?: string
}

export default function ArticleCard({ article, className }: ArticleCardProps) {
  const tags = article.tags ? article.tags.split(',').map(t => t.trim()).filter(Boolean) : []
  const excerpt = article.excerpt || ''

  return (
    <Link
      to={`/article/${article.slug}`}
      className={cn(
        'group block rounded-2xl bg-white/5 border border-white/10 overflow-hidden transition-all duration-300 hover:scale-[1.02] hover:shadow-xl hover:shadow-emerald-500/10 hover:border-emerald-500/30',
        className
      )}
    >
      <div className="relative aspect-video overflow-hidden">
        <img
          src={article.featured_image || 'https://placehold.co/600x400?text=VetCrack'}
          alt={article.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-transparent to-transparent" />
      </div>

      <div className="p-5">
        <h3 className="text-lg font-semibold text-white group-hover:text-emerald-300 transition-colors line-clamp-2">
          {article.title}
        </h3>

        {excerpt && (
          <p className="mt-2 text-sm text-gray-400 line-clamp-2 leading-relaxed">
            {excerpt}
          </p>
        )}

        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="px-2 py-0.5 rounded-full text-xs font-medium bg-white/5 text-gray-400 border border-white/10"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        <div className="flex items-center gap-4 mt-4 pt-4 border-t border-white/10 text-xs text-gray-500">
          {article.author && (
            <span className="flex items-center gap-1.5">
              <User className="w-3.5 h-3.5" />
              {article.author}
            </span>
          )}
          {article.reading_time && (
            <span className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              {article.reading_time} min read
            </span>
          )}
        </div>
      </div>
    </Link>
  )
}
