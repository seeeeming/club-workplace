<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useGrowthStore } from '../stores/growth'
import { openingLine, firstActivityQuestion, buildFollowUpQuestion, distillExperience } from '../data/aiEngine'
import { getLevel } from '../data/growth'
import type { ActivityRating, KnowledgeType } from '../types'
import StarRating from '../components/StarRating.vue'
import AiBubble from '../components/AiBubble.vue'

const route = useRoute()
const router = useRouter()
const store = useGrowthStore()

const activityId = route.params.activityId as string
const justCompleted = route.query.justCompleted === '1'

const activity = computed(() => store.getActivity(activityId))

type Phase = 'celebration' | 'rating' | 'guided' | 'summary' | 'done'

const phase = ref<Phase>(justCompleted ? 'celebration' : 'rating')
const rating = ref<ActivityRating | null>(null)

// Step 2 引导问答
const currentStep = ref<'activity' | 'experience'>('activity')
const activityAnswer = ref('')
const experienceQuestion = ref('')
const experienceAnswer = ref('')
const draft = ref('')
const thinking = ref(false)

// Step 3 整理提炼（只提炼经验部分）
const distilled = ref<Array<{ content: string; type: KnowledgeType }>>([])

// 完成反馈
const unlockedLevelName = ref('')
const unlockedMessage = ref('')

// 若活动不存在（比如刷新后），回工作台
if (!activity.value) {
  router.replace('/platform/workspace')
}

function startReflection() {
  phase.value = 'rating'
}

function postpone() {
  router.push('/platform/workspace')
}

function goToGuided() {
  if (!rating.value) return
  currentStep.value = 'activity'
  activityAnswer.value = ''
  experienceAnswer.value = ''
  phase.value = 'guided'
}

/** 提交当前步的回答 */
function submitAnswer() {
  const text = draft.value.trim()
  if (!text) return

  if (currentStep.value === 'activity') {
    // 第一步：个人经历回答 → AI 根据内容生成相关经验追问
    activityAnswer.value = text
    draft.value = ''
    thinking.value = true
    setTimeout(() => {
      thinking.value = false
      experienceQuestion.value = buildFollowUpQuestion(text, rating.value!)
      currentStep.value = 'experience'
    }, 900)
  } else {
    // 第二步：经验回答 → AI 整理
    experienceAnswer.value = text
    draft.value = ''
    thinking.value = true
    setTimeout(() => {
      thinking.value = false
      const { qas } = collectQAs()
      distilled.value = distillExperience(qas, rating.value!)
      phase.value = 'summary'
    }, 900)
  }
}

/** 汇总两次回答为 qas 列表 */
function collectQAs() {
  return {
    qas: [
      { question: firstActivityQuestion(rating.value!), answer: activityAnswer.value, kind: 'activity' as const },
      { question: experienceQuestion.value, answer: experienceAnswer.value, kind: 'experience' as const },
    ],
  }
}

/** 展示「已答内容 + AI 追问」的对话流 */
const chatLog = computed(() => {
  const log: Array<{ from: 'ai' | 'user'; text: string }> = []
  log.push({
    from: 'ai',
    text: `${openingLine(rating.value!)}\n\n${firstActivityQuestion(rating.value!)}`,
  })
  if (activityAnswer.value) {
    log.push({ from: 'user', text: activityAnswer.value })
    if (experienceQuestion.value) {
      log.push({ from: 'ai', text: experienceQuestion.value })
      if (experienceAnswer.value) log.push({ from: 'user', text: experienceAnswer.value })
    }
  }
  return log
})

function updateItem(index: number, patch: Partial<{ content: string; type: KnowledgeType }>) {
  const item = distilled.value[index]
  if (!item) return
  if (patch.content !== undefined) item.content = patch.content
  if (patch.type !== undefined) item.type = patch.type
}

function removeItem(index: number) {
  distilled.value.splice(index, 1)
}

function addItem() {
  distilled.value.push({ content: '', type: 'experience' })
}

function confirmSave() {
  const confirmedItems = distilled.value
    .filter((it) => it.content.trim())
    .map((it) => ({ content: it.content.trim(), type: it.type }))

  store.saveReflection({
    activityId,
    rating: rating.value!,
    qas: collectQAs().qas,
    confirmedItems,
  })

  const level = getLevel(store.stats.reflections)
  unlockedLevelName.value = level ? `${level.emoji} ${level.name}` : ''
  unlockedMessage.value = level?.message ?? ''

  phase.value = 'done'
}

