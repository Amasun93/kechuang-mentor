/**
 * 3 个主要科创比赛元数据
 * 评估标准、获奖规律、常见错误等数据从 docs/competitions/*.json 整合
 *
 * 关键路由逻辑(来自汇总分析):
 * - 小学中低年级 → 宋庆龄(科技绘画/创意)唯一优选
 * - 小学高年级 → 雏鹰杯 ≈ 宋庆龄 > 青创赛
 * - 初中 → 3 个比赛全面推荐
 * - 高中 → 青创赛 > 宋庆龄,雏鹰杯不参赛
 */

export const COMPETITIONS = [
  {
    id: 'qingchuang',
    name: '全国青少年科技创新大赛',
    short: '青创赛',
    alias: '青创赛',
    organizer: '中国科协 + 国家自然科学基金委 + 共青团中央 + 全国妇联',
    level: '国家级(白名单)',
    gradeRange: '小学高年级 - 高中',
    submitMonth: '3-4 月(各省差异)',
    portal: 'https://www.xiaoxiaotong.org',
    summary: '中国最权威的青少年科创比赛之一,A类(专业研究) + B类(生活发明)。国家级一等奖是升学硬通货。',
    oneLine: '科研训练场——比研究的规范性和科学素养',
    tracks: ['物质科学', '生命科学', '地球与空间科学', '技术', '行为与社会科学', '计算机'],
    keyPoints: [
      '高中阶段是青创赛获奖含金量最高的学段',
      '小学生原则上只能申报 B 类(日常生活类)',
      '查重率 ≤ 30%,查新报告、原始实验数据必须齐全',
      '评委重点考察「学生主体性」——能讲清楚每个细节',
    ],
    evaluateFromFile: 'docs/competitions/青创赛-评估标准.json',
  },
  {
    id: 'songqingling',
    name: '宋庆龄少年儿童发明奖',
    short: '宋庆龄奖',
    alias: '宋庆龄发明奖',
    organizer: '中国宋庆龄基金会 + 中国发明协会',
    level: '国家级(白名单)',
    gradeRange: '小学 - 高中',
    submitMonth: '4-5 月',
    portal: 'https://www.songqling.org.cn',
    summary: '强调"发明"和"动手",4 类(发明/创意/AI编程/科技绘画)。发明作品必须有实物。',
    oneLine: '发明创造展——比把脑子里的想法做成实物',
    tracks: ['发明作品', '创意作品', '科技绘画(仅小学)', '人工智能'],
    keyPoints: [
      '全年龄段友好,小学阶段有专属「科技绘画类」',
      '明确**不接受**科学研究论文类',
      '发明作品必须有实物/可演示',
      '绿色环保/可持续发展是特色加分项',
    ],
    evaluateFromFile: 'docs/competitions/宋庆龄-评估标准.json',
  },
  {
    id: 'chuaying',
    name: '雏鹰杯红领巾科创达人挑战赛',
    short: '雏鹰杯',
    alias: '雏鹰杯',
    organizer: '共青团上海市委 + 上海市教委 + 上海市少工委',
    level: '省市级(上海)',
    gradeRange: '小学 2 年级 - 初中 9 年级',
    submitMonth: '10-12 月',
    portal: 'https://www.shedu.cn',
    summary: '上海地区最有影响力的青少年科创赛事,两院院士领衔评审,对接"小院士"称号。',
    oneLine: '真问题实验室——比用科学方法解决真实问题',
    tracks: ['创造发明', '自然生态', '智慧城市', '航空航天', 'AI', '新能源车', '创新创意'],
    keyPoints: [
      '初中阶段是核心组别',
      '院士级评委,标准更"硬核"',
      '高中阶段**不在参赛范围**',
      '每年有年度主题(如 2025:智慧关怀/智学未来/智行上海)',
    ],
    evaluateFromFile: 'docs/competitions/雏鹰杯-评估标准.json',
  },
]

export function getCompetitionById(id) {
  return COMPETITIONS.find((c) => c.id === id) || COMPETITIONS[0]
}

/**
 * 年级 + 地区 → 比赛推荐
 * 来自汇总分析第四章 4.4
 */
