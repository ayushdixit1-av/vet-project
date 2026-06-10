import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  AlertCircle, AlertTriangle, Info, Lightbulb, Download, ExternalLink,
  CheckCircle2, XCircle, Gift
} from 'lucide-react'
import { cn } from '../lib/utils'
import type { ArticleBlock } from '../types'

interface ArticleBlocksProps {
  blocks: ArticleBlock[]
  className?: string
}

function MCQBlock({ content }: { content: any }) {
  const [selected, setSelected] = useState<string | null>(null)

  const options = content.options || []
  const correctAnswer = content.correct_answer || content.correctAnswer

  return (
    <div className="rounded-xl bg-white/5 border border-white/10 p-6 space-y-4">
      <p className="text-white font-semibold text-lg">{content.question}</p>
      <div className="space-y-2">
        {options.map((opt: any) => {
          const isSelected = selected === opt.label
          const isCorrect = opt.label === correctAnswer
          let borderClass = 'border-white/10 hover:border-white/30'
          let bgClass = 'bg-white/5 hover:bg-white/10'
          let icon = null

          if (selected) {
            if (isCorrect) {
              borderClass = 'border-emerald-500'
              bgClass = 'bg-emerald-500/10'
              icon = <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            } else if (isSelected) {
              borderClass = 'border-red-500'
              bgClass = 'bg-red-500/10'
              icon = <XCircle className="w-5 h-5 text-red-400 shrink-0" />
            }
          }

          return (
            <button
              key={opt.label}
              onClick={() => selected === null && setSelected(opt.label)}
              disabled={selected !== null}
              className={cn(
                'w-full flex items-center gap-3 px-4 py-3 rounded-lg border transition-all text-left',
                borderClass, bgClass
              )}
            >
              <span className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center text-sm font-medium text-gray-300 shrink-0">
                {opt.label}
              </span>
              <span className="text-gray-200 flex-1">{opt.text}</span>
              {icon}
            </button>
          )
        })}
      </div>
      {selected && content.explanation && (
        <div className="mt-4 p-4 rounded-lg bg-blue-500/10 border border-blue-500/20 text-sm text-blue-200">
          <strong className="text-blue-300">Explanation:</strong> {content.explanation}
        </div>
      )}
    </div>
  )
}

