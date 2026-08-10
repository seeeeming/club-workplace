<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()

// 主页（三卡片）自带顶栏，壳只在子页面（工作台/资料库/手册）显示导航
const isHome = computed(() => route.name === 'platform')
</script>

<template>
  <div class="platform" :class="{ bare: isHome }">
    <!-- 顶栏（主页不渲染，由 PlatformHomeView 自绘） -->
    <header v-if="!isHome" class="topbar">
      <div class="topbar-left">
        <RouterLink to="/platform" class="back-link">‹ 主页</RouterLink>
        <div class="brand">
          <span class="brand-logo">🏫</span>
          <span class="brand-name">社团成长中心</span>
        </div>
      </div>
      <div class="topbar-right">
        <RouterLink to="/growth" class="avatar-btn" title="我的成长">
          <span class="avatar-mini">🧑‍💼</span>
        </RouterLink>
      </div>
    </header>

    <!-- 内容区 -->
    <main class="platform-content">
      <RouterView />
    </main>
  </div>
</template>

<style scoped>
.platform {
  min-height: 100vh;
  background: var(--bg);
}

.topbar {
  position: sticky;
  top: 0;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 28px;
  background: var(--surface);
  border-bottom: 1px solid var(--border);
}

.topbar-left {
  display: flex;
  align-items: center;
  gap: 18px;
}

.back-link {
  font-size: 14px;
  color: var(--text-secondary);
  text-decoration: none;
}

.back-link:hover {
  color: var(--primary);
}

.brand {
  display: flex;
  align-items: center;
  gap: 8px;
}

.brand-logo {
  font-size: 20px;
}

.brand-name {
  font-size: 16px;
  font-weight: 700;
}

.avatar-btn {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: var(--primary-weak);
  display: flex;
  align-items: center;
  justify-content: center;
  text-decoration: none;
}

.avatar-mini {
  font-size: 18px;
}

.platform-content {
  max-width: 1100px;
  margin: 0 auto;
  padding: 24px 28px;
}

/* 主页占满全宽，去掉内容区约束 */
.platform.bare .platform-content {
  max-width: none;
  padding: 0;
}
</style>
