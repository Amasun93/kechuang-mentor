/**
 * Sidebar - 左侧栏
 * 展示:学生档案 / AI 设置 / 课题素材积累
 */

import AISettings from './AISettings.jsx'
import { StudentProfileView } from './StudentProfile.jsx'

export default function Sidebar({ profile, onEditProfile, onResetProfile, personalityId, onPersonalityChange, model, onModelChange, outline }) {
  return (
    <aside className="w-80 shrink-0 border-r border-ink-700/60 bg-ink-900/60 backdrop-blur h-full overflow-y-auto p-4 space-y-4">
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
  )
}
