
import axios, { AxiosError } from 'axios'
import { toast } from 'react-toastify'
import { useAuthStore } from '@/store/useAuthStore'
import { signOut } from 'next-auth/react'

const BASE_URL = process.env.NEXT_PUBLIC_LARAVEL_API_URL || 'http://localhost:8001/api'
console.log('[HttpClient] Initializing with BASE_URL:', BASE_URL)

export const httpClient = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
})

// Request Interceptor: Attach Token
httpClient.interceptors.request.use(
  (config) => {
    console.log(`[API Request] ${config.method?.toUpperCase()} ${config.url}`, {
        params: config.params,
        data: config.data,
    })
    if (typeof window !== 'undefined') {
      const { token } = useAuthStore.getState()
      
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`
        // console.log('[HttpClient] Attaching token from AuthStore') 
      }
    }
    return config
  },
  (error) => {
    console.error('[API Request Error]', error)
    return Promise.reject(error)
  }
)

// Response Interceptor: Error Handling
httpClient.interceptors.response.use(
  (response) => {
    console.log(`[API Response] ${response.status} ${response.config.url}`, response.data)
    return response
  },
  (error: AxiosError) => {
    console.error(`[API Response Error] ${error.response?.status} ${error.config?.url}`, error.response?.data || error.message)
    const status = error.response?.status
    const data: any = error.response?.data
    const message = data?.message || data?.error || error.message || 'Something went wrong'

    if (status === 401) {
        console.warn('[HttpClient] Unauthorized access (401), redirecting to login...')
        if (typeof window !== 'undefined') {
            const currentOrigin = window.location.origin;
            console.log(`[HttpClient] Signing out manually to: ${currentOrigin}`);
            
            // Force manual redirect to avoid NextAuth default 3000
            signOut({ redirect: false }).then(() => {
                window.location.href = currentOrigin;
            });
        }
    }

    return Promise.reject({
        status,
        message,
        details: data
    })
  }
)
