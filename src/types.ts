/** 活动评分（1~5 星） */
export type ActivityRating = 1 | 2 | 3 | 4 | 5

/** 知识沉淀的类型 */
export type KnowledgeType = 'experience' | 'risk'

/** 一条沉淀后的知识条目 */
export interface KnowledgeItem {
  id: string
  type: KnowledgeType
  /** 提炼后的内容 */
  content: string
  /** 原始来源的 reflectionId（若来自某次复盘） */
  reflectionId?: string
  createdAt: string
}

/** 活动状态：草稿 → 进行中 → 待复盘 → 已完成 */
export type ActivityStatus = 'draft' | 'inProgress' | 'pendingReflection' | 'completed'

/** 一次活动 */
export interface Activity {
  id: string
  title: string
  /** 活动照片（base64 或 object URL） */
  photo?: string
  /** 创建时间（草稿 / 进行中阶段在每次保存时刷新为最近编辑时间） */
  createdAt: string
  /** 走完 6 步流程的时间（草稿 / 进行中阶段没有） */
  completedAt?: string
  /** 当前状态 */
  status: ActivityStatus
}

/**
 * Reflection 引导问答（一对）
 *
 * kind 区分回答性质：
 * - `activity`：个人经历（做了什么、发生了什么），进活动记录，**不进知识库**
 * - `experience`：经验总结（学到了什么），AI 提炼后才可沉淀进知识库
 */
export interface ReflectionQA {
  question: string
  answer: string
  kind: 'activity' | 'experience'
}

/** 一次完整的 Reflection */
export interface Reflection {
  id: string
  activityId: string
  rating: ActivityRating
  /** 引导问答记录（含性质分类） */
  qas: ReflectionQA[]
  /** AI 提炼后进入知识库的条目 id */
  knowledgeIds: string[]
  createdAt: string
}

/** 用户成长统计数据 */
export interface GrowthStats {
  /** 已完成活动数 */
  completedActivities: number
  /** 已完成 Reflection 数 */
  reflections: number
  /** 已贡献经验数 */
  experiences: number
  /** 已新增风险提醒数 */
  risks: number
}

/** 成长等级 */
export interface GrowthLevel {
  /** 需要达到的 Reflection 次数 */
  count: number
  emoji: string
  name: string
  /** 英文名 */
  en: string
  /** 解锁时的成长提示 */
  message: string
}

/** Reflection 流程中的步骤 */
export type ReflectionStep = 'rating' | 'guided' | 'summary' | 'done'
