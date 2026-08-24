import { onBeforeUnmount, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useGrowthStore } from '../stores/growth'
import { getActivityLevel } from '../data/growth'
import type { ActivityStatus } from '../types'

/**
 * 同学工作台（public/ai/create.html，通过 iframe 嵌入）与父窗口之间的桥接。
 * - activity-completed：走完 6 步流程 → 记录为「待复盘」，并弹「要不要复盘」询问
 * - activity-save：保存草稿 / 流程进行中 → 同步「草稿」「进行中」状态
 * - open-reflection：同学侧栏 🪞 复盘入口 → 跳最近待复盘的活动
 */
interface WorkspaceMessage {
  type: 'activity-completed' | 'activity-save' | 'open-reflection'
  id?: string
  title?: string
  photo?: string
  status?: ActivityStatus
}

/** 兜底 id（正常情况下 create.html 会带上活动 id，用于按 id 去重） */
function fallbackId(): string {
  return `act-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
}

export function useWorkspaceBridge() {
  const router = useRouter()
  const store = useGrowthStore()

  // 完成活动后待处理的记录（用于「要不要复盘」弹窗）
  // level：完成本场活动后解锁的活动称号（未达门槛时为 null，比如从 0 到 1）
  const pending = ref<{ id: string; title: string; level: ReturnType<typeof getActivityLevel> } | null>(null)

  function onMessage(e: MessageEvent<WorkspaceMessage>) {
    const data = e.data
    if (!data || typeof data !== 'object') return
    // 只接受来自我们的工作台 iframe 的消息（同源即可）。
    // 注意：不能用 e.source instanceof Window —— iframe 属于独立 realm，其 Window 原型不同，
    // instanceof 永远为 false，会把真实消息误杀。
    if (e.origin !== window.location.origin) return

    if (data.type === 'activity-completed') {
      // 走完流程：按 id 写入「待复盘」（照片必传，由工作台保证）
      const activity = store.upsertActivity({
        id: data.id || fallbackId(),
        title: data.title || '',
        status: 'pendingReflection',
        photo: data.photo,
      })
      pending.value = {
        id: activity.id,
        title: activity.title,
        level: getActivityLevel(store.stats.completedActivities),
      }
    } else if (data.type === 'activity-save') {
      // 保存草稿 / 流程进行中：同步「草稿」「进行中」
      store.upsertActivity({
        id: data.id || fallbackId(),
        title: data.title || '',
        status: data.status || 'draft',
        photo: data.photo,
      })
    } else if (data.type === 'open-reflection') {
      // 主动进入复盘：找最近一个待复盘的活动
      const target = store.activities.find((a) => a.status === 'pendingReflection')
      if (target) {
        router.push(`/reflection/${target.id}`)
      } else {
        alert('还没有需要复盘的活动')
      }
    }
  }

  /** 立即开始复盘（进入 Reflection，标记为刚完成） */
  function startReflection() {
    if (!pending.value) return
    router.push({
      path: `/reflection/${pending.value.id}`,
      query: { justCompleted: '1' },
    })
  }

  function postpone() {
    pending.value = null
  }

  onMounted(() => {
    window.addEventListener('message', onMessage)
  })

  onBeforeUnmount(() => {
    window.removeEventListener('message', onMessage)
  })

  return { pending, startReflection, postpone }
}
