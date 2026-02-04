import axios from 'axios'

// Determine the base URL based on environment
const baseURL = import.meta.env.DEV ? '/api' : '/api'

const apiClient = axios.create({
  baseURL,
  withCredentials: true,
  timeout: 15000
})

// 👉 Request interceptor
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// 👉 Response interceptor
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default apiClient
