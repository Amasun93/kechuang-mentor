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
    console.error('[ai/chat error]', e)
    res.status(502).json({
      error: e.message || 'AI 请求失败',
      content:
        '我这边刚才连接模型慢了一下。先别换题,咱们把问题缩小一点:你现在卡住的是“找不到生活现象”,还是“有现象但不知道怎么变成课题”?',
      transient: true,
      mock: false,
    })
  }
})

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
