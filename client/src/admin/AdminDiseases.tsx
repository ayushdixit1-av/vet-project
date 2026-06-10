import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit3, Trash2, Loader2, X, Search } from 'lucide-react';
import api from '../lib/api';
import { slugify } from '../lib/utils';
import type { Disease } from '../types';

export default function AdminDiseases() {
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Disease | null>(null);
  const [search, setSearch] = useState('');

  const { data: diseases, isLoading, error } = useQuery({
    queryKey: ['admin-diseases', search],
    queryFn: () => api.get(`/diseases?search=${search}`).then(r => r.data),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/diseases/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-diseases'] }),
  });

  const handleDelete = (id: number) => {
    if (window.confirm('Are you sure you want to delete this disease?')) deleteMutation.mutate(id);
  };

  const list = diseases?.diseases || [];

  if (isLoading) return <div className="flex items-center justify-center h-64"><Loader2 className="animate-spin text-emerald-500" size={32} /></div>;
  if (error) return <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700">Failed to load diseases.</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Diseases</h2>
        <button onClick={() => { setEditing(null); setModalOpen(true); }} className="flex items-center gap-1.5 px-3 py-2 bg-emerald-500 text-white rounded-lg text-sm font-medium hover:bg-emerald-600"><Plus size={16} /> Add Disease</button>
      </div>
      <div className="relative max-w-sm">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search diseases..." className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none" />
      </div>
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {list.length === 0 ? <div className="text-center py-12 text-gray-500">No diseases found.</div> : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Name</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Slug</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Species</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {list.map((d: Disease) => (
                  <tr key={d.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{d.name}</td>
                    <td className="px-4 py-3 text-sm text-gray-500 font-mono">{d.slug}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{d.species || '-'}</td>
                    <td className="px-4 py-3"><span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${d.status === 'active' ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-600'}`}>{d.status}</span></td>
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => { setEditing(d); setModalOpen(true); }} className="p-1.5 rounded hover:bg-blue-50 text-blue-500"><Edit3 size={14} /></button>
                      <button onClick={() => handleDelete(d.id)} className="p-1.5 rounded hover:bg-red-50 text-red-500 ml-1"><Trash2 size={14} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      {modalOpen && <DiseaseModal disease={editing} onClose={() => setModalOpen(false)} onSuccess={() => { setModalOpen(false); queryClient.invalidateQueries({ queryKey: ['admin-diseases'] }); }} />}
    </div>
  );
}

function DiseaseModal({ disease, onClose, onSuccess }: { disease: Disease | null; onClose: () => void; onSuccess: () => void }) {
  const [name, setName] = useState(disease?.name || '');
  const [slug, setSlug] = useState(disease?.slug || '');
  const [overview, setOverview] = useState(disease?.overview || '');
  const [symptoms, setSymptoms] = useState(disease?.symptoms || '');
  const [causes, setCauses] = useState(disease?.causes || '');
  const [diagnosis, setDiagnosis] = useState(disease?.diagnosis || '');
  const [treatment, setTreatment] = useState(disease?.treatment || '');
  const [prevention, setPrevention] = useState(disease?.prevention || '');
  const [species, setSpecies] = useState(disease?.species || '');
  const [status, setStatus] = useState(disease?.status || 'active');
  const [references, setReferences] = useState(disease?.references || '');
  const [images, setImages] = useState<string[]>(disease?.images || ['']);
  const [seoTitle, setSeoTitle] = useState(disease?.seo_title || '');
  const [seoDescription, setSeoDescription] = useState(disease?.seo_description || '');
  const [seoKeywords, setSeoKeywords] = useState(disease?.seo_keywords || '');

  const mutation = useMutation({
    mutationFn: (data: any) => {
      if (disease) return api.put(`/diseases/${disease.id}`, data);
      return api.post('/diseases', data);
    },
    onSuccess,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate({ name, slug: slug || slugify(name), overview, symptoms, causes, diagnosis, treatment, prevention, species, status, references, images: images.filter(Boolean), seo_title: seoTitle, seo_description: seoDescription, seo_keywords: seoKeywords });
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center pt-10 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl mx-4 my-10">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 sticky top-0 bg-white rounded-t-xl">
          <h3 className="font-semibold text-gray-900">{disease ? 'Edit Disease' : 'Add Disease'}</h3>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100 text-gray-400"><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-xs font-medium text-gray-600 mb-1">Name *</label><input value={name} onChange={e => { setName(e.target.value); if (!disease) setSlug(slugify(e.target.value)); }} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none" required /></div>
            <div><label className="block text-xs font-medium text-gray-600 mb-1">Slug</label><input value={slug} onChange={e => setSlug(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none" /></div>
            <div><label className="block text-xs font-medium text-gray-600 mb-1">Species</label><input value={species} onChange={e => setSpecies(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none" /></div>
            <div><label className="block text-xs font-medium text-gray-600 mb-1">Status</label><select value={status} onChange={e => setStatus(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none"><option value="active">Active</option><option value="inactive">Inactive</option></select></div>
          </div>
          <div><label className="block text-xs font-medium text-gray-600 mb-1">Overview</label><textarea value={overview} onChange={e => setOverview(e.target.value)} rows={3} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none resize-none" /></div>
          <div><label className="block text-xs font-medium text-gray-600 mb-1">Symptoms</label><textarea value={symptoms} onChange={e => setSymptoms(e.target.value)} rows={3} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none resize-none" /></div>
          <div><label className="block text-xs font-medium text-gray-600 mb-1">Causes</label><textarea value={causes} onChange={e => setCauses(e.target.value)} rows={3} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none resize-none" /></div>
          <div><label className="block text-xs font-medium text-gray-600 mb-1">Diagnosis</label><textarea value={diagnosis} onChange={e => setDiagnosis(e.target.value)} rows={3} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none resize-none" /></div>
          <div><label className="block text-xs font-medium text-gray-600 mb-1">Treatment</label><textarea value={treatment} onChange={e => setTreatment(e.target.value)} rows={3} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none resize-none" /></div>
          <div><label className="block text-xs font-medium text-gray-600 mb-1">Prevention</label><textarea value={prevention} onChange={e => setPrevention(e.target.value)} rows={3} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none resize-none" /></div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Images</label>
            {images.map((url, i) => (
              <div key={i} className="flex gap-2 mb-1">
                <input value={url} onChange={e => { const imgs = [...images]; imgs[i] = e.target.value; setImages(imgs); }} placeholder="Image URL..." className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none" />
                <button type="button" onClick={() => setImages(images.filter((_, j) => j !== i))} className="p-2 text-red-400 hover:bg-red-50 rounded"><X size={14} /></button>
              </div>
            ))}
            <button type="button" onClick={() => setImages([...images, ''])} className="text-sm text-emerald-600 font-medium">+ Add Image</button>
          </div>
          <div><label className="block text-xs font-medium text-gray-600 mb-1">References</label><textarea value={references} onChange={e => setReferences(e.target.value)} rows={2} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none resize-none" /></div>
          <div className="border-t border-gray-200 pt-3">
            <p className="text-xs font-semibold text-gray-500 uppercase mb-2">SEO</p>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="block text-xs font-medium text-gray-600 mb-1">SEO Title</label><input value={seoTitle} onChange={e => setSeoTitle(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none" /></div>
              <div><label className="block text-xs font-medium text-gray-600 mb-1">SEO Keywords</label><input value={seoKeywords} onChange={e => setSeoKeywords(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none" /></div>
            </div>
            <div className="mt-2"><label className="block text-xs font-medium text-gray-600 mb-1">SEO Description</label><textarea value={seoDescription} onChange={e => setSeoDescription(e.target.value)} rows={2} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none resize-none" /></div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>
            <button type="submit" disabled={mutation.isPending} className="px-4 py-2 bg-emerald-500 text-white rounded-lg text-sm font-medium hover:bg-emerald-600 disabled:opacity-50 flex items-center gap-1">
              {mutation.isPending && <Loader2 size={14} className="animate-spin" />}{disease ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
