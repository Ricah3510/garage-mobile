// src/router/index.ts
import { createRouter, createWebHistory } from '@ionic/vue-router'
import Home from '../views/Home.vue'
import Login from '../views/Login.vue'


const routes = [
  {
    path: '/',
    redirect: '/login'
  },
  {
    path: '/login',
    component: Login
  },
  {
    path: '/home',
    component: Home
  }
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
})

export default router