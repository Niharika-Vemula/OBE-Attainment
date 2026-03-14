import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { Upload, Plus } from 'lucide-react'
import { getCourses, getExams, uploadMarks, getMarksForExam } from '../api'
import PageHeader from '../components/PageHeader'
import Card from '../components/Card'

export default function Marks() {
  const [courses, setCourses] = useState([])
  const [exams, setExams] = useState([])
  const [selectedCourse, setSelectedCourse] = useState('')
  const [selectedExam, setSelectedExam] = useState('')
  const [marks, setMarks] = useState([])
  const [questions, setQuestions] = useState([])
  const [rows, setRows] = useState([{ roll_number: '', name: '' }])

  useEffect(() => { getCourses().then(r => setCourses(r.data)) }, [])

  useEffect(() => {
    if (selectedCourse) getExams(selectedCourse).then(r => setExams(r.data))
  }, [selectedCourse])

  useEffect(() => {
    if (selectedExam) {
      const exam = exams.find(e => e.id === selectedExam)
      if (exam) {
        setQuestions(exam.questions || [])
        setRows([{ roll_number: '', name: '' }])
      }
      getMarksForExam(selectedExam).then(r => setMarks(r.data)).catch(() => setMarks([]))
    }
  }, [selectedExam])

  const updateRow = (i, field, val) => setRows(prev => {
    const r = [...prev]; r[i] = { ...r[i], [field]: val }; return r
  })

  const handleSubmit = async (e) => {
    e.preventDefault()
    const entries = []
    rows.forEach(row => {
      questions.forEach(q => {
        const val = row[q.id]
        if (val !== undefined && val !== '') {
          entries.push({ roll_number: row.roll_number, name: row.name, question_id: q.id, marks_obtained: +val })
        }
      })
    })
    try {
      await uploadMarks({ exam_id: selectedExam, entries })
      toast.success('Marks saved')
      getMarksForExam(selectedExam).then(r => setMarks(r.data))
    } catch { toast.error('Failed to save marks') }
  }

  return (
    <div>
      <PageHeader title="Student Marks" subtitle="Enter or view marks for each exam" />

      <div className="flex gap-3 mb-6">
        <select value={selectedCourse} onChange={e => { setSelectedCourse(e.target.value); setSelectedExam('') }}
          className="border border-violet-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-300 w-64">
          <option value="">Select course...</option>
          {courses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select value={selectedExam} onChange={e => setSelectedExam(e.target.value)} disabled={!selectedCourse}
          className="border border-violet-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-300 w-64 disabled:opacity-50">
          <option value="">Select exam...</option>
          {exams.map(e => <option key={e.id} value={e.id}>{e.name} ({e.exam_type})</option>)}
        </select>
      </div>

      {selectedExam && questions.length > 0 && (
        <Card className="p-5 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-indigo-800">Enter Marks</h2>
            <button onClick={() => setRows(r => [...r, { roll_number: '', name: '' }])}
              className="flex items-center gap-1 text-xs text-indigo-700 hover:text-indigo-900">
              <Plus className="w-3 h-3" /> Add Student
            </button>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs text-violet-400 border-b border-violet-100">
                    <th className="text-left py-2 pr-3">Roll No.</th>
                    <th className="text-left py-2 pr-3">Name</th>
                    {questions.map(q => <th key={q.id} className="text-left py-2 pr-3">{q.question_number} <span className="text-violet-300">/{q.max_marks}</span></th>)}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, i) => (
                    <tr key={i} className="border-b border-slate-50">
                      <td className="py-1.5 pr-3">
                        <input required value={row.roll_number} onChange={e => updateRow(i, 'roll_number', e.target.value)}
                          className="border border-violet-100 rounded px-2 py-1 text-sm w-24 focus:outline-none focus:ring-1 focus:ring-violet-300" />
                      </td>
                      <td className="py-1.5 pr-3">
                        <input value={row.name} onChange={e => updateRow(i, 'name', e.target.value)}
                          className="border border-violet-100 rounded px-2 py-1 text-sm w-32 focus:outline-none focus:ring-1 focus:ring-violet-300" />
                      </td>
                      {questions.map(q => (
                        <td key={q.id} className="py-1.5 pr-3">
                          <input type="number" min="0" max={q.max_marks} value={row[q.id] || ''}
                            onChange={e => updateRow(i, q.id, e.target.value)}
                            className="border border-violet-100 rounded px-2 py-1 text-sm w-16 focus:outline-none focus:ring-1 focus:ring-violet-300" />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <button type="submit" className="mt-4 flex items-center gap-2 gradient-btn text-white px-4 py-2 rounded-lg text-sm font-medium ">
              <Upload className="w-4 h-4" /> Save Marks
            </button>
          </form>
        </Card>
      )}

      {marks.length > 0 && (
        <Card className="p-5">
          <h2 className="font-semibold text-indigo-800 mb-4">Saved Marks</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-violet-400 border-b border-violet-100">
                  <th className="text-left py-2 pr-4">Roll No.</th>
                  <th className="text-left py-2 pr-4">Name</th>
                  {Object.keys(marks[0]?.marks || {}).map(q => <th key={q} className="text-left py-2 pr-4">{q}</th>)}
                </tr>
              </thead>
              <tbody>
                {marks.map((s, i) => (
                  <tr key={i} className="border-b border-slate-50 hover:bg-white/60">
                    <td className="py-2 pr-4 font-medium">{s.roll_number}</td>
                    <td className="py-2 pr-4 text-indigo-700">{s.name}</td>
                    {Object.values(s.marks || {}).map((v, j) => <td key={j} className="py-2 pr-4">{v}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  )
}
