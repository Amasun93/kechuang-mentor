/**
 * /api/evaluate - 评估引擎
 *
 * 注入顺序(PROJECT_BRIEF §6.2):
 * 1. 主人提供的 PromptX 角色设定(从 env.PROMPTX_PERSONA_JSON 读)
 * 2. 当前比赛的 evaluation_dimensions(按学生学段筛选)
 * 3. 联网搜索补全的"今年最新政策"
 * 4. 学生当前的 profile 和 step 上下文
 *
 * 孩子端只返回鼓励性反馈(studentFeedback + suggestedQuestions + strongPoints),
 * 不直接暴露评分。
 *
 * 没配 KEY 时降级为基于规则的本地评估(也满足 9.1 验收)。
 */

import { Router } from 'express'
import { readFileSync, existsSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { chatCompletion, isMockMode } from '../services/volcengine.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const COMPETITIONS_DIR = join(__dirname, '..', '..', 'docs', 'competitions')

const router = Router()

// 缓存 3 比赛 JSON(避免每次读盘)
const COMPETITION_DATA = {}
function loadCompetitionData() {
  if (Object.keys(COMPETITION_DATA).length > 0) return COMPETITION_DATA
  const files = {
    qingchuang: '青创赛-评估标准.json',
    songqingling: '宋庆龄-评估标准.json',
    chuaying: '雏鹰杯-评估标准.json',
  }
  for (const [id, fname] of Object.entries(files)) {
    const path = join(COMPETITIONS_DIR, fname)
    if (existsSync(path)) {
      try {
        COMPETITION_DATA[id] = JSON.parse(readFileSync(path, 'utf-8'))
      } catch (e) {
        console.warn(`[evaluate] 读 ${fname} 失败:`, e.message)
      }
    }
  }
  return COMPETITION_DATA
}

/**
 * 学段 ID → 比赛 JSON 的 scoring_by_age key
 */
function gradeToAgeKey(grade) {
  return {
    primary: '小学',
    junior: '初中',
    senior: '高中',
  }[grade] || '初中'
}

/**
 * 加载 PromptX 角色设定
 * 主人会从 PromptX 云端导出 JSON 放到环境变量
 */
function loadPromptXPersona() {
  const raw = process.env.PROMPTX_PERSONA_JSON
  if (!raw) return null
  try {
    return JSON.parse(raw)
  } catch (e) {
    console.warn('[evaluate] PROMPTX_PERSONA_JSON 解析失败:', e.message)
    return null
  }
}

/**
 * 构造评估 prompt
 */
function buildEvaluatePrompt({ competition, profile, project, promptX }) {
  const ageKey = gradeToAgeKey(profile?.grade)
  const ageScoring = competition.age_group_focus?.scoring_by_age?.[ageKey] || ''
  const dimensionsText = (competition.evaluation_dimensions || [])
    .map((d) => `- **${d.name}**(权重 ${d.weight}%):${d.description}\n  评分标准: ${(d.scoring_criteria || []).join(' | ')}`)
    .join('\n')
  const pitfallsText = (competition.common_pitfalls || []).map((p, i) => `${i + 1}. ${p}`).join('\n')
  const patternsText = (competition.winning_patterns || []).map((p, i) => `${i + 1}. ${p}`).join('\n')

  const projectText = `
# 学生的当前方案
- 研究问题:${project?.question || '(空)'}
- 研究方法:${project?.method || '(空)'}
- 时间线:${project?.timeline || '(空)'}
- 资源清单:${project?.resources || '(空)'}
- 用户调研:${project?.survey || '(空)'}
- 灵感来源:${project?.inspiration || '(空)'}
`.trim()

  const profileText = `
# 学生档案
- 年级: ${profile?.grade || '未填'} (${ageKey})
- 兴趣: ${(profile?.interests || []).join('、') || '未填'}
- 经历: ${profile?.experience || '未填'}
- 想解决的问题: ${profile?.problem || '未填'}
`.trim()

  return `# 你的任务
你是一位<${competition.alias || competition.name}>的资深评委(模拟),需要评估一位${ageKey}学生的科创方案。

${promptX ? `# PromptX 角色设定注入\n${JSON.stringify(promptX, null, 2)}\n` : ''}

# 比赛定位
${competition.oneLine || competition.summary}

# ${ageKey}组的评分侧重点
${ageScoring}

# 评估维度(权重合计 100)
${dimensionsText}

# 常见错误(自查)
${pitfallsText}

# 获奖模式(参考)
${patternsText}

${profileText}

${projectText}

# 你的输出要求(关键!)

## ★★★ 严禁直接暴露评分或排名 ★★★
- ❌ 不要写"你的方案 70 分"
- ❌ 不要写"按维度评分:创新性 3/5,科学性 4/5"
- ❌ 不要用"优秀/良好/及格/不及格"这种等级词

## 输出 3 段 JSON(用 \`\`\`json 包裹):
\`\`\`json
{
  "studentFeedback": "(1-3 句鼓励性反馈,只说哪里能再深一层,不暴露具体分数。先肯定 1 句具体细节,再指出 1 个可改进点,最后鼓励 1 句)",
  "suggestedQuestions": [
    "评委可能问的 3 个问题(用孩子的口吻能听懂的)"
  ],
  "strongPoints": [
    "孩子做得不错的地方(具体,不是'很棒'这种空话)"
  ]
}
\`\`\`

## 写作风格
- 用孩子能听懂的话
- 多用"你"少用"该学生"
- 不堆砌专业术语
- 总长控制在 200-300 字`
}

/**
 * 规则降级评估(没配 KEY 时)
 * 基于 evaluation_dimensions + 项目字段存在性,做最简版评估
 */
function fallbackEvaluate({ competition, profile, project }) {
  const ageKey = gradeToAgeKey(profile?.grade)
  const dims = competition.evaluation_dimensions || []

  // 简单打分:每个维度按"是否填写 + 字数"给 1-5 分
  const scores = dims.map((d) => {
    const fieldMap = {
      '作品创新性': ['question', 'inspiration'],
      '新颖性': ['question', 'inspiration'],
      '创新性': ['question', 'inspiration'],
      '科学性与研究规范': ['method', 'survey'],
      '科学性': ['method', 'survey'],
      '完整性与工作量': ['timeline', 'method'],
      '完整性': ['timeline', 'method'],
      '实用性与社会价值': ['question', 'survey'],
      '实用性': ['question', 'survey'],
      '选题与学生认知匹配度': ['question'],
      '研究过程与学生主体性': ['method', 'timeline'],
      '学生主体性': ['method', 'timeline'],
      '现场表现与展示效果': ['resources', 'timeline'],
      '创造性': ['question', 'inspiration'],
      '参与度': ['timeline', 'resources'],
      '作品形态': ['method', 'resources'],
    }
    const fields = fieldMap[d.name] || ['question']
    const filled = fields.filter((f) => (project?.[f] || '').trim().length > 5).length
    const score = Math.min(5, Math.max(1, filled * 2 + 1))
    return { name: d.name, score, weight: d.weight }
  })

  // 找最强维度(反馈用)
  const best = scores.reduce((a, b) => (b.score > a.score ? b : a))
  // 找最弱维度(可改进点)
  const worst = scores.filter((s) => s.score < 4).sort((a, b) => a.score - b.score)[0]

  // 建议问题:根据缺失字段动态生成
  const suggestedQuestions = []
  if (!project?.survey || project.survey.length < 10) {
    suggestedQuestions.push('你打算访谈/调查谁?访谈几个人?为什么是这个数?')
  }
  if (!project?.timeline || project.timeline.length < 10) {
    suggestedQuestions.push('从今天到比赛,你打算怎么安排时间?能说出 3 个时间节点吗?')
  }
  if (!project?.method || project.method.length < 20) {
    suggestedQuestions.push('你说要做这个研究——能讲讲具体怎么做吗?分几步?每步要得到什么?')
  }
  if (!project?.question || project.question.length < 10) {
    suggestedQuestions.push('你的研究问题能用一句话讲清楚吗?评委最关心的就是这一句。')
  }
  while (suggestedQuestions.length < 3) {
    suggestedQuestions.push('评委可能挑的刺,你自己先想想是哪一处?')
  }

  // 鼓励性反馈(苏格拉底底色:不直接说"差",反问"评委可能问什么")
  const strongPoints = []
  if ((project?.question || '').length > 10) {
    strongPoints.push(`你的研究问题"${project.question.slice(0, 30)}..."挺聚焦,评委一眼能看懂。`)
  }
  if ((project?.inspiration || '').length > 10) {
    strongPoints.push('你的灵感来源有真实生活观察,这种"以小见大"的选题思路是评委最喜欢的。')
  }
  if ((project?.method || '').length > 20) {
    strongPoints.push('你已经能把研究方法写下来了,这种"拆步骤"的习惯很专业。')
  }
  if (strongPoints.length === 0) {
    strongPoints.push('你愿意迈出"想清楚自己的研究"这一步,这就是好的开始。')
  }

  // 学生端反馈(委婉,不说"差")
  const weaknessMap = {
    '作品创新性': '评委可能想看到你跟"已经存在的方案"有什么不同',
    '科学性与研究规范': '评委可能会问"你怎么证明你看到的就是真的?"',
    '完整性与工作量': '评委可能会问"这个研究从开始到做完要多久?"',
    '实用性与社会价值': '评委可能会问"你这个方案,谁能用得上?"',
    '选题与学生认知匹配度': '评委可能会想"这个课题,学生能独立完成吗?"',
    '研究过程与学生主体性': '评委可能会随机挑一个细节让你讲,看是不是你亲手做的',
  }
  const weaknessText = worst ? (weaknessMap[worst.name] || `评委可能想在「${worst.name}」上多看你一眼`) : ''

  return {
    studentFeedback: `你的方案已经有了一个不错的起点!${strongPoints[0] || '你能迈出这一步就很棒'}${weaknessText ? '——' + weaknessText : ''}。试着在这一块再补一些细节,你的方案就更有说服力了。`,
    suggestedQuestions: suggestedQuestions.slice(0, 3),
    strongPoints,
    // 内部评分仅供服务端日志,不返回给前端
    // _internal_scores: scores,
    // _internal_competition: competition.alias,
    // _internal_age: ageKey,
  }
}

/**
 * POST /api/evaluate
 * body: { competitionId, profile, project }
 */
router.post('/', async (req, res, next) => {
  try {
    const { competitionId, profile, project } = req.body
    if (!competitionId) {
      return res.status(400).json({ error: 'competitionId 必填' })
    }
    if (!project?.question) {
      return res.status(400).json({ error: 'project.question 必填(请先完成"项目设计")' })
    }
    const data = loadCompetitionData()
    const competition = data[competitionId]
    if (!competition) {
      return res.status(404).json({ error: `未找到比赛 ${competitionId},已加载: ${Object.keys(data).join(', ')}` })
    }

    const promptX = loadPromptXPersona()

    // mock 模式 → 用规则降级
    if (isMockMode()) {
      const result = fallbackEvaluate({ competition, profile, project })
      return res.json({ ...result, mock: true, competition: competition.alias, note: '未配置豆包 KEY,使用规则降级评估' })
    }

    // 真实豆包模式
    const system = buildEvaluatePrompt({ competition, profile, project, promptX })
    const userMsg = `请评估以下方案,只输出 3 段 JSON,不暴露具体分数。`
    const ai = await chatCompletion({
      system,
      messages: [{ role: 'user', content: userMsg }],
    })
    // 解析 JSON
    const jsonMatch = ai.content.match(/```json\s*([\s\S]*?)\s*```/) || ai.content.match(/\{[\s\S]*\}/)
    let parsed = null
    if (jsonMatch) {
      try {
        parsed = JSON.parse(jsonMatch[1] || jsonMatch[0])
      } catch (e) {
        // ignore
      }
    }
    if (!parsed) {
      // 解析失败 → 降级
      const result = fallbackEvaluate({ competition, profile, project })
      return res.json({ ...result, mock: true, raw: ai.content, note: '豆包输出未匹配 JSON,降级为规则评估' })
    }
    res.json({
      studentFeedback: parsed.studentFeedback || '',
      suggestedQuestions: parsed.suggestedQuestions || [],
      strongPoints: parsed.strongPoints || [],
      mock: false,
      competition: competition.alias,
      promptxInjected: !!promptX,
    })
  } catch (e) {
    next(e)
  }
})

/**
 * GET /api/evaluate/competitions - 列出可用比赛
 */
router.get('/competitions', (req, res) => {
  const data = loadCompetitionData()
  const list = Object.entries(data).map(([id, c]) => ({
    id,
    name: c.name,
    alias: c.alias,
    level: c.level,
    oneLine: c.oneLine || c.summary,
    ageGroupFocus: c.age_group_focus,
  }))
  res.json({ competitions: list })
})

/**
 * GET /api/evaluate/dimensions/:competitionId?grade=junior
 * 拿某比赛某学段的评估维度
 */
router.get('/dimensions/:competitionId', (req, res) => {
  const data = loadCompetitionData()
  const c = data[req.params.competitionId]
  if (!c) return res.status(404).json({ error: '比赛不存在' })
  const ageKey = gradeToAgeKey(req.query.grade)
  res.json({
    competition: c.alias,
    age: ageKey,
    ageScoring: c.age_group_focus?.scoring_by_age?.[ageKey],
    dimensions: c.evaluation_dimensions,
    commonPitfalls: c.common_pitfalls,
    winningPatterns: c.winning_patterns,
  })
})

export default router
