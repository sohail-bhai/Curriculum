/**
 * Axios API client with JWT token refresh interceptor.
 * All API calls go through this client.
 */
import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios'
import Cookies from 'js-cookie'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'

let isRefreshing = false
let refreshSubscribers: Array<(token: string) => void> = []

function subscribeTokenRefresh(cb: (token: string) => void) {
  refreshSubscribers.push(cb)
}

function onRefreshed(token: string) {
  refreshSubscribers.forEach(cb => cb(token))
  refreshSubscribers = []
}

const api: AxiosInstance = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000,
})

// Request interceptor — attach access token
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = Cookies.get('access_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Response interceptor — handle 401 with token refresh
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean }

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true
      const refreshToken = Cookies.get('refresh_token')

      if (!refreshToken) {
        // No refresh token — force logout
        Cookies.remove('access_token')
        Cookies.remove('refresh_token')
        window.location.href = '/auth/login'
        return Promise.reject(error)
      }

      if (isRefreshing) {
        // Queue request until token is refreshed
        return new Promise((resolve) => {
          subscribeTokenRefresh((token: string) => {
            originalRequest.headers.Authorization = `Bearer ${token}`
            resolve(api(originalRequest))
          })
        })
      }

      isRefreshing = true

      try {
        const response = await axios.post(`${API_BASE}/auth/refresh/`, {
          refresh: refreshToken,
        })
        const newAccessToken = response.data.access
        Cookies.set('access_token', newAccessToken, { expires: 1 / 3 }) // 8 hours
        onRefreshed(newAccessToken)
        isRefreshing = false
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`
        return api(originalRequest)
      } catch (refreshError) {
        isRefreshing = false
        Cookies.remove('access_token')
        Cookies.remove('refresh_token')
        window.location.href = '/auth/login'
        return Promise.reject(refreshError)
      }
    }

    return Promise.reject(error)
  }
)

export default api

// ── Typed API helpers ─────────────────────────────────────────────

export const authAPI = {
  login: (email: string, password: string) =>
    api.post('/auth/login/', { email, password }),
  logout: (refresh: string) =>
    api.post('/auth/logout/', { refresh }),
  me: () => api.get('/auth/me/'),
  updateMe: (data: object) => api.patch('/auth/me/', data),
  changePassword: (data: object) => api.put('/auth/change-password/', data),
  facultyList: (departmentId?: number) =>
    api.get('/auth/faculty/', { params: { department: departmentId } }),
}

export const subjectsAPI = {
  // HOD
  hodList: () => api.get('/subjects/hod/'),
  hodCreate: (data: object) => api.post('/subjects/hod/', data),
  hodDetail: (id: number) => api.get(`/subjects/hod/${id}/`),
  hodUpdate: (id: number, data: object) => api.patch(`/subjects/hod/${id}/`, data),
  hodDelete: (id: number) => api.delete(`/subjects/hod/${id}/`),
  hodReassign: (id: number, facultyId: number) =>
    api.post(`/subjects/hod/${id}/reassign/`, { faculty_id: facultyId }),
  hodApprove: (id: number, comments?: string) =>
    api.post(`/subjects/hod/${id}/approve/`, { comments }),
  hodRequestRevision: (id: number, comments: string) =>
    api.post(`/subjects/hod/${id}/request-revision/`, { comments }),

  // Faculty
  facultyList: (statusFilter?: string) =>
    api.get('/subjects/faculty/', { params: { status: statusFilter } }),
  facultyDetail: (id: number) => api.get(`/subjects/faculty/${id}/`),

  // Module saves
  saveModule: (id: number, module: number, data: object) =>
    api.post(`/subjects/${id}/module/${module}/`, data),
  getModuleData: (id: number, module: number) =>
    api.get(`/subjects/${id}/module/${module}/data/`),

  // Workflow
  submit: (id: number) => api.post(`/subjects/${id}/submit/`),
  retract: (id: number) => api.post(`/subjects/${id}/retract/`),

  // Full data
  full: (id: number) => api.get(`/subjects/${id}/full/`),

  // Document
  downloadPDF: (id: number) =>
    api.get(`/subjects/${id}/document/`, { responseType: 'blob' }),
  generatePDFAsync: (id: number) =>
    api.post(`/subjects/${id}/document/async/`),
}

export const coreAPI = {
  departments: () => api.get('/departments/'),
  programmes: (departmentId?: number) =>
    api.get('/programmes/', { params: { department: departmentId } }),
  curriculumVersions: (programmeId?: number) =>
    api.get('/curriculum-versions/', { params: { programme: programmeId } }),
}

export const workflowAPI = {
  history: (subjectId: number) => api.get(`/subjects/${subjectId}/history/`),
  comments: (subjectId: number) => api.get(`/subjects/${subjectId}/comments/`),
  addComment: (subjectId: number, data: object) =>
    api.post(`/subjects/${subjectId}/comments/`, data),
}
