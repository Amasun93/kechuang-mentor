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
const MAX_CONTEXT_MESSAGES = 8

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

function isRawApiError(content) {
  return /OpenAI 兼容 API 错误|豆包 API 错误|model_not_found|No available channel/i.test(String(content || ''))
}

function localFallbackReply(step, lastMessage) {
  if (/想不到|不知道|观察|生活|问题|开题/.test(lastMessage) || step === 'onboarding' || step === 'inspiration') {
    return '先别急着想课题。你回忆过去一周:在学校、家里或路上,有没有哪一刻让你觉得不方便、不舒服、不安全、浪费,或者反复出错?先说一个具体瞬间。'
  }
  if (step === 'appreciate' || /案例|背景|调研|资料/.test(lastMessage)) {
    return '背景调研先问一个小问题:你现在更想查“有没有类似案例”,还是“这个现象到底有多普遍”?先选一个,我们再往下追。'
  }
  if (step === 'structure') {
    return '项目设计先别写大题目。把你现在的问题压成一句话:谁在什么场景里遇到什么麻烦?如果解决了,谁会受益?'
  }
  return '我先帮你把问题缩小:你现在卡住的是“没想法”,还是“有想法但不知道下一步怎么做”?先回答这一句。'
}

function sanitizeMessages(messages, step) {
  return (messages || []).map((message) => {
    if (message?.role === 'assistant' && isRawApiError(message.content)) {
      return {
        ...message,
        content: localFallbackReply(step, '我生活里想不到问题'),
        error: true,
        sanitized: true,
      }
    }
    return message
  })
}

export default function AIAssistant({ step, profile, model, context, onContextChange }) {
  const [open, setOpen] = useState(false)
  const [minimized, setMinimized] = useState(false)
  const [pos, setPos] = useState(DEFAULT_POS)
  const [dragging, setDragging] = useState(false)
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [statusText, setStatusText] = useState('')
  const [history, setHistory] = useState(() => {
    const all = loadHistory()
    return sanitizeMessages(all[step] || [], step)
  })
  const dragRef = useRef({ offsetX: 0, offsetY: 0 })
  const messagesRef = useRef(null)

  const personality = DA_TEACHER_PERSONA
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768

  // 切换 step 时,加载对应 step 的历史
  useEffect(() => {
    const all = loadHistory()
    setHistory(sanitizeMessages(all[step] || [], step))
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
    setStatusText('正在连接大老师,如果模型慢会先给你一个临时追问...')
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
          messages: newHistory
            .slice(-MAX_CONTEXT_MESSAGES)
            .map((m) => ({ role: m.role, content: m.content })),
          model,
          context,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok && !data.content) {
        throw new Error(data.error || `AI 请求失败(${res.status})`)
      }
      const aiMsg = {
        role: 'assistant',
        content: data.content || localFallbackReply(step, userMsg.content),
        mock: !!data.mock,
        error: !res.ok || !!data.transient,
        ts: Date.now(),
      }
      setHistory((h) => [...h, aiMsg])
      onContextChange?.(data.context)
    } catch (e) {
      setHistory((h) => [...h, {
        role: 'assistant',
        content: localFallbackReply(step, userMsg.content),
        error: true,
        ts: Date.now(),
      }])
    } finally {
      setSending(false)
      setStatusText('')
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
      <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2 md:bottom-6 md:right-6">
        <button
          onClick={() => { setOpen(true); setMinimized(false) }}
          className="max-w-[180px] rounded-full border border-gold-400/35 bg-ink-900/90 px-3 py-2 text-left text-xs text-gold-100 shadow-lg backdrop-blur hover:border-gold-300"
          title="不知道怎么写就问大老师"
        >
          不知道怎么写?<span className="block text-ink-300">点这里问大老师</span>
        </button>
        <button
          onClick={() => { setOpen(true); setMinimized(false) }}
          className="h-12 w-12 rounded-full md:h-14 md:w-14
                     bg-gold-shine shadow-gold-glow text-ink-950
                     flex items-center justify-center text-xl md:text-2xl
                     hover:scale-110 transition-transform animate-pulse-soft"
          title="唤起大老师"
        >
          大
        </button>
      </div>
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
                <div className="mt-4 flex flex-wrap justify-center gap-2">
                  {['我生活里想不到问题', '这一步要填什么', '帮我追问一个具体场景'].map((hint) => (
                    <button
                      key={hint}
                      onClick={() => setInput(hint)}
                      className="rounded-full border border-ink-700 bg-ink-900 px-3 py-1.5 text-xs text-ink-300 hover:border-gold-400/60 hover:text-gold-200"
                    >
                      {hint}
                    </button>
                  ))}
                </div>
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
                <div className="bg-ink-800/80 border border-ink-700 px-4 py-3 rounded-2xl rounded-tl-sm">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 rounded-full bg-ink-400 dot-flashing" />
                    <span className="w-2 h-2 rounded-full bg-ink-400 dot-flashing" />
                    <span className="w-2 h-2 rounded-full bg-ink-400 dot-flashing" />
                  </div>
                  {statusText && <div className="mt-2 max-w-[220px] text-xs text-ink-400">{statusText}</div>}
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
