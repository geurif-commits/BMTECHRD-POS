import api from '../stores/api';

export async function getBusinessConfig(businessId: string) {
  try {
    const { data } = await api.get(`/business/${businessId}/config`);
    return data.data;
  } catch (err) {
    console.error('Error loading business config:', err);
    return null;
  }
}
