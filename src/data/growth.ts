import type { GrowthLevel } from '../types'

/** Reflection 成长等级表（按次数解锁） */
export const GROWTH_LEVELS: GrowthLevel[] = [
  {
    count: 1,
    emoji: '🌱',
    name: 'Reflection 初心者',
    en: 'Beginner',
    message: '恭喜完成第一次 Reflection！\n每一次记录，都会帮助未来的自己，也帮助未来的社长。',
  },
  {
    count: 3,
    emoji: '🌿',
    name: 'Reflection 探索者',
    en: 'Explorer',
    message: '你已经逐渐养成了复盘的习惯。\n好的经验，来自一次次认真思考。',
  },
  {
    count: 7,
    emoji: '🌳',
    name: 'Reflection 达人',
    en: 'Master',
    message: '你的经验正在不断丰富社团知识库。\n谢谢你的分享。',
  },
  {
    count: 10,
    emoji: '⭐',
    name: 'Reflection Expert',
    en: 'Expert',
    message: '你的经验已经成为社团传承的重要组成部分。\n感谢你为社团留下宝贵的知识。',
  },
] as const

/** 根据已完成次数返回当前等级（未达 1 次时返回 null） */
export function getLevel(count: number): GrowthLevel | null {
  let current: GrowthLevel | null = null
  for (const level of GROWTH_LEVELS) {
    if (count >= level.count) current = level
    else break
  }
  return current
}

/** 返回下一次解锁等级（用于进度提示），已满级返回 null */
export function getNextLevel(count: number): GrowthLevel | null {
  return GROWTH_LEVELS.find((l) => count < l.count) ?? null
}
