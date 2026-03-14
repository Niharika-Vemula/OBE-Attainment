import axios from 'axios'
import toast from 'react-hot-toast'

const api = axios.create({
  baseURL: '/api',
  timeout: 15000,
})

// Global error interceptor — shows toast only for network/timeout errors.
// 4xx/5xx are handled by individual callers.
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.code === 'ECONNABORTED') {
      toast.error('Request timed out — is the backend running?')
    } else if (!err.response) {
      toast.error('Cannot reach backend. Start uvicorn on port 8000.')
    }
    return Promise.reject(err)
  }
)

// ── Health ────────────────────────────────────────────────────────────────────
export const checkHealth = () => api.get('/health')

// ── Courses ───────────────────────────────────────────────────────────────────
export const getCourses   = ()         => api.get('/courses/')
export const getCourse    = (id)       => api.get(`/courses/${id}`)
export const createCourse = (data)     => api.post('/courses/', data)
export const updateCourse = (id, data) => api.put(`/courses/${id}`, data)
export const deleteCourse = (id)       => api.delete(`/courses/${id}`)

// ── Program Outcomes ──────────────────────────────────────────────────────────
export const getPOs          = ()     => api.get('/courses/pos/all')
export const getPSOs         = ()     => api.get('/courses/psos/all')
export const createPO        = (data) => api.post('/courses/pos/', data)
export const createPSO       = (data) => api.post('/courses/psos/', data)
export const createPOsBulk   = (data) => api.post('/courses/pos/bulk', data)
export const createPSOsBulk  = (data) => api.post('/courses/psos/bulk', data)

// ── Course Outcomes ───────────────────────────────────────────────────────────
export const getCOs        = (courseId)       => api.get(`/courses/${courseId}/cos`)
export const createCOsBulk = (courseId, data) => api.post(`/courses/${courseId}/cos/bulk`, data)
export const generateCOs   = (courseId, data) => api.post(`/courses/${courseId}/generate-cos`, data)
export const deleteCO      = (courseId, coId) => api.delete(`/courses/${courseId}/cos/${coId}`)

// ── Exams ─────────────────────────────────────────────────────────────────────
export const getExams     = (courseId) => api.get(`/exams/course/${courseId}`)
export const getExam      = (id)       => api.get(`/exams/${id}`)
export const createExam   = (data)     => api.post('/exams/', data)
export const deleteExam   = (id)       => api.delete(`/exams/${id}`)
export const mapQuestions = (data)     => api.post('/exams/map-questions', data)

// ── Marks ─────────────────────────────────────────────────────────────────────
export const getStudents     = ()       => api.get('/marks/students/')
export const uploadMarks     = (data)   => api.post('/marks/upload', data)
export const getMarksForExam = (examId) => api.get(`/marks/exam/${examId}`)

// ── Attainment ────────────────────────────────────────────────────────────────
export const getCOAttainment     = (examId)   => api.get(`/attainment/exam/${examId}/co`)
export const getCourseAttainment = (courseId) => api.get(`/attainment/course/${courseId}`)

// ── Reports ───────────────────────────────────────────────────────────────────
export const downloadExcel    = (courseId) => api.get(`/reports/course/${courseId}/excel`, { responseType: 'blob' })
export const downloadPDF      = (courseId) => api.get(`/reports/course/${courseId}/pdf`,   { responseType: 'blob' })
export const getCourseSummary = (courseId) => api.get(`/chatbot/summary/${courseId}`)

// ── Chatbot ───────────────────────────────────────────────────────────────────
export const sendChat = (data) => api.post('/chatbot/chat', data)

// ── Admin ─────────────────────────────────────────────────────────────────────
export const getAdminStats    = ()           => api.get('/admin/stats')
export const getUsers         = (role)       => api.get('/admin/users', { params: role ? { role } : {} })
export const createUser       = (data)       => api.post('/admin/users', data)
export const updateUser       = (id, data)   => api.put(`/admin/users/${id}`, data)
export const deleteUser       = (id)         => api.delete(`/admin/users/${id}`)
export const toggleUserActive = (id)         => api.patch(`/admin/users/${id}/toggle-active`)
export const getSettings      = ()           => api.get('/admin/settings')
export const updateSetting    = (key, data)  => api.put(`/admin/settings/${key}`, data)
export const seedSettings     = ()           => api.post('/admin/settings/seed-defaults')
export const getCoPOWeights   = (courseId)   => api.get(`/admin/co-po-weights/${courseId}`)
export const updateCOWeights  = (coId, data) => api.put(`/admin/co-po-weights/${coId}`, data)

export default api
