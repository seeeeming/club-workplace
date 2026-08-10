<script setup lang="ts">
// 社长手册：平台三大功能之一（占位，由负责该模块的同学开发）
</script>

<template>
  <div>
    <h1 class="page-title">社长手册</h1>
    <p class="page-subtitle">历届社长留下的社团运营指南与经验汇编</p>

    <div class="placeholder-card card">
      <div class="placeholder-emoji">📖</div>
      <p>社长手册模块</p>
      <p class="placeholder-tip">本模块由负责的同学开发中，此处为占位</p>
    </div>
  </div>
</template>

<style scoped>
.page-title {
  font-size: 24px;
  font-weight: 700;
}

.page-subtitle {
  margin: 6px 0 16px;
  color: var(--text-secondary);
  font-size: 14px;
}

.placeholder-card {
  text-align: center;
  padding: 48px 20px;
}

.placeholder-emoji {
  font-size: 48px;
}

.placeholder-card p:not(.placeholder-tip) {
  font-weight: 700;
  margin-top: 10px;
}

.placeholder-tip {
  margin-top: 6px;
  font-size: 13px;
  color: var(--text-secondary);
}
</style>
