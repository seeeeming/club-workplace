import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import type {
  Activity,
  ActivityRating,
  ActivityStatus,
  GrowthStats,
  KnowledgeItem,
  KnowledgeType,
  Reflection,
  ReflectionQA,
} from '../types'
import { getActivityLevel, getLevel, getNextActivityLevel, getNextLevel } from '../data/growth'
import { seedKnowledge } from '../data/aiEngine'

const STORAGE_KEY = 'club-reflection-store-v1'

interface PersistedState {
  /** 当前登录用户（null = 未登录） */
  user: { id: string; name: string } | null
  activities: Activity[]
  reflections: Reflection[]
  knowledge: KnowledgeItem[]
  stats: GrowthStats
  /** 演示计数（个人主页「演示工具」用），不参与真实统计 */
  demoReflections: number
}

function defaultState(): PersistedState {
  const now = new Date().toISOString()
  return {
    user: null,
    activities: [],
    reflections: [],
    knowledge: seedKnowledge(now),
    stats: {
      completedActivities: 0,
      reflections: 0,
      experiences: 0,
      risks: 0,
    },
    demoReflections: 0,
  }
}

function loadState(): PersistedState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return defaultState()
    const parsed = JSON.parse(raw) as Partial<PersistedState>
    const merged = { ...defaultState(), ...parsed }

    // 旧版本数据结构兼容：老 reflections 用 answers 而非 qas
    merged.reflections = (merged.reflections ?? []).map((r) => {
      if (Array.isArray(r.qas)) return r
      const legacyAnswers = (r as unknown as { answers?: string[] }).answers ?? []
      return {
        ...r,
        qas: legacyAnswers.map((answer: string, i: number) => ({
          question: `Q${i + 1}`,
          answer,
          kind: i === legacyAnswers.length - 1 ? ('experience' as const) : ('activity' as const),
        })),
      }
    })
    // 旧版本数据结构兼容：老 activities 用 reflected 布尔而非 status
    const now = new Date().toISOString()
    merged.activities = (merged.activities ?? []).map((a) => {
      const legacy = a as Activity & { reflected?: boolean }
      if (legacy.status) return legacy
      return {
        ...legacy,
        createdAt: legacy.createdAt ?? legacy.completedAt ?? now,
        status: legacy.reflected ? ('completed' as const) : ('pendingReflection' as const),
      }
    })
    return merged
  } catch {
    return defaultState()
  }
}

let uid = 0
function makeId(prefix: string): string {
  uid += 1
  return `${prefix}-${Date.now().toString(36)}-${uid}`
}

