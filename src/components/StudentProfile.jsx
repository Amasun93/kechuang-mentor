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
  {
    key: 'interests',
    prompt:
      '这个现象先记下。再换个角度:你平时做什么事会忘记时间?这能帮我判断你适合从哪类项目切入。',
    placeholder: '比如:喜欢机器人,也喜欢观察校园里的小问题',
    suggestions: ['我喜欢 AI 和编程', '我喜欢动手做东西', '我关心环保和垃圾分类', '我还没想好'],
  },
  {
    key: 'experience',
    prompt:
      '你之前做过小研究、小发明、小调查,或者参加过科创比赛吗?没有也没关系,这只是判断起点。',
    placeholder: '比如:做过一次问卷 / 参加过雏鹰杯 / 还没做过',
    suggestions: ['还没做过', '做过学校里的小实验', '参加过一次比赛但没拿奖', '做过一个小程序'],
  },
  {
    key: 'grade',
    prompt:
      '为了把问题问到合适的难度,我还需要知道你现在几年级。',
    placeholder: '比如:我上初一 / 小学五年级 / 高一',
    suggestions: ['我上小学五年级', '我上初一', '我上初二', '我上高一'],
  },
  {
    key: 'targetCompetitions',
    prompt:
      '最后问一句:你大概想往哪个比赛靠?不知道也可以,我会先按课题质量来带你。',
    placeholder: '比如:青创赛 / 宋庆龄奖 / 雏鹰杯 / 还不确定',
    suggestions: ['青创赛', '宋庆龄奖', '雏鹰杯', '还不确定,先做出好课题'],
    optional: true,
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

export function StudentProfile({ onComplete, onSkip }) {
  const [stepIndex, setStepIndex] = useState(0)
  const [profile, setProfile] = useState(emptyProfile())
  const [draft, setDraft] = useState('')
  const [messages, setMessages] = useState([assistantMessage(0)])
  const scrollRef = useRef(null)

  const current = ONBOARDING_STEPS[stepIndex]
  const progress = Math.round(((stepIndex + 1) / ONBOARDING_STEPS.length) * 100)

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
    if (stepIndex >= ONBOARDING_STEPS.length - 1) {
      setMessages((prev) => [
        ...prev,
        userMessage,
        {
          role: 'assistant',
          content:
            '够了,先不继续问。现在进入项目流程第一步:开题交流。我们先把你刚才说的现象追成一个更清楚的问题。',
          ts: Date.now() + 1,
        },
      ])
      setProfile(nextProfile)
      finish(nextProfile)
      return
    }

    const nextStep = stepIndex + 1
    setProfile(nextProfile)
    setStepIndex(nextStep)
    setDraft('')
    setMessages((prev) => [...prev, userMessage, assistantMessage(nextStep)])
  }

  const skip = () => {
    const final = { ...profile, onboarded: true, createdAt: Date.now() }
    saveProfile(final)
    onSkip?.(final)
  }

  return (
    <div className="min-h-screen bg-ink-grad text-ink-50">
      <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-5 px-4 py-5 sm:px-6 lg:flex-row lg:items-center lg:gap-8">
        <section className="lg:w-[40%]">
          <div className="inline-flex items-center gap-2 rounded-full border border-gold-400/30 bg-gold-400/10 px-3 py-1 text-xs text-gold-200">
            <span className="h-2 w-2 rounded-full bg-gold-300" />
            大老师科创项目陪练
          </div>
          <h1 className="mt-5 text-3xl font-display leading-tight text-ink-50 sm:text-4xl">
            好项目,
            <span className="block text-gold-shine">从生活里的小别扭开始。</span>
          </h1>
          <p className="mt-4 max-w-md text-sm leading-relaxed text-ink-300">
            不急着想“高科技”。先抓住一个真实场景:谁遇到了麻烦,哪里不方便,为什么值得改一改。大老师会把它慢慢追问成课题。
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
              <span className="text-ink-500">下面只是例子,可以直接打字</span>
            </div>
          </div>
        </section>
      </div>
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
                <span key={c.id} className="chip-gold">🏆 {c.short}</span>
              ))}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}
