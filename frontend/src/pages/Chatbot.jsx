import { useEffect, useRef, useState } from 'react'
import { Send, Bot, User } from 'lucide-react'
import { getCourses, sendChat } from '../api'
import PageHeader from '../components/PageHeader'

export default function Chatbot() {
  const [courses, setCourses] = useState([])
  const [selectedCourse, setSelectedCourse] = useState('')
  const [messages, setMessages] = useState([
    { role: 'bot', text: 'Hi! I\'m your OBE assistant. Ask me anything about CO-PO-PSO mappings, attainment levels, Bloom\'s Taxonomy, or student performance.' }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef(null)

  useEffect(() => { getCourses().then(r => setCourses(r.data)) }, [])
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  const send = async (e) => {
    e.preventDefault()
    if (!input.trim()) return
    const userMsg = input.trim()
    setInput('')
    setMessages(m => [...m, { role: 'user', text: userMsg }])
    setLoading(true)
    try {
      const { data } = await sendChat({ message: userMsg, course_id: selectedCourse || null })
      setMessages(m => [...m, { role: 'bot', text: data.reply }])
    } catch {
      setMessages(m => [...m, { role: 'bot', text: 'Sorry, I couldn\'t process that. Make sure the OpenAI API key is configured.' }])
    }
    setLoading(false)
  }

  const suggestions = [
    'What is Bloom\'s Taxonomy?',
    'How is CO attainment calculated?',
    'What is the difference between PO and PSO?',
    'Explain Level 2 attainment',
  ]

  return (
    <div className="flex flex-col h-[calc(100vh-6rem)]">
      <PageHeader title="AI Chatbot" subtitle="Ask questions about OBE, attainment, and course outcomes" />

      <div className="mb-4">
        <select value={selectedCourse} onChange={e => setSelectedCourse(e.target.value)}
          className="border border-violet-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-300 w-72">
          <option value="">No course context (general questions)</option>
          {courses.map(c => <option key={c.id} value={c.id}>{c.name} ({c.code})</option>)}
        </select>
      </div>

      <div className="flex-1 bg-white rounded-xl border border-violet-100 shadow-sm flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((m, i) => (
            <div key={i} className={`flex gap-3 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0
                ${m.role === 'bot' ? 'bg-violet-100' : 'bg-violet-100'}`}>
                {m.role === 'bot' ? <Bot className="w-4 h-4 text-indigo-700" /> : <User className="w-4 h-4 text-indigo-700" />}
              </div>
              <div className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed
                ${m.role === 'bot' ? 'bg-violet-50 text-indigo-900 rounded-tl-sm' : 'text-white rounded-tr-sm'}`}
                style={m.role === 'user' ? { background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' } : {}}>
                {m.text}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-violet-100 flex items-center justify-center">
                <Bot className="w-4 h-4 text-indigo-700" />
              </div>
              <div className="bg-violet-50 px-4 py-3 rounded-2xl rounded-tl-sm">
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {messages.length === 1 && (
          <div className="px-4 pb-2 flex flex-wrap gap-2">
            {suggestions.map(s => (
              <button key={s} onClick={() => setInput(s)}
                className="text-xs bg-violet-100 text-indigo-800 px-3 py-1.5 rounded-full hover:bg-violet-100 transition">
                {s}
              </button>
            ))}
          </div>
        )}

        <form onSubmit={send} className="p-3 border-t border-violet-100 flex gap-2">
          <input value={input} onChange={e => setInput(e.target.value)}
            placeholder="Ask about OBE, attainment, Bloom's Taxonomy..."
            className="flex-1 border border-violet-100 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-300" />
          <button type="submit" disabled={loading || !input.trim()}
            className="text-white p-2.5 rounded-xl hover:bg-violet-100 gradient-btn disabled:opacity-50 transition">
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  )
}
