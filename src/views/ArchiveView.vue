<script setup lang="ts">
import { useRouter } from 'vue-router'

const router = useRouter()
</script>

<template>
  <div class="archive-fullscreen">
    <!-- 同学的社团活动资料库（React 应用 build 到 public/archive，同源嵌入）。
         注意用 /archive/index.html 显式路径：Vite dev 对 /archive/ 会走 SPA fallback 返回平台首页。 -->
    <iframe class="archive-frame" src="/archive/index.html" title="社团活动资料库" />

    <!-- 浮动返回按钮（悬浮在 iframe 之上） -->
    <button class="floating-back" @click="router.push('/platform')">← 返回平台</button>
  </div>
</template>

<style scoped>
.archive-fullscreen {
  position: fixed;
  inset: 0;
  background: var(--bg);
}

.archive-frame {
  width: 100%;
  height: 100%;
  border: none;
}

.floating-back {
  position: fixed;
  top: 12px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 300;
  padding: 8px 16px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.92);
  border: 1px solid var(--border);
  box-shadow: 0 2px 10px rgba(31, 36, 48, 0.12);
  font-size: 13px;
  font-weight: 600;
  color: var(--text);
}

.floating-back:hover {
  background: #fff;
  color: var(--primary);
}
</style>
