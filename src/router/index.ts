// src/router/index.ts
import { createRouter, createWebHistory } from '@ionic/vue-router'
import { RouteRecordRaw } from 'vue-router'

const routes: Array<RouteRecordRaw> = [
  {
    path: '/',
    redirect: '/login'
  },
  {
    path: '/login',
    component: () => import('../views/Login.vue')
  },
  {
    path: '/ajout',
    component: () => import('../views/Ajout.vue')
  },
  {
    path: '/tabs',
    component: () => import('../views/LayoutTabs.vue'),
    children: [
      {
        path: '',
        redirect: '/tabs/home'
      },
      {
        path: 'home',
        component: () => import('../views/Home.vue')
      },
      {
        path: 'reparations',
        component: () => import('../views/Reparations.vue')
      },
      {
        path: 'historique',
        component: () => import('../views/Historique.vue')
      }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
})

export default router