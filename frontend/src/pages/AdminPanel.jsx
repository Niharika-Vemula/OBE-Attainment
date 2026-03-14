import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import {
  Users, Settings, BookOpen, BarChart2, Plus, Trash2,
  Edit2, UserCheck, UserX, RefreshCw, Save
} from 'lucide-react'
import {
  getAdminStats, getUsers, createUser, updateUser, deleteUser, toggleUserActive,
  getSettings, updateSetting, seedSettings, getCourses, getCoPOWeights, updateCOWeights
} from '../api'
import { useAuth } from '../context/AuthContext'
import PageHeader from '../components/PageHeader'
import Card from '../components/Card'
import Badge from '../components/Badge'

const TABS = [
  { id: 'overview', label: 'Overview', icon: BarChart2 },
  { id: 'users', label: 'User Management', icon: Users },
  { id: 'mapping', label: 'CO-PO Mapping', icon: BookOpen },
  { id: 'settings', label: 'System Settings', icon: Settings },
]

const ROLE_COLOR = { admin: 'purple', faculty: 'blue' }

export default function AdminPanel() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [tab, setTab] = useState('overview')

  // Guard: only admin
  useEffect(() => {
    if (user?.role !== 'admin') { navigate('/dashboard'); toast.error('Admin access only') }
  }, [user])

  if (user?.role !== 'admin') return null

  return (
    <div>
      <PageHeader title="Admin Panel" subtitle="Manage users, mappings, and system settings" />

      {/* Tab Bar */}
      <div className="flex gap-1 bg-white/60 p-1 rounded-xl w-fit mb-6 border border-violet-100">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => setTab(id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition
              ${tab === id ? 'bg-white text-indigo-900 shadow-sm' : 'text-violet-400 hover:text-indigo-700'}`}>
            <Icon className="w-4 h-4" />{label}
          </button>
        ))}
      </div>

      {tab === 'overview'  && <OverviewTab />}
      {tab === 'users'     && <UsersTab />}
      {tab === 'mapping'   && <MappingTab />}
      {tab === 'settings'  && <SettingsTab />}
    </div>
  )
}

// ── Overview Tab ──────────────────────────────────────────────────────────────
function OverviewTab() {
  const [stats, setStats] = useState(null)

  useEffect(() => {
    getAdminStats().then(r => setStats(r.data)).catch(() => {})
  }, [])

  const cards = stats ? [
    { label: 'Total Courses',   value: stats.total_courses,  color: 'bg-violet-100 text-indigo-700' },
    { label: 'Faculty Members', value: stats.faculty_count,  color: 'bg-sky-100 text-sky-700' },
    { label: 'Students',        value: stats.total_students, color: 'bg-emerald-100 text-emerald-700' },
    { label: 'Total Exams',     value: stats.total_exams,    color: 'bg-rose-100 text-rose-700' },
    { label: 'Course Outcomes', value: stats.total_cos,      color: 'bg-amber-100 text-amber-700' },
    { label: 'Program Outcomes',value: stats.total_pos,      color: 'bg-purple-100 text-purple-700' },
    { label: 'PSOs',            value: stats.total_psos,     color: 'bg-pink-100 text-pink-700' },
    { label: 'System Users',    value: stats.total_users,    color: 'bg-indigo-100 text-indigo-700' },
  ] : []

  return (
    <div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {cards.map(({ label, value, color }) => (
          <Card key={label} className="p-5">
            <p className="text-xs text-violet-400 font-medium">{label}</p>
            <p className={`text-3xl font-bold mt-1 ${color.split(' ')[1]}`}>{value ?? '—'}</p>
          </Card>
        ))}
      </div>
      <Card className="p-5">
        <h2 className="font-semibold text-indigo-800 mb-3">Admin Workflow</h2>
        <ol className="space-y-2 text-sm text-indigo-700">
          {[
            'Create faculty users in User Management',
            'Add courses with credits, instructor, and semester',
            'Define POs and PSOs in the Outcomes page',
            'Open a course → AI Generate COs or add manually',
            'Go to CO-PO Mapping tab to review/edit mappings',
            'Create exams and use AI Map to assign COs to questions',
            'Enter student marks in Student Marks page',
            'View attainment charts and export reports',
          ].map((step, i) => (
            <li key={i} className="flex items-start gap-3">
              <span className="w-5 h-5 rounded-full bg-violet-100 text-indigo-700 text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                {i + 1}
              </span>
              {step}
            </li>
          ))}
        </ol>
      </Card>
    </div>
  )
}

// ── Users Tab ─────────────────────────────────────────────────────────────────
function UsersTab() {
  const [users, setUsers] = useState([])
  const [roleFilter, setRoleFilter] = useState('all')
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState(null)
  const [form, setForm] = useState({ name: '', email: '', role: 'faculty', department: '', password: 'password123' })

  const load = () => getUsers().then(r => setUsers(r.data)).catch(() => {})
  useEffect(() => { load() }, [])

  const filtered = roleFilter === 'all' ? users : users.filter(u => u.role === roleFilter)

  const resetForm = () => { setForm({ name: '', email: '', role: 'faculty', department: '', password: 'password123' }); setEditId(null); setShowForm(false) }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      if (editId) {
        await updateUser(editId, form)
        toast.success('User updated')
      } else {
        await createUser(form)
        toast.success('User created')
      }
      resetForm(); load()
    } catch (err) {
      toast.error(err?.response?.data?.detail || 'Failed')
    }
  }

  const handleEdit = (u) => {
    setForm({ name: u.name, email: u.email, role: u.role, department: u.department || '', password: '' })
    setEditId(u.id); setShowForm(true)
  }

  const handleDelete = async (id, name) => {
    if (!confirm(`Delete user "${name}"?`)) return
    await deleteUser(id); toast.success('User deleted'); load()
  }

  const handleToggle = async (id) => {
    await toggleUserActive(id); load()
  }

  const f = (k, v) => setForm(p => ({ ...p, [k]: v }))

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="flex gap-1 bg-white/60 p-1 rounded-lg border border-violet-100">
          {['all', 'admin', 'faculty'].map(r => (
            <button key={r} onClick={() => setRoleFilter(r)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium capitalize transition
                ${roleFilter === r ? 'bg-white text-indigo-900 shadow-sm' : 'text-violet-400 hover:text-indigo-700'}`}>
              {r} {r === 'all' ? `(${users.length})` : `(${users.filter(u => u.role === r).length})`}
            </button>
          ))}
        </div>
        <button onClick={() => { resetForm(); setShowForm(true) }}
          className="flex items-center gap-2 gradient-btn text-white px-4 py-2 rounded-lg text-sm font-medium">
          <Plus className="w-4 h-4" /> Add User
        </button>
      </div>

      {showForm && (
        <Card className="p-5 mb-5">
          <h2 className="font-semibold text-indigo-800 mb-4">{editId ? 'Edit User' : 'Create User'}</h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-3">
            <input required placeholder="Full Name" value={form.name} onChange={e => f('name', e.target.value)}
              className="border border-violet-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-300" />
            <input required={!editId} placeholder="Email" type="email" value={form.email} onChange={e => f('email', e.target.value)}
              className="border border-violet-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-300" />
            <select value={form.role} onChange={e => f('role', e.target.value)}
              className="border border-violet-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-300">
              <option value="admin">Admin</option>
              <option value="faculty">Faculty</option>
            </select>
            <input placeholder="Department (optional)" value={form.department} onChange={e => f('department', e.target.value)}
              className="border border-violet-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-300" />
            <input placeholder={editId ? 'New password (leave blank to keep)' : 'Password'} type="password"
              value={form.password} onChange={e => f('password', e.target.value)}
              className="col-span-2 border border-violet-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-300" />
            <div className="col-span-2 flex gap-2">
              <button type="submit" className="gradient-btn text-white px-4 py-2 rounded-lg text-sm font-medium">
                {editId ? 'Update' : 'Create'}
              </button>
              <button type="button" onClick={resetForm} className="px-4 py-2 rounded-lg text-sm text-indigo-700 hover:bg-violet-50">Cancel</button>
            </div>
          </form>
        </Card>
      )}

      <Card>
        <div className="divide-y divide-violet-50">
          {filtered.map(u => (
            <div key={u.id} className="flex items-center justify-between px-5 py-3.5 hover:bg-white/60 transition">
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold
                  ${u.role === 'admin' ? 'bg-purple-100 text-purple-700' : u.role === 'faculty' ? 'bg-sky-100 text-sky-700' : 'bg-emerald-100 text-emerald-700'}`}>
                  {u.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-medium text-indigo-900">{u.name}</p>
                  <p className="text-xs text-violet-400">{u.email}{u.department ? ` · ${u.department}` : ''}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge label={u.role} color={ROLE_COLOR[u.role] || 'slate'} />
                <button onClick={() => handleToggle(u.id)} title={u.is_active ? 'Deactivate' : 'Activate'}
                  className={`p-1.5 rounded-lg transition ${u.is_active ? 'text-emerald-500 hover:bg-emerald-50' : 'text-slate-400 hover:bg-slate-50'}`}>
                  {u.is_active ? <UserCheck className="w-4 h-4" /> : <UserX className="w-4 h-4" />}
                </button>
                <button onClick={() => handleEdit(u)} className="p-1.5 rounded-lg text-violet-400 hover:text-indigo-700 hover:bg-violet-50 transition">
                  <Edit2 className="w-4 h-4" />
                </button>
                <button onClick={() => handleDelete(u.id, u.name)} className="p-1.5 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50 transition">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="text-center py-12 text-violet-300 text-sm">
              No users found. Add one above.
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}

// ── CO-PO Mapping Tab ─────────────────────────────────────────────────────────
function MappingTab() {
  const [courses, setCourses] = useState([])
  const [selectedCourse, setSelectedCourse] = useState('')
  const [matrix, setMatrix] = useState(null)
  const [saving, setSaving] = useState(null)

  useEffect(() => { getCourses().then(r => setCourses(r.data)) }, [])

  const loadMatrix = async (id) => {
    setSelectedCourse(id)
    if (!id) { setMatrix(null); return }
    try {
      const { data } = await getCoPOWeights(id)
      setMatrix(data)
    } catch { toast.error('No COs defined for this course yet') }
  }

  const toggleMapping = async (co, type, code) => {
    const key = type === 'po' ? 'po_weights' : 'pso_weights'
    const isOn = code in co[key]
    const newWeights = { ...co[key] }
    if (isOn) delete newWeights[code]
    else newWeights[code] = 3

    // Optimistic update
    setMatrix(prev => ({
      ...prev,
      cos: prev.cos.map(c => c.co_id === co.co_id ? { ...c, [key]: newWeights } : c)
    }))

    setSaving(co.co_id)
    try {
      const po_codes = type === 'po' ? Object.keys(newWeights) : Object.keys(co.po_weights)
      const pso_codes = type === 'pso' ? Object.keys(newWeights) : Object.keys(co.pso_weights)
      await updateCOWeights(co.co_id, { po_codes, pso_codes })
    } catch { toast.error('Failed to save mapping') }
    setSaving(null)
  }

  return (
    <div>
      <div className="mb-5">
        <select value={selectedCourse} onChange={e => loadMatrix(e.target.value)}
          className="border border-violet-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-300 w-72">
          <option value="">Select a course...</option>
          {courses.map(c => <option key={c.id} value={c.id}>{c.name} ({c.code})</option>)}
        </select>
      </div>

      {matrix && (
        <Card className="overflow-x-auto">
          <div className="p-4 border-b border-violet-100">
            <p className="text-sm font-semibold text-indigo-800">CO → PO / PSO Mapping Matrix</p>
            <p className="text-xs text-violet-400 mt-0.5">Click a cell to toggle the mapping. Green = mapped.</p>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-violet-100">
                <th className="text-left px-4 py-3 text-xs text-violet-400 font-medium w-40">CO</th>
                {matrix.pos.map(p => (
                  <th key={p} className="px-3 py-3 text-xs text-indigo-700 font-semibold text-center">{p}</th>
                ))}
                {matrix.psos.map(p => (
                  <th key={p} className="px-3 py-3 text-xs text-purple-700 font-semibold text-center">{p}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {matrix.cos.map(co => (
                <tr key={co.co_id} className="border-b border-violet-50 hover:bg-violet-50/40 transition">
                  <td className="px-4 py-3">
                    <p className="font-semibold text-indigo-900 text-xs">{co.co_code}</p>
                    <p className="text-xs text-violet-400 truncate max-w-[140px]">{co.description}</p>
                    {saving === co.co_id && <span className="text-xs text-violet-400">saving...</span>}
                  </td>
                  {matrix.pos.map(p => {
                    const mapped = p in co.po_weights
                    return (
                      <td key={p} className="px-3 py-3 text-center">
                        <button onClick={() => toggleMapping(co, 'po', p)}
                          className={`w-8 h-8 rounded-lg text-xs font-bold transition
                            ${mapped ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200' : 'bg-slate-100 text-slate-400 hover:bg-violet-100 hover:text-indigo-700'}`}>
                          {mapped ? '✓' : '—'}
                        </button>
                      </td>
                    )
                  })}
                  {matrix.psos.map(p => {
                    const mapped = p in co.pso_weights
                    return (
                      <td key={p} className="px-3 py-3 text-center">
                        <button onClick={() => toggleMapping(co, 'pso', p)}
                          className={`w-8 h-8 rounded-lg text-xs font-bold transition
                            ${mapped ? 'bg-purple-100 text-purple-700 hover:bg-purple-200' : 'bg-slate-100 text-slate-400 hover:bg-purple-100 hover:text-purple-700'}`}>
                          {mapped ? '✓' : '—'}
                        </button>
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
          {matrix.cos.length === 0 && (
            <p className="text-center py-10 text-violet-300 text-sm">No COs defined. Go to the course page and generate COs first.</p>
          )}
        </Card>
      )}

      {!matrix && selectedCourse && (
        <div className="text-center py-16 text-violet-300 text-sm">Loading mapping matrix...</div>
      )}
    </div>
  )
}

