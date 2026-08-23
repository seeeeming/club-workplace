<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useGrowthStore } from '../stores/growth'
import { ACTIVITY_LEVELS, getLevel, GROWTH_LEVELS } from '../data/growth'

const store = useGrowthStore()
const router = useRouter()

// ---------- 真实成长数据 ----------
const stats = computed(() => store.stats)

// Reflection 等级进度
const reflectionProgressPct = computed(() => {
  const next = store.nextLevel
  if (!next) return 100
  return Math.min(100, Math.round((stats.value.reflections / next.count) * 100))
})

// 活动称号进度
const activityProgressPct = computed(() => {
  const next = store.nextActivityLevel
  if (!next) return 100
  return Math.min(100, Math.round((stats.value.completedActivities / next.count) * 100))
})

// ---------- 等级演示工具（不影响真实数据） ----------
const demoCount = computed(() => store.demoReflections)
const demoLevel = computed(() => getLevel(demoCount.value))

function fmtDate(iso: string): string {
  const d = new Date(iso)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
</script>

<template>
  <div>
    <div class="head-row">
      <button class="btn btn-ghost back-btn" @click="router.push('/platform/workspace')">← 返回平台</button>
      <button class="btn btn-ghost" @click="store.logout">退出登录</button>
    </div>

    <h1 class="page-title">我的成长</h1>
    <p class="page-subtitle">记录你在社团中的每一次成长与贡献</p>

    <!-- 当前称号（醒目展示） -->
    <div class="profile-card card">
      <div class="avatar-row">
        <div class="avatar">🧑‍💼</div>
        <div class="profile-info">
          <div class="nickname">{{ store.user?.name }}</div>

          <!-- Reflection 等级 -->
          <div class="rank-block">
            <div class="rank-line">
              <span class="rank-emoji">{{ store.currentLevel?.emoji ?? '🌱' }}</span>
              <span class="rank-name">{{ store.currentLevel?.name ?? '尚未获得 Reflection 等级' }}</span>
              <span class="rank-track">Reflection 等级</span>
            </div>
            <template v-if="store.nextLevel">
              <div class="rank-bar">
                <div class="rank-bar-fill" :style="{ width: reflectionProgressPct + '%' }"></div>
              </div>
              <div class="rank-progress-text">
                {{ stats.reflections }} / {{ store.nextLevel.count }} 次 · 还差
                {{ store.nextLevel.count - stats.reflections }} 次到 {{ store.nextLevel.emoji }} {{ store.nextLevel.name }}
              </div>
            </template>
            <div v-else class="rank-progress-text">已满级 ⭐ 感谢你的每一次记录</div>
          </div>

          <!-- 活动称号 -->
          <div class="rank-block">
            <div class="rank-line">
              <span class="rank-emoji">{{ store.activityLevel?.emoji ?? '🏅' }}</span>
              <span class="rank-name">{{ store.activityLevel?.name ?? '尚未完成活动' }}</span>
              <span class="rank-track">活动称号</span>
            </div>
            <template v-if="store.nextActivityLevel">
              <div class="rank-bar">
                <div class="rank-bar-fill" :style="{ width: activityProgressPct + '%' }"></div>
              </div>
              <div class="rank-progress-text">
                {{ stats.completedActivities }} / {{ store.nextActivityLevel.count }} 场 · 还差
                {{ store.nextActivityLevel.count - stats.completedActivities }} 场到 {{ store.nextActivityLevel.emoji }} {{ store.nextActivityLevel.name }}
              </div>
            </template>
            <div v-else class="rank-progress-text">已满级 👑 社团的中流砥柱</div>
          </div>
        </div>
      </div>
    </div>

    <!-- 称号墙 -->
    <div class="badge-wall card">
      <p class="section-title">🏆 称号墙</p>
      <div class="track-block">
        <div class="track-label">📚 Reflection 等级</div>
        <div class="badge-row">
          <div
            v-for="l in GROWTH_LEVELS"
            :key="l.count"
            class="badge-cell"
            :class="{ locked: stats.reflections < l.count }"
          >
            <div class="badge-emoji">{{ l.emoji }}</div>
            <div class="badge-name">{{ l.name }}</div>
            <div class="badge-state">{{ stats.reflections >= l.count ? '已获得' : `需 ${l.count} 次` }}</div>
          </div>
        </div>
      </div>
      <div class="track-block">
        <div class="track-label">🎪 活动称号</div>
        <div class="badge-row">
          <div
            v-for="l in ACTIVITY_LEVELS"
            :key="l.count"
            class="badge-cell"
            :class="{ locked: stats.completedActivities < l.count }"
          >
            <div class="badge-emoji">{{ l.emoji }}</div>
            <div class="badge-name">{{ l.name }}</div>
            <div class="badge-state">{{ stats.completedActivities >= l.count ? '已获得' : `需 ${l.count} 场` }}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- 成长数据 -->
    <div class="stat-grid">
      <div class="stat-card card">
        <div class="stat-emoji">🌿</div>
        <div class="stat-num">{{ stats.reflections }}</div>
        <div class="stat-label">已完成 Reflection</div>
      </div>
      <div class="stat-card card">
        <div class="stat-emoji">📚</div>
        <div class="stat-num">{{ stats.experiences }}</div>
        <div class="stat-label">已贡献经验</div>
      </div>
      <div class="stat-card card">
        <div class="stat-emoji">⚠️</div>
        <div class="stat-num">{{ stats.risks }}</div>
        <div class="stat-label">已新增风险提醒</div>
      </div>
      <div class="stat-card card">
        <div class="stat-emoji">🎯</div>
        <div class="stat-num">{{ stats.completedActivities }}</div>
        <div class="stat-label">已完成活动</div>
      </div>
    </div>

    <p class="growth-note">
      这里展示的不是「完成了多少任务」，而是你在社团中的成长与贡献。经验从属于你，也逐渐沉淀为整个社团的知识资产。
    </p>

    <!-- 历史 Reflection 记录 -->
    <div class="history-section">
      <p class="section-title">我的 Reflection 记录</p>
      <div v-if="store.reflections.length" class="history-list">
        <div v-for="r in [...store.reflections].reverse()" :key="r.id" class="history-item card">
          <div class="history-head">
            <span class="history-stars">{{ '★'.repeat(r.rating) }}</span>
            <span class="history-date">{{ fmtDate(r.createdAt) }}</span>
          </div>
          <div class="history-qa">
            <p v-for="(qa, i) in r.qas" :key="i" class="history-qa-row">
              <span class="qa-kind">{{ qa.kind === 'experience' ? '📚 经验' : '🧩 经历' }}</span>
              <span class="qa-text">{{ qa.answer }}</span>
            </p>
          </div>
        </div>
      </div>
      <div v-else class="empty">还没有 Reflection 记录，完成一次活动后开始吧。</div>
    </div>

    <!-- 等级演示工具（折叠） -->
    <details class="demo-details card">
      <summary class="demo-summary">
        🔧 成长等级演示工具
        <span class="demo-summary-note">（拖动滑块预览不同次数对应的等级，不影响真实数据）</span>
      </summary>
      <div class="demo-body">
        <input
          type="range"
          :value="demoCount"
          min="0"
          :max="GROWTH_LEVELS[GROWTH_LEVELS.length - 1].count"
          step="1"
          @input="store.setDemoReflections(Number(($event.target as HTMLInputElement).value))"
          class="demo-slider"
        />

        <div class="demo-bar">
          <span
            v-for="l in GROWTH_LEVELS"
            :key="l.count"
            class="demo-marker"
            :class="{ reached: demoCount >= l.count }"
            :style="{ left: `${(l.count / GROWTH_LEVELS[GROWTH_LEVELS.length - 1].count) * 100}%` }"
          >
            {{ l.emoji }}
          </span>
        </div>

        <div class="demo-preview">
          <template v-if="demoLevel">
            <div class="demo-level">
              <span class="demo-level-emoji">{{ demoLevel.emoji }}</span>
              <div>
                <div class="demo-level-name">{{ demoLevel.name }}</div>
                <div class="demo-level-en">{{ demoLevel.en }}</div>
              </div>
            </div>
            <p class="demo-message">{{ demoLevel.message }}</p>
          </template>
          <p v-else class="demo-message">完成第 1 次 Reflection 即可解锁 🌱 初心者</p>
        </div>

        <p class="demo-progress-text">
          当前预览：<b>{{ demoCount }}</b> / {{ GROWTH_LEVELS[GROWTH_LEVELS.length - 1].count }} 次
        </p>
      </div>
    </details>

    <button class="btn btn-ghost btn-block reset-btn" @click="store.resetAll">重置演示数据</button>
  </div>
</template>

<style scoped>
.head-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
}

