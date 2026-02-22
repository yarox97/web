import { createRouter, createWebHistory } from 'vue-router'

import { useAuthStore } from '@/stores/authStore'; 

import MainLayout from '@/layouts/MainLayout.vue' 
import LandingView from '../views/landing/LandingView.vue'
import LoginView from '../views/identity/LoginView.vue'
import RegisterView from '../views/identity/RegisterView.vue'
import CockPitView from '../views/notifications/CockPitView.vue'
import ProfileView from '@/views/ProfileView.vue';
import ErrorView from '../views/error-handling/ErrorView.vue'
import ClubsView from '@/views/clubs/ClubsView.vue';
import ClubDetailsView from '@/views/clubs/ClubDetailsView.vue';
import NotificationDetailsView from '@/views/notifications/NotificationDetailsView.vue';
import UserContractsView from '@/modules/contracts/components/UserContracts.vue';
import ContractDetailsView from '@/modules/contracts/components/ContractDetailsView.vue';
import TasksView from '@/views/tasks/TasksView.vue';

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
      component: () => import('@/views/clubs/CreateClubWizard.vue'),
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
          path: '/notifications/:id',
          name: 'NotificationDetails',
          component: NotificationDetailsView
        },
        {
          path: '/app/contracts',
          name: 'contracts',
          component: UserContractsView
        },
        {
          path: '/app/contracts/:id',
          name: 'ContractDetails',
          component: ContractDetailsView
        },
        {
          path: '/app/profile/me',
          name: 'profile',
          component: ProfileView
        },
        {
          path: 'profile/:username', 
          name: 'UserProfile',       
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
        },
        {
          path: 'tasks',
          name: 'Tasks',
          component: TasksView,
          meta: { requiresAuth: true }
        },
        {
          path: '/tasks/:id',
          name: 'TaskDetails',
          component: () => import('@/views/tasks/TaskDetailsView.vue'),
          meta: { requiresAuth: true }
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