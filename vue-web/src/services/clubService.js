import api from '@/services/api'

export const clubService = {
    async createClub(payload){
        const response = await api.post('/api/club', payload); 
        return response.data;
    },
}