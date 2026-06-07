/**
 * StudentProfile - 聊天式破冰 + 档案展示
 *
 * 首屏目标:让学生感觉是在跟大老师对话,不是在填表。
 * 快捷回复只是辅助,学生始终可以自由输入。
 */

import { useEffect, useRef, useState } from 'react'
import { GRADE_LEVELS, INTEREST_DOMAINS, emptyProfile } from '../data/age_adaptations.js'
import { COMPETITIONS } from '../data/competitions.js'
import { OPENING_EXAMPLES } from '../prompts/inspiration.js'
import AIAssistant from './AIAssistant.jsx'

const STORAGE_KEY = 'kechuang_student_profile'

export function loadProfile() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return emptyProfile()
    const parsed = JSON.parse(raw)
    return { ...emptyProfile(), ...parsed }
  } catch (e) {
    return emptyProfile()
  }
}

export function saveProfile(profile) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(profile))
}

export function clearProfile() {
  localStorage.removeItem(STORAGE_KEY)
}

const ONBOARDING_STEPS = [
  {
    key: 'problem',
    prompt:
      '先不填表。过去一周,有没有哪一刻让你觉得不方便、不舒服、不安全、浪费,或者反复出错?',
    placeholder: '比如:每天下午教室很闷,同学们都犯困,但没人知道什么时候该开窗',
    suggestions: ['我遇到一件不方便的小事:', '我发现一个总出错的地方:', '我看到一件很浪费的事:', '我现在还想不到'],
  },
]

const OBSERVATION_HINT_GROUPS = [
  {
    title: '场景',
    formula: '在哪里发生',
    chips: ['教室', '食堂', '校门口', '操场', '图书馆', '实验室', '小区', '电梯', '家里', '公交车站', '雨天路上', '放学路上', '医院', '商场', '公园'],
  },
  {
    title: '对象',
    formula: '谁遇到麻烦',
    chips: ['我自己', '同学', '低年级同学', '老师', '家长', '老人', '小朋友', '骑车的人', '保洁阿姨', '快递员', '宠物主人', '视力不好的人', '行动不便的人', '宿管或保安'],
  },
  {
    title: '痛点',
    formula: '具体哪里不舒服',
    chips: ['排队太久', '总是分错', '太吵', '太闷', '容易摔倒', '很浪费', '没人注意', '找不到', '容易忘', '不好搬', '看不清', '不卫生', '太费时间', '经常坏', '不公平', '不安全'],
  },
  {
    title: '可能方向',
    formula: '可以先联想,不用急着定',
    chips: ['AI 识别', '环保', '工程制作', '健康', '社区', '校园安全', '节能', '信息提醒', '无障碍', '材料改进', '流程优化'],
  },
]

function assistantMessage(stepIndex) {
  return {
    role: 'assistant',
    content: ONBOARDING_STEPS[stepIndex].prompt,
    ts: Date.now() + stepIndex,
  }
}

function parseGrade(text) {
  const t = text.replace(/\s/g, '')
  if (/高|高一|高二|高三|十年级|十一年级|十二年级/.test(t)) return 'senior'
  if (/初|初一|初二|初三|七年级|八年级|九年级/.test(t)) return 'junior'
  if (/小|小学|三年级|四年级|五年级|六年级/.test(t)) return 'primary'
  return null
}

const INTEREST_KEYWORDS = [
  ['ai', /AI|人工智能|编程|代码|小程序|app|APP|模型|算法/i],
  ['tech', /机器人|动手|小发明|制作|工程|电路|传感器|3D|打印/i],
  ['env', /环保|垃圾|空气|水|植物|动物|生态|污染|分类/i],
  ['health', /睡眠|运动|饮食|心理|健康|手机|屏幕|近视/i],
  ['society', /小区|社区|邻里|校园|交通|电梯|快递|老人/i],
  ['culture', /文化|艺术|非遗|历史|传统|绘画/i],
  ['astronomy', /天文|航天|火箭|卫星|宇宙|星/i],
  ['life', /生活|家里|学校|同学|日常|不方便|烦/i],
]

function parseInterests(text, current = []) {
  const found = INTEREST_KEYWORDS
    .filter(([, pattern]) => pattern.test(text))
    .map(([id]) => id)
  return Array.from(new Set([...current, ...found])).slice(0, 3)
}

