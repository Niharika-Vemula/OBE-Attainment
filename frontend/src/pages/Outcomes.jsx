import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { Plus, Trash2 } from 'lucide-react'
import { getPOs, getPSOs, createPO, createPSO } from '../api'
import PageHeader from '../components/PageHeader'
import Card from '../components/Card'

export default function Outcomes() {
  const [pos, setPos] = useState([])
  const [psos, setPsos] = useState([])
  const [tab, setTab] = useState('po')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ code: '', description: '' })

  const load = async () => {
    const [p, ps] = await Promise.all([getPOs(), getPSOs()])
    setPos(p.data); setPsos(ps.data)
  }

  useEffect(() => { load() }, [])

  const handleCreate = async (e) => {
    e.preventDefault()
    try {
      tab === 'po' ? await createPO(form) : await createPSO(form)
      toast.success(`${tab.toUpperCase()} created`)
      setForm({ code: '', description: '' })
      setShowForm(false)
      load()
    } catch { toast.error('Failed') }
  }

  const items = tab === 'po' ? pos : psos
  const label = tab === 'po' ? 'Program Outcome' : 'Program Specific Outcome'

  return (
    <div>
      <PageHeader title="Program Outcomes" subtitle="Manage POs and PSOs for your program"
        action={
          <button onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 gradient-btn text-white px-4 py-2 rounded-lg text-sm font-medium ">
            <Plus className="w-4 h-4" /> Add {tab.toUpperCase()}
          </button>
        } />

      {/* Tabs */}
      <div className="flex gap-1 bg-violet-50 p-1 rounded-lg w-fit mb-6">
        {['po', 'pso'].map(t => (
          <button key={t} onClick={() => { setTab(t); setShowForm(false) }}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition ${tab === t ? 'bg-white text-indigo-900 shadow-sm' : 'text-violet-400 hover:text-indigo-800'}`}>
            {t.toUpperCase()}s ({t === 'po' ? pos.length : psos.length})
          </button>
        ))}
      </div>

      {showForm && (
        <Card className="p-5 mb-6">
          <h2 className="font-semibold text-indigo-800 mb-4">Add {label}</h2>
          <form onSubmit={handleCreate} className="flex gap-3 items-end">
            <div>
              <label className="text-xs text-violet-400 mb-1 block">Code</label>
              <input required placeholder={tab === 'po' ? 'PO1' : 'PSO1'} value={form.code}
                onChange={e => setForm({ ...form, code: e.target.value })}
                className="border border-violet-100 rounded-lg px-3 py-2 text-sm w-28 focus:outline-none focus:ring-2 focus:ring-violet-300" />
            </div>
            <div className="flex-1">
              <label className="text-xs text-violet-400 mb-1 block">Description</label>
              <input required placeholder={`Describe this ${tab.toUpperCase()}...`} value={form.description}
                onChange={e => setForm({ ...form, description: e.target.value })}
                className="w-full border border-violet-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-300" />
            </div>
            <button type="submit" className="gradient-btn text-white px-4 py-2 rounded-lg text-sm font-medium ">Save</button>
            <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 rounded-lg text-sm text-indigo-700 hover:bg-violet-50">Cancel</button>
          </form>
        </Card>
      )}

      <Card>
        <div className="divide-y divide-violet-100">
          {items.map((item, i) => (
            <div key={item.id} className="flex items-start gap-4 px-5 py-4 hover:bg-white/60 transition">
              <span className={`mt-0.5 text-xs font-bold px-2.5 py-1 rounded-lg flex-shrink-0
                ${tab === 'po' ? 'bg-violet-100 text-indigo-800' : 'bg-teal-100 text-teal-700'}`}>
                {item.code}
              </span>
              <p className="text-sm text-indigo-800 flex-1">{item.description}</p>
            </div>
          ))}
          {items.length === 0 && (
            <div className="text-center py-12 text-violet-300 text-sm">
              No {label}s yet. Add one above.
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}
