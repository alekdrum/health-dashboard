import { NavLink, useNavigate } from 'react-router-dom'
import { LayoutDashboard, Upload, FileText, TrendingUp, Bell, Settings, LogOut } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/upload', icon: Upload, label: 'Upload' },
  { to: '/reports', icon: FileText, label: 'Reports' },
  { to: '/trends', icon: TrendingUp, label: 'Trends' },
  { to: '/reminders', icon: Bell, label: 'Reminders' },
  { to: '/settings', icon: Settings, label: 'Settings' },
]

export const Layout = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth()
  const navigate = useNavigate()

  async function handleSignOut() {
    await supabase.auth.signOut()
    navigate('/login')
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <aside className="w-60 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-6">
          <h1 className="text-lg font-bold text-gray-800">Health Dashboard</h1>
        </div>
        <nav className="flex-1 px-3">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg mb-1 text-sm font-medium transition-colors ${
                  isActive ? 'bg-sky-500 text-white' : 'text-gray-600 hover:bg-gray-100'
                }`
              }
            >
              <Icon className="w-4 h-4" />
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="p-4 border-t border-gray-200">
          <p className="text-xs text-gray-500 mb-3 truncate">{user?.email}</p>
          <button
            onClick={handleSignOut}
            className="flex items-center gap-2 text-sm text-gray-600 hover:text-red-500 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sign out
          </button>
        </div>
      </aside>
      <main className="flex-1 overflow-auto">
        <div className="min-h-full flex flex-col">
          <div className="flex-1 p-6">{children}</div>
          <footer className="p-4 text-center text-xs text-gray-400 border-t">
            Health Dashboard is an informational tool. It does not replace medical advice.
          </footer>
        </div>
      </main>
    </div>
  )
}
