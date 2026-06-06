/**
 * InspirationStep - 开题交流
 * 从生活观察和真实困惑出发,根据学生年级动态调整追问深度
 *
 * 苏格拉底底色:不直接给"选题方向",反问一个真实生活瞬间
 */

import { useState } from 'react'
import { LIFE_PROBLEM_LENSES, OPENING_EXAMPLES } from '../../prompts/inspiration.js'
import { GRADE_LEVELS, INTEREST_DOMAINS } from '../../data/age_adaptations.js'

export default function InspirationStep({ profile, onAddOutline, outline = [] }) {
  const grade = GRADE_LEVELS.find((g) => g.id === profile?.grade)
  const [pickedLens, setPickedLens] = useState(null)
  const [text, setText] = useState('')

  const applyLens = (lens) => {
    setPickedLens(lens.key)
    if (!text.trim()) {
      setText(`${lens.starter} `)
    }
  }

  const submit = () => {
    if (!text.trim()) return
    onAddOutline?.(text.trim())
    setText('')
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-display text-gold-shine">开题交流</h2>
        <p className="text-ink-300 text-sm mt-1">
          {grade?.id === 'primary' &&
            '先不用想“课题”。从一件让你觉得不方便、不舒服或总出错的小事开始。'}
          {grade?.id === 'junior' &&
            '开题交流要把“我喜欢 XX”变成一个具体可观察、可继续调研的生活现象。'}
          {grade?.id === 'senior' &&
            '好的研究问题都从一个具体生活观察开始,再逐步判断价值、可行性和证据。'}
          {!grade && '先聊清楚起点:哪件小事反复让你觉得不方便、不舒服、不安全或值得改一改。'}
        </p>
      </div>

      <div className="panel p-5">
        <div className="mb-4">
          <h3 className="text-ink-50 font-semibold text-sm">
            一个好项目通常不是从“我要做个高科技”开始
          </h3>
          <p className="mt-1 text-ink-400 text-xs leading-relaxed">
            它更像这样:先抓住一个生活里反复出现的小别扭,再去查资料、看数据、想办法。
          </p>
        </div>
        <div className="grid gap-3 md:grid-cols-3">
          {OPENING_EXAMPLES.map((example) => (
            <div key={example.scene} className="rounded-lg border border-ink-700 bg-ink-900/50 p-3">
              <div className="text-gold-200 text-sm font-semibold">{example.scene}</div>
              <div className="mt-2 text-xs leading-relaxed text-ink-400">
                <span className="text-red-200/80">先别急着:</span> {example.bad}
              </div>
              <div className="mt-1 text-xs leading-relaxed text-ink-200">
                <span className="text-gold-200">先观察:</span> {example.better}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 生活痛点卡片 */}
      <div>
        <h3 className="text-ink-200 font-semibold text-sm mb-3">
          <i className="fa-solid fa-hand-sparkles text-gold-300 mr-1.5" />
          生活痛点探测器(点一个,下面会生成开头)
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {LIFE_PROBLEM_LENSES.map((lens) => {
            const active = pickedLens === lens.key
            return (
              <button
                key={lens.key}
                onClick={() => applyLens(lens)}
                className={`p-3 rounded-lg border text-left transition-all
                  ${active
                    ? 'border-gold-400 bg-gold-400/10 shadow-gold-glow'
                    : 'border-ink-700 bg-ink-800/40 hover:border-ink-500'}`}
              >
                <div className="text-xl mb-1 text-gold-200">{lens.icon}</div>
                <div className="text-ink-50 text-sm font-semibold">{lens.name}</div>
                <div className="text-ink-400 text-xs mt-1 leading-snug">{lens.question}</div>
              </button>
            )
          })}
        </div>
      </div>

      {/* 兴趣领域 hint */}
      {profile?.interests && profile.interests.length > 0 && (
        <div>
          <h3 className="text-ink-200 font-semibold text-sm mb-3">
            <i className="fa-solid fa-star text-gold-300 mr-1.5" />
          你在开题交流里提到的兴趣
          </h3>
          <div className="flex flex-wrap gap-2">
            {profile.interests.map((id) => {
              const domain = INTEREST_DOMAINS.find((d) => d.id === id)
              if (!domain) return null
              return (
                <span key={id} className="chip-gold">
                  {domain.icon} {domain.label}
                </span>
              )
            })}
          </div>
        </div>
      )}

      {/* 自由记录 */}
      <div className="panel p-5">
        <h3 className="text-ink-200 font-semibold text-sm mb-2">
          <i className="fa-solid fa-pen-fancy text-gold-300 mr-1.5" />
          记下一个可以继续追问的现象
        </h3>
        <p className="text-ink-400 text-xs mb-3">
          不需要是大事。先写清楚 4 件事:发生在哪里、谁受影响、它怎么让人难受、你为什么在意。
        </p>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={grade?.id === 'primary'
            ? '比如:下雨天操场积水很深,同学们要绕很远走,还容易把鞋弄湿'
            : grade?.id === 'senior'
              ? '比如:小区垃圾分类实施半年,厨余垃圾分类准确率反而下降,我想知道是标识问题还是习惯问题'
              : '比如:小区快递柜坏了 3 个月没人修,老人取件要多走 500 米'}
          className="input-dark min-h-[120px]"
        />
        <div className="flex justify-end mt-2">
          <button onClick={submit} disabled={!text.trim()} className="btn-gold text-sm disabled:opacity-50">
            <i className="fa-solid fa-plus" /> 加入项目素材
          </button>
        </div>
      </div>

      {/* 素材列表 */}
      {outline.length > 0 && (
        <div className="panel p-5">
          <h3 className="text-ink-200 font-semibold text-sm mb-3">
            <i className="fa-solid fa-folder-open text-gold-300 mr-1.5" />
            开题素材({outline.length})
          </h3>
          <ul className="space-y-2">
            {outline.map((o, i) => (
              <li key={i} className="text-ink-100 text-sm bg-ink-800/40 border border-ink-700 rounded-md p-3">
                {o}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="bg-gold-400/10 border border-gold-400/30 rounded-lg p-4 text-sm text-ink-200">
        <i className="fa-solid fa-lightbulb text-gold-300 mr-1.5" />
        <strong className="text-gold-200">这一步怎么用:</strong>
        先写一个粗糙观察。写不出来时,点右下角“大老师”,直接问:“我生活里想不到问题,你追问我一个具体场景。”
      </div>
    </div>
  )
}
