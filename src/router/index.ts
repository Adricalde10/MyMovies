import { createRouter, createWebHashHistory } from '@ionic/vue-router'; // <-- CAMBIO AQUÍ
import { RouteRecordRaw } from 'vue-router';
import TabsPage from '../views/TabsPage.vue';

const routes: Array<RouteRecordRaw> = [
  {
    path: '/',
    redirect: '/Principal'
  },
  {
    path: '/tabs/',
    component: TabsPage,
    children: [
      {
        path: '',
        redirect: '/Principal'
      },
      {
        path: '/Principal',
        name: 'Principal',
        component: () => import('@/views/Principal.vue')
      },
      {
        path: '/infoPlay',
        name: 'infoPlay',
        component: () => import('@/views/InfoPlay.vue')
      },
      {
        path: '/infoUser',
        name: 'infoUser',
        component: () => import('@/views/InfoUser.vue')
      },
      {
        path: '/editplay',
        name: 'editplay',
        component: () => import('@/views/EditPlay.vue')
      },
      {
        path: '/infoFavourites',
        name: 'infoFavourites',
        component: () => import('@/views/InfoFavourites.vue')
      },
      {
        path: '/createPlay',
        name: 'createPlay',
        component: () => import('@/views/CreatePlay.vue')
      },
      {
        path: '/register',
        name: 'Register',
        component: () => import('@/views/Register.vue')
      },
      {
        path: '/login',
        name: 'Login',
        component: () => import('@/views/Login.vue')
      },
      {
        path: '/MoviesPage',
        name: 'MoviesPage',
        component: () => import('@/views/MoviesPage.vue')
      },
      {
        path: '/ManageContent',
        name: 'ManageContent',
        component: () => import('@/views/ManageContent.vue')
      },
    ]
  }
];

const router = createRouter({
  history: createWebHashHistory(), // <-- USAR HASH MODE PARA ANDROID
  routes
});

export default router;
  