function goToKnowledgeBase() {
  router.push('/platform/kb')
}

function backHome() {
  router.push('/platform/workspace')
}

function viewProfile() {
  router.push('/growth')
}
</script>

<template>
  <div v-if="activity" class="reflection-page">
    <!-- 顶栏 -->
    <header class="reflection-topbar">
      <button class="btn btn-ghost back-btn" @click="backHome">← 返回工作台</button>
      <div class="topbar-title">
        <span class="topbar-label">Reflection 复盘</span>
        <span class="topbar-activity">{{ activity.title }}</span>
      </div>
      <RouterLink to="/growth" class="avatar-btn" title="我的成长">
        <span class="avatar-mini">🧑‍💼</span>
      </RouterLink>
    </header>

    <!-- 内容区 -->
    <main class="reflection-body">
      <!-- 🎉 庆祝 / 选择是否进入复盘 -->
      <section v-if="phase === 'celebration'" class="phase celebration">
        <div class="confetti">🎉</div>
        <h2 class="celebrate-title">恭喜完成本次活动！</h2>
        <p class="celebrate-sub">「{{ activity.title }}」已记录</p>
        <div class="badge-row">
          <div class="badge">🏅</div>
          <div class="badge-label">获得「活动完成」徽章</div>
        </div>
        <p class="optional-hint">做一次轻量复盘，把经验沉淀下来？</p>
        <div class="decision">
          <button class="btn btn-primary btn-block" @click="startReflection">立即开始</button>
          <button class="btn btn-ghost btn-block" @click="postpone">以后再说</button>
        </div>
      </section>

      <!-- Step 1：活动评分 -->
      <section v-else-if="phase === 'rating'" class="phase rating-phase">
        <AiBubble>辛苦啦！先给这次活动打个分吧 ⭐⭐⭐⭐⭐</AiBubble>
        <div class="rating-area card">
          <StarRating v-model="rating" />
          <button class="btn btn-primary btn-block" :disabled="!rating" @click="goToGuided">
            下一步
          </button>
        </div>
      </section>

      <!-- Step 2：AI 引导复盘（先经历，再自适应追问经验） -->
      <section v-else-if="phase === 'guided'" class="phase guided-phase">
        <div class="chat-shell">
          <div class="chat-area">
            <template v-for="(item, i) in chatLog" :key="i">
              <div v-if="item.from === 'ai'" class="chat-row ai-row">
                <AiBubble>{{ item.text }}</AiBubble>
              </div>
              <div v-else class="chat-row user-row">
                <div class="user-bubble">{{ item.text }}</div>
              </div>
            </template>

            <div v-if="thinking" class="chat-row ai-row">
              <AiBubble>
                <span class="thinking-dots"><i></i><i></i><i></i></span>
                {{ currentStep === 'experience' ? '正在根据你的经历整理追问…' : '正在整理你的表达…' }}
              </AiBubble>
            </div>
          </div>

          <div v-if="!thinking" class="input-area">
            <div class="input-head">
              <span class="input-tip">
                {{ currentStep === 'activity' ? 'Q1 个人经历' : 'Q2 经验总结' }}
              </span>
              <span class="input-hint">回车发送</span>
            </div>
            <textarea
              v-model="draft"
              class="answer-input"
              rows="2"
              :placeholder="currentStep === 'activity' ? firstActivityQuestion(rating!) : experienceQuestion"
              @keydown.enter.exact.prevent="submitAnswer"
            />
            <div class="input-actions">
              <button class="btn btn-primary" :disabled="!draft.trim()" @click="submitAnswer">
                发送 →
              </button>
            </div>
          </div>
          <p v-else class="thinking-tip">AI 正在思考…</p>
        </div>
      </section>

      <!-- Step 3：AI 整理内容（只提炼经验，用户确认后保存） -->
      <section v-else-if="phase === 'summary'" class="phase">
        <AiBubble>
          我已经从你的回答里提炼出可沉淀的<b>经验</b>了（你的个人经历保留在活动记录中，不会进入知识库）。以下是提炼结果，你可以编辑、增删、确认后保存。
        </AiBubble>

        <div class="distill-list">
          <div v-for="(item, i) in distilled" :key="i" class="distill-item card">
            <div class="distill-head">
              <select v-model="item.type" class="type-select" @change="updateItem(i, { type: item.type })">
                <option value="experience">📚 经验</option>
                <option value="risk">⚠️ 风险</option>
              </select>
              <button class="item-remove" @click="removeItem(i)">✕</button>
            </div>
            <textarea
              :value="item.content"
              class="item-textarea"
              rows="2"
              @input="updateItem(i, { content: ($event.target as HTMLTextAreaElement).value })"
            />
          </div>
          <button class="add-item" @click="addItem">＋ 添加一条</button>
        </div>

        <div class="summary-actions">
          <button class="btn btn-ghost" @click="backHome">放弃</button>
          <button class="btn btn-primary" @click="confirmSave">确认保存</button>
        </div>
      </section>

      <!-- Step 4/5：知识沉淀 + 成长反馈 -->
      <section v-else class="phase done">
        <div class="done-icon">🎉</div>
        <h2 class="done-title">Reflection 已保存！</h2>
        <p class="done-sub">你的经验将帮助下一任社长。</p>

        <div class="done-grid">
          <div class="level-card card">
            <div class="level-emoji">🌱</div>
            <div class="level-name">{{ unlockedLevelName }}</div>
            <p class="level-message">{{ unlockedMessage }}</p>
          </div>

          <div class="sync-card card">
            <p class="sync-title">系统已同步更新</p>
            <ul class="sync-list">
              <li>📄 活动 Reflection</li>
              <li>
                <button class="link-btn" @click="goToKnowledgeBase">📚 社团资料库 →</button>
              </li>
              <li>🤖 AI 可调用的历史经验</li>
            </ul>
          </div>
        </div>

        <div class="done-actions">
          <button class="btn btn-ghost" @click="backHome">返回工作台</button>
          <button class="btn btn-primary" @click="viewProfile">查看我的成长 →</button>
        </div>
      </section>
    </main>
  </div>
