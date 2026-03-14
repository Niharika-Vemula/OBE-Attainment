import { NavLink, useNavigate } from 'react-router-dom'
import { LayoutDashboard, BookOpen, ClipboardList, Users, BarChart2, FileText, MessageSquare, GraduationCap, Target, LogOut, ShieldCheck } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import BackendStatus from './BackendStatus'

const links = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/courses', icon: BookOpen, label: 'Courses' },
  { to: '/outcomes', icon: Target, label: 'Outcomes' },
  { to: '/exams', icon: ClipboardList, label: 'Exams' },
  { to: '/marks', icon: Users, label: 'Student Marks' },
  { to: '/attainment', icon: BarChart2, label: 'Attainment' },
  { to: '/reports', icon: FileText, label: 'Reports' },
  { to: '/chatbot', icon: MessageSquare, label: 'AI Chatbot' },
]

const adminLinks = [
  { to: '/admin', icon: ShieldCheck, label: 'Admin Panel' },
]

export default function Sidebar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  return (
    <aside className="w-64 min-h-screen flex flex-col"
      style={{ background: 'linear-gradient(180deg, #4f46e5 0%, #7c3aed 60%, #a855f7 100%)' }}>

      <div className="px-6 py-5" style={{ borderBottom: '1px solid rgba(255,255,255,0.15)' }}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(8px)' }}>
            <GraduationCap className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="font-bold text-sm text-white leading-tight">OBE Attainment</p>
            <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.65)' }}>CO · PO · PSO System</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {links.map(({ to, icon: Icon, label }) => (
          <NavLink key={to} to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150
               ${isActive ? 'text-violet-700 font-semibold shadow-sm' : 'text-white/80 hover:text-white'}`
            }
            style={({ isActive }) => isActive ? { background: 'rgba(255,255,255,0.92)' } : {}}
            onMouseEnter={e => { if (!e.currentTarget.classList.contains('text-violet-700')) e.currentTarget.style.background = 'rgba(255,255,255,0.12)' }}
            onMouseLeave={e => { if (!e.currentTarget.classList.contains('text-violet-700')) e.currentTarget.style.background = 'transparent' }}>
            <Icon className="w-4 h-4 flex-shrink-0" />
            {label}
          </NavLink>
        ))}

        {user?.role === 'admin' && (
          <>
            <div className="mx-3 my-2 border-t border-white/10" />
            {adminLinks.map(({ to, icon: Icon, label }) => (
              <NavLink key={to} to={to}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150
                   ${isActive ? 'text-violet-700 font-semibold shadow-sm' : 'text-white/80 hover:text-white'}`
                }
                style={({ isActive }) => isActive ? { background: 'rgba(255,255,255,0.92)' } : {}}
                onMouseEnter={e => { if (!e.currentTarget.classList.contains('text-violet-700')) e.currentTarget.style.background = 'rgba(255,255,255,0.12)' }}
                onMouseLeave={e => { if (!e.currentTarget.classList.contains('text-violet-700')) e.currentTarget.style.background = 'transparent' }}>
                <Icon className="w-4 h-4 flex-shrink-0" />
                {label}
              </NavLink>
            ))}
          </>
        )}
      </nav>

      <BackendStatus />

      <div className="px-4 py-4" style={{ borderTop: '1px solid rgba(255,255,255,0.15)' }}>
        {user && (
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-white/90">{user.name}</p>
              <p className="text-xs capitalize" style={{ color: 'rgba(255,255,255,0.5)' }}>{user.role}</p>
            </div>
            <button onClick={handleLogout} title="Logout"
              className="text-white/50 hover:text-white transition p-1.5 rounded-lg hover:bg-white/10">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </aside>
  )
}