function FaqBlock({ content }: { content: any }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null)
  const items = Array.isArray(content) ? content : content.items || []

  return (
    <div className="space-y-2">
      {items.map((item: any, idx: number) => (
        <div
          key={idx}
          className="rounded-xl bg-white/5 border border-white/10 overflow-hidden transition-all"
        >
          <button
            onClick={() => setOpenIndex(openIndex === idx ? null : idx)}
            className="w-full flex items-center justify-between px-5 py-4 text-left text-white font-medium hover:bg-white/5 transition-all"
          >
            <span>{item.question || item.q}</span>
            <svg
              className={cn('w-5 h-5 text-gray-400 transition-transform shrink-0', openIndex === idx && 'rotate-180')}
              fill="none" viewBox="0 0 24 24" stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {openIndex === idx && (
            <div className="px-5 pb-4 text-gray-400 text-sm leading-relaxed border-t border-white/10 pt-3">
              {item.answer || item.a}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

function TableBlock({ content }: { content: any }) {
  const rows = Array.isArray(content) ? content : content.rows || content.body || []
  const headers = content.headers || content.head || (rows.length > 0 ? Object.keys(rows[0]) : [])

  return (
    <div className="overflow-x-auto rounded-xl border border-white/10">
      <table className="w-full text-sm">
        {headers.length > 0 && (
          <thead>
            <tr className="bg-white/5">
              {headers.map((h: string, i: number) => (
                <th key={i} className="px-4 py-3 text-left font-semibold text-emerald-300 border-b border-white/10">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
        )}
        <tbody>
          {rows.map((row: any, rIdx: number) => (
            <tr key={rIdx} className={cn(rIdx % 2 === 0 ? 'bg-white/5' : 'bg-transparent', 'hover:bg-white/10 transition-colors')}>
              {headers.length > 0 ? (
                headers.map((h: string, cIdx: number) => (
                  <td key={cIdx} className="px-4 py-3 text-gray-300 border-b border-white/5">
                    {typeof row === 'object' ? (row[h] ?? row[cIdx] ?? '') : (cIdx === 0 ? row : '')}
                  </td>
                ))
              ) : (
                Array.isArray(row) && row.map((cell: any, cIdx: number) => (
                  <td key={cIdx} className="px-4 py-3 text-gray-300 border-b border-white/5">{cell}</td>
                ))
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function CalloutBlock({ content, attrs }: { content: any; attrs?: Record<string, any> }) {
  const type = attrs?.type || 'info'
  const iconMap: Record<string, any> = {
    info: Info,
    warning: AlertTriangle,
    danger: AlertCircle,
    tip: Lightbulb,
    success: Gift,
  }
  const colorMap: Record<string, string> = {
    info: 'bg-blue-500/10 border-blue-500/20 text-blue-200',
    warning: 'bg-amber-500/10 border-amber-500/20 text-amber-200',
    danger: 'bg-red-500/10 border-red-500/20 text-red-200',
    tip: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-200',
    success: 'bg-teal-500/10 border-teal-500/20 text-teal-200',
  }
  const Icon = iconMap[type] || Info

  return (
    <div className={cn('flex gap-4 p-5 rounded-xl border', colorMap[type] || colorMap.info)}>
      <Icon className="w-6 h-6 shrink-0 mt-0.5" />
      <div className="text-sm leading-relaxed">{typeof content === 'string' ? content : content.text || content.body}</div>
    </div>
  )
}

function ReferenceBlock({ content }: { content: any }) {
  const refs = Array.isArray(content) ? content : content.references || []

  return (
    <ol className="space-y-2 list-decimal list-inside">
      {refs.map((ref: any, idx: number) => (
        <li key={idx} className="text-sm text-gray-400 leading-relaxed">
          {typeof ref === 'string' ? ref : ref.text || ref.title}
          {(ref.url || ref.link) && (
            <a
              href={ref.url || ref.link}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 ml-2 text-emerald-400 hover:text-emerald-300 transition-colors"
            >
              <ExternalLink className="w-3 h-3" />
              <span>Source</span>
            </a>
          )}
        </li>
      ))}
    </ol>
  )
}

function DrugReferenceBlock({ content }: { content: any }) {
  return (
    <Link
      to={`/drugs/${content.slug || content.id}`}
      className="block p-5 rounded-xl bg-white/5 border border-white/10 hover:border-emerald-500/50 hover:bg-white/10 transition-all group"
    >
      <h4 className="text-lg font-semibold text-white group-hover:text-emerald-300 transition-colors">
        {content.name}
      </h4>
      {content.generic_name && (
        <p className="text-sm text-gray-400 mt-1">{content.generic_name}</p>
      )}
      <div className="flex flex-wrap gap-2 mt-3">
        {content.category && (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
            {content.category}
          </span>
        )}
        {content.species && (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-500/10 text-blue-300 border border-blue-500/20">
            {content.species}
          </span>
        )}
        {content.prescription_status && (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-500/10 text-amber-300 border border-amber-500/20">
            {content.prescription_status}
          </span>
        )}
      </div>
    </Link>
  )
}

function DiseaseReferenceBlock({ content }: { content: any }) {
  return (
    <Link
      to={`/diseases/${content.slug || content.id}`}
      className="block p-5 rounded-xl bg-white/5 border border-white/10 hover:border-emerald-500/50 hover:bg-white/10 transition-all group"
    >
      <h4 className="text-lg font-semibold text-white group-hover:text-emerald-300 transition-colors">
        {content.name}
      </h4>
      {content.species && (
        <span className="inline-block mt-2 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-500/10 text-blue-300 border border-blue-500/20">
          {content.species}
        </span>
      )}
      {content.description && (
        <p className="text-sm text-gray-400 mt-2 line-clamp-2">{content.description}</p>
      )}
    </Link>
  )
}

export default function ArticleBlocks({ blocks, className }: ArticleBlocksProps) {
  if (!blocks || blocks.length === 0) return null

  return (
    <div className={cn('space-y-6', className)}>
      {blocks.map((block) => {
        switch (block.type) {
          case 'heading': {
            const level = block.attrs?.level || 2
            const text = typeof block.content === 'string' ? block.content : block.content?.text || ''
            if (level === 2) {
              return <h2 key={block.id} className="text-2xl md:text-3xl font-bold text-white mt-8 mb-4">{text}</h2>
            }
            return <h3 key={block.id} className="text-xl md:text-2xl font-semibold text-white mt-6 mb-3">{text}</h3>
          }

          case 'paragraph': {
            const text = typeof block.content === 'string' ? block.content : block.content?.text || ''
            return <p key={block.id} className="text-gray-300 leading-relaxed text-base">{text}</p>
          }

          case 'image': {
            const src = typeof block.content === 'string' ? block.content : block.content?.url || block.content?.src || ''
            const caption = block.attrs?.caption || block.content?.caption || ''
            return (
              <figure key={block.id} className="my-6">
                <div className="rounded-xl overflow-hidden border border-white/10">
                  <img
                    src={src}
                    alt={caption || 'Article image'}
                    className="w-full h-auto object-cover"
                    loading="lazy"
                  />
                </div>
                {caption && (
                  <figcaption className="mt-2 text-center text-sm text-gray-500 italic">{caption}</figcaption>
                )}
              </figure>
            )
          }

          case 'gallery': {
            const images = Array.isArray(block.content) ? block.content : block.content?.images || []
            if (images.length === 0) return null
            return (
              <div key={block.id} className="grid grid-cols-2 md:grid-cols-3 gap-3 my-6">
                {images.map((img: any, idx: number) => {
                  const src = typeof img === 'string' ? img : img.url || img.src || ''
                  const alt = typeof img === 'string' ? '' : img.alt || img.caption || ''
                  return (
                    <div key={idx} className="rounded-xl overflow-hidden border border-white/10">
                      <img src={src} alt={alt} className="w-full h-40 object-cover" loading="lazy" />
                    </div>
                  )
                })}
              </div>
            )
          }

          case 'video': {
            const src = typeof block.content === 'string' ? block.content : block.content?.url || block.content?.src || ''
            return (
              <div key={block.id} className="my-6">
                <div className="relative aspect-video rounded-xl overflow-hidden border border-white/10">
                  <iframe
                    src={src}
                    className="absolute inset-0 w-full h-full"
                    allowFullScreen
                    title="Video embed"
                  />
                </div>
              </div>
            )
          }

          case 'quote': {
            const text = typeof block.content === 'string' ? block.content : block.content?.text || ''
            const author = block.attrs?.author || block.content?.author || ''
            return (
              <blockquote key={block.id} className="border-l-4 border-emerald-400 pl-6 py-3 my-6">
                <p className="text-lg text-gray-200 italic leading-relaxed">&ldquo;{text}&rdquo;</p>
                {author && (
                  <cite className="block mt-2 text-sm text-gray-400 not-italic">&mdash; {author}</cite>
                )}
              </blockquote>
            )
          }

          case 'table':
            return <div key={block.id} className="my-6"><TableBlock content={block.content} /></div>

          case 'faq':
            return <div key={block.id} className="my-6"><FaqBlock content={block.content} /></div>

          case 'reference':
            return (
              <div key={block.id} className="my-6">
                <h3 className="text-lg font-semibold text-white mb-3">References</h3>
                <ReferenceBlock content={block.content} />
              </div>
            )

          case 'callout':
            return <div key={block.id} className="my-6"><CalloutBlock content={block.content} attrs={block.attrs} /></div>

          case 'drug-reference':
            return <div key={block.id} className="my-4"><DrugReferenceBlock content={block.content} /></div>

          case 'disease-reference':
            return <div key={block.id} className="my-4"><DiseaseReferenceBlock content={block.content} /></div>

          case 'mcq':
            return <div key={block.id} className="my-6"><MCQBlock content={block.content} /></div>

          case 'download': {
            const url = typeof block.content === 'string' ? block.content : block.content?.url || ''
            const label = block.attrs?.label || block.content?.label || 'Download'
            return (
              <div key={block.id} className="my-6">
                <a
                  href={url}
                  download
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white font-medium shadow-lg shadow-emerald-500/25 transition-all"
                >
                  <Download className="w-5 h-5" />
                  {label}
                </a>
              </div>
            )
          }

          case 'code': {
            const code = typeof block.content === 'string' ? block.content : block.content?.code || block.content?.text || ''
            const language = block.attrs?.language || ''
            return (
              <div key={block.id} className="my-6">
                {language && (
                  <div className="px-4 py-1.5 bg-gray-800 rounded-t-xl border-t border-x border-white/10 text-xs text-gray-400 font-mono">
                    {language}
                  </div>
                )}
                <pre className={cn(
                  'overflow-x-auto p-4 bg-gray-900 text-gray-200 text-sm font-mono leading-relaxed',
                  language ? 'rounded-b-xl border border-white/10' : 'rounded-xl border border-white/10'
                )}>
                  <code>{code}</code>
                </pre>
              </div>
            )
          }

          case 'divider':
            return (
              <div key={block.id} className="relative flex items-center my-8">
                <div className="flex-1 border-t border-white/10" />
                <div className="mx-4 w-2 h-2 rounded-full bg-emerald-400/50" />
                <div className="flex-1 border-t border-white/10" />
              </div>
            )

          default:
            return null
        }
      })}
    </div>
  )
}
