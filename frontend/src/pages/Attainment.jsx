import { useEffect, useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { getCourses, getCourseAttainment, getCOs } from '../api'
import PageHeader from '../components/PageHeader'
import Card from '../components/Card'

const levelColor = (l) => l >= 3 ? '#22c55e' : l === 2 ? '#f59e0b' : l === 1 ? '#ef4444' : '#94a3b8'
const levelLabel = (l) => l >= 3 ? 'Level 3' : l === 2 ? 'Level 2' : l === 1 ? 'Level 1' : 'No Data'

export default function Attainment() {
  const [courses, setCourses] = useState([])
  const [selected, setSelected] = useState('')
  const [data, setData] = useState(null)
  const [cos, setCos] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => { getCourses().then(r => setCourses(r.data)) }, [])

  const load = async (id) => {
    setLoading(true)
    try {
      const [att, coList] = await Promise.all([getCourseAttainment(id), getCOs(id)])
      setData(att.data); setCos(coList.data)
    } catch { setData(null) }
    setLoading(false)
  }

  const handleSelect = (id) => { setSelected(id); if (id) load(id) }

  const coChartData = data?.co_attainment?.map(e => {
    const co = cos.find(c => c.id === e.co_id)
    return { name: co?.code || e.co_id, pct: e.attainment_pct, level: e.attainment_level }
  }) || []

  const poChartData = Object.entries(data?.po_attainment || {}).map(([k, v]) => ({ name: k, pct: v }))
  const psoChartData = Object.entries(data?.pso_attainment || {}).map(([k, v]) => ({ name: k, pct: v }))

  return (
    <div>
      <PageHeader title="Attainment" subtitle="CO, PO and PSO attainment analysis" />

      <div className="mb-6">
        <select value={selected} onChange={e => handleSelect(e.target.value)}
          className="border border-violet-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-300 w-72">
          <option value="">Select a course...</option>
          {courses.map(c => <option key={c.id} value={c.id}>{c.name} ({c.code})</option>)}
        </select>
      </div>

      {loading && <div className="text-violet-300 text-sm">Loading attainment data...</div>}

      {data && !loading && (
        <div className="space-y-6">
          {/* CO Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3">
            {coChartData.map(co => (
              <Card key={co.name} className="p-4 text-center">
                <p className="font-bold text-lg text-indigo-900">{co.name}</p>
                <p className="text-2xl font-bold mt-1" style={{ color: levelColor(co.level) }}>{co.pct}%</p>
                <span className="text-xs px-2 py-0.5 rounded-full mt-1 inline-block"
                  style={{ background: levelColor(co.level) + '20', color: levelColor(co.level) }}>
                  {levelLabel(co.level)}
                </span>
              </Card>
            ))}
          </div>

          {/* CO Chart */}
          {coChartData.length > 0 && (
            <Card className="p-5">
              <h2 className="font-semibold text-indigo-800 mb-4">CO Attainment</h2>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={coChartData} barSize={40}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ede9fe" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} unit="%" />
                  <Tooltip formatter={(v) => `${v}%`} />
                  <Bar dataKey="pct" radius={[4, 4, 0, 0]}>
                    {coChartData.map((e, i) => <Cell key={i} fill={levelColor(e.level)} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </Card>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* PO Chart */}
            {poChartData.length > 0 && (
              <Card className="p-5">
                <h2 className="font-semibold text-indigo-800 mb-4">PO Attainment</h2>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={poChartData} barSize={20}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ede9fe" />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} unit="%" />
                    <Tooltip formatter={(v) => `${v}%`} />
                    <Bar dataKey="pct" fill="#6366f1" radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </Card>
            )}

            {/* PSO Chart */}
            {psoChartData.length > 0 && (
              <Card className="p-5">
                <h2 className="font-semibold text-indigo-800 mb-4">PSO Attainment</h2>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={psoChartData} barSize={40}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ede9fe" />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} unit="%" />
                    <Tooltip formatter={(v) => `${v}%`} />
                    <Bar dataKey="pct" fill="#a855f7" radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </Card>
            )}
          </div>
        </div>
      )}

      {!data && !loading && selected && (
        <div className="text-center py-16 text-violet-300">
          <p>No attainment data yet. Upload student marks first.</p>
        </div>
      )}
    </div>
  )
}
