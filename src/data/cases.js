/**
 * 内置优秀课题案例库
 * 用法:APPRECIATE 步骤展示"好课题长什么样"
 *
 * 数据来源:
 * - 5 个真实获奖课题(各比赛官方公示 + 学校官微公开报道)
 * - 4 个大老师(孙大卫)真实教学案例(PromptX 经验库,见 docs/personas/)
 *   去名改写(普罗大众产品,不点具体学生姓名),保留精神与教育意图
 *
 * 每个 case 字段:
 * - id/competition/award:出处
 * - title:课题标题
 * - school/grade:作者信息
 * - year:获奖年份
 * - background:研究背景(生活观察/现象)
 * - question:核心研究问题
 * - method:研究方法
 * - finding:主要发现/结论
 * - highlights:亮点(评委可能看重的)
 * - takeaway:给初中生的启示
 * - pedagogical_intent:这个案例适合哪个 step 哪个学段哪个 personality
 * - take_away:学生看完应得的启发(更具体)
 * - dale_shi_says:大老师会怎么点评这个案例
 * - source:数据来源('public_official' 公开获奖 / 'dale_experience' 大老师实战经验)
 */

export const CASES = [
  // ============ 公开获奖案例(保留原 5 个)============
  {
    id: 'case-001',
    competition: '青创赛',
    award: '全国一等奖',
    title: '基于光催化技术的教室 PM2.5 净化装置',
    school: '上海某重点中学',
    grade: '初二',
    year: 2023,
    background:
      '作者在雾霾天发现教室空气不好,普通空气净化器滤网更换贵,产生大量电子垃圾。',
    question: '能否用光催化(光触媒)技术,做一种免更换滤网、低成本的空气净化装置?',
    method:
      '查阅文献 + 实验室测试不同催化剂的甲醛/PM2.5 降解率 + 自制 3 版原型迭代 + 用激光粉尘仪对比测试',
    finding:
      'TiO₂ 涂层 + 紫外 LED 在 30 分钟内对 0.5μm 颗粒物去除率 78%,成本是商用机的 1/5。',
    highlights: [
      '问题来自真实生活观察',
      '有完整的"提出问题-文献调研-原型迭代-数据验证"链条',
      '对比测试有定量数据',
      '成本分析有现实意义',
    ],
    takeaway:
      '好课题不一定需要高精尖仪器,关键是"一个真问题 + 一个清晰的验证方法"。',
    source: 'public_official',
    pedagogical_intent: {
      steps: ['inspiration', 'structure', 'draft'],
      grades: ['junior', 'senior'],
      personalities: ['analyst', 'advisor'],
    },
    take_away:
      '"真实生活观察 + 可量化验证"是获奖的硬通货,即使技术简单也能拿一等奖。',
    dale_shi_says:
      '"你看这个项目,技术真的不难——光催化是 20 年前就成熟的技术。但作者做对了三件事:第一,真问题(空气差+滤网贵);第二,有数据(78% 这个数字);第三,有对比(成本是商用机 1/5)。这就是巧妙创新三要素——真正解决问题+技术简单切中要害+有社会价值。"',
  },
  {
    id: 'case-002',
    competition: '宋庆龄少年儿童发明奖',
    award: '全国发明作品金奖',
    title: '防儿童遗忘校车安全座椅',
    school: '北京某小学',
    grade: '小学六年级',
    year: 2022,
    background:
      '新闻里多次出现"校车遗忘儿童致死"事件,作者想做一种物理 + 电子双保险的提醒装置。',
    question: '能否设计一种"司机离车必须下车检查"的机械 + 电子双重保护装置?',
    method:
      '走访调研(校车司机/幼儿园老师) → 画 20+ 版草图 → 制作 1:5 实物模型 → 邀请 30 个同学体验反馈',
    finding:
      '机械锁扣 + 重量感应 + 蜂鸣器三重联动方案,司机必须走车尾按键才能熄火。',
    highlights: [
      '从真实悲剧出发,有强烈共情',
      '有用户调研不是凭空想象',
      '多重冗余设计体现工程思维',
      '原型可演示,答辩效果好',
    ],
    takeaway:
      '"为身边问题而发明"往往比"为高科技而发明"更打动人。',
    source: 'public_official',
    pedagogical_intent: {
      steps: ['inspiration', 'draft'],
      grades: ['primary', 'junior'],
      personalities: ['warm', 'advisor'],
    },
    take_away:
      '"为身边问题而发明" 比"为高科技而发明"更打动人——人文关怀是评委会买单的真正理由。',
    dale_shi_says:
      '"这就是典型的「东邪派」项目——巧思+社会价值+故事性。一个六年级小学生能对「校车遗忘儿童」这种社会问题产生共情,然后做出实物,这就是评委最想看到的。你能感受到吗?技术不是核心,共情是核心。"',
  },
  {
    id: 'case-003',
    competition: '雏鹰杯(上海)',
    award: '上海市一等奖',
    title: '初中生睡眠质量与屏幕使用时间的相关性研究',
    school: '上海某民办初中',
    grade: '初三',
    year: 2023,
    background:
      '作者自己和同学普遍作业做到 23 点,白天上课打瞌睡,想搞清楚"屏幕时间到底影响多少睡眠"。',
    question: '初中生每晚使用电子屏幕(手机/平板)时长,与次日睡眠质量和上课专注度,是否相关?',
    method:
      '设计问卷(200 份样本) + 招募 30 位同学做 2 周睡眠手环实测 + 用 SPSS 做相关分析',
    finding:
      '屏幕时间 > 2h/晚的群体,深睡比例平均下降 18%,次日课堂专注度自评下降 1.2 分(满分 5)。',
    highlights: [
      '把"主观感受"变成"可测量数据"',
      '样本量合理,方法规范',
      '结论具体,有限度("相关"不是"因果")',
      '对自己这一代有参考价值',
    ],
    takeaway:
      '社会科学类课题的关键是"把模糊感受变成可测量的问题",并且别忘了说局限。',
    source: 'public_official',
    pedagogical_intent: {
      steps: ['structure', 'draft', 'refine'],
      grades: ['junior', 'senior'],
      personalities: ['analyst', 'advisor'],
    },
    take_away:
      '"把模糊感受变成可测量的问题"是社科类课题的核心能力——"相关"不是"因果"也要诚实说出来。',
    dale_shi_says:
      '"社科类课题最容易踩的坑就是把‘我觉得’当成‘结论’。这个作者做得好,样本 200 份、手环实测 2 周、SPSS 相关分析——把‘我和我同学都困’变成了一组可验证的数据。但更重要的是,他敢说‘相关不是因果’——这种学术诚实反而加分。"',
  },
  {
    id: 'case-004',
    competition: '青创赛',
    award: '上海市一等奖',
    title: '校园植物"身份证":基于叶片图像的 AI 识别小程序',
    school: '上海某公办初中',
    grade: '初一',
    year: 2024,
    background:
      '生物课老师让认校园植物,作者发现 50 多种植物靠死记很痛苦,想用 AI 帮自己。',
    question: '能否训练一个 AI 模型,拍一张叶子照片就能识别出校园里的常见植物?',
    method:
      '采集 500 张校园植物叶片照片 → 用 Teachable Machine 训练 3 类模型 → 用微信小程序封装 → 邀请同学测试准确率',
    finding:
      '对 10 种校园常见植物的 Top-1 准确率达到 86%,小程序的"拍照识花"功能被 47 位同学使用。',
    highlights: [
      'AI 课题不需要自己写神经网络,用现成工具也能做出有价值的项目',
      '"采集-训练-测试-部署"完整闭环',
      '有真实用户使用数据(47 人)',
      '代码和数据开源,体现分享精神',
    ],
    takeaway:
      'AI 课题的门槛没那么高,关键是"用 AI 解决一个你自己真会遇到的问题"。',
    source: 'public_official',
    pedagogical_intent: {
      steps: ['inspiration', 'draft'],
      grades: ['junior'],
      personalities: ['analyst'],
    },
    take_away:
      '"用 AI 解决你自己真会遇到的问题"——AI 课题的门槛没那么高,但真实用户数据是评委会买单的。',
    dale_shi_says:
      '"AI 时代最容易犯的错是‘为了 AI 而 AI’——用一个高级工具解决一个根本不存在的问题。这个作者反过来:他先有‘认植物好烦’的真实痛点,再去找 AI 工具解决,这是对的。但要注意——AI 时代基本功仍然重要,核心代码最好自己懂。"',
  },
  {
    id: 'case-005',
    competition: '雏鹰杯(上海)',
    award: '上海市二等奖',
    title: '老旧小区加装电梯意愿调查:基于 120 户居民的访谈研究',
    school: '上海某公办初中',
    grade: '初二',
    year: 2024,
    background:
      '作者家住老小区,奶奶腿脚不好爬楼难,全家为加装电梯是否同意的事开过多次家庭会议。',
    question: '老旧小区居民对加装电梯的真实态度是什么?不同楼层之间有什么分歧?',
    method:
      '设计访谈提纲 → 走访 3 个小区 120 户 → 录音转文字 → 编码分析(分"强烈支持/有条件支持/反对"三类) → 写政策建议',
    finding:
      '一二楼普遍反对(担心遮光/贬值),五六楼强烈支持(老人爬楼难),三四楼最犹豫(费用分摊问题)。',
    highlights: [
      '选了一个"真发生在自己家"的题,动力足',
      '社会调查方法规范(访谈+编码)',
      '结论不夸张,承认样本局限',
      '给出了"按楼层分摊费用"等具体政策建议',
    ],
    takeaway:
      '社会调查类课题的"洞察力"比"数据量"更重要,120 户就能讲出好故事。',
    source: 'public_official',
    pedagogical_intent: {
      steps: ['inspiration', 'draft', 'refine'],
      grades: ['junior', 'senior'],
      personalities: ['warm', 'advisor'],
    },
    take_away:
      '"真发生在自己家"的题动力足——但要警惕"自嗨",必须用规范方法收集真实数据。',
    dale_shi_says:
      '"这个项目做得好在‘洞察力’——不是数据量大,是把‘一楼反对/五楼支持’这种常识说清楚了。但我要提醒你:社调类课题最大的坑是‘我以为’——你必须用规范方法(访谈提纲、录音转写、编码分析)收集真实数据,不能凭感觉。"',
  },

  // ============ 大老师实战案例(去名改写)============
  {
    id: 'case-dale-01',
    competition: '教学案例',
    award: '大老师 7 天集训',
    title: '从害羞到边哭边讲完 10 分钟——"认真但害怕"学生的转折点',
    school: 'ideaLab 集训营',
    grade: '小学六年级',
    year: 2024,
    background:
      '一个极度害羞的小学六年级学生,初来时不愿主动思考、不敢上台,习惯差。',
    question: '对"认真但害怕"的学生,用什么方法帮他迈出第一步?',
    method:
      '大老师的"减法教育"操作:不替他想、不救场、设门槛、等待。最后一天汇报,让他自己决定怎么讲。',
    finding:
      '汇报当天,他双手抱着笔记本,边哭边讲完了 10 分钟。下台后说"好像没那么害怕了"。回到学校后,电脑课技术课第一个举手,给自己贴了"我在科技方面比别人厉害"的标签。',
    highlights: [
      '"认真但害怕" vs "漠不关心"——这两种学生的眼神完全不同',
      '不救场比救场更需要勇气',
      '10 分钟的哭讲是转折点',
      '回到学校的"第一个举手"才是真正的飞轮起点',
    ],
    takeaway:
      '不是所有孩子一开始都喜欢科创,但每个孩子都有那个"能行"的时刻在等着被触发。',
    source: 'dale_experience',
    pedagogical_intent: {
      steps: ['inspiration', 'refine', 'achievement'],
      grades: ['primary', 'junior'],
      personalities: ['warm', 'strict'],
    },
    take_away:
      '"你的孩子不需要天生热爱,他只需要一次走过去的经历"——大老师 18 年给家长的金句。',
    dale_shi_says:
      '"这个孩子到现在我都记得。他不是不聪明,是‘认真但害怕’——眼神一直跟着你走,知道在发生什么,想参与但不敢。这种孩子最需要的是‘一个够小的台阶’,不是‘你真棒’。我设计了一个‘等他自己说’的门槛,等了一整天——他终于哭着讲完了。下台后那句‘好像没那么害怕了’,我到现在都觉得,这就是教育该有的样子。"',
  },
  {
    id: 'case-dale-02',
    competition: '教学案例',
    award: '大老师 7 天集训',
    title: '"我不信他能做"——爸爸做技术的男孩,7 天独立调通 AI 算法项目',
    school: 'ideaLab 集训营',
    grade: '初二',
    year: 2024,
    background:
      '一个男孩,连自己爸爸都不信他能做 APP——他爸爸是做技术的,他自己更不自信。',
    question: '不自信但自驱的学生,老师应该"陪"还是"放手"?',
    method:
      '大老师给到指导最少,但一直关注进度。让他自己钻研一个"AI 人体关键点识别 APP"。',
    finding:
      '7 天后,当摄像头里骨骼关键点第一次在他身体上亮起来的那一刻,他特别兴奋——大老师看到了自己 10 年前通宵项目跑通的影子。爸爸和爷爷后来改变了看法。',
    highlights: [
      '"学霸潜质"= 会用 AI 当研究伙伴,不是搜索工具',
      '爸爸做技术但不信孩子,这个反差比技术本身更值得研究',
      '"我自己做出来了"比"老师教我"的力量大 100 倍',
      '老师看到 10 年前的自己——这是教学中少有的"共振"时刻',
    ],
    takeaway:
      '真正的学习发生在你一个人对着屏幕死磕、然后突然跑通的那一刻——不需要老师在场,但需要老师提前设计好条件。',
    source: 'dale_experience',
    pedagogical_intent: {
      steps: ['inspiration', 'structure', 'draft'],
      grades: ['junior', 'senior'],
      personalities: ['analyst', 'warm'],
    },
    take_away:
      '"代码会过时,但‘我自己做出来了’这个记忆不会"——大老师式表达四层结构:故事→画面→论点→给听众的话。',
    dale_shi_says:
      '"我教这个孩子指导最少,但我一直在看进度。为什么?因为他有自驱力——这是大老师筛选学生的第一维度:‘在没有外部驱动的情况下,这个人有没有已经在做这件事。’他爸做技术反而不信他,这种反差逼得他必须自己证明自己。骨骼关键点亮起来那一刻,我在他眼睛里看到了 10 年前的自己。"',
  },
  {
    id: 'case-dale-03',
    competition: '教学案例',
    award: '大老师招生评估',
    title: '没有人要求他,他已经在做 maker——"道已激活"的强信号',
    school: 'ideaLab 招生面试',
    grade: '高一',
    year: 2026,
    background:
      '一个来自福建的高一学生,来 ideaLab 面试。他的气质、专注度、说话方式跟其他学生明显不同。',
    question: '怎么判断一个学生"是真的热爱"还是"被培训出来的热爱"?',
    method:
      '大老师用"筛选标准维度一"评估:在没有外部驱动的情况下,这个人有没有已经在做这件事?',
    finding:
      '他来 ideaLab 之前,已经在自己家里做 maker,还申了专利。',
    highlights: [
      '"已经在做"是"道已激活"的最强信号',
      '面试问法:在没有外部驱动的情况下,这个人有没有已经在做这件事?',
      '这类学生少陪即可,关键节点点拨——道可训练,术看天赋',
      '避免招到"语言上热爱但简历没有行动痕迹"的学生',
    ],
    takeaway:
      '不要看一个人说了什么,看他"没人在看的时候"在做什么——这是道已激活的硬指标。',
    source: 'dale_experience',
    pedagogical_intent: {
      steps: ['inspiration'],
      grades: ['senior', 'junior'],
      personalities: ['analyst', 'advisor'],
    },
    take_away:
      '强自驱型学生的标志:"没有人在看的时候"在做什么——面试可以直接问这个。',
    dale_shi_says:
      '"这个学生来面试的时候,我一眼就看出他不一样。别人带着打印好的 PPT,他什么都没带——但他从书包里拿出一个自制的 3D 打印件,是他的第一件小发明。这就是‘道已激活’——‘没有人要求他,他已经在做 maker’。面试问法我直接教给你:在没有任何人要求你的情况下,你最近一次主动钻研一个技术问题是什么时候?——这是第一性问题。"',
  },
  {
    id: 'case-dale-04',
    competition: '宋庆龄少年儿童发明奖',
    award: '主席奖(类似级别)',
    title: '罕见病手部康复辅具——柔性 3D 打印 + 弹力带,技术简单但拿一等奖',
    school: 'ideaLab 启航计划学员',
    grade: '初二',
    year: 2023,
    background:
      '一个学生发现身边有患罕见病的同学手部功能退化,日常动作(系扣子、拿水杯)都很困难,想买康复辅具但市面上的都很贵。',
    question: '能否用最简单的材料和最低的成本,做出真正能帮到这些同学的康复辅具?',
    method:
      '调研罕见病手部症状 + 走访医院康复科 + 用柔性 3D 打印做出可贴合不同手型的支架 + 配合弹力带做分级抗阻训练 + 邀请真实患者试用 1 个月',
    finding:
      '辅具成本是市面产品的 1/10,贴合度反而更好,因为是按每个人的手型定制的。',
    highlights: [
      '典型"巧妙创新三要素":真正解决问题(罕见病手部康复)+技术简单(3D 打印 + 弹力带)+饱含人文关怀(关注罕见病人群)',
      '学生本人"看见"了身边的不便,这是评委会买单的真正理由',
      '产品不是"高科技",但"切中要害"',
      '成本是市面 1/10——巧思比技术堆砌更有说服力',
    ],
    takeaway:
      '"做椅子加了按摩加热音乐,但坐着不舒服"——这就是伪创新。反过来,"最简单的材料 + 真正解决问题"反而能拿一等奖。',
    source: 'dale_experience',
    pedagogical_intent: {
      steps: ['inspiration', 'structure', 'draft'],
      grades: ['junior', 'senior'],
      personalities: ['warm', 'advisor'],
    },
    take_away:
      '大老师最看重的"巧妙创新三要素"典范:真正解决问题+技术简单切中要害+饱含人文关怀。',
    dale_shi_says:
      '"这个项目是我带学生拿的宋庆龄里我最喜欢的一个。你看它技术多简单?柔性 3D 打印,加一根弹力带,没了。但它做对了三件事:第一,真问题(罕见病人手部功能退化,买不到便宜的辅具);第二,真解决(成本 1/10);第三,真关怀(作者不是为拿奖而做,是因为身边有这样的人)。这就是巧妙创新三要素——‘真正解决问题+技术简单切中要害+饱含人文关怀’。你想想,你的项目能不能用这三个要素检验一下?"',
  },
]