// ── Settings Tab ──────────────────────────────────────────────────────────────
function SettingsTab() {
  const [settings, setSettings] = useState({})
  const [edits, setEdits] = useState({})
  const [saving, setSaving] = useState(null)

  const load = () => getSettings().then(r => setSettings(r.data)).catch(() => {})
  useEffect(() => { load() }, [])

  const handleSeed = async () => {
    await seedSettings(); toast.success('Default settings created'); load()
  }

  const handleSave = async (key) => {
    setSaving(key)
    try {
      await updateSetting(key, { value: edits[key] ?? settings[key]?.value })
      toast.success('Setting saved')
      setEdits(p => { const n = { ...p }; delete n[key]; return n })
      load()
    } catch { toast.error('Failed to save') }
    setSaving(null)
  }

  const SETTING_LABELS = {
    co_threshold_l1: 'CO Level 1 Threshold (%)',
    co_threshold_l2: 'CO Level 2 Threshold (%)',
    co_threshold_l3: 'CO Level 3 Threshold (%)',
    institution_name: 'Institution Name',
    department_name: 'Department Name',
    academic_year: 'Academic Year',
  }

  const keys = Object.keys(settings)

  return (
    <div>
      <div className="flex justify-end mb-4">
        <button onClick={handleSeed}
          className="flex items-center gap-2 text-sm text-indigo-700 border border-violet-200 px-4 py-2 rounded-lg hover:bg-violet-50 transition">
          <RefreshCw className="w-4 h-4" /> Seed Defaults
        </button>
      </div>

      {keys.length === 0 ? (
        <Card className="p-8 text-center text-violet-400 text-sm">
          No settings yet. Click "Seed Defaults" to create them.
        </Card>
      ) : (
        <Card>
          <div className="divide-y divide-violet-50">
            {keys.map(key => {
              const val = edits[key] ?? settings[key]?.value ?? ''
              const isDirty = edits[key] !== undefined
              return (
                <div key={key} className="flex items-center justify-between px-5 py-4 hover:bg-white/60 transition">
                  <div className="flex-1 mr-4">
                    <p className="text-sm font-medium text-indigo-900">{SETTING_LABELS[key] || key}</p>
                    <p className="text-xs text-violet-400 mt-0.5">{settings[key]?.description}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <input value={val}
                      onChange={e => setEdits(p => ({ ...p, [key]: e.target.value }))}
                      className="border border-violet-100 rounded-lg px-3 py-1.5 text-sm w-40 focus:outline-none focus:ring-2 focus:ring-violet-300" />
                    {isDirty && (
                      <button onClick={() => handleSave(key)} disabled={saving === key}
                        className="gradient-btn text-white px-3 py-1.5 rounded-lg text-xs font-medium disabled:opacity-50">
                        {saving === key ? '...' : <Save className="w-3.5 h-3.5" />}
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </Card>
      )}
    </div>
  )
}
