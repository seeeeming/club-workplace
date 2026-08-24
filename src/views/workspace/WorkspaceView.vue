<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useGrowthStore } from '../../stores/growth'
import { useWorkspaceBridge } from '../../composables/useWorkspaceBridge'
import DeleteActivityButton from '../../components/DeleteActivityButton.vue'
import type { Activity, ActivityStatus } from '../../types'

const router = useRouter()
const store = useGrowthStore()

const { pending, startReflection, postpone } = useWorkspaceBridge()

type FilterValue = 'all' | 'draft' | 'inProgress' | 'done'

const currentFilter = ref<FilterValue>('all')

const tabs: Array<{ label: string; value: FilterValue; match: (a: Activity) => boolean }> = [
  { label: '全部', value: 'all', match: () => true },
  { label: '草稿', value: 'draft', match: (a) => a.status === 'draft' },
  { label: '进行中', value: 'inProgress', match: (a) => a.status === 'inProgress' },
  {
    label: '已完成',
    value: 'done',
    match: (a) => a.status === 'pendingReflection' || a.status === 'completed',
  },
]

const statusLabel: Record<ActivityStatus, string> = {
  draft: '草稿',
  inProgress: '进行中',
  pendingReflection: '待复盘',
  completed: '已完成',
}

const filteredActivities = computed(() => {
  const tab = tabs.find((t) => t.value === currentFilter.value)
  if (!tab) return store.activities
  return store.activities.filter(tab.match)
})

const emptyTitle = computed(() => {
  if (currentFilter.value === 'all') return '还没有活动'
  const tab = tabs.find((t) => t.value === currentFilter.value)
  return `没有「${tab?.label ?? ''}」的活动`
})

function countOf(value: FilterValue): number {
  const tab = tabs.find((t) => t.value === value)
  if (!tab) return 0
  return store.activities.filter(tab.match).length
}

function fmtDate(iso?: string): string {
  if (!iso) return ''
  const d = new Date(iso)
  const now = new Date()
  const sameDay = d.toDateString() === now.toDateString()
  if (sameDay) {
    return `今天 ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
  }
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function activityDate(activity: Activity): string {
  const draftLike = activity.status === 'draft' || activity.status === 'inProgress'
  return fmtDate(draftLike ? activity.createdAt : activity.completedAt)
}
</script>

<template>
  <div class="workspace-page">
    <div class="head-row">
      <div>
        <h1 class="page-title">社团工作台</h1>
        <p class="page-subtitle">策划与执行社团活动，走完 6 步流程，完成后做一次复盘</p>
      </div>
      <button class="btn btn-primary new-btn" @click="router.push('/workspace/create')">
        ＋ 新建活动
      </button>
    </div>

    <!-- 分类标签 -->
    <div class="filter-tabs">
      <button
        v-for="tab in tabs"
        :key="tab.value"
        class="filter-tab"
        :class="{ active: currentFilter === tab.value }"
        @click="currentFilter = tab.value"
      >
        {{ tab.label }}
        <span class="filter-count">{{ countOf(tab.value) }}</span>
      </button>
    </div>

    <!-- 活动列表 -->
    <div v-if="filteredActivities.length" class="activity-list">
      <div v-for="activity in filteredActivities" :key="activity.id" class="activity-item card">
        <div class="thumb" :class="{ placeholder: !activity.photo }">
          <img v-if="activity.photo" :src="activity.photo" alt="" />
          <span v-else>🗂️</span>
        </div>
        <div class="activity-info">
          <div class="activity-title">{{ activity.title }}</div>
          <div class="activity-meta">
            <span class="status-pill" :class="`status-${activity.status}`">
              {{ statusLabel[activity.status] }}
            </span>
            <span v-if="activityDate(activity)" class="meta-date">{{ activityDate(activity) }}</span>
          </div>
        </div>
        <div class="activity-action">
          <template v-if="activity.status === 'completed'">
            <span class="badge done-badge">✓ 已复盘</span>
          </template>
          <template v-else-if="activity.status === 'pendingReflection'">
            <button class="btn btn-primary reflect-btn" @click="router.push(`/reflection/${activity.id}`)">
              去复盘 →
            </button>
          </template>
          <template v-else>
            <button
              class="btn edit-btn"
              @click="router.push({ path: '/workspace/create', query: { id: activity.id } })"
            >
              继续编辑 →
            </button>
          </template>
        </div>
        <DeleteActivityButton :activity="activity" />
      </div>
    </div>

    <!-- 空态 -->
    <div v-else class="empty-state card">
      <div class="empty-emoji">🗂️</div>
      <p class="empty-title">{{ emptyTitle }}</p>
      <p class="empty-tip">点击「＋ 新建活动」，开始策划你的第一场社团活动</p>
    </div>

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

/* ---------- 分类标签 ---------- */
.filter-tabs {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 16px;
}

.filter-tab {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 7px 14px;
  border-radius: 999px;
  border: 1px solid var(--border);
  background: var(--surface);
  color: var(--text-secondary);
  font-size: 13px;
  cursor: pointer;
  transition: background 0.15s ease, color 0.15s ease, border-color 0.15s ease;
  user-select: none;
}

.filter-tab:hover {
  border-color: var(--primary);
  color: var(--primary);
}

.filter-tab.active {
  background: var(--primary-weak);
  border-color: var(--primary);
  color: var(--primary);
  font-weight: 600;
}

.filter-count {
  min-width: 18px;
  height: 18px;
  padding: 0 5px;
  border-radius: 999px;
  background: rgba(0, 0, 0, 0.06);
  font-size: 11px;
  line-height: 18px;
  text-align: center;
}

.filter-tab.active .filter-count {
  background: var(--primary);
  color: #fff;
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
  margin-top: 6px;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: var(--text-tertiary);
}

.status-pill {
  padding: 2px 10px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 600;
}

.status-draft {
  background: #fff7ed;
  color: #d97706;
}

.status-inProgress {
  background: var(--primary-weak);
  color: var(--primary);
}

.status-pendingReflection {
  background: #f3e8ff;
  color: #7c3aed;
}

.status-completed {
  background: #e8f7ee;
  color: #15803d;
}

.meta-date {
  white-space: nowrap;
}

.activity-action {
  flex-shrink: 0;
}

.reflect-btn,
.edit-btn {
  padding: 9px 16px;
  font-size: 14px;
}

.edit-btn {
  background: var(--primary-weak);
  color: var(--primary);
}

.edit-btn:hover {
  background: var(--primary);
  color: #fff;
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
