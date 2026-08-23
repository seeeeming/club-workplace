<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useGrowthStore } from '../../stores/growth'
import { useWorkspaceBridge } from '../../composables/useWorkspaceBridge'
import DeleteActivityButton from '../../components/DeleteActivityButton.vue'

const router = useRouter()
const store = useGrowthStore()

const { pending, startReflection, postpone } = useWorkspaceBridge()

// ---------- 未完成草稿（工作台内保存到 localStorage.editActivity） ----------
const DRAFT_KEY = 'editActivity'
const draft = ref<{ id: string; title: string } | null>(null)

onMounted(() => {
  try {
    const raw = localStorage.getItem(DRAFT_KEY)
    if (raw) {
      const d = JSON.parse(raw)
      if (d && d.id) draft.value = { id: d.id, title: d.title || '' }
    }
  } catch {
    /* 解析失败则当作没有草稿 */
  }
})

function continueDraft() {
  if (!draft.value) return
  router.push({ path: '/workspace/create', query: { id: draft.value.id } })
}

function discardDraft() {
  localStorage.removeItem(DRAFT_KEY)
  draft.value = null
}

function fmtDate(iso: string): string {
  const d = new Date(iso)
  const now = new Date()
  const sameDay = d.toDateString() === now.toDateString()
  if (sameDay) {
    return `今天 ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
  }
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
</script>

<template>
  <div class="workspace-page">
    <div class="head-row">
      <div>
        <h1 class="page-title">社团工作台</h1>
        <p class="page-subtitle">策划与执行社团活动，草稿自动保存，完成后可复盘</p>
      </div>
      <button class="btn btn-primary new-btn" @click="router.push('/workspace/create')">
        ＋ 新建活动
      </button>
    </div>

    <!-- 状态统计 -->
    <div class="stats-row">
      <span class="stat-item">
        <span class="stat-dot in-progress"></span>进行中 <strong>{{ draft ? 1 : 0 }}</strong>
      </span>
      <span class="stat-item">
        <span class="stat-dot done"></span>已完成 <strong>{{ store.activities.length }}</strong>
      </span>
    </div>

    <!-- 正在进行（草稿） -->
    <div class="section">
      <div class="section-title">📝 正在进行</div>
      <div v-if="draft" class="draft-card card">
        <div class="draft-info">
          <div class="draft-emoji">📝</div>
          <div class="draft-text">
            <div class="draft-title">{{ draft.title || '未命名活动' }}</div>
            <div class="draft-sub">
              <span class="badge draft-badge">草稿</span>
              <span class="draft-note">上次编辑到一半，点「继续编辑」接着写</span>
            </div>
          </div>
        </div>
        <div class="draft-actions">
          <button class="btn btn-primary draft-continue" @click="continueDraft">继续编辑 →</button>
          <button class="btn btn-ghost" @click="discardDraft">丢弃</button>
        </div>
      </div>
      <div v-else class="section-empty">还没有正在进行的活动</div>
    </div>

    <!-- 已完成 -->
    <div class="section">
      <div class="section-title">✅ 已完成</div>
      <div v-if="store.activities.length" class="activity-list">
        <div v-for="activity in store.activities" :key="activity.id" class="activity-item card">
          <div class="thumb" :class="{ placeholder: !activity.photo }">
            <img v-if="activity.photo" :src="activity.photo" alt="" />
            <span v-else>🗂️</span>
          </div>
          <div class="activity-info">
            <div class="activity-title">{{ activity.title }}</div>
            <div class="activity-meta">{{ fmtDate(activity.completedAt) }} · 活动完成</div>
          </div>
          <div class="activity-action">
            <template v-if="activity.reflected">
              <span class="badge done-badge">✓ 已复盘</span>
            </template>
            <template v-else>
              <button class="btn btn-primary reflect-btn" @click="router.push(`/reflection/${activity.id}`)">
                去复盘 →
              </button>
            </template>
          </div>
          <DeleteActivityButton :activity="activity" />
        </div>
      </div>
      <div v-else class="empty-state card">
        <div class="empty-emoji">🗂️</div>
        <p class="empty-title">还没有已完成的活动</p>
        <p class="empty-tip">点击「＋ 新建活动」，开始策划你的第一场社团活动</p>
      </div>
    </div>

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
.head-row {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 20px;
}

.page-title {
  font-size: 24px;
  font-weight: 700;
}

.page-subtitle {
  margin-top: 6px;
  color: var(--text-secondary);
  font-size: 14px;
}

.new-btn {
  flex-shrink: 0;
  padding: 12px 24px;
}

/* ---------- 状态统计 ---------- */
.stats-row {
  display: flex;
  gap: 24px;
  margin-bottom: 18px;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: var(--text-secondary);
}

.stat-item strong {
  color: var(--text);
  font-size: 16px;
}

.stat-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
}

.stat-dot.in-progress {
  background: #f59e0b;
}

.stat-dot.done {
  background: #10b981;
}

/* ---------- 分区 ---------- */
.section {
  margin-bottom: 22px;
}

.section-title {
  font-size: 15px;
  font-weight: 700;
  color: var(--text);
  margin-bottom: 10px;
}

.section-empty {
  padding: 22px 18px;
  border: 1px dashed var(--border);
  border-radius: 12px;
  color: var(--text-tertiary);
  font-size: 13px;
  text-align: center;
}

/* ---------- 草稿卡 ---------- */
.draft-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 14px 18px;
  margin-bottom: 14px;
  border: 2px dashed var(--primary-light);
  background: #fbfcff;
}

.draft-info {
  display: flex;
  align-items: center;
  gap: 14px;
  min-width: 0;
}

.draft-emoji {
  font-size: 26px;
}

.draft-text {
  min-width: 0;
}

.draft-title {
  font-size: 15px;
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.draft-sub {
  margin-top: 3px;
  font-size: 12px;
  color: var(--text-tertiary);
}

.draft-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.draft-continue {
  padding: 8px 16px;
  font-size: 14px;
}

.draft-note {
  margin-left: 6px;
  font-size: 12px;
  color: var(--text-tertiary);
}

.draft-badge {
  background: #fff7ed;
  color: #b45309;
}

/* ---------- 活动列表 ---------- */
.activity-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.activity-item {
  position: relative;
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 14px 18px;
}

.thumb {
  width: 64px;
  height: 64px;
  border-radius: 12px;
  overflow: hidden;
  flex-shrink: 0;
  background: var(--primary-weak);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
}

.thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.activity-info {
  flex: 1;
  min-width: 0;
}

.activity-title {
  font-size: 16px;
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.activity-meta {
  margin-top: 4px;
  font-size: 13px;
  color: var(--text-tertiary);
}

.activity-action {
  flex-shrink: 0;
}

.reflect-btn {
  padding: 9px 16px;
  font-size: 14px;
}

.badge {
  display: inline-flex;
  align-items: center;
  padding: 6px 14px;
  border-radius: 999px;
  font-size: 13px;
  font-weight: 600;
}

.done-badge {
  background: #e8f7ee;
  color: #15803d;
}

/* ---------- 空态 ---------- */
.empty-state {
  text-align: center;
  padding: 48px 20px;
}

.empty-emoji {
  font-size: 44px;
}

.empty-title {
  font-size: 17px;
  font-weight: 700;
  margin-top: 12px;
}

.empty-tip {
  margin-top: 6px;
  font-size: 13px;
  color: var(--text-secondary);
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
