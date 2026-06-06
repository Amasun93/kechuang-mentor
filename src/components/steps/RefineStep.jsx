/**
 * RefineStep - 方案评估
 * 后端调用 /api/evaluate 评估引擎
 * 孩子端只显示鼓励性反馈(不暴露评分)
 *
 * 苏格拉底底色:不直接说"你这里写得不具体",反问"评委看到这句,可能先问什么?"
 */

import { useState } from 'react'
import { useEffect } from 'react'
import { COMMON_PITFALLS, COMPETITIONS, getCompetitionById } from '../../data/competitions.js'
import { GRADE_LEVELS } from '../../data/age_adaptations.js'

export default function RefineStep({ profile, project, onUpdateProject, onAddOutline }) {
  const grade = GRADE_LEVELS.find((g) => g.id === profile?.grade)
  const [competitionId, setCompetitionId] = useState(
    profile?.targetCompetitions?.[0] || 'qingchuang'
  )
  const [evaluating, setEvaluating] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const competition = getCompetitionById(competitionId)

  // 完成后自动跑一次评估
  useEffect(() => {
    // 首次进入时,如果项目已有内容,自动评估
    if (project?.question && project?.method && !result && !evaluating) {
      runEvaluate()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const runEvaluate = async () => {
    if (!project?.question) {
      setError('请先在"课题方向聚焦"步骤里写一句话研究问题')
      return
    }
    setEvaluating(true)
    setError(null)
    try {
      const res = await fetch('/api/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          competitionId,
          profile,
          project,
        }),
      })
      const data = await res.json()
      if (data.error) {
        setError(data.error)
      } else {
        setResult(data)
        // 孩子端评估反馈(委婉)写入 project.refine
        if (data.studentFeedback) {
          onUpdateProject({ refine: data.studentFeedback })
        }
      }
    } catch (e) {
      setError('评估失败:网络错误。等会儿再试?')
    } finally {
      setEvaluating(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-display text-gold-shine">方案评估</h2>
        <p className="text-ink-300 text-sm mt-1">
          后台评委老师会看看你的方案,但给你的反馈是<strong className="text-gold-200">鼓励式的</strong>——只告诉你哪里能再深一层,不直接打分。
        </p>
      </div>

      {/* 比赛选择 */}
      <div className="panel p-4">
        <h3 className="text-ink-200 font-semibold text-sm mb-3">
          <i className="fa-solid fa-trophy text-gold-300 mr-1.5" />
          这次评估用哪个比赛的标准?
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          {COMPETITIONS.map((c) => {
            const active = c.id === competitionId
            return (
              <button
                key={c.id}
                onClick={() => setCompetitionId(c.id)}
                className={`p-3 rounded-md border text-left transition-all
                  ${active
                    ? 'border-gold-400 bg-gold-400/10'
                    : 'border-ink-700 bg-ink-800/40 hover:border-ink-500'}`}
              >
                <div className="text-ink-50 text-sm font-semibold">{c.short}</div>
                <div className="text-ink-400 text-xs mt-0.5">{c.oneLine}</div>
              </button>
            )
          })}
        </div>
        <button
          onClick={runEvaluate}
          disabled={evaluating}
          className="btn-gold text-sm mt-4"
        >
          {evaluating ? (
            <><i className="fa-solid fa-spinner fa-spin" /> 评委老师正在看...</>
          ) : (
            <><i className="fa-solid fa-magnifying-glass" /> 让评委老师评估</>
          )}
        </button>
      </div>

      {/* 当前提交的内容 */}
      <div className="panel p-5">
        <h3 className="text-ink-200 font-semibold text-sm mb-3">
          <i className="fa-solid fa-file-lines text-gold-300 mr-1.5" />
          你提交的方案
        </h3>
        <div className="space-y-2 text-sm">
          <div>
            <span className="text-ink-400 text-xs">研究问题:</span>
            <p className="text-ink-100 mt-0.5">{project?.question || '_(未填)_'}</p>
          </div>
          <div>
            <span className="text-ink-400 text-xs">研究方法:</span>
            <p className="text-ink-100 mt-0.5">{project?.method || '_(未填)_'}</p>
          </div>
          <div>
            <span className="text-ink-400 text-xs">时间线:</span>
            <p className="text-ink-100 mt-0.5">{project?.timeline || '_(未填)_'}</p>
          </div>
          <div>
            <span className="text-ink-400 text-xs">资源清单:</span>
            <p className="text-ink-100 mt-0.5">{project?.resources || '_(未填)_'}</p>
          </div>
        </div>
      </div>

      {error && (
        <div className="panel p-4 border-l-4 border-l-rose-500/60">
          <p className="text-rose-200 text-sm">
            <i className="fa-solid fa-circle-exclamation mr-1.5" />{error}
          </p>
        </div>
      )}

      {/* 评估结果 - 孩子端鼓励性反馈 */}
      {result && (
        <div className="panel p-5 border-l-4 border-l-gold-400 animate-fade-in">
          <h3 className="text-gold-shine font-semibold mb-2 flex items-center gap-1.5">
            <i className="fa-solid fa-medal" />
            评委老师的话
          </h3>
          {result.studentFeedback && (
            <p className="text-ink-100 text-sm leading-relaxed mb-4 whitespace-pre-line">
              {result.studentFeedback}
            </p>
          )}

          {result.suggestedQuestions && result.suggestedQuestions.length > 0 && (
            <div className="mb-4">
              <h4 className="text-ink-200 text-sm font-semibold mb-2">评委可能问的 3 个问题</h4>
              <ul className="space-y-1.5 text-sm text-ink-200">
                {result.suggestedQuestions.map((q, i) => (
                  <li key={i} className="flex gap-2">
                    <span className="text-gold-300 shrink-0">{i + 1}.</span>
                    <span>{q}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {result.strongPoints && result.strongPoints.length > 0 && (
            <div>
              <h4 className="text-emerald-200 text-sm font-semibold mb-2">你做得不错的地方</h4>
              <ul className="space-y-1 text-sm text-ink-200">
                {result.strongPoints.map((p, i) => (
                  <li key={i} className="flex gap-2">
                    <span className="text-emerald-300 shrink-0">✓</span>
                    <span>{p}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* 常见错误 - 反问素材 */}
      <details className="panel p-4">
        <summary className="text-ink-200 font-semibold text-sm cursor-pointer">
          <i className="fa-solid fa-list-check text-gold-300 mr-1.5" />
          看看初中生/小学生最常犯的 8 个错误(自查用)
        </summary>
        <div className="mt-3 space-y-3">
          {COMMON_PITFALLS.map((p, i) => (
            <div key={i} className="border-l-2 border-rose-400/40 pl-3">
              <p className="text-ink-100 text-sm">
                <strong className="text-rose-200">#{i + 1} {p.pitfall}</strong>
              </p>
              <p className="text-ink-400 text-xs mt-0.5">反例:{p.example}</p>
              <p className="text-emerald-200 text-xs mt-0.5">→ AI 引导反问:{p.counter}</p>
            </div>
          ))}
        </div>
      </details>
    </div>
  )
}
