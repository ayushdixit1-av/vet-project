import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Save, Loader2 } from 'lucide-react';
import api from '../lib/api';

export default function AdminSettings() {
  const [siteName, setSiteName] = useState('');
  const [siteDescription, setSiteDescription] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [footerText, setFooterText] = useState('');
  const [facebook, setFacebook] = useState('');
  const [instagram, setInstagram] = useState('');
  const [youtube, setYoutube] = useState('');
  const [linkedin, setLinkedin] = useState('');
  const [founderName, setFounderName] = useState('');
  const [founderTitle, setFounderTitle] = useState('');
  const [founderDescription, setFounderDescription] = useState('');
  const [founderImage, setFounderImage] = useState('');
  const [founderExperience, setFounderExperience] = useState('');
  const [founderDegree, setFounderDegree] = useState('');

  const { data: founderData } = useQuery({
    queryKey: ['admin-founder-settings'],
    queryFn: () => api.get('/settings/founder').then(r => r.data),
  });

  useEffect(() => {
    if (founderData) {
      setFounderName(founderData.name || '');
      setFounderTitle(founderData.title || '');
      setFounderDescription(founderData.description || '');
      setFounderImage(founderData.image_url || founderData.image || '');
      setFounderExperience(founderData.experience || '');
      setFounderDegree(founderData.degree || '');
    }
  }, [founderData]);

  const saveMutation = useMutation({
    mutationFn: (data: any) => api.post('/settings/founder', data),
    onSuccess: () => {},
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveMutation.mutate({
      name: founderName,
      title: founderTitle,
      description: founderDescription,
      image_url: founderImage,
      experience: founderExperience,
      degree: founderDegree,
    });
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Site Settings</h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-4">General Settings</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Site Name</label>
              <input value={siteName} onChange={e => setSiteName(e.target.value)} placeholder="VetCrack" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Site Description</label>
              <textarea value={siteDescription} onChange={e => setSiteDescription(e.target.value)} rows={3} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none resize-none" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Logo URL</label>
              <input value={logoUrl} onChange={e => setLogoUrl(e.target.value)} placeholder="https://example.com/logo.png" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Footer Text</label>
              <textarea value={footerText} onChange={e => setFooterText(e.target.value)} rows={2} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none resize-none" />
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-gray-200">
            <h4 className="text-sm font-semibold text-gray-700 mb-3">Social Links</h4>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-blue-500 font-bold text-sm w-20">Facebook</span>
                <input value={facebook} onChange={e => setFacebook(e.target.value)} placeholder="https://facebook.com/..." className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none" />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-pink-500 font-bold text-sm w-20">Instagram</span>
                <input value={instagram} onChange={e => setInstagram(e.target.value)} placeholder="https://instagram.com/..." className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none" />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-red-500 font-bold text-sm w-20">YouTube</span>
                <input value={youtube} onChange={e => setYoutube(e.target.value)} placeholder="https://youtube.com/..." className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none" />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-blue-700 font-bold text-sm w-20">LinkedIn</span>
                <input value={linkedin} onChange={e => setLinkedin(e.target.value)} placeholder="https://linkedin.com/..." className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none" />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Founder Settings</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Name</label>
                <input value={founderName} onChange={e => setFounderName(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Title</label>
                <input value={founderTitle} onChange={e => setFounderTitle(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Description</label>
              <textarea value={founderDescription} onChange={e => setFounderDescription(e.target.value)} rows={3} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none resize-none" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Image URL</label>
              <input value={founderImage} onChange={e => setFounderImage(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none" />
              {founderImage && (
                <img src={founderImage} alt="Founder" className="mt-2 w-20 h-20 rounded-full object-cover border border-gray-200" />
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Experience</label>
                <input value={founderExperience} onChange={e => setFounderExperience(e.target.value)} placeholder="e.g. 10+ years" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Degree</label>
                <input value={founderDegree} onChange={e => setFounderDegree(e.target.value)} placeholder="e.g. DVM, PhD" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none" />
              </div>
            </div>
            <div className="flex justify-end pt-2">
              <button type="submit" disabled={saveMutation.isPending} className="px-4 py-2 bg-emerald-500 text-white rounded-lg text-sm font-medium hover:bg-emerald-600 disabled:opacity-50 flex items-center gap-1.5">
                {saveMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                Save Founder Settings
              </button>
            </div>
            {saveMutation.isSuccess && (
              <p className="text-sm text-emerald-600 bg-emerald-50 px-3 py-2 rounded-lg">Settings saved successfully!</p>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
