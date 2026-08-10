<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useGrowthStore } from '../stores/growth'
import { getLevel, GROWTH_LEVELS } from '../data/growth'

const store = useGrowthStore()
const router = useRouter()

// ---------- 真实成长数据 ----------
const stats = computed(() => store.stats)
const realLevel = computed(() => getLevel(store.stats.reflections))

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

    <!-- 当前成长等级 -->
    <div class="profile-card card">
      <div class="avatar-row">
        <div class="avatar">🧑‍💼</div>
        <div>
          <div class="nickname">{{ store.user?.name }}</div>
          <div class="level-tag">
            {{ realLevel ? `${realLevel.emoji} ${realLevel.name}` : '🌱 从第一次 Reflection 开始' }}
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

    <div class="growth-layout">
    <!-- 等级演示工具 -->
    <div class="demo-card card">
      <p class="section-title">🔧 成长等级演示工具</p>
      <p class="demo-hint">拖动滑块，预览不同 Reflection 次数对应的成长等级（仅演示，不影响真实数据）</p>

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

    </div>

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

.profile-card {
  margin-bottom: 12px;
}

.avatar-row {
  display: flex;
  align-items: center;
  gap: 14px;
}

.avatar {
  width: 54px;
  height: 54px;
  border-radius: 50%;
  background: var(--primary-weak);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 26px;
}

.nickname {
  font-size: 17px;
  font-weight: 700;
}

.level-tag {
  margin-top: 4px;
  font-size: 13px;
  color: var(--primary);
  font-weight: 600;
}

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

.growth-layout {
  display: grid;
  grid-template-columns: 400px 1fr;
  gap: 18px;
  align-items: start;
}

.demo-card {
  margin-bottom: 0;
}

.demo-hint {
  font-size: 12px;
  color: var(--text-tertiary);
  margin-bottom: 12px;
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

.history-section {
  margin-bottom: 0;
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

.reset-btn {
  color: var(--text-tertiary);
}
</style>
