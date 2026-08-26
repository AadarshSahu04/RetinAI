import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { Eye, LayoutDashboard, Upload } from 'lucide-react'
import UploadPage from './pages/UploadPage.jsx'
import DashboardPage from './pages/DashboardPage.jsx'

function NavItem({ to, icon: Icon, label }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `flex items-center gap-2.5 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
          isActive
            ? 'bg-blue-500/15 text-blue-400 border border-blue-500/30'
            : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-white/5'
        }`
      }
    >
      <Icon size={16} />
      {label}
    </NavLink>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <div className="noise-bg min-h-screen relative">
        {/* Background glows */}
        <div className="fixed top-0 left-1/4 w-96 h-96 bg-blue-600/5 rounded-full blur-3xl pointer-events-none" />
        <div className="fixed bottom-0 right-1/4 w-96 h-96 bg-purple-600/5 rounded-full blur-3xl pointer-events-none" />

        {/* Navigation */}
        <nav className="relative z-10 border-b border-[var(--border)] backdrop-blur-sm bg-[var(--bg-primary)]/80 sticky top-0">
          <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center">
                <Eye size={18} className="text-blue-400" />
              </div>
              <div>
                <p className="font-display font-bold text-sm leading-tight text-[var(--text-primary)]">
                  Retin AI
                </p>
                <p className="text-[10px] text-[var(--text-muted)] leading-tight">
                  Diabetic Retinopathy Detection
                </p>
              </div>
            </div>

            {/* Nav links */}
            <div className="flex items-center gap-2">
              <NavItem to="/" icon={Upload} label="New Scan" />
              <NavItem to="/dashboard" icon={LayoutDashboard} label="Dashboard" />
            </div>
          </div>
        </nav>

        {/* Page content */}
        <main className="relative z-10">
          <Routes>
            <Route path="/" element={<UploadPage />} />
            <Route path="/dashboard" element={<DashboardPage />} />
          </Routes>
        </main>

        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: 'var(--bg-card)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border)',
              borderRadius: '12px',
              fontSize: '14px',
            },
            success: { iconTheme: { primary: '#22c55e', secondary: '#0a0f1e' } },
            error: { iconTheme: { primary: '#ef4444', secondary: '#0a0f1e' } },
          }}
        />
      </div>
    </BrowserRouter>
  )
}
