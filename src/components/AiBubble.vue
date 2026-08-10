<script setup lang="ts">
// AI 引导气泡：仅展示 AI 的话，输入交互由外层流程页面负责
</script>

<template>
  <div class="chat-bubble ai">
    <div class="bubble-header">
      <span class="ai-badge">AI</span>
      <span class="role">复盘引导助手</span>
    </div>
    <div class="bubble-content">
      <slot />
    </div>
  </div>
</template>

<style scoped>
.chat-bubble {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.bubble-header {
  display: flex;
  align-items: center;
  gap: 6px;
}

.ai-badge {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--primary), #8b5cf6);
  color: #fff;
  font-size: 10px;
  font-weight: 700;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.role {
  font-size: 12px;
  color: var(--text-tertiary);
}

.bubble-content {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 14px;
  border-top-left-radius: 4px;
  padding: 14px 16px;
  font-size: 15px;
  line-height: 1.6;
  color: var(--text);
  white-space: pre-wrap;
}
</style>
