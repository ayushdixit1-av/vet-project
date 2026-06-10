import { useState, useEffect } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  Clock, User, Calendar, Tag, Share2, Check,
  ChevronRight, MessageCircle, BookOpen, ArrowLeft
} from 'lucide-react'
import api from '../lib/api'
import ArticleBlocks from '../components/ArticleBlocks'
import ArticleCard from '../components/ArticleCard'
import type { Article, ArticleBlock } from '../types'
import { formatDate } from '../lib/utils'

export default function ArticleView() {
  const { slug } = useParams<{ slug: string }>()
  const [copied, setCopied] = useState(false)

  const { data: article, isLoading, error } = useQuery({
    queryKey: ['article', slug],
    queryFn: () => api.get(`/articles/${slug}`).then(r => r.data),
    enabled: !!slug,
  })

  const { data: relatedArticles } = useQuery({
    queryKey: ['article', slug, 'related'],
    queryFn: () => api.get(`/articles/${slug}/related`).then(r => r.data),
    enabled: !!slug,
  })

  useEffect(() => {
    if (copied) {
      const t = setTimeout(() => setCopied(false), 2000)
      return () => clearTimeout(t)
    }
  }, [copied])

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href)
    setCopied(true)
  }

  if (error) return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="text-center">
        <p className="text-red-400 text-lg">Failed to load article</p>
        <p className="text-gray-500 mt-2">Please try again later</p>
      </div>
    </div>
  )

  if (isLoading) return (
    <div className="min-h-screen">
      <div className="animate-pulse bg-gray-800/50 h-96" />
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-4">
        <div className="animate-pulse bg-gray-800/50 h-10 w-3/4 rounded" />
        <div className="animate-pulse bg-gray-800/50 h-4 w-1/2 rounded" />
        <div className="animate-pulse bg-gray-800/50 h-64 rounded-xl" />
        <div className="animate-pulse bg-gray-800/50 h-4 rounded" />
        <div className="animate-pulse bg-gray-800/50 h-4 rounded" />
        <div className="animate-pulse bg-gray-800/50 h-4 rounded w-3/4" />
      </div>
    </div>
  )

  const art = article as Article
  const blocks = art?.content as ArticleBlock[]
  const headings = blocks?.filter(b => b.type === 'heading') ?? []
  const faqBlocks = blocks?.filter(b => b.type === 'faq') ?? []
  const references = blocks?.filter(b => b.type === 'reference') ?? []
  const tags = art?.tags ? art.tags.split(',').map(t => t.trim()).filter(Boolean) : []

  return (
    <div>
      {/* Hero */}
      <div className="relative h-96 overflow-hidden">
        <img
          src={art?.featured_image || '/placeholder-article.jpg'}
          alt={art?.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-gray-950/60 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-8 max-w-4xl mx-auto">
          <div className="flex items-center gap-2 text-sm text-emerald-300 mb-4">
            <Link to="/" className="hover:text-white transition-colors">Home</Link>
            <ChevronRight className="w-3 h-3" />
            <Link to="/knowledge" className="hover:text-white transition-colors">Knowledge</Link>
            {art?.category_slug && (
              <>
                <ChevronRight className="w-3 h-3" />
                <Link to={`/knowledge/${art.category_slug}`} className="hover:text-white transition-colors">{art.category_name}</Link>
              </>
            )}
            {art?.subcategory_slug && (
              <>
                <ChevronRight className="w-3 h-3" />
                <Link to={`/knowledge/${art.category_slug}/${art.subcategory_slug}`} className="hover:text-white transition-colors">{art.subcategory_name}</Link>
              </>
            )}
            <ChevronRight className="w-3 h-3" />
            <span className="text-white">{art?.title}</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-12">
          {/* Sidebar TOC */}
          <aside className="hidden xl:block w-64 shrink-0">
            <div className="sticky top-24">
              <div className="bg-gray-900/60 border border-gray-800 rounded-2xl p-5">
                <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-emerald-400" />
                  Table of Contents
                </h3>
                <nav className="space-y-1">
                  {headings.map((block, i) => (
                    <a
                      key={block.id || i}
                      href={`#heading-${block.id || i}`}
                      className="block text-sm text-gray-400 hover:text-emerald-400 transition-colors truncate py-1"
                    >
                      {(block.content as any)?.text || `Section ${i + 1}`}
                    </a>
                  ))}
                </nav>
              </div>
            </div>
          </aside>

          {/* Article Body */}
          <div className="flex-1 max-w-4xl">
            <article>
              <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">{art?.title}</h1>

              {/* Meta */}
              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-400 mb-8 pb-8 border-b border-gray-800/50">
                <span className="flex items-center gap-1.5">
                  <User className="w-4 h-4 text-emerald-400" />
                  {art?.author}
                </span>
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-emerald-400" />
                  {art?.published_at ? formatDate(art.published_at) : ''}
                </span>
                <span className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-emerald-400" />
                  {art?.reading_time} min read
                </span>
              </div>

              {/* Content Blocks */}
              <div className="prose prose-invert max-w-none mb-12">
                <ArticleBlocks blocks={blocks} />
              </div>

              {/* Tags */}
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-12">
                  <Tag className="w-4 h-4 text-gray-500 mt-1" />
                  {tags.map(tag => (
                    <Link
                      key={tag}
                      to={`/search?q=${encodeURIComponent(tag)}`}
                      className="px-3 py-1 rounded-full text-sm bg-gray-800 text-gray-300 hover:bg-emerald-500/20 hover:text-emerald-300 border border-gray-700 hover:border-emerald-500/30 transition-all"
                    >
                      {tag}
                    </Link>
                  ))}
                </div>
              )}

              {/* Share */}
              <div className="flex items-center gap-4 mb-12 p-4 bg-gray-900/60 border border-gray-800 rounded-2xl">
                <span className="text-sm text-gray-400">Share this article:</span>
                <button
                  onClick={copyLink}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-sm font-medium hover:from-emerald-600 hover:to-teal-600 transition-all"
                >
                  {copied ? <Check className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}
                  {copied ? 'Copied!' : 'Copy Link'}
                </button>
              </div>

              {/* FAQ */}
              {faqBlocks.length > 0 && (
                <section className="mb-12">
                  <h2 className="text-2xl font-bold text-white mb-6">Frequently Asked Questions</h2>
                  <div className="space-y-4">
                    {faqBlocks.map((block, i) => {
                      const { question, answer } = (block.content as any) ?? {}
                      return (
                        <div key={block.id || i} className="bg-gray-900/60 border border-gray-800 rounded-2xl p-6">
                          <h3 className="text-lg font-semibold text-white mb-2">{question || `Question ${i + 1}`}</h3>
                          <p className="text-gray-400">{answer || ''}</p>
                        </div>
                      )
                    })}
                  </div>
                </section>
              )}

              {/* References */}
              {references.length > 0 && (
                <section className="mb-12">
                  <h2 className="text-2xl font-bold text-white mb-6">References</h2>
                  <div className="space-y-3">
                    {references.map((block, i) => (
                      <div key={block.id || i} className="flex gap-3 text-sm text-gray-400">
                        <span className="text-emerald-400 font-medium shrink-0">[{i + 1}]</span>
                        <span>{(block.content as any)?.text || ''}</span>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* Comments placeholder */}
              <section className="mb-12">
                <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                  <MessageCircle className="w-6 h-6 text-emerald-400" />
                  Comments
                </h2>
                <div className="bg-gray-900/60 border border-gray-800 rounded-2xl p-8 text-center">
                  <MessageCircle className="w-12 h-12 mx-auto text-gray-600 mb-3" />
                  <p className="text-gray-400">Comments section coming soon</p>
                </div>
              </section>
            </article>
          </div>
        </div>
      </div>

      {/* Related Articles */}
      {relatedArticles && (relatedArticles as Article[]).length > 0 && (
        <section className="bg-gray-900/30 border-t border-gray-800/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <h2 className="text-2xl font-bold text-white mb-8">Related Articles</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {(relatedArticles as Article[]).map((related) => (
                <ArticleCard key={related.id} article={related} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Back to top */}
      <div className="text-center pb-8">
        <Link
          to="/knowledge"
          className="inline-flex items-center gap-2 text-emerald-400 hover:text-emerald-300 font-medium transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Knowledge Base
        </Link>
      </div>
    </div>
  )
}
