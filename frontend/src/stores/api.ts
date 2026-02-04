import axios from 'axios';
import { useStore } from '../stores/useStore';

const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    // Solo desloguear si el error es 401 y NO es una petición de login
    if (error.response?.status === 401 && error.config?.url !== '/auth/login') {
      // Token expirado
      localStorage.removeItem('token');
      const { setUser } = useStore.getState();
      setUser(null);
      window.location.href = '/login';
    }
    
    if (error.response?.data?.code === 'LICENSE_EXPIRED') {
      // Mostrar modal de licencia expirada
      const { setUser } = useStore.getState();
      localStorage.removeItem('token');
      setUser(null);
      window.location.href = '/license-expired';
    }
    
    return Promise.reject(error);
  }
);

export default api;
