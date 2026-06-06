/**
 * DraftStep - 方案设计
 * 引导调研/实验/时间线/资源四个维度
 *
 * 苏格拉底底色:不替孩子写"第一步/第二步/第三步",
 * 反问"你这步打算具体做什么?"
 */

import { GRADE_LEVELS } from '../../data/age_adaptations.js'

const DIMENSIONS = [
  { key: 'method',  icon: '🔬', title: '研究方法', desc: '你怎么开展这个研究?', placeholder: '比如:用问卷调查 50 个同学 + 实测睡眠手环 1 周' },
  { key: 'timeline', icon: '⏱️', title: '时间线',   desc: '从今天到比赛,你要怎么安排?', placeholder: '比如:第 1 周查资料;第 2-3 周做实验;第 4 周写报告' },
  { key: 'resources', icon: '📦', title: '资源清单', desc: '需要什么设备/材料/人?', placeholder: '比如:智能手环(借妈妈的)+ 调查问卷打印 100 份 + 张老师指导统计方法' },
  { key: 'survey',  icon: '🎤', title: '用户调研', desc: '你要访谈/调查谁?多少人?', placeholder: '比如:访谈 3 位同学 + 收集 30 份有效问卷' },
]

export default function DraftStep({ profile, project, onUpdateProject, onAddOutline }) {
  const grade = GRADE_LEVELS.find((g) => g.id === profile?.grade)
  const question = project?.question || '_(请先完成"项目设计"步骤)_'
  const isPrimary = grade?.id === 'primary'

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-display text-gold-shine">方案设计</h2>
        <p className="text-ink-300 text-sm mt-1">
          把研究问题拆成 4 块可执行的部分。不需要一次写完,可以慢慢补。
        </p>
      </div>

      {/* 锚定问题 */}
      <div className="panel p-4 border-l-4 border-l-gold-400">
        <h3 className="text-ink-300 text-xs uppercase tracking-wide mb-1.5">研究问题</h3>
        <p className="text-ink-100 text-sm font-medium">{question}</p>
      </div>

      {/* 4 维度编辑 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {DIMENSIONS.map((d) => (
          <div key={d.key} className="panel p-5">
            <h3 className="text-ink-200 font-semibold text-sm mb-1.5 flex items-center gap-1.5">
              <span className="text-lg">{d.icon}</span>{d.title}
            </h3>
            <p className="text-ink-400 text-xs mb-2">{d.desc}</p>
            <textarea
              value={project?.[d.key] || ''}
              onChange={(e) => onUpdateProject({ [d.key]: e.target.value })}
              placeholder={d.placeholder}
              className="input-dark min-h-[100px] text-sm"
            />
          </div>
        ))}
      </div>

      {/* 风险红线提示 - 来自汇总分析 */}
      <div className="panel p-5 border-l-4 border-l-rose-500/60">
        <h3 className="text-rose-200 font-semibold text-sm mb-2 flex items-center gap-1.5">
          <i className="fa-solid fa-triangle-exclamation" />
          风险红线(写完先自查)
        </h3>
        <ul className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-1.5 text-xs text-ink-300">
          <li>❌ 选题是否太空泛(像"如何保护环境")</li>
          <li>❌ 主体性:每一步是否你能讲清楚</li>
          <li>❌ 创新性:跟已有方案有没有本质不同</li>
          <li>❌ 研究周期:是否 ≥ 6 个月(高中)或 ≥ 3 个月(初小)</li>
          <li>❌ 类别:A/B 类、发明/创意、AI/绘画选对了吗</li>
          <li>❌ 禁区:食品/医药/脊椎动物/毒害物质(直接禁)</li>
        </ul>
      </div>

      {/* 年级提示 */}
      {isPrimary && (
        <div className="panel p-4 bg-emerald-500/5 border-emerald-500/30">
          <p className="text-sm text-ink-200">
            <i className="fa-solid fa-graduation-cap text-emerald-300 mr-1.5" />
            <strong className="text-emerald-200">小学生提示:</strong>
            你的方案不需要"科学方法"那么严,关键是"你真的能动手做出来"。如果哪一步你觉得要请爸妈帮忙,就在那一步打个 ⭐ 提醒自己。
          </p>
        </div>
      )}
      {grade?.id === 'senior' && (
        <div className="panel p-4 bg-amber-500/5 border-amber-500/30">
          <p className="text-sm text-ink-200">
            <i className="fa-solid fa-graduation-cap text-amber-300 mr-1.5" />
            <strong className="text-amber-200">高中生提示:</strong>
            评委重点看"科学性"和"研究规范"。你的方案需要包含:变量定义、对照组设置、数据收集方法、统计方法、查新报告(查重率 ≤ 30%)。
          </p>
        </div>
      )}
    </div>
  )
}
