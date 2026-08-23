<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useWorkspaceBridge } from '../../composables/useWorkspaceBridge'

const route = useRoute()

const { pending, startReflection, postpone } = useWorkspaceBridge()

// 若从工作台草稿卡「继续编辑」进来，带上 ?id=，create.html 会恢复草稿
const frameSrc = computed(() => {
  const id = route.query.id
  return id ? `/ai/create.html?id=${id}` : '/ai/create.html'
})
</script>

<template>
  <div class="create-fullscreen">
    <!-- 同学完整版工作台（AI+club create.html，含 AI 策划助手）：占满整个窗口 -->
    <iframe class="workspace-frame" :src="frameSrc" title="新建活动 · 社团工作台" />

    <!-- 复盘询问弹窗 -->
    <Teleport to="body">
      <div v-if="pending" class="dialog-mask" @click.self="postpone">
        <div class="dialog card">
          <div class="dialog-icon">🎉</div>
          <h2 class="dialog-title">恭喜完成本次活动！</h2>
          <p class="dialog-sub">
            「{{ pending.title }}」已记录
            <template v-if="pending.level">，解锁称号 <b>{{ pending.level.emoji }} {{ pending.level.name }}</b></template>
            <template v-else>，获得「活动完成」徽章</template>
          </p>
          <p class="dialog-hint">做一次轻量复盘，把经验沉淀下来？</p>
          <div class="dialog-actions">
            <button class="btn btn-primary btn-block" @click="startReflection">立即开始</button>
            <button class="btn btn-ghost btn-block" @click="postpone">以后再说</button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
.create-fullscreen {
  position: fixed;
  inset: 0;
  background: var(--bg);
}

.workspace-frame {
  width: 100%;
  height: 100%;
  border: none;
}

/* ---------- 弹窗 ---------- */
.dialog-mask {
  position: fixed;
  inset: 0;
  background: rgba(31, 36, 48, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  z-index: 400;
}

.dialog {
  width: 100%;
  max-width: 380px;
  text-align: center;
  padding: 28px 22px;
  animation: pop-in 0.25s ease;
}

@keyframes pop-in {
  from {
    opacity: 0;
    transform: scale(0.92);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

.dialog-icon {
  font-size: 44px;
}

.dialog-title {
  font-size: 20px;
  margin-top: 10px;
}

.dialog-sub {
  color: var(--text-secondary);
  font-size: 13px;
  margin-top: 6px;
}

.dialog-hint {
  margin-top: 14px;
  color: var(--text-secondary);
  font-size: 14px;
}

.dialog-actions {
  margin-top: 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
</style>
