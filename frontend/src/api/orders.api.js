import apiClient from './apiClient'

export const getOrders = async () => {
  const { data } = await apiClient.get('/orders')
  return data
}

export const createOrder = async (payload) => {
  const { data } = await apiClient.post('/orders', payload)
  return data
}
