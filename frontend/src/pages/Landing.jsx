import { Link } from 'react-router-dom'
import { GraduationCap, BarChart2, Brain, FileText, Target, Users, ChevronRight, Sparkles } from 'lucide-react'

const features = [
  { icon: Target, title: 'CO-PO-PSO Mapping', desc: 'Automatically map Course Outcomes to Program Outcomes and Program Specific Outcomes.' },
  { icon: BarChart2, title: 'Attainment Analytics', desc: 'Calculate and visualize attainment levels with interactive charts and dashboards.' },
  { icon: Brain, title: 'AI-Powered Insights', desc: 'Generate COs from syllabus, auto-map questions, and get natural language summaries.' },
  { icon: FileText, title: 'Report Generation', desc: 'Export detailed Excel and PDF reports for accreditation and review.' },
  { icon: Users, title: 'Student Marks', desc: 'Enter and manage student marks per exam question with CO-level tracking.' },
  { icon: Sparkles, title: 'Smart Chatbot', desc: 'Ask questions about attainment, Bloom\'s Taxonomy, and OBE concepts.' },
]

const steps = [
  { step: '01', title: 'Set Up Courses', desc: 'Create courses, add syllabus, credits, and instructor details.' },
  { step: '02', title: 'Define Outcomes', desc: 'Add POs, PSOs, and let AI generate COs from your syllabus.' },
  { step: '03', title: 'Configure Exams', desc: 'Create exams, add questions, and map them to COs using AI.' },
  { step: '04', title: 'Enter Marks', desc: 'Upload student marks per question for each exam.' },
  { step: '05', title: 'View Attainment', desc: 'Instantly see CO, PO, and PSO attainment with charts.' },
  { step: '06', title: 'Export Reports', desc: 'Download Excel/PDF reports or get AI-generated summaries.' },
]

export default function Landing() {
  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, #e8f0fe 0%, #f3e8ff 50%, #fce7f3 100%)' }}>
      {/* Navbar */}
      <nav className="flex items-center justify-between px-8 py-4 max-w-6xl mx-auto">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #6366f1, #a855f7)' }}>
            <GraduationCap className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-indigo-900 text-lg">OBE Attainment</span>
        </div>
        <Link to="/login"
          className="gradient-btn text-white px-5 py-2 rounded-xl text-sm font-medium">
          Login
        </Link>
      </nav>

      {/* Hero */}
      <section className="text-center px-6 pt-16 pb-20 max-w-4xl mx-auto">
        <div className="inline-flex items-center gap-2 bg-white/70 border border-violet-200 rounded-full px-4 py-1.5 text-xs text-indigo-700 font-medium mb-6">
          <Sparkles className="w-3.5 h-3.5 text-violet-500" /> AI-Powered Outcome Based Education
        </div>
        <h1 className="text-5xl font-bold text-indigo-900 leading-tight mb-5">
          Measure What<br />
          <span style={{ background: 'linear-gradient(135deg, #6366f1, #a855f7)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Students Actually Learn
          </span>
        </h1>
        <p className="text-lg text-indigo-700/70 max-w-2xl mx-auto mb-8 leading-relaxed">
          A complete platform for CO-PO-PSO attainment tracking, AI-generated course outcomes,
          and accreditation-ready reports — built for modern educators.
        </p>
        <div className="flex items-center justify-center gap-3">
          <Link to="/login"
            className="gradient-btn text-white px-7 py-3 rounded-xl font-semibold text-sm flex items-center gap-2">
            Get Started <ChevronRight className="w-4 h-4" />
          </Link>
          <Link to="/dashboard"
            className="bg-white/80 border border-violet-200 text-indigo-800 px-7 py-3 rounded-xl font-semibold text-sm hover:bg-white transition">
            View Dashboard
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="px-6 pb-20 max-w-6xl mx-auto">
        <h2 className="text-2xl font-bold text-indigo-900 text-center mb-10">Everything you need for OBE</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {features.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="glass-card rounded-2xl p-6 hover:shadow-lg transition">
              <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-4"
                style={{ background: 'linear-gradient(135deg, #ede9fe, #fce7f3)' }}>
                <Icon className="w-5 h-5 text-indigo-700" />
              </div>
              <h3 className="font-semibold text-indigo-900 mb-1.5">{title}</h3>
              <p className="text-sm text-indigo-700/60 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="px-6 pb-24 max-w-5xl mx-auto">
        <h2 className="text-2xl font-bold text-indigo-900 text-center mb-10">How it works</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {steps.map(({ step, title, desc }) => (
            <div key={step} className="glass-card rounded-2xl p-5 flex gap-4">
              <span className="text-3xl font-black text-violet-200 leading-none flex-shrink-0">{step}</span>
              <div>
                <h3 className="font-semibold text-indigo-900 mb-1">{title}</h3>
                <p className="text-sm text-indigo-700/60 leading-relaxed">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="text-center pb-8 text-xs text-indigo-400">
        OBE Attainment System · Outcome Based Education Platform
      </footer>
    </div>
  )
}
