<script setup lang="ts">
import { ref } from 'vue'
import { useGrowthStore } from '../stores/growth'

const props = defineProps<{ activity: { id: string; title: string } }>()

const store = useGrowthStore()
const showConfirm = ref(false)

function confirmDelete() {
  store.deleteActivity(props.activity.id)
  showConfirm.value = false
}
</script>

<template>
  <button class="delete-btn" title="删除活动" @click="showConfirm = true">🗑</button>

  <Teleport to="body">
    <div v-if="showConfirm" class="dialog-mask" @click.self="showConfirm = false">
      <div class="dialog card">
        <div class="dialog-icon">🗑</div>
        <h2 class="dialog-title">删除活动？</h2>
        <p class="dialog-sub">「{{ activity.title }}」删除后将无法恢复。</p>
        <div class="dialog-actions">
          <button class="btn btn-danger btn-block" @click="confirmDelete">删除</button>
          <button class="btn btn-ghost btn-block" @click="showConfirm = false">保留</button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.delete-btn {
  position: absolute;
  right: 10px;
  bottom: 8px;
  background: transparent;
  color: var(--text-tertiary);
  font-size: 15px;
  line-height: 1;
  padding: 4px 6px;
  border-radius: 8px;
  transition: color 0.15s ease, background 0.15s ease;
}

.delete-btn:hover {
  color: var(--danger);
  background: #fef2f2;
}

.btn-danger {
  background: var(--danger);
  color: #fff;
}

/* 弹窗（自包含，不依赖工作台页面的 scoped 样式） */
.dialog-mask {
  position: fixed;
  inset: 0;
  background: rgba(31, 36, 48, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  z-index: 200;
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

.dialog-actions {
  margin-top: 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
</style>
