/**
 * AIAssistant - 浮动 AI 引导窗
 *
 * 核心特性:
 * 1. 永远遵循苏格拉底式引导(由后端 prompt 保证)
 * 2. 可拖动(mousedown/touchstart + mousemove/touchmove)
 * 3. 关闭后右下角出现小图标,点击可重新唤起
 * 4. 固定为"大老师"人格,作为每个项目步骤的助教
 * 5. 支持上下文(每个 step 一个 session)
 * 6. localStorage 保存历史对话
 */

import { useState, useRef, useEffect } from 'react'
import { DA_TEACHER_PERSONA } from '../data/personalities.js'
import { buildFullSystemPrompt } from '../prompts/index.js'

const STORAGE_KEY = 'kechuang_ai_history'

// 位置状态 - 屏幕右下角
const DEFAULT_POS = { x: typeof window !== 'undefined' ? window.innerWidth - 420 : 800, y: typeof window !== 'undefined' ? window.innerHeight - 540 : 200 }
const MIN_POS = { x: 0, y: 0 }

function loadHistory() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch { return {} }
}
function saveHistory(h) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(h))
}

export default function AIAssistant({ step, profile, model, context, onContextChange }) {
  const [open, setOpen] = useState(false)
  const [minimized, setMinimized] = useState(false)
  const [pos, setPos] = useState(DEFAULT_POS)
  const [dragging, setDragging] = useState(false)
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [history, setHistory] = useState(() => {
    const all = loadHistory()
    return all[step] || []
  })
  const dragRef = useRef({ offsetX: 0, offsetY: 0 })
  const messagesRef = useRef(null)

  const personality = DA_TEACHER_PERSONA
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768

  // 切换 step 时,加载对应 step 的历史
  useEffect(() => {
    const all = loadHistory()
    setHistory(all[step] || [])
  }, [step])

  // 滚动到底部
  useEffect(() => {
    if (messagesRef.current) {
      messagesRef.current.scrollTop = messagesRef.current.scrollHeight
    }
  }, [history, open])

  // 保存历史
  useEffect(() => {
    if (history.length === 0) return
    const all = loadHistory()
    all[step] = history
    saveHistory(all)
  }, [history, step])

  // 拖动逻辑
  useEffect(() => {
    if (!dragging) return
    const onMove = (e) => {
      const clientX = e.touches ? e.touches[0].clientX : e.clientX
      const clientY = e.touches ? e.touches[0].clientY : e.clientY
      const newX = Math.max(MIN_POS.x, clientX - dragRef.current.offsetX)
      const newY = Math.max(MIN_POS.y, clientY - dragRef.current.offsetY)
      const maxX = window.innerWidth - 380
      const maxY = window.innerHeight - 60
      setPos({
        x: Math.min(newX, maxX),
        y: Math.min(newY, maxY),
      })
    }
    const onUp = () => setDragging(false)
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
    window.addEventListener('touchmove', onMove)
    window.addEventListener('touchend', onUp)
    return () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
      window.removeEventListener('touchmove', onMove)
      window.removeEventListener('touchend', onUp)
    }
  }, [dragging])

  const startDrag = (e) => {
    const clientX = e.touches ? e.touches[0].clientX : e.clientX
    const clientY = e.touches ? e.touches[0].clientY : e.clientY
    dragRef.current = {
      offsetX: clientX - pos.x,
      offsetY: clientY - pos.y,
    }
    setDragging(true)
  }

  const send = async () => {
    if (!input.trim() || sending) return
    const userMsg = { role: 'user', content: input.trim(), ts: Date.now() }
    const newHistory = [...history, userMsg]
    setHistory(newHistory)
    setInput('')
    setSending(true)
    try {
      const systemPrompt = buildFullSystemPrompt({
        step,
        personalityPrompt: personality.personaPrompt,
        profile,
      })
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system: systemPrompt,
          messages: newHistory.map((m) => ({ role: m.role, content: m.content })),
          model,
          context,
        }),
      })
      const data = await res.json()
      const aiMsg = {
        role: 'assistant',
        content: data.content || data.error || '(无回复)',
        mock: !!data.mock,
        ts: Date.now(),
      }
      setHistory((h) => [...h, aiMsg])
      onContextChange?.(data.context)
    } catch (e) {
      setHistory((h) => [...h, {
        role: 'assistant',
        content: '网络断了一下。先别换题,你把刚才那句话再发一次,我继续追问。',
        error: true,
        ts: Date.now(),
      }])
    } finally {
      setSending(false)
    }
  }

  const clearStepHistory = () => {
    if (!confirm('清空当前步骤的对话历史?')) return
    setHistory([])
    const all = loadHistory()
    delete all[step]
    saveHistory(all)
  }

  // 浮窗隐藏后的小图标
  if (!open) {
    return (
      <button
        onClick={() => { setOpen(true); setMinimized(false) }}
        className="fixed bottom-5 right-5 z-50 h-12 w-12 rounded-full md:bottom-6 md:right-6 md:h-14 md:w-14
                   bg-gold-shine shadow-gold-glow text-ink-950
                   flex items-center justify-center text-xl md:text-2xl
                   hover:scale-110 transition-transform animate-pulse-soft"
        title="唤起大老师"
      >
        大
      </button>
    )
  }

  const assistantStyle = isMobile
    ? {
        left: '0',
        right: '0',
        bottom: '0',
        width: 'auto',
        height: minimized ? 'auto' : '72vh',
      }
    : {
        left: `${pos.x}px`,
        top: `${pos.y}px`,
        width: minimized ? '320px' : '380px',
        height: minimized ? 'auto' : '540px',
      }

  return (
    <div
      style={assistantStyle}
      className={`fixed z-50 flex flex-col overflow-hidden ${isMobile ? 'rounded-t-xl border border-ink-700 bg-ink-950 shadow-2xl' : 'panel'} ${dragging ? 'dragging' : ''} animate-slide-up`}
    >
      {/* 标题栏 - 可拖动 */}
      <div
        onMouseDown={startDrag}
        onTouchStart={startDrag}
        className="px-3 py-2.5 border-b border-ink-700 bg-ink-900/80
                   flex items-center justify-between cursor-grab select-none"
      >
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-7 h-7 rounded-full bg-gold-shine flex items-center justify-center text-sm shrink-0">
            {personality.avatar}
          </div>
          <div className="min-w-0">
            <div className="text-ink-50 text-sm font-semibold truncate">{personality.name}</div>
            <div className="text-ink-400 text-xs truncate">{personality.focus}</div>
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={clearStepHistory}
            className="w-7 h-7 rounded text-ink-300 hover:text-gold-200 hover:bg-ink-800 text-xs"
            title="清空对话"
          >
            <i className="fa-solid fa-eraser" />
          </button>
          <button
            onClick={() => setMinimized(!minimized)}
            className="w-7 h-7 rounded text-ink-300 hover:text-gold-200 hover:bg-ink-800 text-xs"
            title="最小化"
          >
            <i className={`fa-solid fa-${minimized ? 'expand' : 'minus'}`} />
          </button>
          <button
            onClick={() => setOpen(false)}
            className="w-7 h-7 rounded text-ink-300 hover:text-red-300 hover:bg-ink-800 text-xs"
            title="关闭"
          >
            <i className="fa-solid fa-xmark" />
          </button>
        </div>
      </div>

      {!minimized && (
        <>
          {/* 消息区 */}
          <div ref={messagesRef} className="flex-1 overflow-y-auto p-3 space-y-2.5">
            {history.length === 0 && (
              <div className="text-center text-ink-400 text-sm py-8">
                <div className="text-3xl mb-2">{personality.avatar}</div>
                <p>我是 <span className={personality.text}>{personality.name}</span>,这一步的助教。</p>
                <p className="text-xs mt-2">哪里想不明白,把卡住的句子发给我。我只帮你追问,不替你写答案。</p>
              </div>
            )}
            {history.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[80%] px-3 py-2 rounded-2xl text-sm leading-relaxed
                    ${m.role === 'user'
                      ? 'bg-gold-400/20 text-ink-50 rounded-tr-sm border border-gold-400/30'
                      : m.error
                        ? 'bg-red-500/10 text-red-200 rounded-tl-sm border border-red-400/30'
                        : 'bg-ink-800/80 text-ink-100 rounded-tl-sm border border-ink-700'}`}
                >
                  {m.content}
                  {m.mock && <span className="ml-2 text-xs text-ink-500">(mock)</span>}
                </div>
              </div>
            ))}
            {sending && (
              <div className="flex justify-start">
                <div className="bg-ink-800/80 border border-ink-700 px-4 py-3 rounded-2xl rounded-tl-sm flex gap-1">
                  <span className="w-2 h-2 rounded-full bg-ink-400 dot-flashing" />
                  <span className="w-2 h-2 rounded-full bg-ink-400 dot-flashing" />
                  <span className="w-2 h-2 rounded-full bg-ink-400 dot-flashing" />
                </div>
              </div>
            )}
          </div>

          {/* 输入区 */}
          <div className="border-t border-ink-700 p-2 bg-ink-900/60">
            <div className="flex gap-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && send()}
                placeholder="这一步哪里卡住了?"
                disabled={sending}
                className="input-dark text-sm py-2"
              />
              <button
                onClick={send}
                disabled={sending || !input.trim()}
                className="btn-gold text-sm px-3 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <i className="fa-solid fa-paper-plane" />
              </button>
            </div>
            <p className="text-ink-500 text-xs mt-1.5 px-1">
              {personality.name}助教 · {history.length} 轮对话
            </p>
          </div>
        </>
      )}
    </div>
  )
}
