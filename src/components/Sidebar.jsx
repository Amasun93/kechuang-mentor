/**
 * Sidebar - 左侧栏(响应式:桌面展开 / 移动端抽屉)
 * 展示:学生档案 / AI 设置 / 课题素材积累
 */

import { useState, useEffect } from 'react'
import AISettings from './AISettings.jsx'
import { StudentProfileView } from './StudentProfile.jsx'

function isMobile() {
  return typeof window !== 'undefined' && window.innerWidth < 768
}

export default function Sidebar({ profile, onEditProfile, onResetProfile, personalityId, onPersonalityChange, model, onModelChange, outline }) {
  const [open, setOpen] = useState(() => !isMobile())

  // 窗口变大时自动展开
  useEffect(() => {
    const onResize = () => {
      if (!isMobile()) setOpen(true)
    }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  // 移动端:折叠成底部抽屉按钮
  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-20 left-4 z-40 w-12 h-12 rounded-full
                   bg-ink-800 border border-ink-700 text-ink-300 hover:text-gold-200
                   flex items-center justify-center text-lg shadow-lg
                   md:hidden transition-all hover:scale-105"
        title="打开侧边栏"
      >
        <i className="fa-solid fa-bars" />
      </button>
    )
  }

  return (
    <>
      {/* 移动端遮罩 */}
      <div
        className="fixed inset-0 bg-black/50 z-30 md:hidden"
        onClick={() => setOpen(false)}
      />
      <aside
        className="w-80 shrink-0 border-r border-ink-700/60 bg-ink-900/60 backdrop-blur h-full overflow-y-auto p-4 space-y-4
                   fixed md:relative left-0 top-0 z-40 md:z-auto
                   animate-slide-left"
      >
        {/* 移动端关闭按钮 */}
        <div className="flex justify-end md:hidden">
          <button
            onClick={() => setOpen(false)}
            className="w-8 h-8 rounded text-ink-400 hover:text-ink-100 flex items-center justify-center"
          >
            <i className="fa-solid fa-xmark" />
          </button>
        </div>
        <StudentProfileView
          profile={profile}
          onEdit={onEditProfile}
          onReset={onResetProfile}
        />
        <AISettings
          personalityId={personalityId}
          onPersonalityChange={onPersonalityChange}
          model={model}
          onModelChange={onModelChange}
        />
        {outline && outline.length > 0 && (
          <div className="panel p-4">
            <div className="flex items-center gap-2 mb-3">
              <i className="fa-solid fa-list-ul text-gold-300" />
              <h3 className="text-ink-50 font-semibold text-sm">课题素材积累</h3>
            </div>
            <ul className="space-y-1.5 text-sm text-ink-200">
              {outline.map((o, i) => (
                <li key={i} className="flex gap-2">
                  <span className="text-gold-300 shrink-0">·</span>
                  <span className="line-clamp-2">{o}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </aside>
    </>
  )
}
