import type { ActivityRating, KnowledgeItem, KnowledgeType, ReflectionQA } from '../types'

/**
 * ============ Reflection 引导引擎 ============
 *
 * 结构化 4 步引导复盘（按评分调整主次）：
 *   1. 回到现场 —— 个人经历，进活动存档（不进知识库）
 *   2. 主次一：高分问「做得好的」/ 低分问「没达预期的」（→ 成功经验 / 经验教训）
 *   3. 主次二：高分问「想改进的」/ 低分找「做得好的」（→ 改进建议）
 *   4. 传承精华 —— 一句话传给下一任社长（→ 传承经验）
 *
 * 接入真实大模型时，把 guidedSteps() 替换成 AI 生成问题、distillExperience()
 * 替换成 AI 提炼即可，输出契约保持不变。
 */

/** 引导步骤定义 */
export interface GuidedStep {
  /** 步骤序号（1-4） */
  step: number
  /** 步骤标签（对话里的小标题，如「回到现场」） */
  label: string
  /** 问题文案 */
  question: string
  /** 回答性质：activity 只进活动存档；experience 进知识库 */
  kind: 'activity' | 'experience'
  /** 进知识库后的条目类型（kind=experience 时有效） */
  knowledgeType?: 'experience' | 'risk' | 'legacy'
}

/** 评分对应的开场白 */
export function openingLine(rating: ActivityRating): string {
  if (rating >= 4) return '这次活动办得挺不错的！我们花几分钟，把值得记住的东西留下来。'
  return '没关系，每一次活动都是经验。我们一起把这其中最有价值的部分留下来。'
}

/** 按评分返回 4 步引导问题（评分决定主次顺序） */
export function guidedSteps(rating: ActivityRating): GuidedStep[] {
  const good = rating >= 4
  return [
    {
      step: 1,
      label: '回到现场',
      kind: 'activity',
      question: '这次活动从开始到结束，有没有让你印象最深的一件事，或一个瞬间？',
    },
    {
      step: 2,
      label: good ? '做得好的' : '没达预期的',
      kind: 'experience',
      knowledgeType: 'experience',
      question: good
        ? '你觉得这次活动里，哪一部分做得特别好、值得以后照着做？'
        : '你觉得这次活动里，哪一部分没达到你的预期？',
    },
    {
      step: 3,
      label: good ? '想改进的' : '做得好的',
      kind: 'experience',
      knowledgeType: 'risk',
      question: good
        ? '那如果重来一次，有没有哪一处你会换一种做法？'
        : '那有没有哪怕一点，你觉得做得还不错、可以保留下来的？',
    },
    {
      step: 4,
      label: '传给下一任',
      kind: 'experience',
      knowledgeType: 'legacy',
      question: '如果下一任社长要办一场类似的活动，你最想告诉他的「一句话」是什么？',
    },
  ]
}

/**
 * 把每步回答提炼成知识条目（Step 3 展示、确认后保存）。
 * 只提炼 experience 部分；个人经历（第 1 步）只进活动存档，不进知识库。
 * 类型由步骤决定，不再靠关键词猜测。
 */
export function distillExperience(
  steps: GuidedStep[],
  answers: string[],
  rating: ActivityRating,
): Array<{ content: string; type: KnowledgeType }> {
  const items: Array<{ content: string; type: KnowledgeType }> = []
  for (let i = 0; i < steps.length; i++) {
    const step = steps[i]
    if (step.kind !== 'experience') continue
    const text = (answers[i] ?? '').trim()
    if (!text) continue
    items.push(buildItem(step, text, rating))
  }
  return items
}

/** 按步骤类型生成带前缀的知识条目 */
function buildItem(
  step: GuidedStep,
  text: string,
  rating: ActivityRating,
): { content: string; type: KnowledgeType } {
  switch (step.knowledgeType) {
    case 'risk':
      return { content: tidy(`改进建议：${text}`), type: 'risk' }
    case 'legacy':
      return { content: tidy(`传承经验：${text}`), type: 'experience' }
    default:
      return { content: tidy(`${rating >= 4 ? '成功经验' : '经验教训'}：${text}`), type: 'experience' }
  }
}

/** 压缩空白、去首尾标点（仅做排版整理，不删内容） */
function tidy(text: string): string {
  return text.replace(/\s+/g, ' ').replace(/^[\s，。；：、,.;:]/, '').replace(/[\s，。；：、,.;:]+$/, '').trim()
}

/** 组装引导问答对（供活动记录存档） */
export function buildQAs(steps: GuidedStep[], answers: string[]): ReflectionQA[] {
  return steps.map((s, i) => ({
    question: s.question,
    answer: answers[i] ?? '',
    kind: s.kind,
  }))
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
