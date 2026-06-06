/**
 * 不同年级的 prompt 适配
 * 让产品支持小学 / 初中 / 高中三档自适应
 *
 * 关键差异:
 * 1. 语言复杂度
 * 2. 术语密度
 * 3. 引导深度(小学生更具体,高中生可以抽象)
 * 4. 案例推荐范围
 * 5. 节奏(小学生慢一些,高中生快一些)
 */

export const GRADE_LEVELS = [
  {
    id: 'primary',
    label: '小学',
    gradeRange: '3-6 年级',
    ageRange: '9-12 岁',
    color: 'bg-persona-warm/15 text-persona-warm border-persona-warm/40',
    desc: '直观、具体、有趣。多用"就像……一样"打比方。',
  },
  {
    id: 'junior',
    label: '初中',
    gradeRange: '初一 - 初三',
    ageRange: '12-15 岁',
    color: 'bg-gold-400/15 text-gold-200 border-gold-400/40',
    desc: '避免术语但可以用"实验""对照"等基础概念。',
  },
  {
    id: 'senior',
    label: '高中',
    gradeRange: '高一 - 高三',
    ageRange: '15-18 岁',
    color: 'bg-persona-analyst/15 text-persona-analyst border-persona-analyst/40',
    desc: '可适度引入"方法论""变量控制"等学术词汇。',
  },
]

/**
 * 年级相关的 prompt 片段
 * 拼接到 system 之后,影响 AI 的语言风格和深度
 */
export const AGE_PROMPTS = {
  primary: `
# 你的学生是小学生(3-6 年级,9-12 岁)
- 句子要短,多打比方:"就像……一样""你想想看,如果你把电池装反了会怎样?"
- 避免任何学术术语,"实验设计""对照组""信效度"全部改用白话。
- 一次只问 1 个非常具体的问题,不要抽象。
- 鼓励大于评判,多肯定孩子的观察:"你这个发现很棒!"
- 不需要孩子做"文献综述"或"数据分析",能"观察 + 描述"就够了。
- 如果孩子说"我看不出区别",不要给答案,而是问"你再仔细看 10 秒钟,这次注意到了什么?"`,

  junior: `
# 你的学生是初中生(初一 - 初三,12-15 岁)
- 避免"假设检验""信效度""文献综述"等术语,改用"你打算怎么证明""你怎么知道这个数据靠谱"。
- 可以用"实验""对照""变量"等基础概念。
- 一次问 1-2 个问题,鼓励孩子举例。
- 引导孩子用"数字"代替"感觉",但不要强迫。
- 可以问"如果让评委来看,他会先看哪里?"(高中组学生才适合这种提问,初中组用更简单的版本)`,

  senior: `
# 你的学生是高中生(高一 - 高三,15-18 岁)
- 可以适度引入"方法论""变量控制""样本量""数据可靠性"等词汇。
- 一次问 1-2 个有深度的问题,鼓励批判性思考。
- 可以问"如果让评委挑刺,他会先挑哪一处?"
- 引导孩子考虑"研究的局限"和"未来方向"。
- 不必"哄"孩子,直接挑战:"你说 X,但反方可能说 Y,你怎么回应?"`,
}

/**
 * 案例推荐时的年级权重
 * 根据学生年级,过滤或调整案例推荐顺序
 */
export const CASE_GRADE_TAGS = {
  // key 是案例 ID
  'case-001': ['junior', 'senior'], // 光催化 - 初高中
  'case-002': ['primary', 'junior'], // 防遗忘校车 - 小学初中
  'case-003': ['junior', 'senior'], // 睡眠研究 - 初高中
  'case-004': ['junior'],             // AI 叶片 - 初中
  'case-005': ['junior', 'senior'], // 加装电梯 - 初高中
  // 大老师实战案例(去名改写)
  'case-dale-01': ['primary', 'junior'], // 害羞男孩边哭边讲 - 小学初中
  'case-dale-02': ['junior', 'senior'],  // 骨骼关键点跑通 - 初高中
  'case-dale-03': ['senior', 'junior'],  // 福建 maker 同学 - 高中/初中
  'case-dale-04': ['junior', 'senior'],  // 罕见病手部康复 - 初高中
}

/**
 * 根据年级筛选案例
 */
export function filterCasesByGrade(cases, gradeId) {
  if (!gradeId) return cases
  return cases.filter((c) => {
    const tags = CASE_GRADE_TAGS[c.id] || ['junior']
    return tags.includes(gradeId)
  })
}

/**
 * 兴趣领域枚举
 * 破冰对话中会用到
 */
export const INTEREST_DOMAINS = [
  { id: 'life',     label: '日常生活', icon: '🏠', desc: '家里、学校、路上遇到的问题' },
  { id: 'env',      label: '环境生态', icon: '🌱', desc: '垃圾分类、空气、水、动植物' },
  { id: 'tech',     label: '科技工程', icon: '🛠️', desc: '小发明、小制作、机器人' },
  { id: 'ai',       label: 'AI / 编程', icon: '🤖', desc: 'AI 应用、APP、小程序' },
  { id: 'health',   label: '身心健康', icon: '💪', desc: '睡眠、运动、饮食、心理' },
  { id: 'society',  label: '社会观察', icon: '🏘️', desc: '社区、邻里、校园文化' },
  { id: 'culture',  label: '文化艺术', icon: '🎨', desc: '传统、传承、调查' },
  { id: 'astronomy', label: '天文航天', icon: '🚀', desc: '星座、火箭、卫星' },
]

/**
 * 学生档案结构定义
 * 破冰对话后写入 localStorage
 */
export function emptyProfile() {
  return {
    grade: null,           // primary / junior / senior
    interests: [],         // 兴趣领域 id 列表
    experience: '',         // 是否有科创经历(自由文本)
    targetCompetitions: [], // 目标比赛 id 列表
    problem: '',           // 是否有特别想解决的问题
    onboarded: false,      // 是否完成破冰
    createdAt: null,
  }
}
