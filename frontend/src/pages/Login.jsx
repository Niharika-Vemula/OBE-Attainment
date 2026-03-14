import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { GraduationCap, Eye, EyeOff } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'

const DEMO_USERS = {
  admin: { password: 'admin123', name: 'Admin User' },
  faculty: { password: 'faculty123', name: 'Faculty Member' },
}

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [role, setRole] = useState('admin')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    await new Promise(r => setTimeout(r, 600))
    const user = DEMO_USERS[role]
    if (user && password === user.password) {
      login(role, user.name)
      toast.success(`Welcome, ${user.name}`)
      navigate('/dashboard')
    } else {
      toast.error('Invalid credentials')
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4"
      style={{ background: 'linear-gradient(135deg, #e8f0fe 0%, #f3e8ff 50%, #fce7f3 100%)' }}>
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
            style={{ background: 'linear-gradient(135deg, #6366f1, #a855f7)' }}>
            <GraduationCap className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-indigo-900">Welcome back</h1>
          <p className="text-sm text-indigo-500 mt-1">Sign in to OBE Attainment System</p>
        </div>

        <div className="glass-card rounded-2xl p-8">
          <div className="flex gap-1 bg-violet-50 p-1 rounded-xl mb-6">
            {['admin', 'faculty'].map(r => (
              <button key={r} onClick={() => setRole(r)}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition capitalize
                  ${role === r ? 'bg-white text-indigo-900 shadow-sm' : 'text-violet-400 hover:text-indigo-700'}`}>
                {r === 'admin' ? 'Admin' : 'Faculty'}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-medium text-indigo-700 mb-1.5 block">Role</label>
              <input value={role === 'admin' ? 'Administrator' : 'Faculty Member'} readOnly
                className="w-full border border-violet-100 rounded-xl px-4 py-2.5 text-sm bg-violet-50/50 text-indigo-700" />
            </div>
            <div>
              <label className="text-xs font-medium text-indigo-700 mb-1.5 block">Password</label>
              <div className="relative">
                <input type={showPw ? 'text' : 'password'} required value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder={`Enter password (${role}123)`}
                  className="w-full border border-violet-100 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-300 pr-10" />
                <button type="button" onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-violet-400 hover:text-indigo-700">
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading}
              className="w-full gradient-btn text-white py-2.5 rounded-xl font-semibold text-sm disabled:opacity-50 mt-2">
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div className="mt-4 text-center">
            <button className="text-xs text-violet-400 hover:text-indigo-700 transition">
              Forgot password? Contact your administrator.
            </button>
          </div>

          <div className="mt-5 pt-4 border-t border-violet-100 text-xs text-violet-400 text-center space-y-0.5">
            <p>Demo: admin / admin123</p>
            <p>Demo: faculty / faculty123</p>
          </div>
        </div>

        <div className="text-center mt-4">
          <Link to="/" className="text-xs text-violet-400 hover:text-indigo-700 transition">
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  )
}
