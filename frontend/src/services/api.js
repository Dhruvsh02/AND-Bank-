import axios from 'axios'

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:80'

const api = axios.create({
  baseURL: BASE,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use((config) => {
  const token = sessionStorage.getItem('access_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const orig = err.config
    if (err.response?.status === 401 && !orig._retry) {
      orig._retry = true
      const refresh = sessionStorage.getItem('refresh_token')
      if (!refresh) {
        sessionStorage.clear()
        window.location.href = '/login'
        return Promise.reject(err)
      }
      try {
        const res = await axios.post(`${BASE}/api/auth/token/refresh/`, { refresh })
        sessionStorage.setItem('access_token', res.data.access)
        orig.headers.Authorization = `Bearer ${res.data.access}`
        return api(orig)
      } catch {
        sessionStorage.clear()
        window.location.href = '/login'
      }
    }
    return Promise.reject(err)
  }
)

export default api
