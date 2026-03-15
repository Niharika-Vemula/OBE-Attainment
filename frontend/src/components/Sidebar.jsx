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
  const isAdmin = user?.role === 'admin'

  const handleLogout = () => { logout(); navigate('/') }

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon">
          <GraduationCap className="w-5 h-5" />
        </div>
        <div>
          <p className="sidebar-logo-title">OBE Attainment</p>
          <p className="sidebar-logo-sub">CO · PO · PSO System</p>
        </div>
      </div>

      <nav className="sidebar-nav">
        {links.map(({ to, icon: Icon, label }) => (
          <NavLink key={to} to={to}
            className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}>
            <Icon className="w-4 h-4 flex-shrink-0" />
            {label}
          </NavLink>
        ))}

        {isAdmin && (
          <>
            <div className="sidebar-divider" />
            {adminLinks.map(({ to, icon: Icon, label }) => (
              <NavLink key={to} to={to}
                className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}>
                <Icon className="w-4 h-4 flex-shrink-0" />
                {label}
              </NavLink>
            ))}
          </>
        )}
      </nav>

      <BackendStatus />

      <div className="sidebar-footer">
        {user && (
          <>
            <div>
              <p className="sidebar-user-name">{user.name}</p>
              <p className="sidebar-user-role">{user.role}</p>
            </div>
            <button onClick={handleLogout} title="Logout" className="sidebar-logout">
              <LogOut className="w-4 h-4" />
            </button>
          </>
        )}
      </div>
    </aside>
  )
}
