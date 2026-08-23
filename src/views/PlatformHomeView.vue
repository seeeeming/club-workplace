<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useGrowthStore } from '../stores/growth'

const router = useRouter()
const store = useGrowthStore()

const entries = [
  {
    name: '社团工作台',
    path: '/platform/workspace',
    icon: '🗂️',
    desc: '策划与执行社团活动，走完 6 步流程，沉淀每次活动的复盘经验',
  },
  {
    name: '社团资料库',
    path: '/archive',
    icon: '📚',
    desc: '活动档案、资料检索、上传归档，以及历次复盘的 Reflection 沉淀',
  },
  {
    name: '社长手册',
    path: '/platform/handbook',
    icon: '📖',
    desc: '社团运营指南与换届交接手册，新社长快速上手的入口',
  },
]

function logout() {
  store.logout()
  router.replace('/login')
}
</script>

<template>
  <div class="home">
    <!-- 顶部导航 -->
    <header class="topbar">
      <div class="brand">
        <span class="brand-logo">🏫</span>
        <span class="brand-name">社团成长中心</span>
      </div>
      <div class="topbar-right">
        <span class="welcome">你好，{{ store.user?.name }} 👋</span>
        <RouterLink to="/growth" class="avatar-btn" title="我的成长">
          <span class="avatar-mini">🧑‍💼</span>
        </RouterLink>
        <button class="logout-btn" @click="logout">退出</button>
      </div>
    </header>

    <!-- 主体：三卡片 -->
    <main class="home-main">
      <div class="home-head">
        <h1 class="home-title">欢迎回来</h1>
        <p class="home-sub">选择一个功能开始今天的工作</p>
      </div>

      <div class="entry-grid">
        <button
          v-for="entry in entries"
          :key="entry.name"
          class="entry-card"
          @click="router.push(entry.path)"
        >
          <div class="entry-icon">{{ entry.icon }}</div>
          <div class="entry-name">{{ entry.name }}</div>
          <p class="entry-desc">{{ entry.desc }}</p>
          <div class="entry-cta">进入 {{ entry.name }} →</div>
        </button>
      </div>
    </main>
  </div>
</template>

<style scoped>
.home {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: linear-gradient(160deg, #eef1ff 0%, #f6f8fc 100%);
}

/* ---------- 顶部导航 ---------- */
.topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 28px;
  background: var(--surface);
  border-bottom: 1px solid var(--border);
}

.brand {
  display: flex;
  align-items: center;
  gap: 8px;
}

.brand-logo {
  font-size: 22px;
}

.brand-name {
  font-size: 17px;
  font-weight: 700;
}

.topbar-right {
  display: flex;
  align-items: center;
  gap: 14px;
}

.welcome {
  font-size: 14px;
  color: var(--text-secondary);
}

.avatar-btn {
  width: 38px;
  height: 38px;
  border-radius: 50%;
  background: var(--primary-weak);
  display: flex;
  align-items: center;
  justify-content: center;
  text-decoration: none;
}

.avatar-mini {
  font-size: 19px;
}

.logout-btn {
  background: none;
  color: var(--text-secondary);
  font-size: 13px;
  padding: 6px 10px;
}

.logout-btn:hover {
  color: var(--danger);
}

/* ---------- 主体 ---------- */
.home-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 28px;
}

.home-head {
  text-align: center;
  margin-bottom: 32px;
}

.home-title {
  font-size: 28px;
  font-weight: 700;
}

.home-sub {
  margin-top: 8px;
  font-size: 15px;
  color: var(--text-secondary);
}

.entry-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
  width: 100%;
  max-width: 1080px;
}

.entry-card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 20px;
  padding: 32px 26px;
  text-align: left;
  display: flex;
  flex-direction: column;
  gap: 8px;
  box-shadow: var(--shadow);
  transition: transform 0.12s ease, box-shadow 0.2s ease;
}

.entry-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 10px 28px rgba(31, 36, 48, 0.1);
}

.entry-card:hover .entry-cta {
  background: var(--primary);
  color: #fff;
}

.entry-icon {
  font-size: 44px;
}

.entry-name {
  font-size: 19px;
  font-weight: 700;
  margin-top: 6px;
}

.entry-desc {
  font-size: 13px;
  color: var(--text-secondary);
  line-height: 1.7;
  flex: 1;
}

.entry-cta {
  margin-top: 10px;
  padding: 10px 0;
  text-align: center;
  border-radius: 12px;
  background: var(--primary-weak);
  color: var(--primary);
  font-size: 14px;
  font-weight: 600;
  transition: background 0.2s ease, color 0.2s ease;
}
</style>
