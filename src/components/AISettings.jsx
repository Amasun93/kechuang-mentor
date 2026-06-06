/**
 * AISettings - AI 配置面板(性格 / 模型)
 * 可放在侧边栏里,允许用户在 4 种性格间切换
 */

import { PERSONALITIES } from '../data/personalities.js'

export default function AISettings({ personalityId, onPersonalityChange, model, onModelChange }) {
  return (
    <div className="panel p-4">
      <div className="flex items-center gap-2 mb-3">
        <i className="fa-solid fa-robot text-gold-300" />
        <h3 className="text-ink-50 font-semibold text-sm">AI 引导老师</h3>
      </div>

      <div className="mb-4">
        <label className="text-ink-300 text-xs block mb-2">性格风格</label>
        <div className="grid grid-cols-2 gap-2">
          {PERSONALITIES.map((p) => {
            const active = p.id === personalityId
            return (
              <button
                key={p.id}
                onClick={() => onPersonalityChange(p.id)}
                className={`p-2.5 rounded-md border text-left transition-all
                  ${active
                    ? `${p.bg} ${p.border} ${p.text}`
                    : 'border-ink-700 bg-ink-800/40 text-ink-200 hover:border-ink-500'}`}
              >
                <div className="flex items-center gap-1.5 text-sm font-medium">
                  <span>{p.avatar}</span>
                  <span>{p.name}</span>
                </div>
                <div className="text-ink-400 text-xs mt-0.5">{p.focus}</div>
              </button>
            )
          })}
        </div>
        <p className="text-ink-400 text-xs mt-2 leading-relaxed">
          所有性格都遵守<strong className="text-gold-200">苏格拉底底色</strong>——永远提问、不直接给答案。
        </p>
      </div>

      <div>
        <label className="text-ink-300 text-xs block mb-2">底层模型</label>
        <input
          type="text"
          value={model}
          onChange={(e) => onModelChange(e.target.value)}
          className="input-dark text-sm"
          placeholder="Doubao-Seed-1.6-flash"
        />
        <p className="text-ink-400 text-xs mt-1.5">
          默认 <code className="text-gold-300">Doubao-Seed-1.6-flash</code>。如未配置 KEY,使用 mock 响应。
        </p>
      </div>
    </div>
  )
}
