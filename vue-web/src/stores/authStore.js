import { defineStore } from 'pinia';
import router from '@/router';
import api from '@/services/api'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    isAuthenticated: false,
    user: null,
    isLoading: false
  }),

  getters: {
    userAvatar(state) {
      if (state.user?.avatarUrl) {
        return state.user.avatarUrl;
      }
      
      const firstname = state.user?.firstName || '';
      const lastname = state.user?.lastName || '';
      const fullName = `${firstname} ${lastname}`.trim();
      
      const displayString = fullName || 'User';
      
      return `https://ui-avatars.com/api/?name=${encodeURIComponent(displayString)}&background=0D8ABC&color=fff`;
    }
  },

  actions: {
    async checkAuth() {
      if (this.isLoading) return;

      this.isLoading = true;
      try {
        const response = await api.get('/api/user/me');
        
        this.user = response.data;
        console.log('Authenticated user:', this.user);
        this.isAuthenticated = true;
      } catch (error) {
        this.user = null;
        this.isAuthenticated = false;

        router.push('/login');
      } finally {
        this.isLoading = false;
      }
    },

    async loginSuccess() {
      await this.checkAuth();
    },

    async logout() {
      try {
        await api.post('/api/auth/logout');
      } catch (error) {
        console.error('Error while logging out', error);
      } finally {
        this.checkAuth();
        this.$reset(); 
      }
    }
  }
});