import axios from 'axios'

export const TOKEN_STORAGE_KEY = 'zap_token'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? '/api',
  headers: {
    'Content-Type': 'application/json',
  },
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_STORAGE_KEY)
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

export const saveAuthToken = (token) => {
  localStorage.setItem(TOKEN_STORAGE_KEY, token)
}

export const clearAuthToken = () => {
  localStorage.removeItem(TOKEN_STORAGE_KEY)
}

export const hasAuthToken = () => {
  return Boolean(localStorage.getItem(TOKEN_STORAGE_KEY))
}

export const loginRequest = async (email, password) => {
  const response = await api.post('/user/login', { email, password })
  return response.data
}

export const signupRequest = async (email, password) => {
  const response = await api.post('/user/signup', { email, password })
  return response.data
}

export const getCurrentUserRequest = async () => {
  const response = await api.get('/user')
  return response.data
}

export const createLinkRequest = async (url, slug) => {
  const cleanedUrl = url.trim()
  const cleanedSlug = slug?.trim()
  const response = await api.post('/link/create', {
    title: cleanedUrl,
    url: cleanedUrl,
    slug: cleanedSlug || undefined,
  })
  return response.data
}

export const getLinksRequest = async () => {
  const response = await api.get('/link')
  return response.data
}

export const updateLinkRequest = async (slug, url) => {
  const response = await api.post('/link/update', {
    slug: slug.trim().toLowerCase(),
    url: url.trim(),
  })
  return response.data
}

export const deleteLinkRequest = async (slug) => {
  const response = await api.delete('/link', {
    data: { slug: slug.trim().toLowerCase() },
  })
  return response.data
}

export const resolveShortLinkRequest = async (slug) => {
  const response = await api.get(`/link/resolve/${slug}`)
  return response.data
}

export const getApiErrorMessage = (error) => {
  if (!axios.isAxiosError(error)) {
    return 'Something went wrong'
  }

  const responseData = error.response?.data
  if (responseData && typeof responseData === 'object' && typeof responseData.message === 'string') {
    return responseData.message
  }

  return 'Request failed'
}