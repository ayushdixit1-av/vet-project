import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Plus, Edit3, Trash2, FolderOpen, FileText, Loader2, X, Save,
  ChevronDown, ChevronRight, Code
} from 'lucide-react';
import api from '../lib/api';
import { slugify } from '../lib/utils';

export default function AdminNotes() {
  const queryClient = useQueryClient();
  const [expandedCat, setExpandedCat] = useState<Set<number>>(new Set());
  const [editModal, setEditModal] = useState<{ type: string; data?: any } | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ type: string; id: number } | null>(null);
  const [formData, setFormData] = useState<any>({});

  const toggleCat = (id: number) => {
    setExpandedCat(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const { data: catsData, isLoading: catsLoading } = useQuery({
    queryKey: ['admin-note-categories'],
    queryFn: () => api.get('/note-categories').then(r => r.data),
  });

  const categories = (catsData as any)?.categories || [];

  const endpoint = (type: string) => {
    const map: Record<string, string> = {
      category: 'note-categories',
      subcategory: 'note-subcategories',
      page: 'note-pages',
    };
    return map[type] || `note-${type}s`;
  };

  const deleteMutation = useMutation({
    mutationFn: ({ type, id }: { type: string; id: number }) =>
      api.delete(`/${endpoint(type)}/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-note'] });
      setDeleteConfirm(null);
    },
  });

  const saveMutation = useMutation({
    mutationFn: ({ type, data, id }: { type: string; data: any; id?: number }) => {
      if (id) return api.put(`/${endpoint(type)}/${id}`, data);
      return api.post(`/${endpoint(type)}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-note'] });
      setEditModal(null);
      setFormData({});
    },
  });

  const openEdit = (type: string, data?: any) => {
    setFormData(data || {});
    setEditModal({ type, data });
  };

  const renderModal = () => {
    if (!editModal) return null;
    const { type, data } = editModal;
    const isEdit = !!data?.id;

    return (
      <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={() => setEditModal(null)}>
        <div className="bg-gray-900 rounded-2xl border border-gray-800 p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-white">
              {isEdit ? `Edit ${type}` : `New ${type}`}
            </h2>
            <button onClick={() => setEditModal(null)} className="text-gray-400 hover:text-white transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-4">
            {type !== 'page' && (
              <div>
                <label className="block text-sm text-gray-400 mb-1">Name *</label>
                <input
                  value={formData.name || ''}
                  onChange={e => setFormData({ ...formData, name: e.target.value, slug: isEdit ? formData.slug : slugify(e.target.value) })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:border-emerald-500 outline-none"
                />
              </div>
            )}

            {type === 'page' && (
              <div>
                <label className="block text-sm text-gray-400 mb-1">Title *</label>
                <input
                  value={formData.title || ''}
                  onChange={e => setFormData({ ...formData, title: e.target.value, slug: isEdit ? formData.slug : slugify(e.target.value) })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:border-emerald-500 outline-none"
                />
              </div>
            )}

            {(type === 'category' || type === 'subcategory') && (
              <div>
                <label className="block text-sm text-gray-400 mb-1">Slug</label>
                <input
                  value={formData.slug || ''}
                  onChange={e => setFormData({ ...formData, slug: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:border-emerald-500 outline-none"
                />
              </div>
            )}

            {type === 'page' && (
              <div>
                <label className="block text-sm text-gray-400 mb-1">Slug</label>
                <input
                  value={formData.slug || ''}
                  onChange={e => setFormData({ ...formData, slug: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:border-emerald-500 outline-none"
                />
              </div>
            )}

            {(type === 'category' || type === 'subcategory') && (
              <div>
                <label className="block text-sm text-gray-400 mb-1">Description</label>
                <textarea
                  value={formData.description || ''}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:border-emerald-500 outline-none resize-none"
                />
              </div>
            )}

            {type === 'category' && (
              <div>
                <label className="block text-sm text-gray-400 mb-1">Icon</label>
                <input
                  value={formData.icon || ''}
                  onChange={e => setFormData({ ...formData, icon: e.target.value })}
                  placeholder="book, brain, heart, syringe, microscope..."
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:border-emerald-500 outline-none"
                />
              </div>
            )}

            {(type === 'category' || type === 'subcategory') && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Status</label>
                  <select
                    value={formData.status || 'active'}
                    onChange={e => setFormData({ ...formData, status: e.target.value })}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:border-emerald-500 outline-none"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Sort Order</label>
                  <input
                    type="number"
                    value={formData.sort_order || 0}
                    onChange={e => setFormData({ ...formData, sort_order: parseInt(e.target.value) || 0 })}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:border-emerald-500 outline-none"
                  />
                </div>
              </div>
            )}

            {type === 'page' && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Category *</label>
                    <select
                      value={formData.category_id || ''}
                      onChange={e => setFormData({ ...formData, category_id: parseInt(e.target.value) || '' })}
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:border-emerald-500 outline-none"
                    >
                      <option value="">Select category</option>
                      {categories.map((c: any) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Subcategory ID (optional)</label>
                    <input
                      type="number"
                      value={formData.subcategory_id || ''}
                      onChange={e => setFormData({ ...formData, subcategory_id: parseInt(e.target.value) || null })}
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:border-emerald-500 outline-none"
                      placeholder="Enter subcategory ID or leave empty"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Status</label>
                  <select
                    value={formData.status || 'active'}
                    onChange={e => setFormData({ ...formData, status: e.target.value })}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:border-emerald-500 outline-none"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Sort Order</label>
                  <input
                    type="number"
                    value={formData.sort_order || 0}
                    onChange={e => setFormData({ ...formData, sort_order: parseInt(e.target.value) || 0 })}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:border-emerald-500 outline-none"
                  />
                </div>
              </>
            )}

            {type === 'page' && (
              <div>
                <label className="block text-sm text-gray-400 mb-1 flex items-center gap-2">
                  <Code className="w-4 h-4" /> HTML Content
                </label>
                <textarea
                  value={formData.html_content || ''}
                  onChange={e => setFormData({ ...formData, html_content: e.target.value })}
                  rows={15}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white font-mono text-sm focus:border-emerald-500 outline-none resize-none"
                  placeholder="<h2>Topic Title</h2><p>Write your HTML content here...</p>"
                />
                <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                  <Code className="w-3 h-3" /> Write raw HTML. It will be rendered as-is on the note page.
                </p>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 mt-8">
            <button
              onClick={() => setEditModal(null)}
              className="px-5 py-2.5 rounded-lg bg-gray-800 text-gray-300 hover:text-white border border-gray-700 transition-all"
            >
              Cancel
            </button>
            <button
              onClick={() => saveMutation.mutate({ type, data: formData, id: data?.id })}
              disabled={saveMutation.isPending}
              className="px-5 py-2.5 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-medium hover:from-emerald-600 hover:to-teal-600 transition-all flex items-center gap-2"
            >
              {saveMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {isEdit ? 'Update' : 'Create'}
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderDeleteConfirm = () => {
    if (!deleteConfirm) return null;
    return (
      <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={() => setDeleteConfirm(null)}>
        <div className="bg-gray-900 rounded-2xl border border-gray-800 p-6 max-w-md w-full" onClick={e => e.stopPropagation()}>
          <h3 className="text-lg font-bold text-white mb-2">Delete {deleteConfirm.type}?</h3>
          <p className="text-gray-400 text-sm mb-6">This action cannot be undone. All related data will be removed.</p>
          <div className="flex justify-end gap-3">
            <button onClick={() => setDeleteConfirm(null)} className="px-5 py-2.5 rounded-lg bg-gray-800 text-gray-300 hover:text-white border border-gray-700 transition-all">Cancel</button>
            <button
              onClick={() => deleteMutation.mutate(deleteConfirm)}
              disabled={deleteMutation.isPending}
              className="px-5 py-2.5 rounded-lg bg-red-600 text-white font-medium hover:bg-red-700 transition-all flex items-center gap-2"
            >
              {deleteMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
              Delete
            </button>
          </div>
        </div>
      </div>
    );
  };

  if (catsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-400" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white">Manage Notes</h1>
          <p className="text-gray-400 mt-1">Organize note categories, subcategories, and HTML pages</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => openEdit('category')}
            className="px-4 py-2.5 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-medium hover:from-emerald-600 hover:to-teal-600 transition-all flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> Add Category
          </button>
          <button
            onClick={() => openEdit('page')}
            className="px-4 py-2.5 rounded-lg bg-gradient-to-r from-blue-500 to-indigo-500 text-white font-medium hover:from-blue-600 hover:to-indigo-600 transition-all flex items-center gap-2"
          >
            <FileText className="w-4 h-4" /> Add Page
          </button>
        </div>
      </div>

      <div className="space-y-3">
        {categories.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <FolderOpen className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>No note categories yet. Create one to get started.</p>
          </div>
        ) : (
          categories.map((cat: any) => (
            <NoteCategoryCard
              key={cat.id}
              cat={cat}
              expanded={expandedCat.has(cat.id)}
              onToggle={() => toggleCat(cat.id)}
              onEdit={() => openEdit('category', cat)}
              onDelete={() => setDeleteConfirm({ type: 'category', id: cat.id })}
              onAddSub={() => openEdit('subcategory', { category_id: cat.id })}
              onEditSub={(sub: any) => openEdit('subcategory', sub)}
              onDeleteSub={(id: number) => setDeleteConfirm({ type: 'subcategory', id })}
              onAddPage={(subId?: number) => openEdit('page', { category_id: cat.id, subcategory_id: subId || '' })}
              onEditPage={(page: any) => openEdit('page', page)}
              onDeletePage={(id: number) => setDeleteConfirm({ type: 'page', id })}
            />
          ))
        )}
      </div>

      {renderModal()}
      {renderDeleteConfirm()}
    </div>
  );
}

function NoteCategoryCard({
  cat, expanded, onToggle, onEdit, onDelete, onAddSub,
  onEditSub, onDeleteSub, onAddPage, onEditPage, onDeletePage
}: {
  cat: any; expanded: boolean; onToggle: () => void;
  onEdit: () => void; onDelete: () => void; onAddSub: () => void;
  onEditSub: (sub: any) => void; onDeleteSub: (id: number) => void;
  onAddPage: (subId?: number) => void; onEditPage: (page: any) => void; onDeletePage: (id: number) => void;
}) {
  const { data: subsData } = useQuery({
    queryKey: ['admin-note-subs', cat.id],
    queryFn: () => api.get(`/note-subcategories?category_id=${cat.id}`).then(r => r.data),
    enabled: expanded,
  });

  const { data: pagesData } = useQuery({
    queryKey: ['admin-note-pages-cat', cat.id],
    queryFn: () => api.get(`/note-pages?category_id=${cat.id}`).then(r => r.data),
    enabled: expanded,
  });

  const subcategories = (subsData as any)?.subcategories || [];
  const pages = (pagesData as any)?.pages || [];

  const topLevelPages = pages.filter((p: any) => !p.subcategory_id);

  return (
    <div className="bg-gray-900/50 border border-gray-800 rounded-xl overflow-hidden">
      <div className="flex items-center gap-3 px-5 py-4 cursor-pointer hover:bg-gray-800/30 transition-colors" onClick={onToggle}>
        <button className="text-gray-400 hover:text-white transition-colors">
          {expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </button>
        <FolderOpen className="w-5 h-5 text-emerald-400" />
        <div className="flex-1">
          <span className="text-white font-medium">{cat.name}</span>
          <span className="text-gray-500 text-sm ml-3">
            ({cat.subcategory_count || 0} topics, {cat.page_count || 0} pages)
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={e => { e.stopPropagation(); onAddSub(); }} className="p-1.5 rounded-lg hover:bg-gray-700 text-gray-400 hover:text-emerald-400 transition-all" title="Add subcategory">
            <Plus className="w-4 h-4" />
          </button>
          <button onClick={e => { e.stopPropagation(); onEdit(); }} className="p-1.5 rounded-lg hover:bg-gray-700 text-gray-400 hover:text-blue-400 transition-all" title="Edit">
            <Edit3 className="w-4 h-4" />
          </button>
          <button onClick={e => { e.stopPropagation(); onDelete(); }} className="p-1.5 rounded-lg hover:bg-gray-700 text-gray-400 hover:text-red-400 transition-all" title="Delete">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {expanded && (
        <div className="border-t border-gray-800">
          {subcategories.length === 0 && topLevelPages.length === 0 ? (
            <div className="px-12 py-6 text-gray-500 text-sm">
              <p>No subcategories. Add one or create a page directly.</p>
              <button onClick={() => onAddPage()} className="mt-2 text-emerald-400 hover:text-emerald-300 text-sm font-medium">
                <Plus className="w-3 h-3 inline mr-1" />Add page directly
              </button>
            </div>
          ) : (
            <div className="px-5 py-3 space-y-2">
              {subcategories.map((sub: any) => (
                <SubcategoryRow
                  key={sub.id}
                  sub={sub}
                  onEdit={() => onEditSub(sub)}
                  onDelete={() => onDeleteSub(sub.id)}
                  onAddPage={() => onAddPage(sub.id)}
                  onEditPage={onEditPage}
                  onDeletePage={onDeletePage}
                />
              ))}
              {topLevelPages.map((p: any) => (
                <PageRow key={p.id} page={p} onEdit={() => onEditPage(p)} onDelete={() => onDeletePage(p.id)} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function SubcategoryRow({ sub, onEdit, onDelete, onAddPage, onEditPage, onDeletePage }: {
  sub: any; onEdit: () => void; onDelete: () => void;
  onAddPage: () => void; onEditPage: (p: any) => void; onDeletePage: (id: number) => void;
}) {
  const [expanded, setExpanded] = useState(false);

  const { data: pagesData } = useQuery({
    queryKey: ['admin-note-pages-sub', sub.id],
    queryFn: () => api.get(`/note-pages?subcategory_id=${sub.id}`).then(r => r.data),
    enabled: expanded,
  });

  const pages = (pagesData as any)?.pages || [];

  return (
    <div className="bg-gray-800/30 border border-gray-700/50 rounded-lg">
      <div className="flex items-center gap-2 px-3 py-2.5 cursor-pointer hover:bg-gray-700/30 transition-colors" onClick={() => setExpanded(!expanded)}>
        <button className="text-gray-500 hover:text-white">
          {expanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
        </button>
        <span className="text-sm text-gray-300 flex-1">{sub.name}</span>
        <span className="text-xs text-gray-500">{sub.page_count || 0} pages</span>
        <button onClick={e => { e.stopPropagation(); onAddPage(); }} className="p-1 rounded hover:bg-gray-700 text-gray-400 hover:text-emerald-400" title="Add page">
          <Plus className="w-3 h-3" />
        </button>
        <button onClick={e => { e.stopPropagation(); onEdit(); }} className="p-1 rounded hover:bg-gray-700 text-gray-400 hover:text-blue-400" title="Edit subcategory">
          <Edit3 className="w-3 h-3" />
        </button>
        <button onClick={e => { e.stopPropagation(); onDelete(); }} className="p-1 rounded hover:bg-gray-700 text-gray-400 hover:text-red-400" title="Delete subcategory">
          <Trash2 className="w-3 h-3" />
        </button>
      </div>
      {expanded && (
        <div className="px-5 pb-2 space-y-1">
          {pages.map((p: any) => (
            <PageRow key={p.id} page={p} onEdit={() => onEditPage(p)} onDelete={() => onDeletePage(p.id)} />
          ))}
          {pages.length === 0 && (
            <p className="text-xs text-gray-600 py-2">No pages in this topic</p>
          )}
        </div>
      )}
    </div>
  );
}

function PageRow({ page, onEdit, onDelete }: { page: any; onEdit: () => void; onDelete: () => void }) {
  return (
    <div className="flex items-center gap-2 px-3 py-2 rounded hover:bg-gray-800/50 transition-colors group">
      <FileText className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
      <span className="text-sm text-gray-300 flex-1 truncate">{page.title}</span>
      <span className="text-xs text-gray-600">{page.view_count || 0} views</span>
      <button onClick={onEdit} className="p-1 rounded hover:bg-gray-700 text-gray-500 hover:text-blue-400 opacity-0 group-hover:opacity-100 transition-all">
        <Edit3 className="w-3 h-3" />
      </button>
      <button onClick={onDelete} className="p-1 rounded hover:bg-gray-700 text-gray-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all">
        <Trash2 className="w-3 h-3" />
      </button>
    </div>
  );
}
