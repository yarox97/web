import api from '@/services/api'

export const profileService = {
  async getByUsername(username) {
    const response = await api.get(`/api/user/${username}`);
    return response.data;
  }
}