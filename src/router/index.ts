import { createRouter, createWebHistory } from '@ionic/vue-router';
import { RouteRecordRaw } from 'vue-router';
import TabsPage from '../views/TabsPage.vue';

const routes: Array<RouteRecordRaw> = [
  {
    path: '/',
    redirect: '/tabs/Principal'
  },
  {
    path: '/tabs/',
    component: TabsPage,
    children: [
      {
        path: '',
        redirect: '/tabs/tab1'
      },
      {
        path: 'tab2',
        component: () => import('@/views/InfoPlay.vue')
      },
      {
        path: 'tab3',
        component: () => import('@/views/InfoUser.vue')
      },
      {
        path: 'tab4',
        component: () => import('@/views/InfoFavourites.vue')
      },
      {
        path: 'tab5',
        component: () => import('@/views/CreatePlay.vue')
      },
      {
        path: 'Principal',
        component: () => import('@/views/Principal.vue')
      },
      {
        path: '/register',
        name: 'Register',
        component: () => import('@/views/Register.vue') // Verifica que esta ruta sea correcta
      },
      {
        path: 'tab-movies',
        component: () => import('@/views/MoviesPage.vue') // Verifica que esta ruta sea correcta
      }
    ]
  }
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
});

export default router;
