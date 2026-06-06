/**
 * AISettings - 大老师引导原则 + 模型配置
 * 学生端不再暴露多角色切换,避免人格分裂。
 */

import { DA_TEACHER_PERSONA } from '../data/personalities.js'

export default function AISettings({ model, onModelChange }) {
  return (
    <div className="panel p-4">
      <div className="flex items-center gap-2 mb-3">
        <span className="w-7 h-7 rounded-full bg-gold-shine text-ink-950 text-sm font-bold flex items-center justify-center">
          大
        </span>
        <div>
          <h3 className="text-ink-50 font-semibold text-sm">大老师 AI 助教</h3>
          <p className="text-ink-400 text-xs">{DA_TEACHER_PERSONA.focus}</p>
        </div>
      </div>

      <div className="mb-4 rounded-lg border border-gold-400/25 bg-gold-400/5 p-3">
        <p className="text-ink-200 text-xs leading-relaxed mb-2">
          这里不是聊天陪伴,是科创课题陪练。大老师会持续追问,帮学生把模糊兴趣变成可验证的问题。
        </p>
        <ul className="space-y-1.5 text-xs text-ink-300">
          {DA_TEACHER_PERSONA.principles.map((item) => (
            <li key={item} className="flex gap-2">
              <span className="text-gold-300 shrink-0">·</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
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
