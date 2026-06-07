/**
 * /api/ai/chat - 豆包对话代理
 * POST /api/ai/chat
 * body: { system: string, messages: Array<{role, content}>, context?: object, model?: string }
 *
 * 响应: { content: string, mock: boolean, usage?: object, note?: string }
 */

import { Router } from 'express'
import { chatCompletion, isMockMode } from '../services/volcengine.js'

const router = Router()

router.post('/chat', async (req, res, next) => {
  let messages = []
  try {
    const { system, model } = req.body
    messages = req.body.messages
    if (!system) {
      return res.status(400).json({ error: 'system prompt 必填' })
    }
    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'messages 必填,至少 1 条' })
    }
    const result = await chatCompletion({ system, messages, model })
    res.json(result)
  } catch (e) {
    console.error('[ai/chat error]', e)
    const last = messages?.[messages.length - 1]?.content || ''
    res.status(502).json({
      error: 'AI 请求失败或超时',
      content: fallbackAssistantReply(last),
      transient: true,
      mock: false,
    })
  }
})

function fallbackAssistantReply(lastMessage) {
  if (/观察|生活|想不到|不知道|开题|问题/.test(lastMessage)) {
    return '我这边模型连接慢了一下,先别等它。咱们先把问题问小:过去一周,在学校、家里或路上,有没有哪一刻让你觉得不方便、不舒服、不安全、浪费,或者总出错?先说一个瞬间就行。'
  }
  if (/案例|背景|资料|调研/.test(lastMessage)) {
    return '模型连接慢了一下。我先追问你一个最小问题:你现在想查清楚的是“有没有别人做过”,还是“这个现象到底有多严重”?先选一个。'
  }
  return '模型连接慢了一下。我先帮你缩小一下:你现在卡住的是“找不到生活现象”,还是“有现象但不知道怎么变成课题”?先回答这一个。'
}

/**
 * GET /api/ai/modes - 返回当前可用模式
 */
router.get('/modes', (req, res) => {
  res.json({
    mock: isMockMode(),
    model: process.env.OPENAI_COMPAT_MODEL || process.env.VOLC_MODEL || 'deepseek-v4-pro',
    endpoint: process.env.OPENAI_COMPAT_BASE || process.env.VOLC_ENDPOINT || 'https://api.yz.rs/v1',
    webSearchEnabled: process.env.ENABLE_WEB_SEARCH === 'true',
  })
})

export default router
