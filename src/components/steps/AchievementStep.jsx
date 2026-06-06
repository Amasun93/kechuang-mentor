/**
 * AchievementStep - 申报材料
 * 整理课题设计,导出"我的科创想法卡"
 *
 * 苏格拉底底色:不帮孩子写"项目总结",反问"你最骄傲的是哪一步?"
 */

import { useState } from 'react'
import ExportButton from '../ExportButton.jsx'
import { WINNING_PATTERNS } from '../../data/competitions.js'
import { GRADE_LEVELS } from '../../data/age_adaptations.js'

export default function AchievementStep({ profile, project, onUpdateProject }) {
  const grade = GRADE_LEVELS.find((g) => g.id === profile?.grade)
  const [credo, setCredo] = useState(project?.credo || '')

  const saveCredo = () => {
    onUpdateProject({ credo })
  }

  const completed = {
    inspiration: !!project?.inspiration,
    question: !!project?.question,
    method: !!project?.method,
    timeline: !!project?.timeline,
    resources: !!project?.resources,
    refine: !!project?.refine,
  }
  const completedCount = Object.values(completed).filter(Boolean).length
  const totalChecks = Object.keys(completed).length

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-display text-gold-shine">申报材料</h2>
        <p className="text-ink-300 text-sm mt-1">
          先整理成一张"科创想法卡"。后面真正参赛时,再扩展成申报书、展板和答辩稿。
        </p>
      </div>

      {/* 完成度 */}
      <div className="panel p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-ink-200 font-semibold text-sm">
            <i className="fa-solid fa-trophy text-gold-300 mr-1.5" />
            方案完整度
          </h3>
          <span className="chip-gold">{completedCount} / {totalChecks}</span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
          {Object.entries(completed).map(([k, v]) => (
            <div key={k} className={`flex items-center gap-1.5 ${v ? 'text-emerald-300' : 'text-ink-500'}`}>
              <i className={`fa-solid ${v ? 'fa-check-circle' : 'fa-circle'}`} />
              <span>{k}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 课题想法卡 */}
      <div className="panel p-6 border-l-4 border-l-gold-400">
        <h3 className="text-gold-shine font-display text-xl mb-4">
          <i className="fa-solid fa-id-card mr-2" />
          我的科创想法卡
        </h3>
        <div className="space-y-3 text-sm">
          <Field label="研究问题" value={project?.question || '_(待补充)_'} />
          <Field label="研究方法" value={project?.method || '_(待补充)_'} />
          <Field label="时间线"   value={project?.timeline || '_(待补充)_'} />
          <Field label="资源清单" value={project?.resources || '_(待补充)_'} />
          <Field label="用户调研" value={project?.survey || '_(待补充)_'} />
        </div>

        <div className="border-t border-ink-700 mt-5 pt-4">
          <h4 className="text-ink-200 font-semibold text-sm mb-2">
            <i className="fa-solid fa-quote-left text-gold-300 mr-1.5" />
            我的科创信条
          </h4>
          <textarea
            value={credo}
            onChange={(e) => setCredo(e.target.value)}
            onBlur={saveCredo}
            placeholder={grade?.id === 'primary'
              ? '比如:我做的研究,是为了让身边的人更方便'
              : '比如:不复杂的问题,也要用认真的方法去研究'}
            className="input-dark min-h-[80px] text-sm"
          />
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          <ExportButton project={{ ...project, credo, grade: grade?.label, author: '我' }} />
          <button
            onClick={() => {
              localStorage.removeItem('kechuang_project')
              localStorage.removeItem('kechuang_outline')
              window.location.reload()
            }}
            className="btn-ghost text-sm"
          >
            <i className="fa-solid fa-rotate-left" /> 重新开始
          </button>
        </div>
      </div>

      {/* 回顾与展望 */}
      <div className="panel p-5">
        <h3 className="text-ink-200 font-semibold text-sm mb-3">
          <i className="fa-solid fa-binoculars text-gold-300 mr-1.5" />
          7 大跨比赛获奖规律(参考)
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {WINNING_PATTERNS.map((p, i) => (
            <div key={i} className="bg-ink-800/40 border border-ink-700 rounded-md p-3">
              <p className="text-gold-200 text-sm font-semibold">{p.pattern}</p>
              <p className="text-ink-300 text-xs mt-1 leading-relaxed">{p.desc}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-gold-400/10 border border-gold-400/30 rounded-lg p-4 text-sm text-ink-200">
        <i className="fa-solid fa-party-horn text-gold-300 mr-1.5" />
        <strong className="text-gold-200">下一步:</strong>
        带着你的"科创想法卡",找个有经验的老师/家长/学长聊聊,听听他们的反馈。然后真正开始动手做!
      </div>
    </div>
  )
}

function Field({ label, value }) {
  return (
    <div>
      <span className="text-ink-400 text-xs">{label}</span>
      <p className="text-ink-100 mt-0.5 whitespace-pre-line">{value}</p>
    </div>
  )
}
