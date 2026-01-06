import { ref } from 'vue';
import { clubsService } from '@/modules/clubs/services/clubsService';

export function useMyJoinRequests() {
    const myRequests = ref([]);
    const loadingRequests = ref(false);
    const error = ref(null);

    const fetchMyRequests = async () => {
        loadingRequests.value = true;
        error.value = null;
        try {
            const data = await clubsService.getMyRequests();

            myRequests.value = data.map(req => ({
                id: req.id,
                clubId: req.clubId,
                clubName: req.clubName,
                status: req.joinClubRequestStatus, 
                createdAt: req.createdAt
            }));
        } catch (e) {
            console.error('Error fetching requests', e);
            error.value = 'Failed to load requests';
        } finally {
            loadingRequests.value = false;
        }
    };

    const cancelRequest = async (id) => {
        if(!confirm('Cancel this request?')) return;
        
        try {
            await clubsService.cancelRequest(id);
            myRequests.value = myRequests.value.filter(r => r.id !== id);
        } catch (e) {
            console.error(e);
        }
    };

    return {
        myRequests,
        loadingRequests,
        fetchMyRequests,
        cancelRequest
    };
}