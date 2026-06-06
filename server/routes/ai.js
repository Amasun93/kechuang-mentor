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
  try {
    const { system, messages, model } = req.body
    if (!system) {
      return res.status(400).json({ error: 'system prompt 必填' })
    }
    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'messages 必填,至少 1 条' })
    }
    const result = await chatCompletion({ system, messages, model })
    res.json(result)
  } catch (e) {
    next(e)
  }
})

/**
 * GET /api/ai/modes - 返回当前可用模式
 */
router.get('/modes', (req, res) => {
  res.json({
    mock: isMockMode(),
    model: process.env.VOLC_MODEL || 'Doubao-Seed-1.6-flash',
    endpoint: process.env.VOLC_ENDPOINT || 'ep-20260125095517-z49n4',
    webSearchEnabled: process.env.ENABLE_WEB_SEARCH === 'true',
  })
})

export default router
