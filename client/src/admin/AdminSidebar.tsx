import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, BookOpen, FolderTree, GitBranch, FileText,
  Pill, Bug, PawPrint, Syringe, Stethoscope, Image,
  Users, BarChart3, Settings, ExternalLink, X, Book
} from 'lucide-react';

interface AdminSidebarProps {
  open: boolean;
  onClose: () => void;
}

const navItems = [
  { label: 'Dashboard', path: '/admin', icon: LayoutDashboard },
  { label: 'Knowledge', path: '/admin/knowledge', icon: BookOpen },
  { label: 'Notes', path: '/admin/notes', icon: Book },
  { label: 'Categories', path: '/admin/categories', icon: FolderTree },
  { label: 'Subcategories', path: '/admin/subcategories', icon: GitBranch },
  { label: 'Articles', path: '/admin/articles', icon: FileText },
  { label: 'Drugs', path: '/admin/drugs', icon: Pill },
  { label: 'Diseases', path: '/admin/diseases', icon: Bug },
  { label: 'Breeds', path: '/admin/breeds', icon: PawPrint },
  { label: 'Vaccines', path: '/admin/vaccines', icon: Syringe },
  { label: 'Procedures', path: '/admin/procedures', icon: Stethoscope },
  { label: 'Media Library', path: '/admin/media', icon: Image },
  { label: 'Users', path: '/admin/users', icon: Users },
  { label: 'Analytics', path: '/admin/analytics', icon: BarChart3 },
  { label: 'Settings', path: '/admin/settings', icon: Settings },
];

export default function AdminSidebar({ open, onClose }: AdminSidebarProps) {
  return (
    <aside
      className={`fixed lg:static inset-y-0 left-0 z-30 w-64 bg-[#0f172a] text-white flex flex-col transition-transform duration-200 ${
        open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      }`}
    >
      <div className="h-16 flex items-center justify-between px-4 border-b border-white/10">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center">
            <PawPrint size={18} className="text-white" />
          </div>
          <span className="font-bold text-lg">VetCrack Admin</span>
        </div>
        <button onClick={onClose} className="lg:hidden p-1 rounded hover:bg-white/10 text-white/60">
          <X size={20} />
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto py-2 px-2 space-y-0.5">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/admin'}
            onClick={onClose}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-emerald-500/20 text-emerald-400'
                  : 'text-white/60 hover:text-white hover:bg-white/5'
              }`
            }
          >
            <item.icon size={18} />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="p-3 border-t border-white/10">
        <a
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm text-white/50 hover:text-white hover:bg-white/5 transition-colors"
        >
          <ExternalLink size={16} />
          <span>View Site</span>
        </a>
      </div>
    </aside>
  );
}
