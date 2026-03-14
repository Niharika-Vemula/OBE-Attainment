import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { Plus, BookOpen, Trash2, ChevronRight, User, Star } from 'lucide-react'
import { getCourses, createCourse, deleteCourse } from '../api'
import PageHeader from '../components/PageHeader'
import Card from '../components/Card'

const emptyForm = { name: '', code: '', syllabus: '', credits: '', instructor: '', semester: '' }

export default function Courses() {
  const [courses, setCourses] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [loading, setLoading] = useState(false)

  const load = async () => { const { data } = await getCourses(); setCourses(data) }
  useEffect(() => { load() }, [])

  const handleCreate = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await createCourse({ ...form, credits: form.credits ? +form.credits : null })
      toast.success('Course created')
      setForm(emptyForm)
      setShowForm(false)
      load()
    } catch { toast.error('Failed to create course') }
    setLoading(false)
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this course and all its COs?')) return
    await deleteCourse(id); toast.success('Deleted'); load()
  }

  const f = (field, val) => setForm(prev => ({ ...prev, [field]: val }))

  return (
    <div>
      <PageHeader title="Courses" subtitle="Manage your courses and their outcomes"
        action={
          <button onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 gradient-btn text-white px-4 py-2 rounded-lg text-sm font-medium transition">
            <Plus className="w-4 h-4" /> New Course
          </button>
        } />

      {showForm && (
        <Card className="p-5 mb-6">
          <h2 className="font-semibold text-indigo-800 mb-4">Create Course</h2>
          <form onSubmit={handleCreate} className="grid grid-cols-2 gap-4">
            <input required placeholder="Course Name" value={form.name}
              onChange={e => f('name', e.target.value)}
              className="border border-violet-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-300" />
            <input required placeholder="Course Code (e.g. CS301)" value={form.code}
              onChange={e => f('code', e.target.value)}
              className="border border-violet-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-300" />
            <input placeholder="Instructor Name" value={form.instructor}
              onChange={e => f('instructor', e.target.value)}
              className="border border-violet-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-300" />
            <div className="grid grid-cols-2 gap-3">
              <input type="number" placeholder="Credits" min="1" max="10" value={form.credits}
                onChange={e => f('credits', e.target.value)}
                className="border border-violet-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-300" />
              <input placeholder="Semester (e.g. S3)" value={form.semester}
                onChange={e => f('semester', e.target.value)}
                className="border border-violet-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-300" />
            </div>
            <textarea placeholder="Syllabus (topics covered)" value={form.syllabus}
              onChange={e => f('syllabus', e.target.value)}
              rows={3} className="col-span-2 border border-violet-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-300" />
            <div className="col-span-2 flex gap-2">
              <button type="submit" disabled={loading}
                className="gradient-btn text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50">
                {loading ? 'Creating...' : 'Create'}
              </button>
              <button type="button" onClick={() => setShowForm(false)}
                className="px-4 py-2 rounded-lg text-sm text-indigo-700 hover:bg-violet-50">Cancel</button>
            </div>
          </form>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {courses.map(c => (
          <Card key={c.id} className="p-5 hover:shadow-md transition group">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-violet-100 rounded-lg flex items-center justify-center">
                  <BookOpen className="w-5 h-5 text-indigo-700" />
                </div>
                <div>
                  <p className="font-semibold text-indigo-900 text-sm">{c.name}</p>
                  <p className="text-xs text-violet-400">{c.code}{c.semester ? ` · ${c.semester}` : ''}</p>
                </div>
              </div>
              <button onClick={() => handleDelete(c.id)}
                className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 transition">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
            <div className="mt-3 flex flex-wrap gap-3 text-xs text-violet-500">
              {c.instructor && (
                <span className="flex items-center gap-1"><User className="w-3 h-3" />{c.instructor}</span>
              )}
              {c.credits && (
                <span className="flex items-center gap-1"><Star className="w-3 h-3" />{c.credits} credits</span>
              )}
            </div>
            {c.syllabus && <p className="text-xs text-violet-400 mt-2 line-clamp-2">{c.syllabus}</p>}
            <div className="mt-3 flex items-center justify-between">
              <span className="text-xs text-violet-300">{c.outcomes?.length || 0} COs defined</span>
              <Link to={`/courses/${c.id}`}
                className="flex items-center gap-1 text-xs text-indigo-700 font-medium hover:text-indigo-900">
                View <ChevronRight className="w-3 h-3" />
              </Link>
            </div>
          </Card>
        ))}
        {courses.length === 0 && (
          <div className="col-span-3 text-center py-16 text-violet-300">
            <BookOpen className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p>No courses yet. Create your first course.</p>
          </div>
        )}
      </div>
    </div>
  )
}