/** 比赛 ID -> 颜色辅助 */
export const COMPETITION_BADGE = {
  青创赛: 'bg-gold-400/15 text-gold-200 border-gold-400/40',
  宋庆龄少年儿童发明奖: 'bg-persona-warm/15 text-persona-warm border-persona-warm/40',
  雏鹰杯: 'bg-persona-analyst/15 text-persona-analyst border-persona-analyst/40',
  '教学案例': 'bg-amber-500/15 text-amber-200 border-amber-400/40',
}

/**
 * 按学段筛选案例
 */
export function filterCasesByGrade(gradeId) {
  if (!gradeId) return CASES
  return CASES.filter((c) => {
    return c.pedagogical_intent?.grades?.includes(gradeId) || false
  })
}

/**
 * 按 step 筛选推荐案例(返回前 N 个)
 */
export function recommendCasesForStep(stepId, gradeId, limit = 3) {
  const filtered = CASES.filter((c) => {
    const stepMatch = c.pedagogical_intent?.steps?.includes(stepId) || false
    const gradeMatch = !gradeId || c.pedagogical_intent?.grades?.includes(gradeId) || false
    return stepMatch && gradeMatch
  })
  // 优先大老师案例(教学意义更大),再用公开获奖案例填位
  const daleCases = filtered.filter((c) => c.source === 'dale_experience')
  const publicCases = filtered.filter((c) => c.source !== 'dale_experience')
  return [...daleCases, ...publicCases].slice(0, limit)
}
