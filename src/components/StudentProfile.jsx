/**
 * StudentProfile - 破冰对话 + 档案展示
 *
 * 两种模式:
 * 1. <StudentProfile> 默认是"破冰对话"模式(首次进入)
 * 2. <StudentProfileView> 是"档案展示"模式(已破冰,允许编辑)
 *
 * 设计原则:
 * - 不要"问卷式"表单,要用对话式提问(苏格拉底底色)
 * - 破冰完后写入 localStorage('kechuang_student_profile')
 * - 允许用户后续修改档案
 */

import { useState, useEffect, useRef } from 'react'
import { GRADE_LEVELS, INTEREST_DOMAINS, emptyProfile } from '../data/age_adaptations.js'
import { COMPETITIONS } from '../data/competitions.js'

const STORAGE_KEY = 'kechuang_student_profile'

/** 读取本地档案 */
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

/** 写入本地档案 */
export function saveProfile(profile) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(profile))
}

/** 清空档案(调试用) */
export function clearProfile() {
  localStorage.removeItem(STORAGE_KEY)
}

// ============================================================
// 破冰对话 - 内嵌一个 mini AI 引导窗
// ============================================================
const ONBOARDING_QUESTIONS = [
  {
    key: 'grade',
    icon: '🎒',
    question: '你好!我是你的科创课题陪练老师。在我们开始之前,我想先认识一下你——你今年上几年级啦?',
    hint: '小学 / 初中 / 高中,选一个就行',
  },
  {
    key: 'interests',
    icon: '✨',
    question: '好嘞~ 那你平时课余时间,什么事让你觉得时间过得特别快?',
    hint: '可以选 1-3 个你最喜欢的领域',
  },
  {
    key: 'experience',
    icon: '🛠️',
    question: '听起来挺有意思的。那你有没有做过什么小研究、小调查、小发明,或者参加过什么科创比赛?哪怕只是在学校里做过一次小报告也算。',
    hint: '有就说说,没有就说"还没做过"',
  },
  {
    key: 'problem',
    icon: '💡',
    question: '嗯嗯~ 那你最近有没有遇到什么让你觉得"挺烦的"或者"挺想搞清楚"的事?哪怕很小的也算。',
    hint: '可以是一个生活里的小问题,也可以是一个"为什么"',
  },
  {
    key: 'targetCompetitions',
    icon: '🏆',
    question: '最后一个问题——你听说过青创赛、宋庆龄奖、雏鹰杯这些科创比赛吗?知道的可以选一下,不知道也没关系。',
    hint: '可以多选,也可以跳过',
  },
]

