import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit3, Trash2, Loader2, X, Search, Check, XCircle } from 'lucide-react';
import api from '../lib/api';
import { slugify } from '../lib/utils';
import type { Subcategory, Category } from '../types';

export default function AdminSubcategories() {
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Subcategory | null>(null);
  const [search, setSearch] = useState('');

  const { data: subcategories, isLoading, error } = useQuery({
    queryKey: ['admin-subcategories'],
    queryFn: () => api.get('/knowledge-subcategories').then(r => r.data),
  });

  const { data: categories } = useQuery({
    queryKey: ['admin-categories-dropdown'],
    queryFn: () => api.get('/knowledge-categories').then(r => r.data),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/knowledge-subcategories/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-subcategories'] }),
  });

  const toggleStatus = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) =>
      api.put(`/knowledge-subcategories/${id}`, { status }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-subcategories'] }),
  });

  const handleDelete = (id: number) => {
    if (window.confirm('Are you sure you want to delete this subcategory?')) {
      deleteMutation.mutate(id);
    }
  };

  const filtered = (subcategories?.subcategories || []).filter((s: Subcategory) =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    (s.category_name || '').toLowerCase().includes(search.toLowerCase())
  );

  if (isLoading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="animate-spin text-emerald-500" size={32} />
    </div>
  );

  if (error) return (
    <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700">
      Failed to load subcategories.
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Subcategories</h2>
        <button
          onClick={() => { setEditing(null); setModalOpen(true); }}
          className="flex items-center gap-1.5 px-3 py-2 bg-emerald-500 text-white rounded-lg text-sm font-medium hover:bg-emerald-600"
        >
          <Plus size={16} /> Add Subcategory
        </button>
      </div>

      <div className="relative max-w-sm">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search subcategories..."
          className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
        />
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {filtered.length === 0 ? (
          <div className="text-center py-12 text-gray-500">No subcategories found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Name</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Parent Category</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Slug</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((sub: Subcategory) => (
                  <tr key={sub.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{sub.name}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{sub.category_name || '-'}</td>
                    <td className="px-4 py-3 text-sm text-gray-500 font-mono">{sub.slug}</td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => toggleStatus.mutate({ id: sub.id, status: sub.status === 'active' ? 'inactive' : 'active' })}
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                          sub.status === 'active' ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {sub.status === 'active' ? <Check size={12} /> : <XCircle size={12} />}
                        {sub.status}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => { setEditing(sub); setModalOpen(true); }} className="p-1.5 rounded hover:bg-blue-50 text-blue-500">
                        <Edit3 size={14} />
                      </button>
                      <button onClick={() => handleDelete(sub.id)} className="p-1.5 rounded hover:bg-red-50 text-red-500 ml-1">
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modalOpen && (
        <SubcategoryModal
          subcategory={editing}
          categories={categories?.categories || []}
          onClose={() => setModalOpen(false)}
          onSuccess={() => {
            setModalOpen(false);
            queryClient.invalidateQueries({ queryKey: ['admin-subcategories'] });
          }}
        />
      )}
    </div>
  );
}

function SubcategoryModal({
  subcategory, categories, onClose, onSuccess
}: {
  subcategory: Subcategory | null;
  categories: Category[];
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [name, setName] = useState(subcategory?.name || '');
  const [slug, setSlug] = useState(subcategory?.slug || '');
  const [description, setDescription] = useState(subcategory?.description || '');
  const [categoryId, setCategoryId] = useState(subcategory?.category_id || (categories[0]?.id || ''));
  const [status, setStatus] = useState(subcategory?.status || 'active');

  const mutation = useMutation({
    mutationFn: (data: any) => {
      if (subcategory) return api.put(`/knowledge-subcategories/${subcategory.id}`, data);
      return api.post('/knowledge-subcategories', data);
    },
    onSuccess,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate({ name, slug: slug || slugify(name), description, category_id: Number(categoryId), status });
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center pt-20">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg mx-4">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h3 className="font-semibold text-gray-900">{subcategory ? 'Edit Subcategory' : 'Add Subcategory'}</h3>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100 text-gray-400"><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <input value={name} onChange={e => { setName(e.target.value); if (!subcategory) setSlug(slugify(e.target.value)); }} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Slug</label>
            <input value={slug} onChange={e => setSlug(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Parent Category</label>
            <select value={categoryId} onChange={e => setCategoryId(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none">
              {categories.map((cat: Category) => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none resize-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select value={status} onChange={e => setStatus(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none">
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>
            <button type="submit" disabled={mutation.isPending} className="px-4 py-2 bg-emerald-500 text-white rounded-lg text-sm font-medium hover:bg-emerald-600 disabled:opacity-50 flex items-center gap-1">
              {mutation.isPending && <Loader2 size={14} className="animate-spin" />}
              {subcategory ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
