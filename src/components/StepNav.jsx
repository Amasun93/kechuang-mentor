/**
 * StepNav - 6 步顶部导航
 * 暗金/深蓝风格
 * 步骤:开题交流 → 背景调研 → 项目设计 → 方案设计 → 测试优化 → 申报材料
 */

import { STEPS } from '../prompts/index.js'

export default function StepNav({ currentStep, onChange, completed }) {
  const currentIndex = STEPS.findIndex((s) => s.id === currentStep)

  return (
    <div className="border-b border-ink-700/60 bg-ink-900/80 backdrop-blur">
      <div className="max-w-7xl mx-auto px-4 py-3 md:px-6 md:py-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <div className="w-9 h-9 rounded-md bg-gold-shine flex items-center justify-center text-ink-950 font-display text-lg shadow-gold-glow shrink-0">
              ⌬
            </div>
            <div className="min-w-0">
              <div className="text-gold-shine text-base sm:text-lg font-display leading-none whitespace-nowrap">
                大老师 <span className="text-ink-300 font-sans text-sm">·</span> 科创导师
              </div>
              <div className="hidden sm:block text-ink-400 text-xs mt-0.5 truncate">
                开题交流、背景调研、项目设计、方案设计、测试优化、申报材料
              </div>
            </div>
          </div>

          {/* 步骤条 */}
          <div className="-mx-1 flex items-center gap-2 overflow-x-auto px-1 pb-1 md:mx-0 md:overflow-visible md:pb-0">
            {STEPS.map((s, i) => {
              const isCurrent = s.id === currentStep
              const isDone = completed?.has(s.id)
              const isEnabled = s.enabled !== false
              const canGo = isEnabled
              return (
                <button
                  key={s.id}
                  disabled={!canGo}
                  onClick={() => canGo && onChange(s.id)}
                  className={`group relative flex min-w-11 items-center justify-center gap-2 rounded-md px-3 py-1.5 transition-all md:min-w-0 md:justify-start
                    ${isCurrent
                      ? 'bg-gold-400/15 border border-gold-400/50 text-gold-100'
                      : isDone
                        ? 'border border-gold-400/30 text-gold-200 hover:bg-gold-400/10'
                        : canGo
                          ? 'border border-ink-600 text-ink-200 hover:border-ink-400'
                          : 'border border-ink-800 text-ink-500 cursor-not-allowed'}`}
                  title={isEnabled ? s.desc : `${s.name}暂未开放`}
                >
                  <span className={`w-5 h-5 rounded-full text-xs flex items-center justify-center font-semibold shrink-0
                    ${isCurrent ? 'bg-gold-400 text-ink-950' : isDone ? 'bg-gold-200 text-ink-950' : 'bg-ink-700 text-ink-300'}`}>
                    {isDone ? <i className="fa-solid fa-check" /> : s.key}
                  </span>
                  <span className="text-sm whitespace-nowrap hidden md:inline">
                    {s.name}
                    {!isEnabled && <span className="ml-1 text-[10px] text-ink-500">待开</span>}
                  </span>
                </button>
              )
            })}
          </div>

          <div className="hidden w-20 md:block" />
        </div>
      </div>
    </div>
  )
}