export function StudentProfile({ onComplete, onSkip }) {
  const [step, setStep] = useState(0)
  const [profile, setProfile] = useState(emptyProfile())
  const current = ONBOARDING_QUESTIONS[step]

  const updateProfile = (patch) => {
    setProfile((prev) => ({ ...prev, ...patch }))
  }

  const next = () => {
    if (step < ONBOARDING_QUESTIONS.length - 1) {
      setStep(step + 1)
    } else {
      // 完成
      const final = { ...profile, onboarded: true, createdAt: Date.now() }
      saveProfile(final)
      onComplete?.(final)
    }
  }

  const skip = () => {
    const final = { ...profile, onboarded: true, createdAt: Date.now() }
    saveProfile(final)
    onSkip?.(final)
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-ink-grad">
      <div className="w-full max-w-2xl panel p-8 animate-fade-in">
        {/* 顶部进度 */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <span className="text-gold-shine text-xl font-display">科创导师</span>
            <span className="chip">初次见面</span>
          </div>
          <div className="flex items-center gap-1.5">
            {ONBOARDING_QUESTIONS.map((_, i) => (
              <div
                key={i}
                className={`w-2 h-2 rounded-full transition-all ${
                  i < step ? 'bg-gold-200' : i === step ? 'bg-gold-400 w-3 h-3' : 'bg-ink-600'
                }`}
              />
            ))}
          </div>
        </div>

        {/* AI 提问 */}
        <div className="mb-6 flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-gold-shine flex items-center justify-center text-ink-950 text-lg shrink-0">
            🤖
          </div>
          <div className="panel bg-ink-800/60 px-4 py-3 rounded-2xl rounded-tl-sm max-w-md">
            <p className="text-ink-50 leading-relaxed">{current.question}</p>
            <p className="text-ink-300 text-xs mt-2 italic">{current.hint}</p>
          </div>
        </div>

        {/* 用户回答区 - 根据 key 切换不同输入 */}
        <div className="mb-6 pl-12">
          {current.key === 'grade' && (
            <GradeSelector
              value={profile.grade}
              onChange={(v) => updateProfile({ grade: v })}
            />
          )}
          {current.key === 'interests' && (
            <InterestChips
              value={profile.interests}
              onChange={(v) => updateProfile({ interests: v })}
            />
          )}
          {current.key === 'experience' && (
            <textarea
              className="input-dark min-h-[100px]"
              placeholder="比如:做过一次叶脉书签实验 / 参加过一次雏鹰杯 / 还没做过"
              value={profile.experience}
              onChange={(e) => updateProfile({ experience: e.target.value })}
            />
          )}
          {current.key === 'problem' && (
            <textarea
              className="input-dark min-h-[100px]"
              placeholder="比如:小区快递柜坏了 3 个月没人修 / 想知道为什么打哈欠会传染"
              value={profile.problem}
              onChange={(e) => updateProfile({ problem: e.target.value })}
            />
          )}
          {current.key === 'targetCompetitions' && (
            <CompetitionChips
              value={profile.targetCompetitions}
              onChange={(v) => updateProfile({ targetCompetitions: v })}
            />
          )}
        </div>

        {/* 操作 */}
        <div className="flex items-center justify-between">
          <button
            onClick={skip}
            className="text-ink-300 hover:text-ink-100 text-sm"
          >
            稍后再说,直接开始
          </button>
          <div className="flex gap-3">
            {step > 0 && (
              <button
                onClick={() => setStep(step - 1)}
                className="btn-ghost text-sm"
              >
                <i className="fa-solid fa-arrow-left" /> 上一题
              </button>
            )}
            <button onClick={next} className="btn-gold text-sm">
              {step < ONBOARDING_QUESTIONS.length - 1 ? (
                <>下一题 <i className="fa-solid fa-arrow-right" /></>
              ) : (
                <>开始 6 步旅程 <i className="fa-solid fa-rocket" /></>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ============================================================
// 子组件:年级选择
// ============================================================
function GradeSelector({ value, onChange }) {
  return (
    <div className="grid grid-cols-3 gap-3">
      {GRADE_LEVELS.map((g) => (
        <button
          key={g.id}
          onClick={() => onChange(g.id)}
          className={`p-4 rounded-lg border-2 text-left transition-all
            ${value === g.id
              ? 'border-gold-400 bg-gold-400/10 shadow-gold-glow'
              : 'border-ink-700 bg-ink-800/40 hover:border-ink-500'}`}
        >
          <div className="text-2xl mb-1">
            {g.id === 'primary' ? '🎒' : g.id === 'junior' ? '📚' : '🎓'}
          </div>
          <div className="text-ink-50 font-semibold">{g.label}</div>
          <div className="text-ink-300 text-xs mt-1">{g.gradeRange} · {g.ageRange}</div>
        </button>
      ))}
    </div>
  )
}

// ============================================================
// 子组件:兴趣多选
// ============================================================
function InterestChips({ value = [], onChange }) {
  const toggle = (id) => {
    if (value.includes(id)) {
      onChange(value.filter((v) => v !== id))
    } else if (value.length < 3) {
      onChange([...value, id])
    }
  }
  return (
    <div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {INTEREST_DOMAINS.map((d) => {
          const active = value.includes(d.id)
          return (
            <button
              key={d.id}
              onClick={() => toggle(d.id)}
              className={`p-3 rounded-lg border text-center transition-all
                ${active
                  ? 'border-gold-400 bg-gold-400/10 text-gold-100'
                  : 'border-ink-700 bg-ink-800/40 text-ink-200 hover:border-ink-500'}`}
            >
              <div className="text-xl mb-1">{d.icon}</div>
              <div className="text-sm font-medium">{d.label}</div>
            </button>
          )
        })}
      </div>
      <p className="text-ink-400 text-xs mt-2">已选 {value.length} / 3</p>
    </div>
  )
}

// ============================================================
// 子组件:比赛多选
// ============================================================
function CompetitionChips({ value = [], onChange }) {
  const toggle = (id) => {
    if (value.includes(id)) onChange(value.filter((v) => v !== id))
    else onChange([...value, id])
  }
  return (
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        {COMPETITIONS.map((c) => {
          const active = value.includes(c.id)
          return (
            <button
              key={c.id}
              onClick={() => toggle(c.id)}
              className={`p-3 rounded-lg border text-left transition-all
                ${active
                  ? 'border-gold-400 bg-gold-400/10'
                  : 'border-ink-700 bg-ink-800/40 hover:border-ink-500'}`}
            >
              <div className="text-ink-50 text-sm font-semibold">{c.short}</div>
              <div className="text-ink-400 text-xs mt-0.5">{c.level}</div>
            </button>
          )
        })}
      </div>
      <p className="text-ink-400 text-xs mt-2">可以多选,也可以不选</p>
    </div>
  )
}

// ============================================================
// 档案展示 + 编辑
// ============================================================
export function StudentProfileView({ profile, onEdit, onReset }) {
  if (!profile) return null
  const grade = GRADE_LEVELS.find((g) => g.id === profile.grade)
  const interests = INTEREST_DOMAINS.filter((d) => profile.interests?.includes(d.id))
  const competitions = COMPETITIONS.filter((c) => profile.targetCompetitions?.includes(c.id))

  return (
    <div className="panel p-5">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-gold-shine text-lg">👤</span>
          <h3 className="text-ink-50 font-semibold">学生档案</h3>
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
            <span className="ml-2 inline-flex gap-1 flex-wrap">
              {interests.map((i) => (
                <span key={i.id} className="chip">{i.icon} {i.label}</span>
              ))}
            </span>
          </div>
        )}
        {profile.experience && (
          <div>
            <span className="text-ink-400">经历</span>
            <p className="text-ink-200 mt-1">{profile.experience}</p>
          </div>
        )}
        {profile.problem && (
          <div>
            <span className="text-ink-400">想解决的问题</span>
            <p className="text-ink-200 mt-1">{profile.problem}</p>
          </div>
        )}
        {competitions.length > 0 && (
          <div>
            <span className="text-ink-400">目标比赛</span>
            <span className="ml-2 inline-flex gap-1 flex-wrap">
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
