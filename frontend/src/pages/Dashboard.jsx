import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { BookOpen, ClipboardList, Users, BarChart2, ChevronRight, TrendingUp } from 'lucide-react'
import { getCourses, getStudents, getPOs, getPSOs } from '../api'
import Card from '../components/Card'

export default function Dashboard() {
  const [stats, setStats] = useState({ courses: 0, students: 0, pos: 0, psos: 0 })
  const [courses, setCourses] = useState([])

  useEffect(() => {
    Promise.all([getCourses(), getStudents(), getPOs(), getPSOs()]).then(
      ([c, s, po, pso]) => {
        setCourses(c.data.slice(0, 4))
        setStats({ courses: c.data.length, students: s.data.length, pos: po.data.length, psos: pso.data.length })
      }
    )
  }, [])

  const statCards = [
    { label: 'Courses', value: stats.courses, icon: BookOpen, color: 'bg-violet-100 text-indigo-700', to: '/courses' },
    { label: 'Students', value: stats.students, icon: Users, color: 'bg-sky-100 text-sky-600', to: '/marks' },
    { label: 'Program Outcomes', value: stats.pos, icon: BarChart2, color: 'bg-sky-100 text-sky-600', to: '/outcomes' },
    { label: 'PSOs', value: stats.psos, icon: TrendingUp, color: 'bg-violet-100 text-violet-700', to: '/outcomes' },
  ]

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-indigo-900">Dashboard</h1>
        <p className="text-violet-400 text-sm mt-1">Welcome to the OBE Attainment System</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
        {statCards.map(({ label, value, icon: Icon, color, to }) => (
          <Link to={to} key={label}>
            <Card className="p-5 hover:shadow-md transition cursor-pointer">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-violet-400 font-medium">{label}</p>
                  <p className="text-3xl font-bold text-indigo-900 mt-1">{value}</p>
                </div>
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${color}`}>
                  <Icon className="w-5 h-5" />
                </div>
              </div>
            </Card>
          </Link>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {[
          { to: '/courses', label: 'Manage Courses', desc: 'Create courses and define COs', icon: BookOpen, bg: 'bg-violet-100', text: 'text-indigo-700' },
          { to: '/exams', label: 'Configure Exams', desc: 'Set up exams and map questions', icon: ClipboardList, bg: 'bg-sky-100', text: 'text-sky-600' },
          { to: '/attainment', label: 'View Attainment', desc: 'Analyze CO/PO/PSO attainment', icon: BarChart2, bg: 'bg-violet-100', text: 'text-violet-700' },
        ].map(({ to, label, desc, icon: Icon, bg, text }) => (
          <Link to={to} key={to}>
            <Card className="p-5 hover:shadow-md transition group">
              <div className={`w-10 h-10 rounded-lg ${bg} flex items-center justify-center mb-3`}>
                <Icon className={`w-5 h-5 ${text}`} />
              </div>
              <p className="font-semibold text-indigo-900 text-sm">{label}</p>
              <p className="text-xs text-violet-400 mt-0.5">{desc}</p>
              <div className={`flex items-center gap-1 text-xs ${text} font-medium mt-3 group-hover:gap-2 transition-all`}>
                Go <ChevronRight className="w-3 h-3" />
              </div>
            </Card>
          </Link>
        ))}
      </div>

      {/* Recent Courses */}
      {courses.length > 0 && (
        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-indigo-800">Recent Courses</h2>
            <Link to="/courses" className="text-xs text-indigo-700 hover:text-indigo-900 font-medium">View all</Link>
          </div>
          <div className="space-y-3">
            {courses.map(c => (
              <Link to={`/courses/${c.id}`} key={c.id}
                className="flex items-center justify-between p-3 rounded-lg hover:bg-white/60 transition group">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-violet-100 rounded-lg flex items-center justify-center">
                    <BookOpen className="w-4 h-4 text-indigo-700" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-indigo-900">{c.name}</p>
                    <p className="text-xs text-violet-400">{c.code} · {c.outcomes?.length || 0} COs</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-violet-300 group-hover:text-violet-400 transition" />
              </Link>
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}