</template>

<style scoped>
.reflection-page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: linear-gradient(160deg, #eef1ff 0%, #f6f8fc 100%);
}

/* ---------- 顶栏 ---------- */
.reflection-topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 24px;
  background: var(--surface);
  border-bottom: 1px solid var(--border);
  position: sticky;
  top: 0;
  z-index: 20;
}

.back-btn {
  color: var(--text-secondary);
  font-size: 14px;
  padding: 8px 10px;
}

.topbar-title {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}

.topbar-label {
  font-size: 15px;
  font-weight: 700;
}

.topbar-activity {
  font-size: 12px;
  color: var(--text-tertiary);
}

.avatar-btn {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: var(--primary-weak);
  display: flex;
  align-items: center;
  justify-content: center;
  text-decoration: none;
}

.avatar-mini {
  font-size: 18px;
}

/* ---------- 内容区 ---------- */
.reflection-body {
  flex: 1;
  width: 100%;
  max-width: 860px;
  margin: 0 auto;
  padding: 28px 32px;
}

.phase {
  animation: fade-in 0.35s ease;
}

@keyframes fade-in {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: none;
  }
}

/* ---------- 庆祝 ---------- */
.celebration {
  text-align: center;
  padding-top: 12px;
}

.confetti {
  font-size: 56px;
}

.celebrate-title {
  font-size: 22px;
  margin-top: 10px;
}

.celebrate-sub {
  color: var(--text-secondary);
  margin-top: 6px;
  font-size: 14px;
}

.badge-row {
  margin: 20px 0 6px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
}

