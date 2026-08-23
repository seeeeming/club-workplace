import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import type {
  Activity,
  ActivityRating,
  GrowthStats,
  KnowledgeItem,
  KnowledgeType,
  Reflection,
  ReflectionQA,
} from '../types'
import { getLevel, getNextLevel } from '../data/growth'
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
  function completeActivity(title: string, photo?: string): Activity {
    const activity: Activity = {
      id: makeId('act'),
      title,
      photo,
      completedAt: new Date().toISOString(),
      reflected: false,
    }
    state.value.activities.unshift(activity)
    state.value.stats.completedActivities += 1
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

    state.value.stats.completedActivities = Math.max(0, state.value.stats.completedActivities - 1)
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
    if (activity) activity.reflected = true

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
    demoReflections: computed(() => state.value.demoReflections),
    login,
    logout,
    completeActivity,
    getActivity,
    deleteActivity,
    saveReflection,
    setDemoReflections,
    resetAll,
  }
})
