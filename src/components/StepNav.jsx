/**
 * StepNav - 6 步顶部导航
 * 暗金/深蓝风格
 * 步骤:APPRECIATE → INSPIRATION → STRUCTURE → DRAFT → REFINE → ACHIEVEMENT
 */

import { STEPS } from '../prompts/index.js'

export default function StepNav({ currentStep, onChange, completed }) {
  const currentIndex = STEPS.findIndex((s) => s.id === currentStep)

  return (
    <div className="border-b border-ink-700/60 bg-ink-900/80 backdrop-blur">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-md bg-gold-shine flex items-center justify-center text-ink-950 font-display text-lg shadow-gold-glow">
              ⌬
            </div>
            <div>
              <div className="text-gold-shine text-lg font-display leading-none">
                大老师 <span className="text-ink-300 font-sans text-sm">·</span> 科创导师
              </div>
              <div className="text-ink-400 text-xs mt-0.5">
                从公开案例出发,一步步收拢成可做的科创课题
              </div>
            </div>
          </div>

          {/* 步骤条 */}
          <div className="flex items-center gap-2">
            {STEPS.map((s, i) => {
              const isCurrent = s.id === currentStep
              const isDone = completed?.has(s.id)
              const canGo = i === 0 || isDone || i <= currentIndex
              return (
                <button
                  key={s.id}
                  disabled={!canGo}
                  onClick={() => canGo && onChange(s.id)}
                  className={`group relative flex items-center gap-2 px-3 py-1.5 rounded-md transition-all
                    ${isCurrent
                      ? 'bg-gold-400/15 border border-gold-400/50 text-gold-100'
                      : isDone
                        ? 'border border-gold-400/30 text-gold-200 hover:bg-gold-400/10'
                        : canGo
                          ? 'border border-ink-600 text-ink-200 hover:border-ink-400'
                          : 'border border-ink-800 text-ink-500 cursor-not-allowed'}`}
                >
                  <span className={`w-5 h-5 rounded-full text-xs flex items-center justify-center font-semibold shrink-0
                    ${isCurrent ? 'bg-gold-400 text-ink-950' : isDone ? 'bg-gold-200 text-ink-950' : 'bg-ink-700 text-ink-300'}`}>
                    {isDone ? <i className="fa-solid fa-check" /> : s.key}
                  </span>
                  <span className="text-sm whitespace-nowrap hidden md:inline">{s.name}</span>
                </button>
              )
            })}
          </div>

          <div className="w-20" />
        </div>
      </div>
    </div>
  )
}
