import apiClient from './apiClient'

export const getProducts = async () => {
  const { data } = await apiClient.get('/products')
  return data
}

export const createProduct = async (payload) => {
  const { data } = await apiClient.post('/products', payload)
  return data
}
