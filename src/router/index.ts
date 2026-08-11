import { createRouter, createWebHistory } from 'vue-router'
import { useGrowthStore } from '../stores/growth'

const routes = [
  { path: '/', redirect: '/platform' },
  { path: '/login', name: 'login', component: () => import('../views/LoginView.vue') },
  {
    path: '/platform',
    component: () => import('../views/PlatformLayout.vue'),
    children: [
      // 主页三卡片
      { path: '', name: 'platform', component: () => import('../views/PlatformHomeView.vue') },
      {
        path: 'workspace',
        name: 'workspace',
        component: () => import('../views/workspace/WorkspaceView.vue'),
      },
      {
        path: 'handbook',
        name: 'handbook',
        component: () => import('../views/HandbookView.vue'),
      },
      {
        // 旧的资料库路由：现由同学的全屏资料库承接（/archive）
        path: 'kb',
        redirect: '/archive',
      },
    ],
  },
  {
    // 社团活动资料库（同学 React 应用全屏嵌入 public/archive）
    path: '/archive',
    name: 'archive',
    component: () => import('../views/ArchiveView.vue'),
  },
  {
    // 全屏新建活动流程（独立于平台壳，占满整个窗口）
    path: '/workspace/create',
    name: 'workspace-create',
    component: () => import('../views/workspace/CreateWorkspaceView.vue'),
  },
  {
    path: '/reflection/:activityId',
    name: 'reflection',
    component: () => import('../views/ReflectionView.vue'),
  },
  { path: '/growth', name: 'growth', component: () => import('../views/GrowthProfileView.vue') },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

/** 登录守卫：进入平台前必须已登录 */
const PUBLIC_ROUTES = ['login']

router.beforeEach((to) => {
  const store = useGrowthStore()
  const isPublic = PUBLIC_ROUTES.some((name) => to.name === name)

  if (!isPublic && !store.isLoggedIn) {
    return { name: 'login', query: { redirect: to.fullPath } }
  }
  if (to.name === 'login' && store.isLoggedIn) {
    return { name: 'platform' }
  }
  return true
})

export default router
