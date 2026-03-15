import { Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider, useAuth } from './context/AuthContext'
import Sidebar from './components/Sidebar'
import Landing from './pages/Landing'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Courses from './pages/Courses'
import CourseDetail from './pages/CourseDetail'
import Exams from './pages/Exams'
import Marks from './pages/Marks'
import Attainment from './pages/Attainment'
import Outcomes from './pages/Outcomes'
import Reports from './pages/Reports'
import Chatbot from './pages/Chatbot'
import AdminPanel from './pages/AdminPanel'

function AppLayout() {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  const theme = user.role === 'admin' ? 'admin-theme' : 'faculty-theme'
  return (
    <div className={`flex min-h-screen ${theme}`} style={
      user.role === 'admin'
        ? { background: '#0F0E1A' }
        : { background: 'linear-gradient(135deg, #EFF6FF 0%, #F0F9FF 50%, #F5F3FF 100%)' }
    }>
      <Sidebar />
      <main className="flex-1 p-8 overflow-y-auto">
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/courses" element={<Courses />} />
          <Route path="/courses/:id" element={<CourseDetail />} />
          <Route path="/exams" element={<Exams />} />
          <Route path="/marks" element={<Marks />} />
          <Route path="/attainment" element={<Attainment />} />
          <Route path="/outcomes" element={<Outcomes />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/chatbot" element={<Chatbot />} />
          <Route path="/admin" element={<AdminPanel />} />
        </Routes>
      </main>
    </div>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <Toaster position="top-right" toastOptions={{ className: 'text-sm' }} />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/*" element={<AppLayout />} />
      </Routes>
    </AuthProvider>
  )
}
