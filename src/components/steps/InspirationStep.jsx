/**
 * InspirationStep - 找到兴趣点
 * 五感式提问,根据学生年级动态调整
 *
 * 苏格拉底底色:不直接给"选题方向",反问"你最近看到/听到什么"
 */

import { useState } from 'react'
import { FIVE_SENSES } from '../../prompts/inspiration.js'
import { GRADE_LEVELS, INTEREST_DOMAINS } from '../../data/age_adaptations.js'

export default function InspirationStep({ profile, onAddOutline, outline = [] }) {
  const grade = GRADE_LEVELS.find((g) => g.id === profile?.grade)
  const [pickedSenses, setPickedSenses] = useState([])
  const [text, setText] = useState('')

  const toggleSense = (key) => {
    setPickedSenses((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    )
  }

  const submit = () => {
    if (!text.trim()) return
    onAddOutline?.(text.trim())
    setText('')
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-display text-gold-shine">找到兴趣点</h2>
        <p className="text-ink-300 text-sm mt-1">
          {grade?.id === 'primary' &&
            '你平时看什么、听什么、摸什么的时候,会觉得"咦,为什么是这样?"'}
          {grade?.id === 'junior' &&
            '从"我喜欢 XX"收敛到一个具体可观察的现象,差的就是这关键一步。'}
          {grade?.id === 'senior' &&
            '好的研究问题都从一个"具体生活观察"开始——比"我关心环保"更有价值。'}
          {!grade && '从一个"宽泛兴趣"收敛到一个"具体可观察的现象"。'}
        </p>
      </div>

      {/* 五感卡片 */}
      <div>
        <h3 className="text-ink-200 font-semibold text-sm mb-3">
          <i className="fa-solid fa-hand-sparkles text-gold-300 mr-1.5" />
          五感扫描(挑 1-2 个你最有感觉的)
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
          {FIVE_SENSES.map((s) => {
            const active = pickedSenses.includes(s.key)
            return (
              <button
                key={s.key}
                onClick={() => toggleSense(s.key)}
                className={`p-3 rounded-lg border text-left transition-all
                  ${active
                    ? 'border-gold-400 bg-gold-400/10 shadow-gold-glow'
                    : 'border-ink-700 bg-ink-800/40 hover:border-ink-500'}`}
              >
                <div className="text-2xl mb-1">{s.icon}</div>
                <div className="text-ink-50 text-sm font-semibold">{s.name}</div>
                <div className="text-ink-400 text-xs mt-1 leading-snug">{s.question}</div>
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
            你在破冰时提到的兴趣
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
          记下你最近的一个"具体观察"
        </h3>
        <p className="text-ink-400 text-xs mb-3">
          不需要是"大事"。哪怕是"我家楼道的灯天天 24 小时亮着"或"食堂打饭阿姨每次都多给我一勺"也算。
        </p>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={grade?.id === 'primary'
            ? '比如:下雨天操场积水很深,同学们要绕很远走'
            : grade?.id === 'senior'
              ? '比如:小区垃圾分类实施半年,厨余垃圾的分类准确率反而下降了'
              : '比如:小区快递柜坏了 3 个月没人修'}
          className="input-dark min-h-[120px]"
        />
        <div className="flex justify-end mt-2">
          <button onClick={submit} disabled={!text.trim()} className="btn-gold text-sm disabled:opacity-50">
            <i className="fa-solid fa-plus" /> 加入课题素材
          </button>
        </div>
      </div>

      {/* 素材列表 */}
      {outline.length > 0 && (
        <div className="panel p-5">
          <h3 className="text-ink-200 font-semibold text-sm mb-3">
            <i className="fa-solid fa-folder-open text-gold-300 mr-1.5" />
            你积累的素材({outline.length})
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
        <strong className="text-gold-200">下一步:</strong>
        打开 AI 引导窗,把你刚才记下的具体观察告诉老师,听老师怎么反问你。
      </div>
    </div>
  )
}
