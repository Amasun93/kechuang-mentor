/**
 * App.jsx - 6 步流程主组件
 *
 * 流程:
 * 1. 检查 localStorage 是否有 student_profile
 *    - 没有 → <StudentProfile> 破冰对话
 *    - 有 → 进入 6 步流程
 * 2. 6 步流程 = OPENING → RESEARCH → DESIGN → PLAN → TEST → SUBMISSION
 * 3. 浮动 AI 引导窗始终可用(右下角图标)
 * 4. 4 格式导出在 ACHIEVEMENT 步骤
 */

import { useState, useEffect, useMemo } from 'react'
import StepNav from './components/StepNav.jsx'
import Sidebar from './components/Sidebar.jsx'
import AIAssistant from './components/AIAssistant.jsx'
import ExportButton from './components/ExportButton.jsx'
import AppreciateStep from './components/steps/AppreciateStep.jsx'
import InspirationStep from './components/steps/InspirationStep.jsx'
import StructureStep from './components/steps/StructureStep.jsx'
import DraftStep from './components/steps/DraftStep.jsx'
import RefineStep from './components/steps/RefineStep.jsx'
import AchievementStep from './components/steps/AchievementStep.jsx'
import { StudentProfile, loadProfile, saveProfile, clearProfile } from './components/StudentProfile.jsx'
import { STEPS } from './prompts/index.js'

const PROJECT_KEY = 'kechuang_project'
const OUTLINE_KEY = 'kechuang_outline'
const MODEL_KEY = 'kechuang_model'

function loadProject() {
  try {
    const raw = localStorage.getItem(PROJECT_KEY)
    return raw ? JSON.parse(raw) : { directions: ['', '', ''] }
  } catch { return { directions: ['', '', ''] } }
}
function loadOutline() {
  try {
    const raw = localStorage.getItem(OUTLINE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch { return [] }
}

export default function App() {
  const [profile, setProfile] = useState(() => loadProfile())
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [step, setStep] = useState('inspiration')
  const [completed, setCompleted] = useState(new Set())
  const [project, setProject] = useState(loadProject)
  const [outline, setOutline] = useState(loadOutline)
  const [model, setModel] = useState(() => localStorage.getItem(MODEL_KEY) || 'deepseek-v4-pro')

  // 首次进入 → 检查破冰
  useEffect(() => {
    if (!profile?.onboarded) {
      setShowOnboarding(true)
    }
  }, [])

  // 持久化
  useEffect(() => { localStorage.setItem(PROJECT_KEY, JSON.stringify(project)) }, [project])
  useEffect(() => { localStorage.setItem(OUTLINE_KEY, JSON.stringify(outline)) }, [outline])
  useEffect(() => { localStorage.setItem(MODEL_KEY, model) }, [model])

  const onOnboardingComplete = (p) => {
    setProfile(p)
    setShowOnboarding(false)
  }

  const onEditProfile = () => setShowOnboarding(true)
  const onResetProfile = () => {
    if (!confirm('确定要重新做破冰对话吗?会清空你当前的档案。')) return
    clearProfile()
    setProfile(loadProfile())
    setShowOnboarding(true)
  }

  const handleStepChange = (newStep) => {
    setStep(newStep)
    // 标记前一步为完成
    const idx = STEPS.findIndex((s) => s.id === newStep)
    if (idx > 0) {
      const newCompleted = new Set(completed)
      for (let i = 0; i < idx; i++) {
        newCompleted.add(STEPS[i].id)
      }
      setCompleted(newCompleted)
    }
  }

  const updateProject = (patch) => {
    setProject((p) => ({ ...p, ...patch }))
  }

  const addOutline = (text) => {
    setOutline((o) => [...o, text])
  }

  const currentStep = useMemo(() => STEPS.find((s) => s.id === step), [step])

  // 破冰界面
  if (showOnboarding && !profile?.onboarded) {
    return <StudentProfile onComplete={onOnboardingComplete} onSkip={onOnboardingComplete} />
  }

  // 已破冰但用户主动重新破冰
  if (showOnboarding && profile?.onboarded) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-ink-grad">
        <div className="w-full max-w-2xl">
          <StudentProfile onComplete={(p) => { setProfile(p); setShowOnboarding(false) }} onSkip={() => setShowOnboarding(false)} />
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col bg-ink-grad">
      <StepNav currentStep={step} onChange={handleStepChange} completed={completed} />

      <div className="flex-1 flex min-h-0">
        {/* 左侧栏 */}
        <Sidebar
          profile={profile}
          onEditProfile={onEditProfile}
          onResetProfile={onResetProfile}
          model={model}
          onModelChange={setModel}
          outline={outline}
        />

        {/* 主内容区 */}
        <main className="flex-1 overflow-y-auto p-4 pb-28 md:p-6">
          {step === 'appreciate' && (
            <AppreciateStep profile={profile} onAddOutline={addOutline} outline={outline} />
          )}
          {step === 'inspiration' && (
            <InspirationStep profile={profile} onAddOutline={addOutline} outline={outline} />
          )}
          {step === 'structure' && (
            <StructureStep
              profile={profile}
              project={{ ...project, inspiration: outline[0] || '' }}
              onUpdateProject={updateProject}
              onAddOutline={addOutline}
            />
          )}
          {step === 'draft' && (
            <DraftStep
              profile={profile}
              project={project}
              onUpdateProject={updateProject}
              onAddOutline={addOutline}
            />
          )}
          {step === 'refine' && (
            <RefineStep
              profile={profile}
              project={project}
              onUpdateProject={updateProject}
              onAddOutline={addOutline}
            />
          )}
          {step === 'achievement' && (
            <AchievementStep
              profile={profile}
              project={project}
              onUpdateProject={updateProject}
            />
          )}
        </main>
      </div>

      {/* 浮动 AI 引导窗(可拖动 + 可关闭再唤起) */}
      <AIAssistant
        step={step}
        profile={profile}
        model={model}
        context={{ project, outline }}
      />
    </div>
  )
}