.badge {
  width: 72px;
  height: 72px;
  border-radius: 50%;
  background: linear-gradient(145deg, #fff7dd, #ffe29a);
  border: 3px solid #f7b500;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 36px;
  box-shadow: 0 4px 16px rgba(247, 181, 0, 0.25);
}

.badge-label {
  font-size: 13px;
  font-weight: 600;
  color: #b45309;
}

.optional-hint {
  margin-top: 18px;
  color: var(--text-secondary);
  font-size: 14px;
}

.decision {
  margin-top: 14px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-width: 360px;
  margin-left: auto;
  margin-right: auto;
}

/* ---------- 评分 ---------- */
.rating-phase {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.rating-area {
  margin-top: 4px;
  display: flex;
  flex-direction: column;
  gap: 20px;
  align-items: center;
}

.rating-area .btn {
  width: 100%;
  max-width: 360px;
}

/* ---------- 引导对话 ---------- */
.guided-phase {
  padding-bottom: 0;
}

.chat-shell {
  display: flex;
  flex-direction: column;
  gap: 14px;
  height: calc(100vh - 220px);
  min-height: 340px;
}

.chat-area {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 4px 4px 8px;
}

.chat-row.ai-row {
  display: flex;
  justify-content: flex-start;
}

.chat-row.user-row {
  display: flex;
  justify-content: flex-end;
}

.user-bubble {
  background: var(--primary);
  color: #fff;
  border-radius: 14px;
  border-top-right-radius: 4px;
  padding: 12px 16px;
  font-size: 15px;
  line-height: 1.6;
  max-width: 72%;
}

.thinking-dots {
  display: inline-flex;
  gap: 4px;
  align-items: center;
  margin-right: 6px;
}

.thinking-dots i {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--text-tertiary);
  animation: blink 1.2s infinite;
}

.thinking-dots i:nth-child(2) {
  animation-delay: 0.2s;
}

.thinking-dots i:nth-child(3) {
  animation-delay: 0.4s;
}

@keyframes blink {
  0%,
  80%,
  100% {
    opacity: 0.3;
  }
  40% {
    opacity: 1;
  }
}

.thinking-tip {
  color: var(--text-tertiary);
  font-size: 13px;
  text-align: center;
}

.input-area {
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 14px;
  padding: 12px 14px;
  box-shadow: var(--shadow);
}

.input-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.input-tip {
  font-size: 12px;
  color: var(--text-tertiary);
  font-weight: 600;
}

.input-hint {
  font-size: 12px;
  color: var(--text-tertiary);
}

.answer-input {
  width: 100%;
  border: none;
  resize: none;
  font-size: 15px;
  line-height: 1.6;
  background: transparent;
}

.answer-input::placeholder {
  color: var(--text-tertiary);
}

.input-actions {
  display: flex;
  justify-content: flex-end;
}

/* ---------- 整理确认 ---------- */
.distill-list {
  margin-top: 16px;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.distill-item {
  padding: 12px;
}

.distill-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.type-select {
  border: none;
  background: var(--primary-weak);
  color: var(--primary);
  font-size: 13px;
  font-weight: 600;
  padding: 6px 10px;
  border-radius: 999px;
  appearance: none;
}

.item-remove {
  background: none;
  color: var(--text-tertiary);
  font-size: 16px;
  padding: 4px;
}

.item-textarea {
  width: 100%;
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 10px;
  font-size: 14px;
  line-height: 1.6;
  resize: none;
  background: var(--bg);
}

.add-item {
  border: 2px dashed var(--border);
  background: transparent;
  color: var(--text-secondary);
  font-size: 14px;
  padding: 12px;
  border-radius: 12px;
  grid-column: 1 / -1;
}

.summary-actions {
  margin-top: 18px;
  display: flex;
  gap: 10px;
}

.summary-actions .btn {
  flex: 1;
}

/* ---------- 完成反馈 ---------- */
.done {
  text-align: center;
  padding-top: 8px;
}

.done-icon {
  font-size: 56px;
}

.done-title {
  font-size: 22px;
  margin-top: 8px;
}

.done-sub {
  color: var(--text-secondary);
  font-size: 14px;
  margin-top: 6px;
}

.done-grid {
  margin-top: 20px;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.level-card {
  text-align: center;
}

.level-emoji {
  font-size: 40px;
}

.level-name {
  font-size: 17px;
  font-weight: 700;
  margin-top: 6px;
}

.level-message {
  margin-top: 8px;
  color: var(--text-secondary);
  font-size: 13px;
  line-height: 1.6;
  white-space: pre-line;
}

.sync-card {
  text-align: left;
}

.sync-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-secondary);
  margin-bottom: 8px;
}

.sync-list {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 14px;
}

.link-btn {
  background: none;
  color: var(--primary);
  font-size: 14px;
  padding: 0;
}

.done-actions {
  margin-top: 20px;
  display: flex;
  gap: 10px;
  max-width: 480px;
  margin-left: auto;
  margin-right: auto;
}

.done-actions .btn {
  flex: 1;
}
</style>
