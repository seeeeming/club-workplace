import type { ActivityRating, KnowledgeItem, KnowledgeType, ReflectionQA } from '../types'

/**
 * ============ Reflection 引导引擎 ============
 *
 * 结构化 4 步引导复盘（按评分调整主次）：
 *   1. 还原过程 —— 按环节记录活动怎么一步步办下来（选填，可跳过）→ 流程记录
 *   2. 主次一：高分问「做得好的」/ 低分问「没达预期的」（→ 成功经验 / 经验教训）
 *   3. 主次二：高分问「还能更好」/ 低分找「做得好的」（→ 改进建议 / 成功经验）
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
  /** 回答性质：activity 记活动过程（同时沉淀为流程记录）；experience 提炼进知识库 */
  kind: 'activity' | 'experience'
  /** 进知识库后的条目类型（kind=experience 时有效） */
  knowledgeType?: KnowledgeType
  /** 是否选填（可跳过），如第 1 步「还原过程」 */
  optional?: boolean
  /** 内容前缀（如「成功经验」「改进建议」「传承经验」） */
  prefix?: string
}

/** 评分对应的开场白 */
export function openingLine(rating: ActivityRating): string {
  if (rating >= 4) return '这次活动办得挺不错的！我们花几分钟，把值得记住的东西留下来。'
  return '没关系，每一次活动都是经验。我们一起把这其中最有价值的部分留下来。'
}

/**
 * 按评分返回 4 步引导问题（评分决定主次顺序与产出类型）：
 *   高分：亮点→经验、改进→风险；低分：不足→教训、亮点→经验
 */
export function guidedSteps(rating: ActivityRating): GuidedStep[] {
  const good = rating >= 4
  return [
    {
      step: 1,
      label: '还原过程',
      kind: 'activity',
      optional: true,
      question:
        '你还记得这次活动是怎么一步步办下来的吗？从策划、准备到现场、收尾，哪个环节都行——你做了什么都写下来，想起来多少写多少。这些会成为「流程记录」，留给以后办活动的人参考。',
    },
    {
      step: 2,
      label: good ? '做得好的' : '没达预期的',
      kind: 'experience',
      knowledgeType: good ? 'experience' : 'risk',
      prefix: good ? '成功经验' : '经验教训',
      question: good
        ? '你觉得这次活动里，哪个环节做得特别好、值得以后照着做？'
        : '你觉得这次活动里，哪个环节没达到你的预期？',
    },
    {
      step: 3,
      label: good ? '还能更好' : '做得好的',
      kind: 'experience',
      knowledgeType: good ? 'risk' : 'experience',
      prefix: good ? '改进建议' : '成功经验',
      question: good
        ? '那有没有哪个环节，你觉得下次还能做得更好？'
        : '那有没有哪个环节，你觉得做得还不错、可以保留下来？',
    },
    {
      step: 4,
      label: '传给下一任',
      kind: 'experience',
      knowledgeType: 'experience',
      prefix: '传承经验',
      question: '如果下一任社长要办一场类似的活动，你最想告诉他的「一句话」是什么？',
    },
  ]
}

/**
 * 把每步回答提炼成知识条目（整理页展示、确认后保存）。
 * 第 1 步「还原过程」→ 流程记录（process，不加前缀）；其余步骤 → 经验/风险。
 * 类型由步骤决定，不再靠关键词猜测。
 */
export function distillExperience(
  steps: GuidedStep[],
  answers: string[],
): Array<{ content: string; type: KnowledgeType }> {
  const items: Array<{ content: string; type: KnowledgeType }> = []
  for (let i = 0; i < steps.length; i++) {
    const step = steps[i]
    const text = (answers[i] ?? '').trim()
    if (!text) continue
    if (step.kind === 'activity') {
      // 第 1 步：按环节记录的活动过程，作为「流程记录」沉淀，不加前缀
      items.push({ content: tidy(text), type: 'process' })
    } else {
      items.push(buildItem(step, text))
    }
  }
  return items
}

/** 按步骤生成带前缀的知识条目 */
function buildItem(step: GuidedStep, text: string): { content: string; type: KnowledgeType } {
  return {
    content: tidy(`${step.prefix ?? ''}：${text}`),
    type: step.knowledgeType ?? 'experience',
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
