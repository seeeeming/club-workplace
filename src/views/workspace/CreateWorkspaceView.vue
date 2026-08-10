<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useWorkspaceBridge } from '../../composables/useWorkspaceBridge'

const router = useRouter()

const { pending, startReflection, postpone } = useWorkspaceBridge()
</script>

<template>
  <div class="create-fullscreen">
    <!-- 同学工作台：占满整个窗口 -->
    <iframe class="workspace-frame" src="/workspace.html" title="新建活动 · 社团工作台" />

    <!-- 浮动返回按钮（悬浮在 iframe 之上） -->
    <button class="floating-back" @click="router.push('/platform/workspace')">← 返回工作台</button>

    <!-- 复盘询问弹窗 -->
    <Teleport to="body">
      <div v-if="pending" class="dialog-mask" @click.self="postpone">
        <div class="dialog card">
          <div class="dialog-icon">🎉</div>
          <h2 class="dialog-title">恭喜完成本次活动！</h2>
          <p class="dialog-sub">「{{ pending.title }}」已记录，获得「活动完成」徽章</p>
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
