import { Link } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import { cn } from '../lib/utils'

interface BreadcrumbItem {
  label: string
  href?: string
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[]
  className?: string
}

export default function Breadcrumbs({ items, className }: BreadcrumbsProps) {
  return (
    <nav aria-label="Breadcrumb" className={cn('flex items-center gap-1.5 text-sm', className)}>
      {items.map((item, index) => {
        const isLast = index === items.length - 1
        return (
          <span key={index} className="flex items-center gap-1.5">
            {index > 0 && (
              <ChevronRight className="w-4 h-4 text-gray-500" />
            )}
            {item.href && !isLast ? (
              <Link
                to={item.href}
                className="text-gray-400 hover:text-emerald-400 transition-colors"
              >
                {item.label}
              </Link>
            ) : (
              <span className={cn(
                isLast ? 'text-white font-medium' : 'text-gray-400'
              )}>
                {item.label}
              </span>
            )}
          </span>
        )
      })}
    </nav>
  )
}
