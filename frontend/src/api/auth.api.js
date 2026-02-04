import apiClient from './apiClient'

export const login = async (credentials) => {
  const { data } = await apiClient.post('/auth/login', credentials)
  return data
}

export const logout = async () => {
  const { data } = await apiClient.post('/auth/logout')
  return data
}

export const getProfile = async () => {
  const { data } = await apiClient.get('/auth/me')
  return data
}
