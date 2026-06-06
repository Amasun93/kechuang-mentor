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
  { id: 'appreciate',  key: '01', name: '看优秀案例',   nameEn: 'APPRECIATE',  desc: '好课题长什么样' },
  { id: 'inspiration', key: '02', name: '找到兴趣点',   nameEn: 'INSPIRATION', desc: '从生活里挖' },
  { id: 'structure',   key: '03', name: '课题方向聚焦', nameEn: 'STRUCTURE',   desc: '收到一个可研究的问题' },
  { id: 'draft',       key: '04', name: '研究方案设计', nameEn: 'DRAFT',       desc: '拆成可执行步骤' },
  { id: 'refine',      key: '05', name: '方案评估',     nameEn: 'REFINE',      desc: '让方案更稳' },
  { id: 'achievement', key: '06', name: '项目档案',     nameEn: 'ACHIEVEMENT', desc: '保存你的想法' },
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