function parseCompetitions(text) {
  if (/不确定|不知道|还没|先不|没有/.test(text)) return []
  return COMPETITIONS
    .filter((c) => text.includes(c.short) || text.includes(c.alias) || text.includes(c.name))
    .map((c) => c.id)
}

function profilePatchFor(stepKey, answer, profile) {
  if (stepKey === 'grade') {
    return { grade: parseGrade(answer) || profile.grade }
  }
  if (stepKey === 'interests') {
    return {
      interests: parseInterests(answer, profile.interests),
      interestNote: answer,
    }
  }
  if (stepKey === 'experience') {
    return { experience: answer }
  }
  if (stepKey === 'problem') {
    return { problem: answer }
  }
  if (stepKey === 'targetCompetitions') {
    return { targetCompetitions: parseCompetitions(answer) }
  }
  return {}
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

export function StudentProfile({ onComplete, onSkip }) {
  const [showIntro, setShowIntro] = useState(true)
  const [stepIndex, setStepIndex] = useState(0)
  const [profile, setProfile] = useState(emptyProfile())
  const [draft, setDraft] = useState('')
  const [selectedChips, setSelectedChips] = useState({})
  const [messages, setMessages] = useState([assistantMessage(0)])
  const scrollRef = useRef(null)

  const current = ONBOARDING_STEPS[stepIndex]
  const progress = Math.round(((stepIndex + 1) / ONBOARDING_STEPS.length) * 100)
  const model = localStorage.getItem('kechuang_model') || 'deepseek-v4-pro'

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  const finish = (nextProfile) => {
    const final = {
      ...nextProfile,
      onboarded: true,
      createdAt: nextProfile.createdAt || Date.now(),
    }
    saveProfile(final)
    onComplete?.(final)
  }

  const submitAnswer = (raw) => {
    const answer = raw.trim()
    if (!answer && !current.optional) return

    const normalizedAnswer = answer || '还不确定'
    const nextProfile = {
      ...profile,
      ...profilePatchFor(current.key, normalizedAnswer, profile),
    }

    const userMessage = { role: 'user', content: normalizedAnswer, ts: Date.now() }
    setMessages((prev) => [
      ...prev,
      userMessage,
      {
        role: 'assistant',
        content:
          '够了,这个就是第一条观察。接下来进入背景调研:先看看这个现象有没有别人研究过,再判断它值不值得继续做。',
        ts: Date.now() + 1,
      },
    ])
    setProfile(nextProfile)
    finish(nextProfile)
  }

  const skip = () => {
    const final = { ...profile, onboarded: true, createdAt: Date.now() }
    saveProfile(final)
    onSkip?.(final)
  }

  const toggleHintChip = (groupTitle, chip) => {
    setSelectedChips((prev) => {
      const current = new Set(prev[groupTitle] || [])
      const exists = current.has(chip)
      if (exists) {
        current.delete(chip)
      } else {
        current.add(chip)
      }
      return { ...prev, [groupTitle]: Array.from(current) }
    })
    setDraft((prev) => {
      const trimmed = prev.trim()
      if (trimmed.includes(chip)) {
        return trimmed
          .replace(new RegExp(`(^|\\s)${escapeRegExp(chip)}(?=\\s|$)`, 'g'), ' ')
          .replace(/\s+/g, ' ')
          .trim()
      }
      if (!trimmed) return chip
      return `${trimmed} ${chip}`
    })
  }

  if (showIntro) {
    return (
      <div className="min-h-screen bg-ink-grad text-ink-50">
        <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col justify-center px-4 py-8 sm:px-6">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-gold-400/30 bg-gold-400/10 px-3 py-1 text-xs text-gold-200">
              <span className="h-2 w-2 rounded-full bg-gold-300" />
              大老师科创项目陪练
            </div>
            <h1 className="mt-6 text-4xl font-display leading-tight text-ink-50 sm:text-5xl">
              科创项目,
              <span className="block text-gold-shine">从一个真实的小问题开始。</span>
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-relaxed text-ink-300">
              好项目不是先想一个复杂装置,也不是先堆 AI、传感器、算法。它通常从一个学生真的见过、真的在意、真的想改一改的生活现象开始。
            </p>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {OPENING_EXAMPLES.map((example) => (
              <div key={example.scene} className="panel p-4">
                <div className="text-sm font-semibold text-gold-200">{example.scene}</div>
                <div className="mt-3 text-xs leading-relaxed text-ink-400">
                  不急着做“{example.bad}”。
                </div>
                <div className="mt-1 text-sm leading-relaxed text-ink-100">
                  先观察:{example.better}。
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 rounded-xl border border-ink-700 bg-ink-900/55 p-5">
            <div className="grid gap-4 md:grid-cols-4">
              {[
                ['01', '提出观察', '从生活里的不方便、不舒服、不安全开始'],
                ['02', '背景调研', '看看别人做过什么,问题是否真实存在'],
                ['03', '收敛想法', '把观察压成一个可研究的问题'],
                ['04', '设计方案', '拆成能验证、能执行的步骤'],
              ].map(([key, title, desc]) => (
                <div key={key} className="rounded-lg border border-ink-700 bg-ink-950/50 p-3">
                  <div className="text-xs font-semibold text-gold-300">{key}</div>
                  <div className="mt-2 text-sm font-semibold text-ink-50">{title}</div>
                  <div className="mt-1 text-xs leading-relaxed text-ink-400">{desc}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
            <button onClick={() => setShowIntro(false)} className="btn-gold justify-center px-6 py-3 text-sm">
              开始开题交流
            </button>
            <button onClick={skip} className="text-sm text-ink-400 hover:text-ink-100">
              我已经有想法,直接进入工作台
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-ink-grad text-ink-50">
      <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-5 px-4 py-5 sm:px-6 lg:flex-row lg:items-center lg:gap-8">
        <section className="lg:w-[40%]">
          <div className="inline-flex items-center gap-2 rounded-full border border-gold-400/30 bg-gold-400/10 px-3 py-1 text-xs text-gold-200">
            <span className="h-2 w-2 rounded-full bg-gold-300" />
            01 开题交流
          </div>
          <h1 className="mt-5 text-3xl font-display leading-tight text-ink-50 sm:text-4xl">
            先抓一个
            <span className="block text-gold-shine">真实生活问题。</span>
          </h1>
          <p className="mt-4 max-w-md text-sm leading-relaxed text-ink-300">
            现在只做一件事:说清楚在哪里,谁遇到什么麻烦,这个麻烦为什么值得改。写不完整也没关系,先粗糙地说出来。
          </p>
          <div className="mt-5 grid gap-2">
            {OPENING_EXAMPLES.map((example) => (
              <div key={example.scene} className="rounded-lg border border-ink-700/70 bg-ink-900/60 p-3">
                <div className="text-sm font-semibold text-gold-200">{example.scene}</div>
                <div className="mt-1 text-xs leading-relaxed text-ink-400">
                  不是直接做“{example.bad}”,而是先问:{example.better}。
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="panel flex min-h-[560px] flex-1 flex-col overflow-hidden rounded-xl">
          <div className="border-b border-ink-700/70 bg-ink-900/80 px-4 py-3">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gold-shine text-sm font-bold text-ink-950">
                  大
                </div>
                <div>
                  <div className="text-sm font-semibold text-ink-50">大老师</div>
                  <div className="text-xs text-ink-400">正在了解你的课题起点</div>
                </div>
              </div>
              <div className="min-w-[96px] text-right">
                <div className="text-xs text-ink-400">{progress}%</div>
                <div className="mt-1 h-1.5 rounded-full bg-ink-800">
                  <div
                    className="h-full rounded-full bg-gold-shine transition-all"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto px-4 py-5 sm:px-6">
            {messages.map((message, index) => (
              <div
                key={`${message.ts}-${index}`}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[86%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm ${
                    message.role === 'user'
                      ? 'rounded-tr-sm border border-gold-400/30 bg-gold-400/15 text-ink-50'
                      : 'rounded-tl-sm border border-ink-700 bg-ink-800/80 text-ink-100'
                  }`}
                >
                  {message.content}
                </div>
              </div>
            ))}
          </div>

          <div className="border-t border-ink-700/70 bg-ink-950/70 p-4">
            {current.key === 'problem' && (
              <div className="mb-4 rounded-lg border border-gold-400/25 bg-gold-400/10 p-3">
                <div className="text-xs font-semibold text-gold-200">观察记录卡</div>
                <div className="mt-1 text-xs leading-relaxed text-ink-300">
                  先按公式拼一句话:<span className="text-gold-200">问题 = 场景 + 对象 + 痛点</span>。
                </div>
                <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                  {OBSERVATION_HINT_GROUPS.map((group) => (
                    <div key={group.title}>
                      <div className="mb-1">
                        <div className="text-[11px] font-semibold text-ink-300">{group.title}</div>
                        <div className="text-[10px] text-ink-500">{group.formula}</div>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {group.chips.map((chip) => (
                          <button
                            key={chip}
                            onClick={() => toggleHintChip(group.title, chip)}
                            className={`rounded border px-2 py-1 text-[11px] transition ${
                              selectedChips[group.title]?.includes(chip)
                                ? 'border-gold-300 bg-gold-400/20 text-gold-100 shadow-gold-glow'
                                : 'border-ink-700 bg-ink-900/70 text-ink-300 hover:border-gold-400/60 hover:text-gold-200'
                            }`}
                          >
                            {chip}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div className="mb-3 flex flex-wrap gap-2">
              {current.suggestions.map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => setDraft(suggestion)}
                  className="rounded-full border border-ink-700 bg-ink-800/70 px-3 py-1.5 text-xs text-ink-200 transition hover:border-gold-400/60 hover:text-gold-200"
                >
                  {suggestion}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    submitAnswer(draft)
                  }
                }}
                placeholder={current.placeholder}
                className="input-dark min-h-[52px] resize-none text-sm"
              />
              <button
                onClick={() => submitAnswer(draft)}
                disabled={!draft.trim() && !current.optional}
                className="btn-gold min-w-[76px] justify-center px-4 text-sm disabled:cursor-not-allowed disabled:opacity-40"
              >
                继续
              </button>
            </div>
            <div className="mt-3 flex items-center justify-between text-xs">
              <button onClick={skip} className="text-ink-400 hover:text-ink-100">
                先跳过,直接进入体验
              </button>
              <span className="text-ink-500">想不出来就点右下角“大老师”</span>
            </div>
          </div>
        </section>
      </div>
      <AIAssistant
        step="onboarding"
        profile={profile}
        model={model}
        context={{ onboardingStep: current.key, draft }}
      />
    </div>
  )
}

export function StudentProfileView({ profile, onEdit, onReset }) {
  if (!profile) return null
  const grade = GRADE_LEVELS.find((g) => g.id === profile.grade)
  const interests = INTEREST_DOMAINS.filter((d) => profile.interests?.includes(d.id))
  const competitions = COMPETITIONS.filter((c) => profile.targetCompetitions?.includes(c.id))

  return (
    <div className="panel p-5">
      <div className="mb-4 flex items-start justify-between">
        <div className="flex items-center gap-2">
          <span className="text-gold-shine text-lg">●</span>
          <h3 className="font-semibold text-ink-50">学生档案</h3>
        </div>
        <div className="flex gap-2">
          <button onClick={onEdit} className="text-xs text-gold-300 hover:text-gold-200">
            <i className="fa-solid fa-pen" /> 编辑
          </button>
          <button onClick={onReset} className="text-xs text-ink-400 hover:text-ink-200">
            <i className="fa-solid fa-rotate-left" /> 重做破冰
          </button>
        </div>
      </div>
      <div className="space-y-3 text-sm">
        <div>
          <span className="text-ink-400">年级</span>
          <span className="ml-2 chip-gold">{grade?.label || '未填'} {grade?.gradeRange}</span>
        </div>
        {interests.length > 0 && (
          <div>
            <span className="text-ink-400">兴趣</span>
            <span className="ml-2 inline-flex flex-wrap gap-1">
              {interests.map((i) => (
                <span key={i.id} className="chip">{i.icon} {i.label}</span>
              ))}
            </span>
          </div>
        )}
        {profile.interestNote && interests.length === 0 && (
          <div>
            <span className="text-ink-400">兴趣线索</span>
            <p className="mt-1 text-ink-200">{profile.interestNote}</p>
          </div>
        )}
        {profile.experience && (
          <div>
            <span className="text-ink-400">经历</span>
            <p className="mt-1 text-ink-200">{profile.experience}</p>
          </div>
        )}
        {profile.problem && (
          <div>
            <span className="text-ink-400">想解决的问题</span>
            <p className="mt-1 text-ink-200">{profile.problem}</p>
          </div>
        )}
        {competitions.length > 0 && (
          <div>
            <span className="text-ink-400">目标比赛</span>
            <span className="ml-2 inline-flex flex-wrap gap-1">
              {competitions.map((c) => (
                <span key={c.id} className="chip-gold">赛 · {c.short}</span>
              ))}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}
