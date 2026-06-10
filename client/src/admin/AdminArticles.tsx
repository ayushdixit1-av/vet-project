import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Plus, Edit3, Trash2, Loader2, Search, Eye } from 'lucide-react';
import api from '../lib/api';
import { formatDate } from '../lib/utils';
import type { Article } from '../types';

export default function AdminArticles() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [page, setPage] = useState(1);

  const { data: categories } = useQuery({
    queryKey: ['admin-categories-list'],
    queryFn: () => api.get('/knowledge-categories').then(r => r.data),
  });

  const params = new URLSearchParams();
  if (statusFilter) params.set('status', statusFilter);
  if (categoryFilter) params.set('category_id', categoryFilter);
  if (search) params.set('search', search);
  params.set('page', String(page));

  const { data: articlesData, isLoading, error } = useQuery({
    queryKey: ['admin-articles', statusFilter, categoryFilter, search, page],
    queryFn: () => api.get(`/articles?${params.toString()}`).then(r => r.data),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/articles/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-articles'] }),
  });

  const handleDelete = (id: number) => {
    if (window.confirm('Are you sure you want to delete this article?')) {
      deleteMutation.mutate(id);
    }
  };

  const articles = articlesData?.articles || [];
  const totalPages = articlesData?.totalPages || 1;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Articles</h2>
        <button
          onClick={() => navigate('/admin/articles/new')}
          className="flex items-center gap-1.5 px-3 py-2 bg-emerald-500 text-white rounded-lg text-sm font-medium hover:bg-emerald-600"
        >
          <Plus size={16} /> Add Article
        </button>
      </div>

      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search articles..."
            className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
          />
        </div>
        <select
          value={statusFilter}
          onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
        >
          <option value="">All Status</option>
          <option value="draft">Draft</option>
          <option value="published">Published</option>
        </select>
        <select
          value={categoryFilter}
          onChange={e => { setCategoryFilter(e.target.value); setPage(1); }}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
        >
          <option value="">All Categories</option>
          {(categories?.categories || []).map((c: any) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-64"><Loader2 className="animate-spin text-emerald-500" size={32} /></div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700">Failed to load articles.</div>
      ) : articles.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center text-gray-500">
          <Eye size={48} className="mx-auto text-gray-300 mb-3" />
          <p>No articles found.</p>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Title</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Category</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase">Views</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Author</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Date</th>
                    <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {articles.map((article: Article) => (
                    <tr key={article.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900 max-w-xs truncate">{article.title}</td>
                      <td className="px-4 py-3 text-sm text-gray-500">{article.category_name || '-'}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                          article.status === 'published' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                        }`}>
                          {article.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-center text-gray-600">{article.view_count || 0}</td>
                      <td className="px-4 py-3 text-sm text-gray-500">{article.author || '-'}</td>
                      <td className="px-4 py-3 text-sm text-gray-500">{article.created_at ? formatDate(article.created_at) : '-'}</td>
                      <td className="px-4 py-3 text-right">
                        <button onClick={() => navigate(`/admin/articles/edit/${article.id}`)} className="p-1.5 rounded hover:bg-blue-50 text-blue-500">
                          <Edit3 size={14} />
                        </button>
                        <button onClick={() => handleDelete(article.id)} className="p-1.5 rounded hover:bg-red-50 text-red-500 ml-1">
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          {totalPages > 1 && (
            <div className="flex justify-center gap-2">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium ${
                    p === page ? 'bg-emerald-500 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
