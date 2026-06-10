import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit3, Trash2, Loader2, X, Search } from 'lucide-react';
import api from '../lib/api';
import type { Drug } from '../types';

export default function AdminDrugs() {
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Drug | null>(null);
  const [search, setSearch] = useState('');

  const { data: drugs, isLoading, error } = useQuery({
    queryKey: ['admin-drugs', search],
    queryFn: () => api.get(`/medicines?search=${search}`).then(r => r.data),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/medicines/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-drugs'] }),
  });

  const handleDelete = (id: number) => {
    if (window.confirm('Are you sure you want to delete this drug?')) {
      deleteMutation.mutate(id);
    }
  };

  const drugList = drugs?.medicines || [];

  if (isLoading) return <div className="flex items-center justify-center h-64"><Loader2 className="animate-spin text-emerald-500" size={32} /></div>;
  if (error) return <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700">Failed to load drugs.</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Drugs</h2>
        <button onClick={() => { setEditing(null); setModalOpen(true); }} className="flex items-center gap-1.5 px-3 py-2 bg-emerald-500 text-white rounded-lg text-sm font-medium hover:bg-emerald-600">
          <Plus size={16} /> Add Drug
        </button>
      </div>
      <div className="relative max-w-sm">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search drugs..." className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none" />
      </div>
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {drugList.length === 0 ? (
          <div className="text-center py-12 text-gray-500">No drugs found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Name</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Generic Name</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Category</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Species</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Drug Class</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {drugList.map((drug: Drug) => (
                  <tr key={drug.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{drug.name}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{drug.generic_name || '-'}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{drug.category || '-'}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{drug.species || '-'}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{drug.drug_class || '-'}</td>
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => { setEditing(drug); setModalOpen(true); }} className="p-1.5 rounded hover:bg-blue-50 text-blue-500"><Edit3 size={14} /></button>
                      <button onClick={() => handleDelete(drug.id)} className="p-1.5 rounded hover:bg-red-50 text-red-500 ml-1"><Trash2 size={14} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      {modalOpen && <DrugModal drug={editing} onClose={() => setModalOpen(false)} onSuccess={() => { setModalOpen(false); queryClient.invalidateQueries({ queryKey: ['admin-drugs'] }); }} />}
    </div>
  );
}

function DrugModal({ drug, onClose, onSuccess }: { drug: Drug | null; onClose: () => void; onSuccess: () => void }) {
  const [name, setName] = useState(drug?.name || '');
  const [genericName, setGenericName] = useState(drug?.generic_name || '');
  const [brandNames, setBrandNames] = useState(drug?.brand_names || '');
  const [category, setCategory] = useState(drug?.category || '');
  const [species, setSpecies] = useState(drug?.species || '');
  const [drugClass, setDrugClass] = useState(drug?.drug_class || '');
  const [route, setRoute] = useState(drug?.route || '');
  const [prescriptionStatus, setPrescriptionStatus] = useState(drug?.prescription_status || 'OTC');
  const [description, setDescription] = useState(drug?.description || '');
  const [uses, setUses] = useState(drug?.indications || '');
  const [dosage, setDosage] = useState(drug?.dosage || '');
  const [contraindications, setContraindications] = useState(drug?.contraindications || '');
  const [sideEffects, setSideEffects] = useState(drug?.side_effects || '');
  const [references, setReferences] = useState(drug?.references || '');
  const [images, setImages] = useState<string[]>(drug?.images || ['']);

  const mutation = useMutation({
    mutationFn: (data: any) => {
      if (drug) return api.put(`/medicines/${drug.id}`, data);
      return api.post('/medicines', data);
    },
    onSuccess,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate({ name, generic_name: genericName, brand_names: brandNames, category, species, drug_class: drugClass, route, prescription_status: prescriptionStatus, description, indications: uses, dosage, contraindications, side_effects: sideEffects, references, images: images.filter(Boolean) });
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center pt-10 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl mx-4 my-10">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 sticky top-0 bg-white rounded-t-xl">
          <h3 className="font-semibold text-gray-900">{drug ? 'Edit Drug' : 'Add Drug'}</h3>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100 text-gray-400"><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-xs font-medium text-gray-600 mb-1">Name *</label><input value={name} onChange={e => setName(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none" required /></div>
            <div><label className="block text-xs font-medium text-gray-600 mb-1">Generic Name</label><input value={genericName} onChange={e => setGenericName(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none" /></div>
            <div><label className="block text-xs font-medium text-gray-600 mb-1">Brand Names</label><input value={brandNames} onChange={e => setBrandNames(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none" /></div>
            <div><label className="block text-xs font-medium text-gray-600 mb-1">Category</label><input value={category} onChange={e => setCategory(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none" /></div>
            <div><label className="block text-xs font-medium text-gray-600 mb-1">Species</label><input value={species} onChange={e => setSpecies(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none" /></div>
            <div><label className="block text-xs font-medium text-gray-600 mb-1">Drug Class</label><input value={drugClass} onChange={e => setDrugClass(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none" /></div>
            <div><label className="block text-xs font-medium text-gray-600 mb-1">Route</label><input value={route} onChange={e => setRoute(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none" /></div>
            <div><label className="block text-xs font-medium text-gray-600 mb-1">Prescription Status</label><select value={prescriptionStatus} onChange={e => setPrescriptionStatus(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none"><option value="OTC">OTC</option><option value="Prescription">Prescription</option><option value="Controlled">Controlled</option></select></div>
          </div>
          <div><label className="block text-xs font-medium text-gray-600 mb-1">Description</label><textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none resize-none" /></div>
          <div><label className="block text-xs font-medium text-gray-600 mb-1">Uses / Indications</label><textarea value={uses} onChange={e => setUses(e.target.value)} rows={2} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none resize-none" /></div>
          <div><label className="block text-xs font-medium text-gray-600 mb-1">Dosage</label><textarea value={dosage} onChange={e => setDosage(e.target.value)} rows={2} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none resize-none" /></div>
          <div><label className="block text-xs font-medium text-gray-600 mb-1">Contraindications</label><textarea value={contraindications} onChange={e => setContraindications(e.target.value)} rows={2} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none resize-none" /></div>
          <div><label className="block text-xs font-medium text-gray-600 mb-1">Side Effects</label><textarea value={sideEffects} onChange={e => setSideEffects(e.target.value)} rows={2} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none resize-none" /></div>
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
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>
            <button type="submit" disabled={mutation.isPending} className="px-4 py-2 bg-emerald-500 text-white rounded-lg text-sm font-medium hover:bg-emerald-600 disabled:opacity-50 flex items-center gap-1">
              {mutation.isPending && <Loader2 size={14} className="animate-spin" />}{drug ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
