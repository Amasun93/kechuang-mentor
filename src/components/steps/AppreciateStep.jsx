/**
 * AppreciateStep - 看优秀案例
 * 大老师版本:展示 5 公开案例 + 4 大老师实战案例(去名改写)
 * 按学段 + step 智能推荐,显示 pedagogical_intent + 大老师点评
 *
 * 苏格拉底底色:不替孩子总结"好在哪",只问"你最意外的是哪一点?"
 * 大老师底色:案例带"大老师会怎么点评" + "四层表达结构"金句
 */

import { useState } from 'react'
import { CASES, COMPETITION_BADGE, recommendCasesForStep } from '../../data/cases.js'
import { filterCasesByGrade, GRADE_LEVELS } from '../../data/age_adaptations.js'

export default function AppreciateStep({ profile, onAddOutline, outline = [] }) {
  const grade = GRADE_LEVELS.find((g) => g.id === profile?.grade)
  const [picked, setPicked] = useState([]) // 用户勾选"想学这个"的案例
  const [expanded, setExpanded] = useState(null) // 展开详情的案例

  // 1. 按学段 + step 智能推荐前 3 个
  const recommended = recommendCasesForStep('appreciate', profile?.grade, 3)
  // 2. 按学段全量(用户可点击"看更多"展开)
  const allForGrade = filterCasesByGrade(profile?.grade)

  const togglePick = (id) => {
    setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]))
  }

  const recordInsight = (caseData) => {
    onAddOutline?.(
      `【${caseData.title}】学到:${caseData.take_away || caseData.takeaway || ''}`
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-display text-gold-shine">看优秀案例</h2>
        <p className="text-ink-300 text-sm mt-1">
          {grade?.id === 'primary' &&
            '好课题都从一个"真问题"开始——先看看别人怎么发现问题的。'}
          {grade?.id === 'junior' &&
            '好课题有完整的"链条"——从问题→方法→数据→结论。看看评委最看重哪个环节。'}
          {grade?.id === 'senior' &&
            '读案例不是为了模仿,而是为了"看见"评委视角——巧妙创新和技术堆砌差别在哪。'}
          {!grade && '好课题长什么样,先看几个再说。'}
        </p>
      </div>

      {/* 大老师式开场(2 种模式,按学段) */}
      <div className="panel p-5 border-l-4 border-l-gold-400 bg-gold-400/5">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-gold-shine flex items-center justify-center text-ink-950 text-lg shrink-0">
            👨‍🏫
          </div>
          <div className="flex-1">
            <p className="text-ink-50 text-sm leading-relaxed">
              {grade?.id === 'primary' ? (
                <>
                  你好呀,我是<strong className="text-gold-200">大老师</strong>。
                  咱们今天一起"看案例"——不是背例子,是学方法。
                  看的时候随手记下"这个案例让我想到什么",等会儿聊。
                </>
              ) : (
                <>
                  你好,我是<strong className="text-gold-200">大老师</strong>。看了上千个学生项目,
                  我发现好课题有个共同点——不是技术多高级,而是"巧妙创新三要素":真正解决问题 + 技术简单切中要害 + 饱含人文关怀。
                  咱们今天看 3 个案例,你读完告诉我:你最想"偷"的是哪个方法?
                </>
              )}
            </p>
          </div>
        </div>
      </div>

      {/* 推荐案例 3 个 */}
      <div>
        <h3 className="text-ink-200 font-semibold text-sm mb-3">
          <i className="fa-solid fa-star text-gold-300 mr-1.5" />
          {grade?.label}组精选(3 个)
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {recommended.map((c) => (
            <CaseCard
              key={c.id}
              caseData={c}
              picked={picked.includes(c.id)}
              expanded={expanded === c.id}
              onTogglePick={() => togglePick(c.id)}
              onExpand={() => setExpanded(expanded === c.id ? null : c.id)}
              onRecordInsight={() => recordInsight(c)}
            />
          ))}
        </div>
      </div>

      {/* 看更多 - 全量(按学段) */}
      <details className="panel p-4">
        <summary className="text-ink-200 font-semibold text-sm cursor-pointer">
          <i className="fa-solid fa-book-open text-gold-300 mr-1.5" />
          {grade?.label}组还能看 {allForGrade.length - recommended.length} 个案例(展开)
        </summary>
        <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-3">
          {allForGrade
            .filter((c) => !recommended.find((r) => r.id === c.id))
            .map((c) => (
              <CaseCard
                key={c.id}
                caseData={c}
                picked={picked.includes(c.id)}
                expanded={expanded === c.id}
                onTogglePick={() => togglePick(c.id)}
                onExpand={() => setExpanded(expanded === c.id ? null : c.id)}
                onRecordInsight={() => recordInsight(c)}
              />
            ))}
        </div>
      </details>

      {/* 已选案例 → 加入课题素材 */}
      {picked.length > 0 && (
        <div className="panel p-5 border-l-4 border-l-emerald-500/50 animate-fade-in">
          <h3 className="text-emerald-200 font-semibold text-sm mb-2">
            <i className="fa-solid fa-heart text-emerald-300 mr-1.5" />
            你想学的案例({picked.length})
          </h3>
          <p className="text-ink-300 text-xs mb-3">
            建议:每个案例点击"记下启发"按钮,把学到的方法加到课题素材里。
          </p>
          <div className="space-y-2">
            {picked.map((id) => {
              const c = CASES.find((x) => x.id === id)
              if (!c) return null
              return (
                <div key={id} className="flex items-start gap-2 text-sm">
                  <span className="text-emerald-300 shrink-0">✓</span>
                  <div className="flex-1">
                    <p className="text-ink-50">{c.title}</p>
                    <p className="text-ink-400 text-xs mt-0.5">
                      想偷的方法:{c.take_away || c.takeaway}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      <div className="bg-gold-400/10 border border-gold-400/30 rounded-lg p-4 text-sm text-ink-200">
        <i className="fa-solid fa-lightbulb text-gold-300 mr-1.5" />
        <strong className="text-gold-200">下一步:</strong>
        打开 AI 引导窗,告诉大老师"我从 X 案例学到 Y,接下来想试 Z"——
        我会陪你从"想学"走到"开始做"。
      </div>
    </div>
  )
}

// ============================================================
// 案例卡片(可展开 + 可勾选 + 可记笔记)
// ============================================================
function CaseCard({ caseData, picked, expanded, onTogglePick, onExpand, onRecordInsight }) {
  const isDale = caseData.source === 'dale_experience'
  return (
    <div
      className={`bg-ink-800/60 border rounded-md p-3 transition-all
        ${picked
          ? 'border-gold-400 shadow-gold-glow'
          : 'border-ink-700 hover:border-ink-500'}`}
    >
      {/* 比赛标签 + 大老师标签 */}
      <div className="flex items-center gap-1.5 mb-2 flex-wrap">
        <span
          className={`text-xs px-1.5 py-0.5 rounded border ${
            COMPETITION_BADGE[caseData.competition] || 'bg-ink-700/40 text-ink-300'
          }`}
        >
          {caseData.award}
        </span>
        {isDale && (
          <span className="text-xs px-1.5 py-0.5 rounded border bg-amber-500/15 text-amber-300 border-amber-400/40">
            大老师实战
          </span>
        )}
      </div>

      {/* 标题 */}
      <h4 className="text-ink-50 text-sm font-semibold leading-snug line-clamp-2 mb-1.5">
        {caseData.title}
      </h4>

      {/* 元数据 */}
      <p className="text-ink-400 text-xs mb-2">
        {caseData.school} · {caseData.grade} · {caseData.year}
      </p>

      {/* 简述(默认) */}
      <p className="text-ink-300 text-xs line-clamp-3 leading-relaxed">
        {caseData.question || caseData.background}
      </p>

      {/* 展开后内容 */}
      {expanded && (
        <div className="mt-3 space-y-3 animate-fade-in">
          <div>
            <p className="text-ink-400 text-xs font-semibold mb-1">研究问题</p>
            <p className="text-ink-200 text-xs leading-relaxed">{caseData.question}</p>
          </div>
          <div>
            <p className="text-ink-400 text-xs font-semibold mb-1">研究方法</p>
            <p className="text-ink-200 text-xs leading-relaxed">{caseData.method}</p>
          </div>
          <div>
            <p className="text-ink-400 text-xs font-semibold mb-1">主要发现</p>
            <p className="text-ink-200 text-xs leading-relaxed">{caseData.finding}</p>
          </div>
          {caseData.highlights && caseData.highlights.length > 0 && (
            <div>
              <p className="text-ink-400 text-xs font-semibold mb-1">亮点</p>
              <ul className="text-ink-200 text-xs space-y-0.5">
                {caseData.highlights.map((h, i) => (
                  <li key={i} className="flex gap-1.5">
                    <span className="text-gold-300 shrink-0">▸</span>
                    <span>{h}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* 大老师点评(大老师案例特有) */}
          {caseData.dale_shi_says && (
            <div className="border-l-2 border-amber-400/60 pl-3 bg-amber-500/5 py-2 rounded-r">
              <p className="text-amber-200 text-xs font-semibold mb-1">
                <i className="fa-solid fa-quote-left text-amber-300 mr-1" />
                大老师会怎么点评
              </p>
              <p className="text-ink-200 text-xs leading-relaxed italic">
                {caseData.dale_shi_says}
              </p>
            </div>
          )}

          {/* 启发(给学生) */}
          {caseData.take_away && (
            <div className="border-l-2 border-emerald-400/60 pl-3">
              <p className="text-emerald-200 text-xs font-semibold mb-1">
                <i className="fa-solid fa-lightbulb text-emerald-300 mr-1" />
                你看完应得的启发
              </p>
              <p className="text-ink-200 text-xs leading-relaxed">
                {caseData.take_away}
              </p>
            </div>
          )}
        </div>
      )}

      {/* 操作按钮 */}
      <div className="flex items-center gap-1.5 mt-3">
        <button
          onClick={onExpand}
          className="text-xs text-ink-300 hover:text-gold-200 flex-1 text-left"
        >
          <i className={`fa-solid fa-${expanded ? 'chevron-up' : 'chevron-down'} mr-1`} />
          {expanded ? '收起' : '展开详情'}
        </button>
        {expanded && (
          <button
            onClick={onRecordInsight}
            className="text-xs text-gold-300 hover:text-gold-200"
            title="把启发加到课题素材"
          >
            <i className="fa-solid fa-bookmark mr-1" />
            记下启发
          </button>
        )}
        <button
          onClick={onTogglePick}
          className={`text-xs px-2 py-0.5 rounded ${
            picked
              ? 'bg-gold-400/20 text-gold-200 border border-gold-400/40'
              : 'text-ink-400 hover:text-gold-200 border border-ink-700'
          }`}
        >
          <i className={`fa-${picked ? 'solid' : 'regular'} fa-heart mr-1`} />
          {picked ? '已选' : '想学'}
        </button>
      </div>
    </div>
  )
}
