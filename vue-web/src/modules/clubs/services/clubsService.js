import api from '@/services/api'

export const clubsService = {
    async getMyRequests() {
        const response = await api.get('api/joinClubRequests/my');
        return response.data;
    },

    async cancelRequest(requestId) {
        // await api.delete(`/api/joinClubRequests/${requestId}`)
        return true;
    }
}