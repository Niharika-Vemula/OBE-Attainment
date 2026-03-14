import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { FileSpreadsheet, FileText, Download, Sparkles, BarChart2 } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { getCourses, downloadExcel, downloadPDF, getCourseSummary, getCourseAttainment } from '../api'
import PageHeader from '../components/PageHeader'
import Card from '../components/Card'

export default function Reports() {
  const [courses, setCourses] = useState([])
  const [selected, setSelected] = useState('')
  const [summary, setSummary] = useState(null)
  const [loadingSummary, setLoadingSummary] = useState(false)
  const [loadingExcel, setLoadingExcel] = useState(false)
  const [loadingPdf, setLoadingPdf] = useState(false)
  const [semesterData, setSemesterData] = useState([])
  const [loadingSem, setLoadingSem] = useState(false)

  useEffect(() => { getCourses().then(r => setCourses(r.data)) }, [])

  const handleDownload = async (type) => {
    if (!selected) return toast.error('Select a course first')
    type === 'excel' ? setLoadingExcel(true) : setLoadingPdf(true)
    try {
      const res = type === 'excel' ? await downloadExcel(selected) : await downloadPDF(selected)
      const blob = new Blob([res.data], {
        type: type === 'excel'
          ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
          : 'application/pdf'
      })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url; a.download = `attainment_report.${type === 'excel' ? 'xlsx' : 'pdf'}`
      document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url)
      toast.success(`${type === 'excel' ? 'Excel' : 'PDF'} downloaded`)
    } catch { toast.error('Download failed. Ensure attainment data exists for this course.') }
    type === 'excel' ? setLoadingExcel(false) : setLoadingPdf(false)
  }

  const handleSummary = async () => {
    if (!selected) return toast.error('Select a course first')
    setLoadingSummary(true); setSummary(null)
    try {
      const { data } = await getCourseSummary(selected)
      setSummary(data)
    } catch (err) {
      const detail = err?.response?.data?.detail || ''
      toast.error(detail.includes('No attainment') ? 'No attainment data. Upload marks first.' : 'Summary unavailable.')
    }
    setLoadingSummary(false)
  }

  const loadSemesterAnalytics = async () => {
    setLoadingSem(true)
    try {
      const semGroups = {}
      for (const c of courses) {
        const sem = c.semester || 'Unassigned'
        if (!semGroups[sem]) semGroups[sem] = []
        try {
          const { data } = await getCourseAttainment(c.id)
          const coAvg = data.co_attainment?.length
            ? data.co_attainment.reduce((s, e) => s + e.attainment_pct, 0) / data.co_attainment.length
            : 0
          semGroups[sem].push({ course: c.code, avg: Math.round(coAvg) })
        } catch { /* no data for this course */ }
      }
      const result = Object.entries(semGroups).map(([sem, items]) => ({
        semester: sem,
        avgAttainment: items.length ? Math.round(items.reduce((s, i) => s + i.avg, 0) / items.length) : 0,
        courses: items.length,
      }))
      setSemesterData(result)
    } catch { toast.error('Failed to load semester analytics') }
    setLoadingSem(false)
  }

  return (
    <div>
      <PageHeader title="Reports" subtitle="Export attainment reports and get AI summaries" />

      <div className="mb-6">
        <select value={selected} onChange={e => { setSelected(e.target.value); setSummary(null) }}
          className="border border-violet-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-300 w-72">
          <option value="">Select a course...</option>
          {courses.map(c => <option key={c.id} value={c.id}>{c.name} ({c.code})</option>)}
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card className="p-5 flex flex-col items-center text-center gap-3">
          <div className="w-12 h-12 bg-violet-100 rounded-xl flex items-center justify-center">
            <FileSpreadsheet className="w-6 h-6 text-indigo-700" />
          </div>
          <div>
            <p className="font-semibold text-indigo-900">Excel Report</p>
            <p className="text-xs text-violet-400 mt-0.5">CO, PO, PSO attainment sheets</p>
          </div>
          <button onClick={() => handleDownload('excel')} disabled={loadingExcel}
            className="flex items-center gap-1.5 gradient-btn text-white px-4 py-1.5 rounded-lg text-sm disabled:opacity-50 transition">
            <Download className="w-3.5 h-3.5" />
            {loadingExcel ? 'Downloading...' : 'Download'}
          </button>
        </Card>

        <Card className="p-5 flex flex-col items-center text-center gap-3">
          <div className="w-12 h-12 bg-rose-100 rounded-xl flex items-center justify-center">
            <FileText className="w-6 h-6 text-rose-600" />
          </div>
          <div>
            <p className="font-semibold text-indigo-900">PDF Report</p>
            <p className="text-xs text-violet-400 mt-0.5">Formatted attainment report</p>
          </div>
          <button onClick={() => handleDownload('pdf')} disabled={loadingPdf}
            className="flex items-center gap-1.5 bg-rose-500 text-white px-4 py-1.5 rounded-lg text-sm hover:bg-rose-600 disabled:opacity-50 transition">
            <Download className="w-3.5 h-3.5" />
            {loadingPdf ? 'Downloading...' : 'Download'}
          </button>
        </Card>

        <Card className="p-5 flex flex-col items-center text-center gap-3">
          <div className="w-12 h-12 bg-sky-100 rounded-xl flex items-center justify-center">
            <Sparkles className="w-6 h-6 text-sky-600" />
          </div>
          <div>
            <p className="font-semibold text-indigo-900">AI Summary</p>
            <p className="text-xs text-violet-400 mt-0.5">Natural language analysis</p>
          </div>
          <button onClick={handleSummary} disabled={loadingSummary}
            className="flex items-center gap-1.5 gradient-btn text-white px-4 py-1.5 rounded-lg text-sm disabled:opacity-50 transition">
            <Sparkles className="w-3.5 h-3.5" />
            {loadingSummary ? 'Generating...' : 'Generate'}
          </button>
        </Card>
      </div>

      {summary && (
        <Card className="p-5 mb-6">
          <h2 className="font-semibold text-indigo-800 mb-3">AI Attainment Summary — {summary.course}</h2>
          <p className="text-sm text-indigo-700 leading-relaxed whitespace-pre-wrap">{summary.summary}</p>
        </Card>
      )}

      {/* Semester Analytics */}
      <Card className="p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <BarChart2 className="w-5 h-5 text-indigo-700" />
            <h2 className="font-semibold text-indigo-800">Semester Analytics</h2>
          </div>
          <button onClick={loadSemesterAnalytics} disabled={loadingSem}
            className="gradient-btn text-white px-4 py-1.5 rounded-lg text-sm disabled:opacity-50 transition">
            {loadingSem ? 'Loading...' : 'Load Analytics'}
          </button>
        </div>

        {semesterData.length > 0 ? (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
              {semesterData.map(s => (
                <div key={s.semester} className="bg-violet-50 rounded-xl p-4 text-center">
                  <p className="text-xs text-violet-400 font-medium">{s.semester}</p>
                  <p className="text-2xl font-bold text-indigo-900 mt-1">{s.avgAttainment}%</p>
                  <p className="text-xs text-violet-400 mt-0.5">{s.courses} course{s.courses !== 1 ? 's' : ''}</p>
                </div>
              ))}
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={semesterData} barSize={40}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ede9fe" />
                <XAxis dataKey="semester" tick={{ fontSize: 12 }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} unit="%" />
                <Tooltip formatter={v => `${v}%`} />
                <Bar dataKey="avgAttainment" fill="#6366f1" radius={[4, 4, 0, 0]} name="Avg Attainment" />
              </BarChart>
            </ResponsiveContainer>
          </>
        ) : (
          <p className="text-sm text-violet-400 text-center py-8">
            Click "Load Analytics" to see semester-wise attainment overview.
          </p>
        )}
      </Card>
    </div>
  )
}