.back-btn {
  color: var(--text-secondary);
}

.page-title {
  font-size: 22px;
  font-weight: 700;
}

.page-subtitle {
  margin: 6px 0 16px;
  color: var(--text-secondary);
  font-size: 14px;
}

/* ---------- 当前称号（醒目） ---------- */
.profile-card {
  margin-bottom: 12px;
}

.avatar-row {
  display: flex;
  align-items: center;
  gap: 16px;
}

.avatar {
  width: 58px;
  height: 58px;
  border-radius: 50%;
  background: var(--primary-weak);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
  flex-shrink: 0;
}

.profile-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.nickname {
  font-size: 18px;
  font-weight: 700;
}

.rank-block {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.rank-line {
  display: flex;
  align-items: center;
  gap: 8px;
}

.rank-emoji {
  font-size: 22px;
}

.rank-name {
  font-size: 16px;
  font-weight: 700;
  color: var(--primary);
}

.rank-track {
  font-size: 11px;
  font-weight: 600;
  color: var(--text-tertiary);
  background: var(--primary-weak);
  padding: 2px 8px;
  border-radius: 999px;
}

.rank-bar {
  width: 100%;
  max-width: 420px;
  height: 6px;
  border-radius: 999px;
  background: #eceff4;
  overflow: hidden;
}

.rank-bar-fill {
  height: 100%;
  border-radius: 999px;
  background: linear-gradient(90deg, #7c9df2, #4a6cf7);
  transition: width 0.3s ease;
}

.rank-progress-text {
  font-size: 12px;
  color: var(--text-tertiary);
}

/* ---------- 称号墙 ---------- */
.badge-wall {
  margin-bottom: 12px;
}

.track-block {
  margin-bottom: 14px;
}

.track-block:last-child {
  margin-bottom: 0;
}

.track-label {
  font-size: 13px;
  font-weight: 700;
  color: var(--text-secondary);
  margin-bottom: 8px;
}

.badge-row {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.badge-cell {
  flex: 1;
  min-width: 90px;
  max-width: 140px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  padding: 12px 10px;
  border: 1px solid var(--border);
  border-radius: 12px;
  background: var(--surface);
}

.badge-cell.locked {
  opacity: 0.45;
  border-style: dashed;
  filter: grayscale(0.6);
}

.badge-emoji {
  font-size: 28px;
}

.badge-name {
  font-size: 13px;
  font-weight: 600;
  text-align: center;
}

.badge-state {
  font-size: 11px;
  color: var(--text-tertiary);
}

/* ---------- 成长数据 ---------- */
.stat-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10px;
}

.stat-card {
  text-align: center;
  padding: 14px 10px;
}

.stat-emoji {
  font-size: 24px;
}

.stat-num {
  font-size: 26px;
  font-weight: 700;
  margin: 4px 0 2px;
}

.stat-label {
  font-size: 12px;
  color: var(--text-secondary);
}

.growth-note {
  margin: 14px 0;
  font-size: 13px;
  color: var(--text-secondary);
  line-height: 1.7;
}

/* ---------- 历史记录 ---------- */
.history-section {
  margin-bottom: 14px;
}

.history-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.history-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.history-stars {
  color: #f7b500;
  font-size: 14px;
  letter-spacing: 2px;
}

.history-date {
  font-size: 12px;
  color: var(--text-tertiary);
}

.history-qa {
  margin-top: 8px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.history-qa-row {
  display: flex;
  gap: 8px;
  font-size: 13px;
  line-height: 1.6;
}

.qa-kind {
  flex-shrink: 0;
  font-size: 12px;
  font-weight: 600;
  color: var(--primary);
}

.qa-text {
  color: var(--text-secondary);
}

/* ---------- 演示工具（折叠） ---------- */
.demo-details {
  margin-bottom: 12px;
  padding: 10px 14px;
}

.demo-summary {
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;
  color: var(--text-secondary);
}

.demo-summary-note {
  font-size: 12px;
  font-weight: 400;
  color: var(--text-tertiary);
}

.demo-body {
  margin-top: 12px;
}

.demo-slider {
  width: 100%;
  accent-color: var(--primary);
}

.demo-bar {
  position: relative;
  height: 18px;
  margin: 4px 0 10px;
}

.demo-marker {
  position: absolute;
  transform: translateX(-50%);
  font-size: 14px;
  opacity: 0.35;
  transition: opacity 0.2s ease;
}

.demo-marker.reached {
  opacity: 1;
}

.demo-preview {
  background: var(--bg);
  border-radius: 12px;
  padding: 12px 14px;
}

.demo-level {
  display: flex;
  align-items: center;
  gap: 10px;
}

.demo-level-emoji {
  font-size: 30px;
}

.demo-level-name {
  font-weight: 700;
}

.demo-level-en {
  font-size: 12px;
  color: var(--text-tertiary);
}

.demo-message {
  margin-top: 8px;
  font-size: 13px;
  color: var(--text-secondary);
  line-height: 1.7;
  white-space: pre-line;
}

.demo-progress-text {
  margin-top: 8px;
  font-size: 12px;
  color: var(--text-tertiary);
  text-align: center;
}

.reset-btn {
  color: var(--text-tertiary);
}
</style>
