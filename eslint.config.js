import { ReactNode } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, Upload, FileText, TrendingUp, Bell, Settings, LogOut } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface LayoutProps {
  children: ReactNode;
}

interface NavItem {
  to: string;
  icon: React.ElementType;
  label: string;
}

const navItems: NavItem[] = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/upload', icon: Upload, label: 'Upload' },
  { to: '/reports', icon: FileText, label: 'Reports' },
  { to: '/trends', icon: TrendingUp, label: 'Trends' },
  { to: '/reminders', icon: Bell, label: 'Reminders' },
  { to: '/settings', icon: Settings, label: 'Settings' },
];

export const Layout = ({ children }: LayoutProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  return (
    <div className="min-h-screen flex bg-gray-50">
      <aside className="w-60 bg-slate-50 border-r border-gray-200 flex flex-col fixed h-screen">
        <div className="p-6 border-b border-gray-200">
          <h1 className="text-xl font-bold text-gray-900">Health Dashboard</h1>
        </div>

        <nav className="flex-1 p-4">
          <ul className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.to;
              return (
                <li key={item.to}>
                  <Link
                    to={item.to}
                    className={`flex items-center px-4 py-3 rounded-lg transition-colors ${
                      isActive
                        ? 'bg-sky-500 text-white'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <Icon className="w-5 h-5 mr-3" />
                    <span className="font-medium">{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="p-4 border-t border-gray-200">
          <div className="mb-3 px-4">
            <p className="text-sm text-gray-600 truncate">{user?.email}</p>
          </div>
          <button
            onClick={handleSignOut}
            className="w-full flex items-center px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <LogOut className="w-5 h-5 mr-3" />
            <span className="font-medium">Sign out</span>
          </button>
        </div>
      </aside>

      <main className="flex-1 ml-60">
        <div className="min-h-screen flex flex-col">
          <div className="flex-1 p-8">
            {children}
          </div>
          <footer className="border-t border-gray-200 py-4 px-8">
            <p className="text-sm text-gray-500 text-center">
              Health Dashboard is an informational tool. It does not replace medical advice.
            </p>
          </footer>
        </div>
      </main>
    </div>
  );
};
