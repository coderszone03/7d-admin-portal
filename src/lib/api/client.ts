import axios from 'axios'
import { getCookie } from '../utils/cookies'
import { AUTH_COOKIE_KEY } from '../../features/auth/constants'

const resolveBaseURL = () => {
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL as string
  }
  // In dev, hit the Vite proxy so the browser sees same-origin and CORS is bypassed.
  if (import.meta.env.DEV) {
    return ''
  }
  return 'https://7ddesign-backend.maverickz.online'
}

const client = axios.create({
  baseURL: resolveBaseURL(),
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
})

client.interceptors.request.use(
  async (config) => {
    const raw = getCookie(AUTH_COOKIE_KEY)

    if (raw) {
      try {
        const parsed = JSON.parse(raw) as { token?: string }

        if (parsed.token) {
          const headers = (config.headers ?? {}) as Record<string, unknown>
          headers.Authorization = `Bearer ${parsed.token}`
          config.headers = headers as any
        }
      } catch {
        // Ignore malformed cookie data.
      }
    }

    return config
  },
  (error) => Promise.reject(error),
)

client.interceptors.response.use(
  (response) => response,
  (error) => {
    // Central place to handle API errors/logging.
    return Promise.reject(error)
  },
)

export default client