export function recommendCompetitions({ grade, city, hasLab = false, researchDepth = '浅' }) {
  // 上海地区:雏鹰杯优先
  if (city === '上海' && (grade === 'primary-upper' || grade === 'junior')) {
    return {
      primary: 'chuaying',
      secondary: ['songqingling', 'qingchuang'],
      note: '上海地区优先推荐雏鹰杯(本地含金量高 + 院士级评委)',
    }
  }

  if (grade === 'primary-lower') {
    return {
      primary: 'songqingling',
      secondary: [],
      note: '小学中低年级 → 宋庆龄(科技绘画/创意)唯一优选',
    }
  }
  if (grade === 'primary-upper') {
    return {
      primary: 'songqingling',
      secondary: ['qingchuang', city === '上海' ? 'chuaying' : null].filter(Boolean),
      note: '小学高年级 → 3 个比赛都开放,建议主攻宋庆龄',
    }
  }
  if (grade === 'junior') {
    if (hasLab || researchDepth === '深') {
      return {
        primary: 'qingchuang',
        secondary: ['songqingling', city === '上海' ? 'chuaying' : null].filter(Boolean),
        note: '初中黄金期,有实验条件冲青创赛',
      }
    }
    return {
      primary: 'songqingling',
      secondary: [city === '上海' ? 'chuaying' : null, 'qingchuang'].filter(Boolean),
      note: '初中黄金期,推荐宋庆龄(实物友好)',
    }
  }
  if (grade === 'senior') {
    return {
      primary: 'qingchuang',
      secondary: ['songqingling'],
      note: '高中阶段 → 青创赛主场,国家级一等奖是升学硬通货',
    }
  }
  return {
    primary: 'songqingling',
    secondary: ['chuaying', 'qingchuang'],
    note: '默认推荐',
  }
}

/**
 * 6 大共性维度(跨比赛总结)
 * 用于产品 UI 展示和评估 checklist
 */
export const COMMON_DIMENSIONS = [
  { name: '创新性',       desc: '这件事别人做过吗?跟已有方案有什么本质不同?', frequency: '3/3 比赛均列为最重要' },
  { name: '实用性',       desc: '解决了什么真实问题?目标用户是谁?方案能用吗?', frequency: '3/3 比赛均赋予高权重' },
  { name: '科学性',       desc: '研究方法科学吗?数据真实吗?记录完整吗?',         frequency: '3/3 比赛均要求' },
  { name: '完整性',       desc: '研究链条完整吗?过程记录齐全吗?工作饱满吗?',     frequency: '3/3 比赛均考察' },
  { name: '学生主体性',   desc: '这真的是学生做的吗?学生能讲清楚每个细节吗?',     frequency: '3/3 比赛均作为底线' },
  { name: '现场答辩',     desc: '答辩逻辑清晰吗?展板/演示能让人信服吗?',         frequency: '3/3 比赛均设现场环节' },
]

/**
 * 7 大跨比赛获奖规律(来自汇总分析第六章)
 * 用于"看优秀案例"步骤的展示 + AI 反问素材
 */
export const WINNING_PATTERNS = [
  { pattern: '「以小见大」选题法',     desc: '从生活小痛点切入(防夹手/防淋雨/防呛咳),但解决方案要具体且经过实测' },
  { pattern: '「社会热点 + 本地特色」', desc: '结合地方文化/特产/环保议题(如平潭蓝眼泪、青海生态、上海非遗)' },
  { pattern: '「特殊人群关怀」',       desc: '聚焦孕妇、老人、儿童等弱势群体,触发评委同理心' },
  { pattern: '「AI + 传统场景」',      desc: '用 AI 赋能日常生活(智能垃圾分类、教室通风、智慧皮影戏),在青创赛一等奖中占 55%+' },
  { pattern: '「专利或专业认证」',     desc: '发明专利 > 实用新型 > 论文发表,能佐证创新性' },
  { pattern: '「可验证的真实数据」',   desc: '用对照实验、问卷调查、热力图呈现量化结果' },
  { pattern: '「学生全程参与」',       desc: '发现痛点 → 调研 → 设计 → 制作 → 测试 → 迭代,每步都有记录' },
]

/**
 * 8 大常见错误(来自汇总分析第七章)
 * 用于 AI 引导的"反问"素材
 */
export const COMMON_PITFALLS = [
  { pitfall: '选题过大或太空泛',       example: '「如何保护环境」「AI 改变生活」',     counter: '反问"如果你只研究一个具体场景,会是什么?"' },
  { pitfall: '学生主体性不足',         example: '主要由教师/家长代做,答辩露馅',         counter: '反问"如果评委问你 X 步骤的细节,你能讲清楚吗?"' },
  { pitfall: '创新性缺乏',             example: '「智能xxx」泛滥,方法为常规组合',       counter: '反问"你做的这件事,跟已经存在的 3 个类似项目有什么不同?"' },
  { pitfall: '数据造假或润色过度',     example: '查重率 > 30%,原始记录缺失',             counter: '反问"你的数据,如果让老师重新做一次,能得到一样结果吗?"' },
  { pitfall: '研究过程不连续',         example: '临时拼凑,从选题到完成只几周',           counter: '反问"你从开始到今天,中间过了几个月的记录?"' },
  { pitfall: '类别选错',               example: '小学生申报 A 类、纯软件报入发明类',     counter: '反问"你的作品更接近 A 类还是 B 类?为什么?"' },
  { pitfall: '展板/材料出现禁忌信息', example: '含指导教师姓名/专家评价/媒体报道',       counter: '反问"展板上哪些信息是绝对不能出现的?"' },
  { pitfall: '作品仅停留在创意设计阶段', example: '宋庆龄发明类、雏鹰杯创造发明类必须有实物', counter: '反问"如果让你现在就用纸板做一个 1:5 模型,你能做出来吗?"' },
]
