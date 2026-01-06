import { createRouter, createWebHistory } from 'vue-router'

import { useAuthStore } from '@/stores/authStore'; 

import MainLayout from '@/layouts/MainLayout.vue' 
import LandingView from '../views/LandingView.vue'
import LoginView from '../views/identity/LoginView.vue'
import RegisterView from '../views/identity/RegisterView.vue'
import CockPitView from '../views/CockPitView.vue'
import ProfileView from '@/views/ProfileView.vue';
import ErrorView from '../views/error-handling/ErrorView.vue'
import ClubsView from '@/views/clubs/ClubsView.vue';
import ClubDetailsView from '@/views/clubs/ClubDetailsView.vue';

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'landing',
      component: LandingView
    },
    {
      path: '/login',
      name: 'login',
      component: LoginView
    },
    {
      path: '/register',
      name: 'register',
      component: RegisterView
    },
    {
      path: '/error/:code?', // :code? значит параметр необязателен
      name: 'error',
      component: ErrorView,
    },
    {
      path: '/app/clubs/create',
      name: 'CreateClub',
      component: () => import('@/views/CreateClubWizard.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/app',
      component: MainLayout,
      children: [
        {
          path: 'cockpit', 
          name: 'cockpit',
          component: CockPitView
        },
        {
          path: 'profile',
          name: 'profile',
          component: ProfileView
        },
        {
          path: 'clubs',
          name: 'clubs',
          component: ClubsView
        },
        {
          path: '/app/club/:id',
          name: 'ClubDetails',
          component: ClubDetailsView
        }
      ]
    },
    {
      path: '/:pathMatch(.*)*',
      component: ErrorView
    }
  ]
})

router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore();

  if (to.path.startsWith('/app')) {
    
    if (!authStore.isAuthenticated) {
      await authStore.checkAuth();
    }

    if (!authStore.isAuthenticated) {
      next({ name: 'login' });
    } else {
      next();
    }
    
  } else {
    next();
  }
});

export default router