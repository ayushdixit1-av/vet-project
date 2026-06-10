import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Upload, Trash2, Loader2, X, Search, Image, Film, FileText, Grid3X3, List } from 'lucide-react';
import api from '../lib/api';
import { formatDate } from '../lib/utils';
import type { MediaItem } from '../types';

export default function AdminMedia() {
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const { data: media, isLoading, error } = useQuery({
    queryKey: ['admin-media', search, typeFilter],
    queryFn: () => api.get(`/media?search=${search}&mime_type=${typeFilter}`).then(r => r.data),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/media/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-media'] }),
  });

  const handleDelete = (id: number) => {
    if (window.confirm('Are you sure you want to delete this media?')) deleteMutation.mutate(id);
  };

  const list = Array.isArray(media) ? media : media?.data || [];

  const getIcon = (mime: string) => {
    if (mime.startsWith('image/')) return <Image size={24} className="text-blue-400" />;
    if (mime.startsWith('video/')) return <Film size={24} className="text-purple-400" />;
    return <FileText size={24} className="text-gray-400" />;
  };

  if (isLoading) return <div className="flex items-center justify-center h-64"><Loader2 className="animate-spin text-emerald-500" size={32} /></div>;
  if (error) return <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700">Failed to load media.</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Media Library</h2>
        <button onClick={() => setModalOpen(true)} className="flex items-center gap-1.5 px-3 py-2 bg-emerald-500 text-white rounded-lg text-sm font-medium hover:bg-emerald-600">
          <Upload size={16} /> Upload Media
        </button>
      </div>

      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search media..." className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none" />
        </div>
        <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none">
          <option value="">All Types</option>
          <option value="image">Images</option>
          <option value="video">Videos</option>
          <option value="application">Documents</option>
        </select>
        <div className="flex border border-gray-300 rounded-lg overflow-hidden">
          <button onClick={() => setViewMode('grid')} className={`p-2 ${viewMode === 'grid' ? 'bg-gray-100 text-gray-700' : 'text-gray-400 hover:bg-gray-50'}`}><Grid3X3 size={16} /></button>
          <button onClick={() => setViewMode('list')} className={`p-2 ${viewMode === 'list' ? 'bg-gray-100 text-gray-700' : 'text-gray-400 hover:bg-gray-50'}`}><List size={16} /></button>
        </div>
      </div>

      {list.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center text-gray-500">
          <Upload size={48} className="mx-auto text-gray-300 mb-3" />
          <p>No media found. Upload your first file.</p>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {list.map((item: MediaItem) => (
            <div key={item.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden group relative">
              <div className="aspect-square bg-gray-100 flex items-center justify-center">
                {item.mime_type?.startsWith('image/') ? (
                  <img src={item.thumbnail_url || item.url} alt={item.alt_text || ''} className="w-full h-full object-cover" />
                ) : (
                  getIcon(item.mime_type)
                )}
              </div>
              <div className="p-2">
                <p className="text-xs font-medium text-gray-700 truncate">{item.original_name || item.filename}</p>
                <p className="text-xs text-gray-400">{formatDate(item.created_at)}</p>
              </div>
              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => handleDelete(item.id)} className="p-1.5 bg-white rounded-lg shadow text-red-500 hover:bg-red-50">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">File</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Type</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Alt Text</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Uploaded</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {list.map((item: MediaItem) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded bg-gray-100 flex items-center justify-center overflow-hidden">
                          {item.mime_type?.startsWith('image/') ? (
                            <img src={item.thumbnail_url || item.url} alt="" className="w-full h-full object-cover" />
                          ) : getIcon(item.mime_type)}
                        </div>
                        <span className="text-sm font-medium text-gray-700 truncate max-w-[200px]">{item.original_name || item.filename}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">{item.mime_type || '-'}</td>
                    <td className="px-4 py-3 text-sm text-gray-500 truncate max-w-[150px]">{item.alt_text || '-'}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{formatDate(item.created_at)}</td>
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => handleDelete(item.id)} className="p-1.5 rounded hover:bg-red-50 text-red-500"><Trash2 size={14} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {modalOpen && <MediaUploadModal onClose={() => setModalOpen(false)} onSuccess={() => { setModalOpen(false); queryClient.invalidateQueries({ queryKey: ['admin-media'] }); }} />}
    </div>
  );
}

function MediaUploadModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [url, setUrl] = useState('');
  const [originalName, setOriginalName] = useState('');
  const [mimeType, setMimeType] = useState('image/jpeg');
  const [altText, setAltText] = useState('');
  const [caption, setCaption] = useState('');

  const mutation = useMutation({
    mutationFn: (data: any) => api.post('/media', data),
    onSuccess,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate({ url, original_name: originalName, mime_type: mimeType, alt_text: altText, caption });
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center pt-20">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg mx-4">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h3 className="font-semibold text-gray-900">Upload Media</h3>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100 text-gray-400"><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div><label className="block text-xs font-medium text-gray-600 mb-1">Media URL *</label><input value={url} onChange={e => setUrl(e.target.value)} placeholder="https://example.com/image.jpg" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none" required /></div>
          <div><label className="block text-xs font-medium text-gray-600 mb-1">Original Name</label><input value={originalName} onChange={e => setOriginalName(e.target.value)} placeholder="image.jpg" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none" /></div>
          <div><label className="block text-xs font-medium text-gray-600 mb-1">MIME Type</label><select value={mimeType} onChange={e => setMimeType(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none">
            <option value="image/jpeg">JPEG Image</option>
            <option value="image/png">PNG Image</option>
            <option value="image/webp">WebP Image</option>
            <option value="image/gif">GIF Image</option>
            <option value="image/svg+xml">SVG Image</option>
            <option value="video/mp4">MP4 Video</option>
            <option value="application/pdf">PDF Document</option>
          </select></div>
          <div><label className="block text-xs font-medium text-gray-600 mb-1">Alt Text</label><input value={altText} onChange={e => setAltText(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none" /></div>
          <div><label className="block text-xs font-medium text-gray-600 mb-1">Caption</label><input value={caption} onChange={e => setCaption(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none" /></div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>
            <button type="submit" disabled={mutation.isPending} className="px-4 py-2 bg-emerald-500 text-white rounded-lg text-sm font-medium hover:bg-emerald-600 disabled:opacity-50 flex items-center gap-1">
              {mutation.isPending && <Loader2 size={14} className="animate-spin" />}Upload
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
