import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { Plus, Trash2, Zap, ChevronDown, ChevronUp } from 'lucide-react'
import { getCourses, getExams, createExam, deleteExam, mapQuestions } from '../api'
import PageHeader from '../components/PageHeader'
import Card from '../components/Card'
import Badge from '../components/Badge'

const EXAM_TYPES = ['T1','T2','T3','T4','T5','Summative']

export default function Exams() {
  const [courses, setCourses] = useState([])
  const [selectedCourse, setSelectedCourse] = useState('')
  const [exams, setExams] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [expanded, setExpanded] = useState(null)
  const [form, setForm] = useState({ name: '', exam_type: 'T1', questions: [{ question_number: 'Q1', text: '', max_marks: 10 }] })

  useEffect(() => { getCourses().then(r => setCourses(r.data)) }, [])

  useEffect(() => {
    if (selectedCourse) getExams(selectedCourse).then(r => setExams(r.data))
    else setExams([])
  }, [selectedCourse])

  const addQuestion = () => setForm(f => ({
    ...f, questions: [...f.questions, { question_number: `Q${f.questions.length + 1}`, text: '', max_marks: 10 }]
  }))

  const updateQ = (i, field, val) => setForm(f => {
    const qs = [...f.questions]; qs[i] = { ...qs[i], [field]: val }; return { ...f, questions: qs }
  })

  const handleCreate = async (e) => {
    e.preventDefault()
    try {
      await createExam({ ...form, course_id: selectedCourse })
      toast.success('Exam created')
      setShowForm(false)
      setForm({ name: '', exam_type: 'T1', questions: [{ question_number: 'Q1', text: '', max_marks: 10 }] })
      getExams(selectedCourse).then(r => setExams(r.data))
    } catch { toast.error('Failed to create exam') }
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this exam?')) return
    await deleteExam(id); toast.success('Deleted')
    getExams(selectedCourse).then(r => setExams(r.data))
  }

  const handleAutoMap = async (examId) => {
    try {
      await mapQuestions({ exam_id: examId })
      toast.success('Questions mapped to COs by AI')
    } catch { toast.error('Mapping failed. Ensure COs exist for this course.') }
  }

  return (
    <div>
      <PageHeader title="Exams" subtitle="Configure exams and map questions to COs"
        action={selectedCourse && (
          <button onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 gradient-btn text-white px-4 py-2 rounded-lg text-sm font-medium ">
            <Plus className="w-4 h-4" /> New Exam
          </button>
        )} />

      <div className="mb-6">
        <select value={selectedCourse} onChange={e => setSelectedCourse(e.target.value)}
          className="border border-violet-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-300 w-72">
          <option value="">Select a course...</option>
          {courses.map(c => <option key={c.id} value={c.id}>{c.name} ({c.code})</option>)}
        </select>
      </div>

      {showForm && (
        <Card className="p-5 mb-6">
          <h2 className="font-semibold text-indigo-800 mb-4">Create Exam</h2>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <input required placeholder="Exam Name" value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                className="border border-violet-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-300" />
              <select value={form.exam_type} onChange={e => setForm({ ...form, exam_type: e.target.value })}
                className="border border-violet-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-300">
                {EXAM_TYPES.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-indigo-800">Questions</p>
                <button type="button" onClick={addQuestion} className="text-xs text-indigo-700 hover:text-indigo-900">+ Add Question</button>
              </div>
              <div className="space-y-2">
                {form.questions.map((q, i) => (
                  <div key={i} className="grid grid-cols-12 gap-2 items-center">
                    <input value={q.question_number} onChange={e => updateQ(i, 'question_number', e.target.value)}
                      className="col-span-2 border border-violet-100 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-300" />
                    <input placeholder="Question text (optional)" value={q.text} onChange={e => updateQ(i, 'text', e.target.value)}
                      className="col-span-8 border border-violet-100 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-300" />
                    <input type="number" value={q.max_marks} onChange={e => updateQ(i, 'max_marks', +e.target.value)}
                      className="col-span-2 border border-violet-100 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-300" />
                  </div>
                ))}
              </div>
            </div>
            <div className="flex gap-2">
              <button type="submit" className="gradient-btn text-white px-4 py-2 rounded-lg text-sm font-medium ">Create</button>
              <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 rounded-lg text-sm text-indigo-700 hover:bg-violet-50">Cancel</button>
            </div>
          </form>
        </Card>
      )}

      <div className="space-y-3">
        {exams.map(exam => (
          <Card key={exam.id} className="overflow-hidden">
            <div className="p-4 flex items-center justify-between cursor-pointer" onClick={() => setExpanded(expanded === exam.id ? null : exam.id)}>
              <div className="flex items-center gap-3">
                <Badge label={exam.exam_type} color="blue" />
                <div>
                  <p className="font-medium text-indigo-900 text-sm">{exam.name}</p>
                  <p className="text-xs text-violet-400">{exam.questions?.length || 0} questions · {exam.total_marks} marks</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={e => { e.stopPropagation(); handleAutoMap(exam.id) }}
                  className="flex items-center gap-1 text-xs bg-teal-100 text-teal-700 px-2.5 py-1 rounded-lg hover:bg-teal-200">
                  <Zap className="w-3 h-3" /> AI Map
                </button>
                <button onClick={e => { e.stopPropagation(); handleDelete(exam.id) }} className="text-red-400 hover:text-red-600">
                  <Trash2 className="w-4 h-4" />
                </button>
                {expanded === exam.id ? <ChevronUp className="w-4 h-4 text-violet-300" /> : <ChevronDown className="w-4 h-4 text-violet-300" />}
              </div>
            </div>
            {expanded === exam.id && (
              <div className="border-t border-violet-100 px-4 py-3">
                <table className="w-full text-sm">
                  <thead><tr className="text-xs text-violet-400 border-b border-violet-100">
                    <th className="text-left py-1.5">Question</th>
                    <th className="text-left py-1.5">Text</th>
                    <th className="text-left py-1.5">Marks</th>
                    <th className="text-left py-1.5">CO</th>
                    <th className="text-left py-1.5">BT Level</th>
                  </tr></thead>
                  <tbody>
                    {exam.questions?.map(q => (
                      <tr key={q.id} className="border-b border-slate-50">
                        <td className="py-1.5 font-medium">{q.question_number}</td>
                        <td className="py-1.5 text-violet-400 max-w-xs truncate">{q.text || '—'}</td>
                        <td className="py-1.5">{q.max_marks}</td>
                        <td className="py-1.5">{q.co_id ? <Badge label="Mapped" color="green" /> : <Badge label="Unmapped" color="slate" />}</td>
                        <td className="py-1.5">{q.bloom_level || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        ))}
        {selectedCourse && exams.length === 0 && (
          <div className="text-center py-12 text-violet-300">No exams yet for this course.</div>
        )}
      </div>
    </div>
  )
}
