import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ChevronDown, ChevronRight, Plus, Edit3, Trash2,
  FolderOpen, FileText, Loader2, X
} from 'lucide-react';
import api from '../lib/api';
import { slugify } from '../lib/utils';
import type { Category, Subcategory } from '../types';

export default function AdminKnowledge() {
  const queryClient = useQueryClient();
  const [expanded, setExpanded] = useState<Set<number>>(new Set());
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [itemType, setItemType] = useState<'category' | 'subcategory'>('category');

  const { data: categories, isLoading, error } = useQuery({
    queryKey: ['admin-knowledge-categories'],
    queryFn: () => api.get('/knowledge-categories/tree').then(r => r.data),
  });

  const deleteMutation = useMutation({
    mutationFn: ({ type, id }: { type: string; id: number }) =>
      api.delete(`/knowledge-${type}s/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-knowledge-categories'] });
    },
  });

  const toggleExpand = (id: number) => {
    setExpanded(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const openAdd = (type: 'category' | 'subcategory') => {
    setItemType(type);
    setEditingItem(null);
    setModalOpen(true);
  };

  const openEdit = (type: 'category' | 'subcategory', item: any) => {
    setItemType(type);
    setEditingItem(item);
    setModalOpen(true);
  };

  const handleDelete = (type: string, id: number) => {
    if (window.confirm(`Are you sure you want to delete this ${type}?`)) {
      deleteMutation.mutate({ type, id });
    }
  };

  if (isLoading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="animate-spin text-emerald-500" size={32} />
    </div>
  );

  if (error) return (
    <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700">
      Failed to load knowledge base. Please try again.
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Knowledge Base</h2>
        <div className="flex gap-2">
          <button
            onClick={() => openAdd('category')}
            className="flex items-center gap-1.5 px-3 py-2 bg-emerald-500 text-white rounded-lg text-sm font-medium hover:bg-emerald-600"
          >
            <Plus size={16} /> Add Category
          </button>
          <button
            onClick={() => openAdd('subcategory')}
            className="flex items-center gap-1.5 px-3 py-2 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-600"
          >
            <Plus size={16} /> Add Subcategory
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-5">
        {(!categories?.categories || categories.categories.length === 0) ? (
          <div className="text-center py-12">
            <FolderOpen size={48} className="mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500">No categories yet. Add your first category to get started.</p>
          </div>
        ) : (
          <div className="space-y-1">
            {(categories.categories || []).map((category: Category) => (
              <div key={category.id} className="border border-gray-200 rounded-lg overflow-hidden">
                <div
                  className="flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 cursor-pointer"
                  onClick={() => toggleExpand(category.id)}
                >
                  <div className="flex items-center gap-2">
                    {expanded.has(category.id) ? (
                      <ChevronDown size={16} className="text-gray-400" />
                    ) : (
                      <ChevronRight size={16} className="text-gray-400" />
                    )}
                    <FolderOpen size={18} className="text-amber-500" />
                    <span className="font-medium text-gray-900">{category.name}</span>
                    <span className="text-xs text-gray-400">({category.subcategory_count || 0} subcategories)</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={(e) => { e.stopPropagation(); openEdit('category', category); }}
                      className="p-1.5 rounded hover:bg-gray-200 text-gray-500"
                    >
                      <Edit3 size={14} />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDelete('category', category.id); }}
                      className="p-1.5 rounded hover:bg-red-100 text-red-400"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
                {expanded.has(category.id) && (
                  <div className="border-t border-gray-200">
                    {category.subcategories && category.subcategories.length > 0 ? (
                      category.subcategories.map((sub: Subcategory) => (
                        <div key={sub.id} className="flex items-center justify-between px-4 py-2.5 pl-10 hover:bg-gray-50 border-b border-gray-100 last:border-0">
                          <div className="flex items-center gap-2">
                            <FileText size={14} className="text-blue-400" />
                            <span className="text-sm text-gray-700">{sub.name}</span>
                            {sub.article_count ? (
                              <span className="text-xs text-gray-400">({sub.article_count} articles)</span>
                            ) : null}
                          </div>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => openEdit('subcategory', sub)}
                              className="p-1.5 rounded hover:bg-gray-200 text-gray-500"
                            >
                              <Edit3 size={14} />
                            </button>
                            <button
                              onClick={() => handleDelete('subcategory', sub.id)}
                              className="p-1.5 rounded hover:bg-red-100 text-red-400"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="px-10 py-3 text-sm text-gray-400">No subcategories</p>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {modalOpen && (
        <KnowledgeModal
          type={itemType}
          item={editingItem}
          categories={categories?.categories || []}
          onClose={() => setModalOpen(false)}
          onSuccess={() => {
            setModalOpen(false);
            queryClient.invalidateQueries({ queryKey: ['admin-knowledge-categories'] });
          }}
        />
      )}
    </div>
  );
}

function KnowledgeModal({
  type, item, categories, onClose, onSuccess
}: {
  type: 'category' | 'subcategory';
  item: any;
  categories: Category[];
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [name, setName] = useState(item?.name || '');
  const [slug, setSlug] = useState(item?.slug || '');
  const [description, setDescription] = useState(item?.description || '');
  const [status, setStatus] = useState(item?.status || 'active');
  const [categoryId, setCategoryId] = useState(item?.category_id || (categories[0]?.id || ''));
  const [icon, setIcon] = useState(item?.icon || '');
  const [thumbnail, setThumbnail] = useState(item?.thumbnail || '');
  const [seoTitle, setSeoTitle] = useState(item?.seo_title || '');
  const [seoDescription, setSeoDescription] = useState(item?.seo_description || '');

  const mutation = useMutation({
    mutationFn: (data: any) => {
      const endpoint = type === 'category' ? '/knowledge-categories' : '/knowledge-subcategories';
      if (item) {
        return api.put(`${endpoint}/${item.id}`, data);
      }
      return api.post(endpoint, data);
    },
    onSuccess,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload: any = { name, slug: slug || slugify(name), description, status };
    if (type === 'category') {
      payload.icon = icon;
      payload.thumbnail = thumbnail;
      payload.seo_title = seoTitle;
      payload.seo_description = seoDescription;
    } else {
      payload.category_id = Number(categoryId);
    }
    mutation.mutate(payload);
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center pt-20">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg mx-4">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h3 className="font-semibold text-gray-900">
            {item ? `Edit ${type === 'category' ? 'Category' : 'Subcategory'}` : `Add ${type === 'category' ? 'Category' : 'Subcategory'}`}
          </h3>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100 text-gray-400">
            <X size={20} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <input
              value={name}
              onChange={e => { setName(e.target.value); if (!item) setSlug(slugify(e.target.value)); }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Slug</label>
            <input
              value={slug}
              onChange={e => setSlug(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none resize-none"
            />
          </div>
          {type === 'category' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Icon</label>
                <input
                  value={icon}
                  onChange={e => setIcon(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Thumbnail URL</label>
                <input
                  value={thumbnail}
                  onChange={e => setThumbnail(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">SEO Title</label>
                <input
                  value={seoTitle}
                  onChange={e => setSeoTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">SEO Description</label>
                <textarea
                  value={seoDescription}
                  onChange={e => setSeoDescription(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none resize-none"
                />
              </div>
            </>
          )}
          {type === 'subcategory' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Parent Category</label>
              <select
                value={categoryId}
                onChange={e => setCategoryId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
              >
                {categories.map((cat: Category) => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={status}
              onChange={e => setStatus(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">
              Cancel
            </button>
            <button
              type="submit"
              disabled={mutation.isPending}
              className="px-4 py-2 bg-emerald-500 text-white rounded-lg text-sm font-medium hover:bg-emerald-600 disabled:opacity-50 flex items-center gap-1"
            >
              {mutation.isPending && <Loader2 size={14} className="animate-spin" />}
              {item ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
