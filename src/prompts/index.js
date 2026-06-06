/**
 * Prompt 统一出口
 * 给 AI 引导窗调用,根据 step 拿到对应 prompt
 */

import { SYSTEM_PROMPT, buildSystemPrompt } from './system.js'
import { APPRECIATE_PROMPT } from './appreciate.js'
import { INSPIRATION_PROMPT } from './inspiration.js'
import { STRUCTURE_PROMPT } from './structure.js'
import { DRAFT_PROMPT } from './draft.js'
import { REFINE_PROMPT } from './refine.js'
import { ACHIEVEMENT_PROMPT } from './achievement.js'
import { ONBOARDING_PROMPT } from './onboarding.js'
import { AGE_PROMPTS } from '../data/age_adaptations.js'

const STAGE_PROMPTS = {
  onboarding: ONBOARDING_PROMPT,
  appreciate: APPRECIATE_PROMPT,
  inspiration: INSPIRATION_PROMPT,
  structure: STRUCTURE_PROMPT,
  draft: DRAFT_PROMPT,
  refine: REFINE_PROMPT,
  achievement: ACHIEVEMENT_PROMPT,
}

export const STEPS = [
  { id: 'inspiration', key: '01', name: '开题交流',   nameEn: 'OPENING',     desc: '先把起点聊清楚', enabled: true },
  { id: 'appreciate',  key: '02', name: '背景调研',   nameEn: 'RESEARCH',    desc: '看案例和资料', enabled: true },
  { id: 'structure',   key: '03', name: '项目设计',   nameEn: 'DESIGN',      desc: '收到一个可研究的问题', enabled: true },
  { id: 'draft',       key: '04', name: '方案设计',   nameEn: 'PLAN',        desc: '拆成可执行步骤', enabled: true },
  { id: 'refine',      key: '05', name: '测试优化',   nameEn: 'TEST',        desc: '后续开发', enabled: false },
  { id: 'achievement', key: '06', name: '申报材料',   nameEn: 'SUBMISSION',  desc: '后续开发', enabled: false },
]

/**
 * 拼接最终发送给豆包的 system prompt
 * @param {object} opts
 * @param {string} opts.step - 步骤 ID(onboarding / appreciate / ...)
 * @param {string} opts.personalityPrompt - 性格 prompt
 * @param {object} opts.profile - 学生档案
 * @returns {string}
 */
export function buildFullSystemPrompt({ step, personalityPrompt, profile }) {
  const stagePrompt = STAGE_PROMPTS[step] || STAGE_PROMPTS.appreciate
  const agePrompt = profile?.grade ? AGE_PROMPTS[profile.grade] : ''
  return buildSystemPrompt(personalityPrompt, stagePrompt + agePrompt, profile, step)
}

export { SYSTEM_PROMPT }
