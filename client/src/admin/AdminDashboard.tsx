import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  FileText, Pill, Bug, PawPrint, FolderTree, Users, BookOpen,
  TrendingUp, Clock, Search, Upload, ArrowUpRight
} from 'lucide-react';
import api from '../lib/api';

export default function AdminDashboard() {
  const navigate = useNavigate();

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['admin-dashboard-stats'],
    queryFn: () => api.get('/analytics/dashboard').then(r => r.data),
  });

  const { data: mostViewed } = useQuery({
    queryKey: ['admin-most-viewed'],
    queryFn: () => api.get('/analytics/most-viewed').then(r => r.data),
  });

  const { data: recentActivity } = useQuery({
    queryKey: ['admin-recent-activity'],
    queryFn: () => api.get('/analytics/recent').then(r => r.data),
  });

  const { data: popularSearches } = useQuery({
    queryKey: ['admin-popular-searches'],
    queryFn: () => api.get('/analytics/popular-searches').then(r => r.data),
  });

  const statCards = [
    { label: 'Total Articles', value: stats?.total_articles, icon: FileText, color: 'bg-blue-500' },
    { label: 'Total Drugs', value: stats?.total_drugs, icon: Pill, color: 'bg-purple-500' },
    { label: 'Total Diseases', value: stats?.total_diseases, icon: Bug, color: 'bg-red-500' },
    { label: 'Total Breeds', value: stats?.total_breeds, icon: PawPrint, color: 'bg-amber-500' },
    { label: 'Total Categories', value: stats?.total_categories, icon: FolderTree, color: 'bg-cyan-500' },
    { label: 'Total Users', value: stats?.total_users, icon: Users, color: 'bg-indigo-500' },
    { label: 'Total Courses', value: stats?.total_courses ?? 0, icon: BookOpen, color: 'bg-emerald-500' },
  ];

  const quickActions = [
    { label: 'New Article', path: '/admin/articles/new', icon: FileText, color: 'bg-blue-500' },
    { label: 'New Drug', path: '/admin/drugs', icon: Pill, color: 'bg-purple-500' },
    { label: 'New Disease', path: '/admin/diseases', icon: Bug, color: 'bg-red-500' },
    { label: 'Upload Media', path: '/admin/media', icon: Upload, color: 'bg-emerald-500' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Dashboard</h2>
        <div className="flex gap-2">
          {quickActions.map((action) => (
            <button
              key={action.label}
              onClick={() => navigate(action.path)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-white text-sm font-medium hover:opacity-90 transition-opacity"
            >
              <action.icon size={16} />
              <span className="hidden sm:inline">{action.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-4">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="bg-white rounded-xl border border-gray-200 p-4">
              <div className="flex items-center justify-between mb-3">
                <div className={`w-10 h-10 rounded-lg ${card.color} flex items-center justify-center`}>
                  <Icon size={20} className="text-white" />
                </div>
                <ArrowUpRight size={16} className="text-gray-400" />
              </div>
              <p className="text-2xl font-bold text-gray-900">
                {statsLoading ? '-' : card.value ?? 0}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">{card.label}</p>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <TrendingUp size={18} className="text-emerald-500" />
            Most Viewed Content
          </h3>
          {!mostViewed ? (
            <p className="text-gray-400 text-sm py-4">Loading...</p>
          ) : (
            <div className="space-y-3">
              {Array.isArray(mostViewed.articles) && mostViewed.articles.slice(0, 5).map((item: any) => (
                <div key={item.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                  <div className="flex items-center gap-3">
                    <FileText size={16} className="text-gray-400" />
                    <span className="text-sm text-gray-700">{item.title}</span>
                  </div>
                  <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">{item.view_count} views</span>
                </div>
              ))}
              {(!mostViewed.articles || mostViewed.articles.length === 0) && (
                <p className="text-gray-400 text-sm py-4">No data yet</p>
              )}
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Clock size={18} className="text-emerald-500" />
            Recent Activity
          </h3>
          {!recentActivity ? (
            <p className="text-gray-400 text-sm py-4">Loading...</p>
          ) : (
            <div className="space-y-3">
              {Array.isArray(recentActivity.recent_articles) && recentActivity.recent_articles.slice(0, 5).map((item: any) => (
                <div key={item.id} className="flex items-start gap-3 py-2 border-b border-gray-100 last:border-0">
                  <FileText size={14} className="text-blue-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-700">{item.title}</p>
                    <p className="text-xs text-gray-400">{new Date(item.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
              ))}
              {(!recentActivity.recent_articles || recentActivity.recent_articles.length === 0) && (
                <p className="text-gray-400 text-sm py-4">No recent activity</p>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Search size={18} className="text-emerald-500" />
          Popular Searches
        </h3>
        {!popularSearches ? (
          <p className="text-gray-400 text-sm py-4">Loading...</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {Array.isArray(popularSearches) && popularSearches.map((item: any) => (
              <div key={item.term || item.query} className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded-full text-sm">
                <span className="text-gray-700">{item.term || item.query}</span>
                <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-full">{item.count}</span>
              </div>
            ))}
            {(!popularSearches || popularSearches.length === 0) && (
              <p className="text-gray-400 text-sm py-4">No search data yet</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