export const useGrowthStore = defineStore('growth', () => {
  const state = ref<PersistedState>(loadState())

  /** 持久化到 localStorage */
  function persist() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state.value))
    } catch (e) {
      console.warn('[growth] persist failed', e)
    }
  }

  // ---------- 派生状态 ----------
  const stats = computed(() => state.value.stats)
  const knowledge = computed(() => state.value.knowledge)
  const reflections = computed(() => state.value.reflections)
  const activities = computed(() => state.value.activities)
  const user = computed(() => state.value.user)
  const isLoggedIn = computed(() => state.value.user !== null)

  const currentLevel = computed(() => getLevel(stats.value.reflections))
  const nextLevel = computed(() => getNextLevel(stats.value.reflections))
  const activityLevel = computed(() => getActivityLevel(stats.value.completedActivities))
  const nextActivityLevel = computed(() => getNextActivityLevel(stats.value.completedActivities))

  // ---------- 登录 ----------
  function login(name: string) {
    state.value.user = { id: makeId('usr'), name: name.trim() || '社长' }
    persist()
  }

  function logout() {
    state.value.user = null
    persist()
  }

  // ---------- 活动 ----------
  /** 活动排序：最近编辑 / 完成的排最前（草稿按 createdAt，完成后按 completedAt） */
  function sortActivities() {
    state.value.activities.sort((a, b) => {
      const ta = a.completedAt ?? a.createdAt
      const tb = b.completedAt ?? b.createdAt
      return tb.localeCompare(ta)
    })
  }

  /**
   * 创建或更新一条活动记录（草稿 / 进行中 / 待复盘 / 已完成）。
   * create.html 通过 postMessage 上报的状态变化都汇聚到这里，按 id 去重，
   * 保证「保存草稿 → 继续编辑 → 走完流程」是同一条记录，不会重复。
   */
  function upsertActivity(input: {
    id: string
    title: string
    status: ActivityStatus
    photo?: string
  }): Activity {
    const now = new Date().toISOString()
    const title = input.title?.trim() || '未命名活动'
    const isCompletedFlow = input.status === 'pendingReflection' || input.status === 'completed'

    const existing = state.value.activities.find((a) => a.id === input.id)
    if (existing) {
      const wasCompletedFlow =
        existing.status === 'pendingReflection' || existing.status === 'completed'
      existing.title = title
      if (input.photo) existing.photo = input.photo
      existing.status = input.status
      // 草稿 / 进行中阶段每次保存都刷新时间（代表最近编辑时间）
      if (input.status === 'draft' || input.status === 'inProgress') {
        existing.createdAt = now
      }
      if (isCompletedFlow && !existing.completedAt) {
        existing.completedAt = now
        state.value.stats.completedActivities += 1
      } else if (!isCompletedFlow && wasCompletedFlow) {
        // 状态回退（极少发生）：撤销完成统计
        existing.completedAt = undefined
        state.value.stats.completedActivities = Math.max(0, state.value.stats.completedActivities - 1)
      }
      sortActivities()
      persist()
      return existing
    }

    const activity: Activity = {
      id: input.id,
      title,
      photo: input.photo,
      createdAt: now,
      completedAt: isCompletedFlow ? now : undefined,
      status: input.status,
    }
    state.value.activities.push(activity)
    if (isCompletedFlow) state.value.stats.completedActivities += 1
    sortActivities()
    persist()
    return activity
  }

  function getActivity(id: string): Activity | undefined {
    return state.value.activities.find((a) => a.id === id)
  }

  /** 删除活动：连同其复盘记录与沉淀的知识条目一起移除，并回退统计 */
  function deleteActivity(id: string) {
    const idx = state.value.activities.findIndex((a) => a.id === id)
    if (idx === -1) return

    const activity = state.value.activities[idx]
    const wasCompletedFlow =
      activity.status === 'pendingReflection' || activity.status === 'completed'

    const related = state.value.reflections.filter((r) => r.activityId === id)
    const knowledgeIds = new Set(related.flatMap((r) => r.knowledgeIds))
    const removedExperiences = state.value.knowledge.filter(
      (k) => knowledgeIds.has(k.id) && k.type === 'experience',
    ).length
    const removedRisks = state.value.knowledge.filter(
      (k) => knowledgeIds.has(k.id) && k.type === 'risk',
    ).length

    state.value.activities.splice(idx, 1)
    state.value.reflections = state.value.reflections.filter((r) => r.activityId !== id)
    state.value.knowledge = state.value.knowledge.filter((k) => !knowledgeIds.has(k.id))

    if (wasCompletedFlow) {
      state.value.stats.completedActivities = Math.max(0, state.value.stats.completedActivities - 1)
    }
    state.value.stats.reflections = Math.max(0, state.value.stats.reflections - related.length)
    state.value.stats.experiences = Math.max(0, state.value.stats.experiences - removedExperiences)
    state.value.stats.risks = Math.max(0, state.value.stats.risks - removedRisks)

    persist()
  }

  // ---------- Reflection ----------
  function saveReflection(params: {
    activityId: string
    rating: ActivityRating
    qas: ReflectionQA[]
    /** 用户确认后的知识条目：只来自「经验总结」部分，AI 提炼 → 用户编辑 → 确认 */
    confirmedItems: Array<{ content: string; type: KnowledgeType }>
  }): { reflection: Reflection; unlockedLevel: ReturnType<typeof getLevel>; knowledgeAdded: number } {
    const now = new Date().toISOString()
    const reflectionId = makeId('ref')

    const knowledgeItems: KnowledgeItem[] = params.confirmedItems
      .filter((it) => it.content.trim())
      .map((it, i) => ({
        id: `${reflectionId}-k${i}`,
        type: it.type,
        content: it.content.trim(),
        reflectionId,
        createdAt: now,
      }))

    const reflection: Reflection = {
      id: reflectionId,
      activityId: params.activityId,
      rating: params.rating,
      qas: params.qas,
      knowledgeIds: knowledgeItems.map((k) => k.id),
      createdAt: now,
    }

    state.value.reflections.push(reflection)
    state.value.knowledge.push(...knowledgeItems)
    state.value.stats.reflections += 1
    state.value.stats.experiences += knowledgeItems.filter((k) => k.type === 'experience').length
    state.value.stats.risks += knowledgeItems.filter((k) => k.type === 'risk').length

    const activity = state.value.activities.find((a) => a.id === params.activityId)
    if (activity) activity.status = 'completed'

    persist()

    return {
      reflection,
      unlockedLevel: getLevel(state.value.stats.reflections),
      knowledgeAdded: knowledgeItems.length,
    }
  }

  // ---------- 演示工具 ----------
  function setDemoReflections(count: number) {
    state.value.demoReflections = Math.max(0, count)
    persist()
  }

  // ---------- 数据重置 ----------
  function resetAll() {
    state.value = defaultState()
    persist()
  }

  return {
    stats,
    knowledge,
    reflections,
    activities,
    user,
    isLoggedIn,
    currentLevel,
    nextLevel,
    activityLevel,
    nextActivityLevel,
    demoReflections: computed(() => state.value.demoReflections),
    login,
    logout,
    upsertActivity,
    getActivity,
    deleteActivity,
    saveReflection,
    setDemoReflections,
    resetAll,
  }
})
