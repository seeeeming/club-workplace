import { onBeforeUnmount, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useGrowthStore } from '../stores/growth'

/**
 * 同学工作台（public/workspace.html，通过 iframe 嵌入）与父窗口之间的桥接。
 * - activity-completed：活动完成 → 记录到 store，并弹「要不要复盘」询问
 * - open-reflection：同学侧栏 🪞 复盘入口 → 跳最近未复盘的活动
 */
interface WorkspaceMessage {
  type: 'activity-completed' | 'open-reflection'
  title?: string
  photo?: string
}

export function useWorkspaceBridge() {
  const router = useRouter()
  const store = useGrowthStore()

  // 完成活动后待处理的记录（用于「要不要复盘」弹窗）
  const pending = ref<{ id: string; title: string } | null>(null)

  function onMessage(e: MessageEvent<WorkspaceMessage>) {
    const data = e.data
    if (!data || typeof data !== 'object') return
    // 只接受来自我们的工作台 iframe 的消息（同源即可）。
    // 注意：不能用 e.source instanceof Window —— iframe 属于独立 realm，其 Window 原型不同，
    // instanceof 永远为 false，会把真实消息误杀。
    if (e.origin !== window.location.origin) return

    if (data.type === 'activity-completed') {
      // 活动完成：记录到 store（照片必传，由工作台保证）
      const activity = store.completeActivity(data.title?.trim() || '未命名活动', data.photo)
      pending.value = { id: activity.id, title: activity.title }
    } else if (data.type === 'open-reflection') {
      // 主动进入复盘：找最近一个未复盘的活动
      const unreflected = store.activities.find((a) => !a.reflected)
      if (unreflected) {
        router.push(`/reflection/${unreflected.id}`)
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
