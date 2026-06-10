import { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Menu, Bell, LogOut } from 'lucide-react';
import AdminSidebar from './AdminSidebar';

export default function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [pageTitle, setPageTitle] = useState('Dashboard');
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      navigate('/', { replace: true });
    }
  }, [user, navigate]);

  useEffect(() => {
    const path = location.pathname;
    if (path === '/admin') setPageTitle('Dashboard');
    else if (path.includes('/knowledge')) setPageTitle('Knowledge Base');
    else if (path.includes('/categories')) setPageTitle('Categories');
    else if (path.includes('/subcategories')) setPageTitle('Subcategories');
    else if (path.includes('/articles')) setPageTitle('Articles');
    else if (path.includes('/drugs')) setPageTitle('Drugs');
    else if (path.includes('/diseases')) setPageTitle('Diseases');
    else if (path.includes('/breeds')) setPageTitle('Breeds');
    else if (path.includes('/vaccines')) setPageTitle('Vaccines');
    else if (path.includes('/procedures')) setPageTitle('Procedures');
    else if (path.includes('/media')) setPageTitle('Media Library');
    else if (path.includes('/users')) setPageTitle('Users');
    else if (path.includes('/analytics')) setPageTitle('Analytics');
    else if (path.includes('/settings')) setPageTitle('Settings');
    else setPageTitle('Dashboard');
  }, [location]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <AdminSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 lg:px-6 sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-lg hover:bg-gray-100 text-gray-600"
            >
              <Menu size={20} />
            </button>
            <h1 className="text-lg font-semibold text-gray-900">{pageTitle}</h1>
          </div>
          <div className="flex items-center gap-3">
            <button className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 relative">
              <Bell size={20} />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
            </button>
            <div className="flex items-center gap-2 pl-3 border-l border-gray-200">
              <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center text-white text-sm font-medium">
                {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
              </div>
              <div className="hidden sm:block">
                <p className="text-sm font-medium text-gray-700">{user.name || 'Admin'}</p>
                <p className="text-xs text-gray-500">{user.email || ''}</p>
              </div>
              <button
                onClick={handleLogout}
                className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-red-500 ml-1"
                title="Logout"
              >
                <LogOut size={16} />
              </button>
            </div>
          </div>
        </header>
        <main className="flex-1 overflow-auto p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
