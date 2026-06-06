/**
 * StructureStep - 课题方向聚焦
 * 把"具体观察"收窄为"可研究的科学问题"
 * 输出 3-5 个候选方向,收敛到 1 个
 *
 * 苏格拉底底色:不替孩子写"我的研究问题是 XXX",反问"你觉得哪 3 个方向最想做?"
 */

import { useState } from 'react'
import { GRADE_LEVELS, filterCasesByGrade } from '../../data/age_adaptations.js'
import { CASES } from '../../data/cases.js'

export default function StructureStep({ profile, project, onUpdateProject, onAddOutline }) {
  const grade = GRADE_LEVELS.find((g) => g.id === profile?.grade)
  const directions = project?.directions || ['', '', '']
  const focused = project?.focused || null

  const setDirection = (i, v) => {
    const next = [...directions]
    next[i] = v
    onUpdateProject({ directions: next })
  }

  const addDirection = () => {
    if (directions.length >= 5) return
    onUpdateProject({ directions: [...directions, ''] })
  }

  const removeDirection = (i) => {
    const next = directions.filter((_, idx) => idx !== i)
    onUpdateProject({ directions: next.length ? next : [''] })
  }

  const focusOn = (i) => {
    onUpdateProject({ focused: i })
  }

  // 引导话术 - 按年级
  const hints = grade?.id === 'primary' ? [
    '把范围缩到"一周内能完成"的小问题',
    '用"如果……会怎样?"造一个句',
    '目标:这个研究做完了,你能跟爸妈讲清楚',
  ] : grade?.id === 'senior' ? [
    '用 PICO 框架(对象/干预/对照/结果)定义问题',
    '区分"相关"和"因果",别用模糊的"影响"',
    '问"评委可能挑什么刺"',
  ] : [
    '把"宽泛"收到"具体可观察的现象"',
    '用"为什么/怎么/多少"开头',
    '这个研究做完了,你最想告诉别人什么?',
  ]

  const inspiration = project?.inspiration || ''
  const cases = filterCasesByGrade(CASES, profile?.grade).slice(0, 3)

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-display text-gold-shine">课题方向聚焦</h2>
        <p className="text-ink-300 text-sm mt-1">
          把你之前找到的"具体观察"收窄为 <strong className="text-gold-200">3-5 个候选方向</strong>,
          然后选 1 个最想做的深入下去。
        </p>
      </div>

      {/* 起始素材回顾 */}
      {inspiration && (
        <div className="panel p-4 border-l-4 border-l-gold-400">
          <h3 className="text-ink-300 text-xs uppercase tracking-wide mb-1.5">
            你的起点(从"找到兴趣点"带来)
          </h3>
          <p className="text-ink-100 text-sm">{inspiration}</p>
        </div>
      )}

      {/* 引导提示 */}
      <div className="panel p-4 bg-ink-800/40">
        <h3 className="text-ink-200 font-semibold text-sm mb-2 flex items-center gap-1.5">
          <i className="fa-solid fa-compass text-gold-300" />
          {grade?.label}组的聚焦策略
        </h3>
        <ul className="space-y-1 text-sm text-ink-300">
          {hints.map((h, i) => (
            <li key={i} className="flex gap-2">
              <span className="text-gold-300 shrink-0">▸</span>{h}
            </li>
          ))}
        </ul>
      </div>

      {/* 候选方向 */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-ink-200 font-semibold text-sm">
            <i className="fa-solid fa-list text-gold-300 mr-1.5" />
            3-5 个候选方向
          </h3>
          {directions.length < 5 && (
            <button onClick={addDirection} className="text-xs text-gold-300 hover:text-gold-200">
              <i className="fa-solid fa-plus" /> 加一个
            </button>
          )}
        </div>
        <div className="space-y-2">
          {directions.map((d, i) => {
            const isFocused = focused === i
            return (
              <div
                key={i}
                className={`flex items-start gap-2 p-3 rounded-lg border transition-all
                  ${isFocused
                    ? 'border-gold-400 bg-gold-400/10 shadow-gold-glow'
                    : 'border-ink-700 bg-ink-800/40'}`}
              >
                <span className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-semibold shrink-0 mt-0.5
                  ${isFocused ? 'bg-gold-400 text-ink-950' : 'bg-ink-700 text-ink-300'}`}>
                  {i + 1}
                </span>
                <input
                  value={d}
                  onChange={(e) => setDirection(i, e.target.value)}
                  placeholder={
                    grade?.id === 'primary'
                      ? `方向 ${i + 1}: 比如"为什么小区的流浪猫越来越多"`
                      : `方向 ${i + 1}: 比如"初中生睡眠质量与屏幕使用时长的相关性"`
                  }
                  className="input-dark text-sm flex-1"
                />
                {!isFocused ? (
                  <button
                    onClick={() => focusOn(i)}
                    disabled={!d.trim()}
                    className="btn-ghost text-xs px-2 py-1 disabled:opacity-30"
                    title="聚焦到这个方向"
                  >
                    选这个
                  </button>
                ) : (
                  <span className="chip-gold mt-1.5">
                    <i className="fa-solid fa-check" /> 已聚焦
                  </span>
                )}
                {directions.length > 1 && (
                  <button
                    onClick={() => removeDirection(i)}
                    className="text-ink-500 hover:text-rose-300 text-xs mt-2"
                  >
                    <i className="fa-solid fa-trash" />
                  </button>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* 聚焦后,提取"研究问题" */}
      {focused !== null && directions[focused] && (
        <div className="panel p-5 border-l-4 border-l-gold-400">
          <h3 className="text-ink-200 font-semibold text-sm mb-2">
            <i className="fa-solid fa-bullseye text-gold-300 mr-1.5" />
            你的研究问题(用一句话写)
          </h3>
          <p className="text-ink-400 text-xs mb-2">
            试着把"{directions[focused]}" 收成一句"我想研究 ___ 对 ___ 的影响/关系/效果"这种结构。
          </p>
          <textarea
            value={project?.question || ''}
            onChange={(e) => onUpdateProject({ question: e.target.value })}
            placeholder="比如:我想研究初中生每晚使用手机时长与次日上课专注度的关系"
            className="input-dark min-h-[80px]"
          />
        </div>
      )}

      {/* 参考案例 */}
      {cases.length > 0 && (
        <div className="panel p-5">
          <h3 className="text-ink-200 font-semibold text-sm mb-3">
            <i className="fa-solid fa-book-open text-gold-300 mr-1.5" />
            {grade?.label}生可参考的课题
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            {cases.map((c) => (
              <div key={c.id} className="bg-ink-800/60 border border-ink-700 rounded-md p-3">
                <h4 className="text-ink-50 text-sm font-semibold leading-snug line-clamp-2">{c.title}</h4>
                <p className="text-ink-400 text-xs mt-1">{c.school} · {c.year}</p>
                <p className="text-ink-300 text-xs mt-2 line-clamp-3">{c.question}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
