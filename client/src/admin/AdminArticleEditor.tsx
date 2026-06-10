import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Save, Eye, Edit3, Plus, X, ArrowUp, ArrowDown,
  Trash2, Type, Heading1, Image, Columns, Video, Quote,
  Table2, HelpCircle, BookOpen, AlertTriangle, Beaker,
  Bug, Divide, CheckSquare, Loader2, Search, ChevronLeft,
  ChevronRight
} from 'lucide-react';
import api from '../lib/api';
import { slugify } from '../lib/utils';
import type { ArticleBlock } from '../types';

let blockCounter = 0;
const genId = () => `block_${Date.now()}_${++blockCounter}`;

const BLOCK_TYPES = [
  { type: 'heading', label: 'Heading', icon: Heading1 },
  { type: 'paragraph', label: 'Paragraph', icon: Type },
  { type: 'image', label: 'Image', icon: Image },
  { type: 'gallery', label: 'Gallery', icon: Columns },
  { type: 'video', label: 'Video', icon: Video },
  { type: 'quote', label: 'Quote', icon: Quote },
  { type: 'table', label: 'Table', icon: Table2 },
  { type: 'faq', label: 'FAQ', icon: HelpCircle },
  { type: 'reference', label: 'Reference', icon: BookOpen },
  { type: 'callout', label: 'Callout', icon: AlertTriangle },
  { type: 'drug-reference', label: 'Drug Reference', icon: Beaker },
  { type: 'disease-reference', label: 'Disease Reference', icon: Bug },
  { type: 'mcq', label: 'MCQ', icon: CheckSquare },
  { type: 'divider', label: 'Divider', icon: Divide },
];

