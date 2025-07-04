import { createRouter, createWebHistory } from '@ionic/vue-router';
import { RouteRecordRaw } from 'vue-router';
import TabsPage from '../views/TabsPage.vue'

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
        path: '/manageContent',
        name: 'manageContent',
        component: () => import('@/views/ManageContent.vue')
      },
      {
        path: '/editPlay',
        name: 'editPlay',
        component: () => import('@/views/EditPlay.vue')
      },
      {
        path: '/register',
        name: 'Register',
        component: () => import('@/views/Register.vue') // Verifica que esta ruta sea correcta
      },
      {
        path: '/login',
        name: 'Login',
        component: () => import('@/views/login.vue') // Verifica que esta ruta sea correcta
      }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
})

export default router
