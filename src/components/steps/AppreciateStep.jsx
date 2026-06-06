/**
 * AppreciateStep - 背景调研
 * 学生端只展示公开获奖案例。
 * 按学段 + step 智能推荐,引导学生把案例当作背景调研材料,不是模仿题目。
 *
 * 苏格拉底底色:不替孩子总结"好在哪",只问"你最意外的是哪一点?"
 * 大老师底色:案例带"大老师会怎么点评" + "四层表达结构"金句
 */

import { useState } from 'react'
import { PUBLIC_CASES, COMPETITION_BADGE, recommendCasesForStep } from '../../data/cases.js'
import { filterCasesByGrade, GRADE_LEVELS } from '../../data/age_adaptations.js'

export default function AppreciateStep({ profile, onAddOutline, outline = [] }) {
  const grade = GRADE_LEVELS.find((g) => g.id === profile?.grade)
  const [picked, setPicked] = useState([]) // 用户勾选"想学这个"的案例
  const [expanded, setExpanded] = useState(null) // 展开详情的案例

  // 1. 按学段 + step 智能推荐前 3 个
  const recommended = recommendCasesForStep('appreciate', profile?.grade, 3)
  // 2. 按学段全量(用户可点击"看更多"展开)
  const allForGrade = filterCasesByGrade(PUBLIC_CASES, profile?.grade)
  const gradeLabel = grade?.label || '推荐'
  const extraCaseCount = Math.max(allForGrade.length - recommended.length, 0)

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
        <h2 className="text-2xl font-display text-gold-shine">背景调研</h2>
        <p className="text-ink-300 text-sm mt-1">
          {grade?.id === 'primary' &&
            '先看看别人怎么发现真问题,再想想你的观察能不能继续查下去。'}
          {grade?.id === 'junior' &&
            '背景调研不是抄题目,而是看别人怎样把问题、方法、数据和结论连起来。'}
          {grade?.id === 'senior' &&
            '读案例是为了看见评委视角:哪些是真问题,哪些只是技术堆砌。'}
          {!grade && '先用公开案例做背景调研,看好项目通常怎么提出问题。'}
        </p>
      </div>

      {outline.length > 0 && (
        <div className="panel p-4 border-l-4 border-l-gold-400">
          <div className="text-xs font-semibold text-ink-400">你的开题观察</div>
          <p className="mt-1 text-sm leading-relaxed text-ink-100">{outline[0]}</p>
          <p className="mt-2 text-xs leading-relaxed text-ink-400">
            现在先别急着做方案。背景调研要查三件事:有没有类似案例、这个现象有多普遍、别人为什么还没解决好。
          </p>
        </div>
      )}

      {/* 大老师式开场(2 种模式,按学段) */}
      <div className="panel p-5 border-l-4 border-l-gold-400 bg-gold-400/5">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-gold-shine flex items-center justify-center text-ink-950 text-lg shrink-0">
            大
          </div>
          <div className="flex-1">
            <p className="text-ink-50 text-sm leading-relaxed">
              {grade?.id === 'primary' ? (
                <>
                  你好呀,我是<strong className="text-gold-200">大老师</strong>。
                  咱们今天先做一点背景调研——不是背例子,是看别人怎么发现问题。
                  看的时候随手记下"这个案例让我想到什么",等会儿继续追问。
                </>
              ) : (
                <>
                  你好,我是<strong className="text-gold-200">大老师</strong>。从很多公开案例里看,
                  我发现好课题有个共同点——不是技术多高级,而是"巧妙创新三要素":真正解决问题 + 技术简单切中要害 + 饱含人文关怀。
                  咱们今天看 3 个案例,你读完告诉我:它能不能帮你改进刚才的开题想法?
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
          {gradeLabel}组公开案例(3 个)
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
          {gradeLabel}组更多背景案例 {extraCaseCount} 个(展开)
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
            建议:每个案例点击"记下启发",把可借鉴的方法放进项目素材里。
          </p>
          <div className="space-y-2">
            {picked.map((id) => {
              const c = PUBLIC_CASES.find((x) => x.id === id)
              if (!c) return null
              return (
                <div key={id} className="flex items-start gap-2 text-sm">
                  <span className="text-emerald-300 shrink-0">✓</span>
                  <div className="flex-1">
                    <p className="text-ink-50">{c.title}</p>
                    <p className="text-ink-400 text-xs mt-0.5">
                      想借鉴的方法:{c.take_away || c.takeaway}
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
        <strong className="text-gold-200">这一步怎么用:</strong>
        背景调研卡住时,点右下角“大老师”,让他帮你判断:这个案例和你的开题问题有什么关系。
      </div>
    </div>
  )
}

// ============================================================
// 案例卡片(可展开 + 可勾选 + 可记笔记)
// ============================================================
function CaseCard({ caseData, picked, expanded, onTogglePick, onExpand, onRecordInsight }) {
  return (
    <div
      className={`bg-ink-800/60 border rounded-md p-3 transition-all
        ${picked
          ? 'border-gold-400 shadow-gold-glow'
          : 'border-ink-700 hover:border-ink-500'}`}
    >
      {/* 比赛标签 */}
      <div className="flex items-center gap-1.5 mb-2 flex-wrap">
        <span
          className={`text-xs px-1.5 py-0.5 rounded border ${
            COMPETITION_BADGE[caseData.competition] || 'bg-ink-700/40 text-ink-300'
          }`}
        >
          {caseData.award}
        </span>
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