export default function AdminArticleEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isEdit = Boolean(id);

  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [author, setAuthor] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [subcategoryId, setSubcategoryId] = useState('');
  const [featuredImage, setFeaturedImage] = useState('');
  const [tags, setTags] = useState('');
  const [status, setStatus] = useState('draft');
  const [seoTitle, setSeoTitle] = useState('');
  const [seoDescription, setSeoDescription] = useState('');
  const [seoKeywords, setSeoKeywords] = useState('');
  const [ogImage, setOgImage] = useState('');
  const [canonicalUrl, setCanonicalUrl] = useState('');
  const [blocks, setBlocks] = useState<ArticleBlock[]>([]);
  const [preview, setPreview] = useState(false);
  const [showBlockMenu, setShowBlockMenu] = useState(false);
  const [metaCollapsed, setMetaCollapsed] = useState(false);
  const [drugSearch, setDrugSearch] = useState('');
  const [diseaseSearch, setDiseaseSearch] = useState('');

  const { data: categories } = useQuery({
    queryKey: ['article-categories'],
    queryFn: () => api.get('/knowledge-categories').then(r => r.data),
  });

  const { data: subcategories } = useQuery({
    queryKey: ['article-subcategories', categoryId],
    queryFn: () => api.get(`/knowledge-subcategories?category_id=${categoryId}`).then(r => r.data),
    enabled: !!categoryId,
  });

  const { data: article, isLoading: articleLoading } = useQuery({
    queryKey: ['article-edit', id],
    queryFn: () => api.get(`/articles/${id}`).then(r => r.data),
    enabled: isEdit,
  });

  const { data: drugResults } = useQuery({
    queryKey: ['drug-search', drugSearch],
    queryFn: () => api.get(`/medicines?search=${drugSearch}`).then(r => r.data),
    enabled: drugSearch.length > 1,
  });

  const { data: diseaseResults } = useQuery({
    queryKey: ['disease-search', diseaseSearch],
    queryFn: () => api.get(`/diseases?search=${diseaseSearch}`).then(r => r.data),
    enabled: diseaseSearch.length > 1,
  });

  useEffect(() => {
    if (article) {
      setTitle(article.title || '');
      setSlug(article.slug || '');
      setExcerpt(article.excerpt || '');
      setAuthor(article.author || '');
      setCategoryId(article.category_id ? String(article.category_id) : '');
      setSubcategoryId(article.subcategory_id ? String(article.subcategory_id) : '');
      setFeaturedImage(article.featured_image || '');
      setTags(article.tags || '');
      setStatus(article.status || 'draft');
      setSeoTitle(article.seo_title || '');
      setSeoDescription(article.seo_description || '');
      setSeoKeywords(article.seo_keywords || '');
      setOgImage(article.og_image || '');
      setCanonicalUrl(article.canonical_url || '');
      if (Array.isArray(article.content)) setBlocks(article.content);
    }
  }, [article]);

  const saveMutation = useMutation({
    mutationFn: (data: any) => {
      if (isEdit) return api.put(`/articles/${id}`, data);
      return api.post('/articles', data);
    },
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['admin-articles'] });
      const savedId = isEdit ? id : res.data?.id || res.data?.article?.id;
      if (savedId && !isEdit) {
        navigate(`/admin/articles/edit/${savedId}`, { replace: true });
      }
    },
  });

  const addBlock = useCallback((type: string) => {
    const block: ArticleBlock = { id: genId(), type: type as ArticleBlock['type'], content: {} };
    switch (type) {
      case 'heading': block.content = { text: '', level: 2 }; break;
      case 'paragraph': block.content = { text: '' }; break;
      case 'image': block.content = { url: '', caption: '', alt: '', layout: 'full' }; break;
      case 'gallery': block.content = { images: [''] }; break;
      case 'video': block.content = { url: '', caption: '' }; break;
      case 'quote': block.content = { text: '', citation: '' }; break;
      case 'table': block.content = { rows: 3, cols: 3, cells: [['', '', ''], ['', '', ''], ['', '', '']] }; break;
      case 'faq': block.content = { items: [{ question: '', answer: '' }] }; break;
      case 'reference': block.content = { items: [''] }; break;
      case 'callout': block.content = { text: '', type: 'info' }; break;
      case 'drug-reference': block.content = { drug_id: null, drug_name: '' }; break;
      case 'disease-reference': block.content = { disease_id: null, disease_name: '' }; break;
      case 'mcq': block.content = { question: '', options: [{ label: 'A', text: '' }, { label: 'B', text: '' }, { label: 'C', text: '' }, { label: 'D', text: '' }], correct_answer: 'A', explanation: '' }; break;
      case 'divider': block.content = {}; break;
    }
    setBlocks(prev => [...prev, block]);
    setShowBlockMenu(false);
  }, []);

  const updateBlock = useCallback((blockId: string, content: any) => {
    setBlocks(prev => prev.map(b => b.id === blockId ? { ...b, content } : b));
  }, []);

  const removeBlock = useCallback((blockId: string) => {
    setBlocks(prev => prev.filter(b => b.id !== blockId));
  }, []);

  const moveBlock = useCallback((index: number, direction: 'up' | 'down') => {
    setBlocks(prev => {
      const next = [...prev];
      const target = direction === 'up' ? index - 1 : index + 1;
      if (target < 0 || target >= next.length) return next;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }, []);

  const handleSave = (publishStatus?: string) => {
    const finalStatus = publishStatus || status;
    const payload = {
      title,
      slug: slug || slugify(title),
      excerpt,
      author,
      category_id: categoryId ? Number(categoryId) : null,
      subcategory_id: subcategoryId ? Number(subcategoryId) : null,
      featured_image: featuredImage,
      tags,
      status: finalStatus,
      content: blocks,
      seo_title: seoTitle,
      seo_description: seoDescription,
      seo_keywords: seoKeywords,
      og_image: ogImage,
      canonical_url: canonicalUrl,
    };
    saveMutation.mutate(payload);
  };

  if (isEdit && articleLoading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="animate-spin text-emerald-500" size={32} /></div>;
  }

  const renderBlockEditor = (block: ArticleBlock) => {
    const content = block.content || {};

    switch (block.type) {
      case 'heading':
        return (
          <div className="space-y-2">
            <div className="flex gap-2">
              <input
                value={content.text || ''}
                onChange={e => updateBlock(block.id, { ...content, text: e.target.value })}
                placeholder="Heading text..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-lg font-bold focus:ring-2 focus:ring-emerald-500 outline-none"
              />
              <select
                value={content.level || 2}
                onChange={e => updateBlock(block.id, { ...content, level: Number(e.target.value) })}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
              >
                <option value={2}>H2</option>
                <option value={3}>H3</option>
                <option value={4}>H4</option>
              </select>
            </div>
          </div>
        );

      case 'paragraph':
        return (
          <textarea
            value={content.text || ''}
            onChange={e => updateBlock(block.id, { ...content, text: e.target.value })}
            placeholder="Type paragraph content..."
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none resize-y min-h-[100px]"
          />
        );

      case 'image':
        return (
          <div className="space-y-2">
            <input value={content.url || ''} onChange={e => updateBlock(block.id, { ...content, url: e.target.value })} placeholder="Image URL..." className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none" />
            <div className="flex gap-2">
              <input value={content.caption || ''} onChange={e => updateBlock(block.id, { ...content, caption: e.target.value })} placeholder="Caption" className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none" />
              <input value={content.alt || ''} onChange={e => updateBlock(block.id, { ...content, alt: e.target.value })} placeholder="Alt text" className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none" />
              <select value={content.layout || 'full'} onChange={e => updateBlock(block.id, { ...content, layout: e.target.value })} className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none">
                <option value="full">Full</option>
                <option value="medium">Medium</option>
                <option value="left">Left</option>
                <option value="right">Right</option>
              </select>
            </div>
          </div>
        );

      case 'gallery':
        return (
          <div className="space-y-2">
            {(content.images || ['']).map((url: string, i: number) => (
              <div key={i} className="flex gap-2">
                <input value={url} onChange={e => {
                  const imgs = [...(content.images || [])];
                  imgs[i] = e.target.value;
                  updateBlock(block.id, { ...content, images: imgs });
                }} placeholder="Image URL..." className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none" />
                <button onClick={() => {
                  const imgs = (content.images || []).filter((_: any, j: number) => j !== i);
                  updateBlock(block.id, { ...content, images: imgs.length ? imgs : [''] });
                }} className="p-2 text-red-400 hover:bg-red-50 rounded"><X size={14} /></button>
              </div>
            ))}
            <button onClick={() => updateBlock(block.id, { ...content, images: [...(content.images || ['']), ''] })} className="text-sm text-emerald-600 hover:text-emerald-700 font-medium">+ Add Image</button>
          </div>
        );

      case 'video':
        return (
          <div className="space-y-2">
            <input value={content.url || ''} onChange={e => updateBlock(block.id, { ...content, url: e.target.value })} placeholder="Video URL (YouTube/Vimeo)..." className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none" />
            <input value={content.caption || ''} onChange={e => updateBlock(block.id, { ...content, caption: e.target.value })} placeholder="Caption" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none" />
          </div>
        );

      case 'quote':
        return (
          <div className="space-y-2">
            <textarea value={content.text || ''} onChange={e => updateBlock(block.id, { ...content, text: e.target.value })} placeholder="Quote text..." rows={3} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none resize-none" />
            <input value={content.citation || ''} onChange={e => updateBlock(block.id, { ...content, citation: e.target.value })} placeholder="Citation" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none" />
          </div>
        );

      case 'table':
        return (
          <div className="space-y-2">
            <div className="flex gap-2 items-center">
              <label className="text-xs text-gray-500">Rows: </label>
              <input type="number" value={content.rows || 3} min={1} max={20} onChange={e => {
                const newRows = Number(e.target.value);
                const cells = [...(content.cells || [])];
                while (cells.length < newRows) cells.push(Array(content.cols || 3).fill(''));
                while (cells.length > newRows) cells.pop();
                updateBlock(block.id, { ...content, rows: newRows, cells });
              }} className="w-16 px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-emerald-500 outline-none" />
              <label className="text-xs text-gray-500">Cols: </label>
              <input type="number" value={content.cols || 3} min={1} max={10} onChange={e => {
                const newCols = Number(e.target.value);
                const cells = (content.cells || []).map((row: string[]) => {
                  const r = [...row];
                  while (r.length < newCols) r.push('');
                  while (r.length > newCols) r.pop();
                  return r;
                });
                updateBlock(block.id, { ...content, cols: newCols, cells });
              }} className="w-16 px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-emerald-500 outline-none" />
            </div>
            <div className="overflow-x-auto border border-gray-200 rounded-lg">
              <table className="w-full">
                <tbody>
                  {(content.cells || Array.from({ length: content.rows || 3 }, () => Array(content.cols || 3).fill(''))).map((row: string[], ri: number) => (
                    <tr key={ri}>
                      {row.map((cell: string, ci: number) => (
                        <td key={ci} className="border border-gray-200 p-0">
                          <input value={cell} onChange={e => {
                            const cells = [...(content.cells || [])];
                            if (!cells[ri]) cells[ri] = Array(content.cols || 3).fill('');
                            cells[ri][ci] = e.target.value;
                            updateBlock(block.id, { ...content, cells });
                          }} className="w-full px-2 py-1.5 text-sm outline-none focus:bg-blue-50" />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );

      case 'faq':
        return (
          <div className="space-y-3">
            {(content.items || [{ question: '', answer: '' }]).map((item: any, i: number) => (
              <div key={i} className="p-3 border border-gray-200 rounded-lg bg-gray-50">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-medium text-gray-500">Q&A #{i + 1}</span>
                  <button onClick={() => {
                    const items = (content.items || []).filter((_: any, j: number) => j !== i);
                    updateBlock(block.id, { ...content, items: items.length ? items : [{ question: '', answer: '' }] });
                  }} className="text-red-400 hover:text-red-600"><X size={14} /></button>
                </div>
                <input value={item.question || ''} onChange={e => {
                  const items = [...(content.items || [])];
                  items[i] = { ...items[i], question: e.target.value };
                  updateBlock(block.id, { ...content, items });
                }} placeholder="Question..." className="w-full px-3 py-2 mb-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none" />
                <textarea value={item.answer || ''} onChange={e => {
                  const items = [...(content.items || [])];
                  items[i] = { ...items[i], answer: e.target.value };
                  updateBlock(block.id, { ...content, items });
                }} placeholder="Answer..." rows={2} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none resize-none" />
              </div>
            ))}
            <button onClick={() => updateBlock(block.id, { ...content, items: [...(content.items || []), { question: '', answer: '' }] })} className="text-sm text-emerald-600 hover:text-emerald-700 font-medium">+ Add Q&A</button>
          </div>
        );

      case 'reference':
        return (
          <div className="space-y-2">
            {(content.items || ['']).map((text: string, i: number) => (
              <div key={i} className="flex gap-2">
                <input value={text} onChange={e => {
                  const items = [...(content.items || [])];
                  items[i] = e.target.value;
                  updateBlock(block.id, { ...content, items });
                }} placeholder="Reference text..." className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none" />
                <button onClick={() => {
                  const items = (content.items || []).filter((_: any, j: number) => j !== i);
                  updateBlock(block.id, { ...content, items: items.length ? items : [''] });
                }} className="p-2 text-red-400 hover:bg-red-50 rounded"><X size={14} /></button>
              </div>
            ))}
            <button onClick={() => updateBlock(block.id, { ...content, items: [...(content.items || []), ''] })} className="text-sm text-emerald-600 hover:text-emerald-700 font-medium">+ Add Reference</button>
          </div>
        );

      case 'callout':
        return (
          <div className="space-y-2">
            <div className="flex gap-2">
              <select value={content.type || 'info'} onChange={e => updateBlock(block.id, { ...content, type: e.target.value })} className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none">
                <option value="info">Info</option>
                <option value="warning">Warning</option>
                <option value="tip">Tip</option>
                <option value="error">Error</option>
              </select>
            </div>
            <textarea value={content.text || ''} onChange={e => updateBlock(block.id, { ...content, text: e.target.value })} placeholder="Callout text..." rows={3} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none resize-none" />
          </div>
        );

      case 'drug-reference':
        return (
          <div className="space-y-2">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input value={drugSearch} onChange={e => setDrugSearch(e.target.value)} placeholder="Search for a drug..." className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none" />
            </div>
            {drugSearch.length > 1 && drugResults?.medicines?.length > 0 && (
              <div className="border border-gray-200 rounded-lg max-h-40 overflow-y-auto">
                {drugResults.medicines.map((d: any) => (
                  <button key={d.id} onClick={() => { updateBlock(block.id, { drug_id: d.id, drug_name: d.name }); setDrugSearch(''); }} className="w-full px-3 py-2 text-sm text-left hover:bg-gray-50 border-b border-gray-100 last:border-0">
                    {d.name} {d.generic_name ? `(${d.generic_name})` : ''}
                  </button>
                ))}
              </div>
            )}
            {content.drug_name && (
              <div className="flex items-center gap-2 px-3 py-2 bg-emerald-50 rounded-lg text-sm text-emerald-700">
                <Beaker size={14} />
                {content.drug_name}
                <button onClick={() => updateBlock(block.id, { drug_id: null, drug_name: '' })} className="ml-auto text-red-400"><X size={14} /></button>
              </div>
            )}
          </div>
        );

      case 'disease-reference':
        return (
          <div className="space-y-2">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input value={diseaseSearch} onChange={e => setDiseaseSearch(e.target.value)} placeholder="Search for a disease..." className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none" />
            </div>
            {diseaseSearch.length > 1 && diseaseResults?.diseases?.length > 0 && (
              <div className="border border-gray-200 rounded-lg max-h-40 overflow-y-auto">
                {diseaseResults.diseases.map((d: any) => (
                  <button key={d.id} onClick={() => { updateBlock(block.id, { disease_id: d.id, disease_name: d.name }); setDiseaseSearch(''); }} className="w-full px-3 py-2 text-sm text-left hover:bg-gray-50 border-b border-gray-100 last:border-0">
                    {d.name}
                  </button>
                ))}
              </div>
            )}
            {content.disease_name && (
              <div className="flex items-center gap-2 px-3 py-2 bg-red-50 rounded-lg text-sm text-red-700">
                <Bug size={14} />
                {content.disease_name}
                <button onClick={() => updateBlock(block.id, { disease_id: null, disease_name: '' })} className="ml-auto text-red-400"><X size={14} /></button>
              </div>
            )}
          </div>
        );

      case 'mcq':
        return (
          <div className="space-y-3">
            <input value={content.question || ''} onChange={e => updateBlock(block.id, { ...content, question: e.target.value })} placeholder="MCQ Question..." className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none" />
            <div className="grid grid-cols-2 gap-2">
              {(content.options || []).map((opt: any, i: number) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="text-xs font-bold text-gray-500 w-5">{opt.label}</span>
                  <input value={opt.text || ''} onChange={e => {
                    const options = [...(content.options || [])];
                    options[i] = { ...options[i], text: e.target.value };
                    updateBlock(block.id, { ...content, options });
                  }} placeholder={`Option ${opt.label}...`} className="flex-1 px-2 py-1.5 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-emerald-500 outline-none" />
                </div>
              ))}
            </div>
            <div className="flex gap-3 items-center">
              <label className="text-sm text-gray-600">Correct Answer:</label>
              <select value={content.correct_answer || 'A'} onChange={e => updateBlock(block.id, { ...content, correct_answer: e.target.value })} className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none">
                {['A', 'B', 'C', 'D'].map(l => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>
            <textarea value={content.explanation || ''} onChange={e => updateBlock(block.id, { ...content, explanation: e.target.value })} placeholder="Explanation..." rows={2} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none resize-none" />
          </div>
        );

      case 'divider':
        return <div className="text-center text-gray-300 text-sm py-2">— Divider —</div>;

      default:
        return <p className="text-gray-400 text-sm">Unknown block type: {block.type}</p>;
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between sticky top-0 z-10 rounded-t-xl">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/admin/articles')} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500">
            <ChevronLeft size={20} />
          </button>
          <h2 className="text-lg font-semibold text-gray-900">{isEdit ? 'Edit Article' : 'New Article'}</h2>
          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
            status === 'published' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
          }`}>{status}</span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setPreview(!preview)} className={`px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-1.5 ${
            preview ? 'bg-emerald-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}>
            {preview ? <Edit3 size={14} /> : <Eye size={14} />}
            {preview ? 'Edit' : 'Preview'}
          </button>
          <button
            onClick={() => handleSave('draft')}
            disabled={saveMutation.isPending}
            className="px-3 py-1.5 rounded-lg text-sm font-medium bg-gray-100 text-gray-600 hover:bg-gray-200 flex items-center gap-1.5"
          >
            {saveMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
            Save Draft
          </button>
          <button
            onClick={() => handleSave('published')}
            disabled={saveMutation.isPending}
            className="px-4 py-1.5 rounded-lg text-sm font-medium bg-emerald-500 text-white hover:bg-emerald-600 flex items-center gap-1.5"
          >
            {saveMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
            Publish
          </button>
        </div>
      </div>

      <div className="flex flex-1 gap-0">
        <div className={`bg-white border-r border-gray-200 transition-all duration-200 ${metaCollapsed ? 'w-0 overflow-hidden' : 'w-80'} flex-shrink-0`}>
          <div className="p-4 space-y-3 overflow-y-auto h-full">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Title</label>
              <input value={title} onChange={e => { setTitle(e.target.value); if (!isEdit) setSlug(slugify(e.target.value)); }} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Slug</label>
              <input value={slug} onChange={e => setSlug(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none font-mono text-xs" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Excerpt</label>
              <textarea value={excerpt} onChange={e => setExcerpt(e.target.value)} rows={2} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none resize-none" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Author</label>
              <input value={author} onChange={e => setAuthor(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Category</label>
              <select value={categoryId} onChange={e => { setCategoryId(e.target.value); setSubcategoryId(''); }} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none">
                <option value="">Select category</option>
                {(categories?.categories || []).map((c: any) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Subcategory</label>
              <select value={subcategoryId} onChange={e => setSubcategoryId(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none">
                <option value="">Select subcategory</option>
                {(subcategories?.subcategories || []).map((s: any) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Featured Image URL</label>
              <input value={featuredImage} onChange={e => setFeaturedImage(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Tags (comma separated)</label>
              <input value={tags} onChange={e => setTags(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Status</label>
              <select value={status} onChange={e => setStatus(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none">
                <option value="draft">Draft</option>
                <option value="published">Published</option>
              </select>
            </div>
            <div className="border-t border-gray-200 pt-3">
              <p className="text-xs font-semibold text-gray-500 uppercase mb-2">SEO</p>
              <div className="space-y-2">
                <input value={seoTitle} onChange={e => setSeoTitle(e.target.value)} placeholder="SEO Title" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none" />
                <textarea value={seoDescription} onChange={e => setSeoDescription(e.target.value)} placeholder="SEO Description" rows={2} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none resize-none" />
                <input value={seoKeywords} onChange={e => setSeoKeywords(e.target.value)} placeholder="SEO Keywords" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none" />
              </div>
            </div>
            <div className="border-t border-gray-200 pt-3">
              <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Social</p>
              <div className="space-y-2">
                <input value={ogImage} onChange={e => setOgImage(e.target.value)} placeholder="OG Image URL" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none" />
                <input value={canonicalUrl} onChange={e => setCanonicalUrl(e.target.value)} placeholder="Canonical URL" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none" />
              </div>
            </div>
          </div>
        </div>

        <button
          onClick={() => setMetaCollapsed(!metaCollapsed)}
          className="bg-white border-r border-gray-200 px-1 flex items-center hover:bg-gray-50 text-gray-400"
        >
          {metaCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>

        <div className="flex-1 bg-gray-50 overflow-y-auto p-6">
          {preview ? (
            <div className="max-w-3xl mx-auto">
              <ArticlePreview title={title} blocks={blocks} featuredImage={featuredImage} />
            </div>
          ) : (
            <div className="max-w-3xl mx-auto space-y-3">
              {blocks.map((block, index) => (
                <div
                  key={block.id}
                  className="bg-white rounded-xl border border-gray-200 p-4 relative group hover:border-emerald-300 transition-colors"
                >
                  <div className="flex items-center justify-between mb-2 pb-2 border-b border-gray-100">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-gray-400 uppercase bg-gray-100 px-2 py-0.5 rounded">
                        {BLOCK_TYPES.find(b => b.type === block.type)?.label || block.type}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => moveBlock(index, 'up')} disabled={index === 0} className="p-1 rounded hover:bg-gray-100 text-gray-400 disabled:opacity-30">
                        <ArrowUp size={14} />
                      </button>
                      <button onClick={() => moveBlock(index, 'down')} disabled={index === blocks.length - 1} className="p-1 rounded hover:bg-gray-100 text-gray-400 disabled:opacity-30">
                        <ArrowDown size={14} />
                      </button>
                      <button onClick={() => removeBlock(block.id)} className="p-1 rounded hover:bg-red-50 text-red-400">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                  {renderBlockEditor(block)}
                </div>
              ))}

              <div className="relative">
                {showBlockMenu && (
                  <div className="bg-white rounded-xl border border-gray-200 shadow-lg p-3 mb-3">
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                      {BLOCK_TYPES.map(bt => {
                        const Icon = bt.icon;
                        return (
                          <button
                            key={bt.type}
                            onClick={() => addBlock(bt.type)}
                            className="flex items-center gap-2 px-3 py-2.5 rounded-lg hover:bg-gray-50 text-sm text-gray-700 hover:text-emerald-600 border border-gray-100 hover:border-emerald-200 transition-colors"
                          >
                            <Icon size={16} />
                            {bt.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
                <button
                  onClick={() => setShowBlockMenu(!showBlockMenu)}
                  className="w-full py-3 border-2 border-dashed border-gray-300 rounded-xl text-gray-400 hover:text-emerald-500 hover:border-emerald-400 transition-colors flex items-center justify-center gap-2 text-sm font-medium"
                >
                  <Plus size={18} />
                  Add Block
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ArticlePreview({ title, blocks, featuredImage }: { title: string; blocks: ArticleBlock[]; featuredImage: string }) {
  return (
    <article className="bg-white rounded-xl p-8">
      {featuredImage && (
        <img src={featuredImage} alt="" className="w-full h-64 object-cover rounded-lg mb-6" />
      )}
      <h1 className="text-3xl font-bold text-gray-900 mb-4">{title || 'Untitled'}</h1>
      <div className="space-y-4">
        {blocks.map((block) => (
          <div key={block.id}>
            {block.type === 'heading' && (
              block.content.level === 2 ? <h2 className="text-2xl font-bold text-gray-900">{block.content.text}</h2> :
              block.content.level === 3 ? <h3 className="text-xl font-bold text-gray-900">{block.content.text}</h3> :
              <h4 className="text-lg font-bold text-gray-900">{block.content.text}</h4>
            )}
            {block.type === 'paragraph' && <p className="text-gray-700 leading-relaxed">{block.content.text}</p>}
            {block.type === 'image' && block.content.url && (
              <figure className={`my-4 ${block.content.layout === 'medium' ? 'max-w-lg' : block.content.layout === 'left' ? 'float-left mr-4 max-w-sm' : block.content.layout === 'right' ? 'float-right ml-4 max-w-sm' : ''}`}>
                <img src={block.content.url} alt={block.content.alt || ''} className="rounded-lg w-full" />
                {block.content.caption && <figcaption className="text-sm text-gray-500 mt-1 text-center">{block.content.caption}</figcaption>}
              </figure>
            )}
            {block.type === 'quote' && (
              <blockquote className="border-l-4 border-emerald-400 pl-4 italic text-gray-600 my-4">
                <p>{block.content.text}</p>
                {block.content.citation && <cite className="text-sm text-gray-400 block mt-1">— {block.content.citation}</cite>}
              </blockquote>
            )}
            {block.type === 'callout' && (
              <div className={`p-4 rounded-lg my-4 ${
                block.content.type === 'info' ? 'bg-blue-50 border border-blue-200 text-blue-800' :
                block.content.type === 'warning' ? 'bg-amber-50 border border-amber-200 text-amber-800' :
                block.content.type === 'tip' ? 'bg-emerald-50 border border-emerald-200 text-emerald-800' :
                'bg-red-50 border border-red-200 text-red-800'
              }`}>
                {block.content.text}
              </div>
            )}
            {block.type === 'divider' && <hr className="my-6 border-gray-200" />}
          </div>
        ))}
      </div>
    </article>
  );
}
