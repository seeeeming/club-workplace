import type { ActivityRating, KnowledgeItem, KnowledgeType, ReflectionQA } from '../types'

/**
 * ============ Reflection 引导引擎（模拟 AI） ============
 *
 * 流程（按评分分支）：
 *   1. 先问「个人经历」—— 你做了什么、发生了什么
 *   2. AI 根据这段经历的**内容关键词**，自适应生成一条更相关的「经验追问」
 *   3. 只有「经验追问」的回答才会被提炼进知识库；个人经历只进活动记录
 *
 * 接入真实大模型时，把下面两个函数替换成 AI 调用即可，输出契约保持不变。
 */

/** 评分对应的开场白 */
export function openingLine(rating: ActivityRating): string {
  if (rating >= 4) return '很好！先来聊聊这次活动里，你做了些什么吧。'
  return '没关系，每一次活动都是经验。先说说这次活动里，你做了些什么吧。'
}

/** 第一问：个人经历（永远先问这个） */
export function firstActivityQuestion(rating: ActivityRating): string {
  if (rating >= 4) return '这次活动从准备到结束，你具体做了哪些事情？'
  return '这次活动从头到尾，发生了什么？你具体参与了哪些部分？'
}

/** 主题关键词库：把个人经历回答映射到相关追问 */
interface FollowUpRule {
  /** 关键词命中即触发 */
  keys: string[]
  /** 根据经历追问相关经验 */
  question: string
}

const FOLLOW_UP_RULES: FollowUpRule[] = [
  {
    keys: ['招新', '宣传', '拉人', '推广', '摆摊', '海报', '公众号', '推文', '校园墙'],
    question: '既然你提到了「宣传招募」——如果下一届要办类似活动，关于前期宣传和召集，你最想让他们知道什么经验？',
  },
  {
    keys: ['预算', '钱', '经费', '报销', '超支', '花费', '采购', '物资', '物料'],
    question: '你提到了「预算物资」——如果重新来一次，关于经费和物资准备，你最想提前做好什么？',
  },
  {
    keys: ['场地', '教室', '会议室', '体育馆', '申请', '租借', '档期'],
    question: '你提到了「场地安排」——下次办活动前，关于场地申请和现场布置，有什么经验可以告诉下一届？',
  },
  {
    keys: ['分工', '队友', '成员', '干事', '志愿者', '负责人', '组员', '合作', '协调'],
    question: '你提到了「团队分工」——这次你们怎么分工配合的？下次怎样才能让团队配合更顺畅？',
  },
  {
    keys: ['时间', '迟到', '太赶', '来不及', '拖延', '计划', '排期', '流程'],
    question: '你提到了「时间计划」——如果重新规划一次时间表，你最想提前安排什么？',
  },
  {
    keys: ['观众', '参与', '到场', '人数', '体验', '反馈', '现场', '气氛', '互动'],
    question: '你提到了「现场体验」——从参与者的角度，你觉得最值得保留或改进的地方是什么？',
  },
  {
    keys: ['设备', '音响', '麦克风', '投影', '电脑', '机器', '坏了', '没电'],
    question: '你提到了「设备」——设备方面有什么教训或经验，可以让下一届提前避坑？',
  },
  {
    keys: ['出问题', '出错', '意外', '突发', '状况', '翻车', '失败', '混乱', '搞砸'],
    question: '你提到了「意外状况」——当时是怎么应对的？下次可以提前做哪些准备避免同样的问题？',
  },
]

/** 兜底追问：没命中任何主题时 */
const FALLBACK_QUESTION =
  '如果下一任社长也要办类似活动，你最希望他知道什么经验？'

/**
 * 根据个人经历回答，自适应生成相关的经验追问（Step 2）
 */
export function buildFollowUpQuestion(activityAnswer: string, rating: ActivityRating): string {
  const text = activityAnswer.toLowerCase()
  for (const rule of FOLLOW_UP_RULES) {
    if (rule.keys.some((k) => text.includes(k))) {
      return rule.question
    }
  }
  // 低分场景给出更贴近复盘的语气
  if (rating <= 3) {
    return '如果重新办一次，你最想提前准备什么？'
  }
  return FALLBACK_QUESTION
}

/**
 * 构建完整的引导问答对列表。
 * 始终两轮：
 *   Q1（个人经历，activity）→ 用户答 → AI 据答生成 Q2（经验，experience）
 */
export function buildQAs(rating: ActivityRating, activityAnswer: string, experienceAnswer: string): ReflectionQA[] {
  return [
    { question: firstActivityQuestion(rating), answer: activityAnswer, kind: 'activity' },
    { question: buildFollowUpQuestion(activityAnswer, rating), answer: experienceAnswer, kind: 'experience' },
  ]
}

/**
 * 提炼「经验部分」的回答进知识库（Step 3）。
 * 设计原则：AI 不生成新内容，只梳理用户表达、提炼重点、分类信息。
 * 个人经历回答不进入知识库。
 * 注意：保留原文完整长度，不做截断——经验是给下一任社长看的，越真实越好。
 */
export function distillExperience(
  qas: ReflectionQA[],
  rating: ActivityRating,
): Array<{ content: string; type: KnowledgeType }> {
  const items: Array<{ content: string; type: KnowledgeType }> = []

  for (const qa of qas) {
    if (qa.kind !== 'experience') continue
    const text = qa.answer.trim()
    if (!text) continue

    const type: KnowledgeType = detectRisk(text)
    const prefix = rating >= 4 ? '成功经验' : '经验教训'
    // 保留完整原文（不再截断到 40 字）：经验是下一任社长要看的，尽量原汁原味
    const content = tidy(`${prefix}：${text}`)
    items.push({ content, type })
  }

  return items
}

/** 简单判断这条内容是否属于风险提示 */
function detectRisk(text: string): KnowledgeType {
  const riskMarkers = [
    '问题',
    '风险',
    '意外',
    '不足',
    '失败',
    '困难',
    '预算',
    '超支',
    '没准备',
    '不够',
    '迟到',
    '缺人',
    '下次要提前',
    '如果重新',
    '避坑',
    '教训',
  ]
  return riskMarkers.some((m) => text.includes(m)) ? 'risk' : 'experience'
}

/** 压缩空白、去首尾标点（仅做排版整理，不删内容） */
function tidy(text: string): string {
  return text.replace(/\s+/g, ' ').replace(/^[\s，。；：、,.;:]/, '').replace(/[\s，。；：、,.;:]+$/, '').trim()
}

/** 原型演示用的示例知识库数据（首次进入时填充） */
export function seedKnowledge(now: string): KnowledgeItem[] {
  return [
    {
      id: 'seed-1',
      type: 'experience',
      content: '成功经验：招新前提前一周在社团群和校园墙同步宣传，到场率明显更高',
      createdAt: now,
    },
    {
      id: 'seed-2',
      type: 'risk',
      content: '经验教训：设备搬运需要至少提前一天联系活动部，当天确认容易来不及',
      createdAt: now,
    },
  ]
}
