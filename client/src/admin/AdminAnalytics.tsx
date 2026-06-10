import { useQuery } from '@tanstack/react-query';
import { TrendingUp, FileText, Users, Search, Eye, Loader2, ArrowUpRight } from 'lucide-react';
import api from '../lib/api';

function Bar({ value, max, label, color }: { value: number; max: number; label: string; color: string }) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  return (
    <div className="flex items-center gap-2 group">
      <span className="text-xs text-gray-500 w-16 text-right truncate">{label}</span>
      <div className="flex-1 h-6 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${color}`}
          style={{ width: `${Math.max(pct, 2)}%` }}
        />
      </div>
      <span className="text-xs font-medium text-gray-700 w-10 text-right">{value}</span>
    </div>
  );
}

export default function AdminAnalytics() {
  const { data: stats } = useQuery({
    queryKey: ['analytics-dashboard'],
    queryFn: () => api.get('/analytics/dashboard').then(r => r.data),
  });

  const { data: mostViewed, isLoading: mvLoading } = useQuery({
    queryKey: ['analytics-most-viewed'],
    queryFn: () => api.get('/analytics/most-viewed').then(r => r.data),
  });

  const { data: popularSearches, isLoading: psLoading } = useQuery({
    queryKey: ['analytics-popular-searches'],
    queryFn: () => api.get('/analytics/popular-searches').then(r => r.data),
  });

  const { data: contentGrowth, isLoading: cgLoading } = useQuery({
    queryKey: ['analytics-content-growth'],
    queryFn: () => api.get('/analytics/content-growth').then(r => r.data),
  });

  const overviewCards = [
    { label: 'Articles', value: stats?.total_articles || 0, icon: FileText, color: 'bg-blue-500' },
    { label: 'Users', value: stats?.total_users || 0, icon: Users, color: 'bg-indigo-500' },
    { label: 'Drugs', value: stats?.total_drugs || 0, icon: Eye, color: 'bg-purple-500' },
    { label: 'Diseases', value: stats?.total_diseases || 0, icon: TrendingUp, color: 'bg-red-500' },
  ];

  const growthData = contentGrowth?.monthly || contentGrowth?.data || [];
  const growthMax = Math.max(...(growthData.map((d: any) => d.articles || d.count || 0)), 1);

  const searches = Array.isArray(popularSearches) ? popularSearches : [];
  const searchMax = Math.max(...(searches.map((s: any) => s.count || 0)), 1);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Analytics</h2>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {overviewCards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="bg-white rounded-xl border border-gray-200 p-4">
              <div className="flex items-center justify-between mb-3">
                <div className={`w-10 h-10 rounded-lg ${card.color} flex items-center justify-center`}>
                  <Icon size={20} className="text-white" />
                </div>
                <ArrowUpRight size={16} className="text-gray-400" />
              </div>
              <p className="text-2xl font-bold text-gray-900">{card.value}</p>
              <p className="text-xs text-gray-500 mt-0.5">{card.label}</p>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <TrendingUp size={18} className="text-emerald-500" />
            Content Growth
          </h3>
          {cgLoading ? (
            <div className="flex justify-center py-8"><Loader2 className="animate-spin text-emerald-500" size={24} /></div>
          ) : growthData.length === 0 ? (
            <p className="text-gray-400 text-sm py-8 text-center">No growth data yet</p>
          ) : (
            <div className="space-y-2">
              {growthData.map((d: any, i: number) => (
                <Bar
                  key={i}
                  label={d.month || d.date || `Month ${i + 1}`}
                  value={d.articles || d.count || 0}
                  max={growthMax}
                  color="bg-emerald-400"
                />
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Search size={18} className="text-emerald-500" />
            Popular Searches
          </h3>
          {psLoading ? (
            <div className="flex justify-center py-8"><Loader2 className="animate-spin text-emerald-500" size={24} /></div>
          ) : searches.length === 0 ? (
            <p className="text-gray-400 text-sm py-8 text-center">No search data yet</p>
          ) : (
            <div className="space-y-2">
              {searches.slice(0, 10).map((s: any, i: number) => (
                <Bar
                  key={i}
                  label={s.term || s.query || 'Unknown'}
                  value={s.count || 0}
                  max={searchMax}
                  color="bg-blue-400"
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Eye size={18} className="text-emerald-500" />
          Most Viewed Content
        </h3>
        {mvLoading ? (
          <div className="flex justify-center py-8"><Loader2 className="animate-spin text-emerald-500" size={24} /></div>
        ) : !mostViewed ? (
          <p className="text-gray-400 text-sm py-8 text-center">No data yet</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <h4 className="text-xs font-semibold text-gray-500 uppercase mb-3">Articles</h4>
              {Array.isArray(mostViewed.articles) && mostViewed.articles.length > 0 ? (
                <div className="space-y-2">
                  {mostViewed.articles.slice(0, 5).map((a: any) => (
                    <div key={a.id} className="flex items-center justify-between py-1.5 border-b border-gray-100 last:border-0">
                      <span className="text-sm text-gray-700 truncate max-w-[200px]">{a.title}</span>
                      <span className="text-xs font-medium text-emerald-600">{a.view_count} views</span>
                    </div>
                  ))}
                </div>
              ) : <p className="text-gray-400 text-sm">No data</p>}
            </div>
            <div>
              <h4 className="text-xs font-semibold text-gray-500 uppercase mb-3">Drugs</h4>
              {Array.isArray(mostViewed.drugs) && mostViewed.drugs.length > 0 ? (
                <div className="space-y-2">
                  {mostViewed.drugs.slice(0, 5).map((d: any) => (
                    <div key={d.id} className="flex items-center justify-between py-1.5 border-b border-gray-100 last:border-0">
                      <span className="text-sm text-gray-700">{d.name}</span>
                      <span className="text-xs font-medium text-emerald-600">{d.view_count} views</span>
                    </div>
                  ))}
                </div>
              ) : <p className="text-gray-400 text-sm">No data</p>}
            </div>
            <div>
              <h4 className="text-xs font-semibold text-gray-500 uppercase mb-3">Diseases</h4>
              {Array.isArray(mostViewed.diseases) && mostViewed.diseases.length > 0 ? (
                <div className="space-y-2">
                  {mostViewed.diseases.slice(0, 5).map((d: any) => (
                    <div key={d.id} className="flex items-center justify-between py-1.5 border-b border-gray-100 last:border-0">
                      <span className="text-sm text-gray-700">{d.name}</span>
                      <span className="text-xs font-medium text-emerald-600">{d.view_count} views</span>
                    </div>
                  ))}
                </div>
              ) : <p className="text-gray-400 text-sm">No data</p>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
