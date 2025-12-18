import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'
import ChatView from '@/views/ChatView.vue'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'chat',
    component: ChatView,
  },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})

export default router
