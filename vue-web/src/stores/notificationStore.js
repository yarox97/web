import { defineStore } from 'pinia';
import api from '@/services/api';

export const useNotificationStore = defineStore('notification', {
  state: () => ({
    unreadCount: 0
  }),
  actions: {
        setUnreadCount(count) {
        this.unreadCount = count;
        },
        decrementUnread() {
        if (this.unreadCount > 0) this.unreadCount--;
        },

        async fetchUnreadCount() {
        try {
            const response = await api.get('/api/notification/user/notifications', {
                params: { 
                    pageNumber: 1, 
                    pageSize: 100,
                }
            });
            const items = response.data.items || [];

            const unreadCount = items.filter(n => n.isChecked === false).length;

            this.unreadCount = unreadCount;

        } catch (error) {
            console.error('Error extracting notifications:', error);
        };
        }
        }      
})


