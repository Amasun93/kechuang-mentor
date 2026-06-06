/**
 * /api/ai/images - AI 文生图
 * POST /api/ai/images
 * body: { prompt: string, size?: '1024x1024' | '1024x1792' | '2048x2048' | '1K' | '2K' | '4K', model?: string }
 *
 * 响应: { url: string, mock: boolean, backend?: string, model?: string, note?: string }
 *
 * 后端优先级(自动探测):
 * 1. OpenAI 兼容中转站 (OPENAI_COMPAT_KEY)
 * 2. 火山 seedream (VOLC_SEEDREAM_KEY)
 * 3. mock (返回占位信息,前端用 SVG/emoji)
 *
 * MVP 状态:方案 C 纯文字,本路由已就位,主人开通后端后填环境变量即可启用。
 */

import { Router } from 'express'
import { generateImage, isMockMode } from '../services/imagegen.js'

const router = Router()

router.post('/', async (req, res, next) => {
  try {
    const { prompt, size, model } = req.body
    if (!prompt) {
      return res.status(400).json({ error: 'prompt 必填' })
    }
    const result = await generateImage({ prompt, size, model })
    res.json(result)
  } catch (e) {
    next(e)
  }
})

/**
 * GET /api/ai/modes/images - 返回图片生成可用模式
 */
router.get('/modes', (req, res) => {
  res.json({
    mock: isMockMode(),
    openaiCompat: !!process.env.OPENAI_COMPAT_KEY && process.env.OPENAI_COMPAT_KEY !== 'your_openai_key_here',
    seedream: !!process.env.VOLC_SEEDREAM_KEY && process.env.VOLC_SEEDREAM_KEY !== 'your_seedream_key_here',
    seedreamModel: process.env.VOLC_SEEDREAM_MODEL || 'doubao-seedream-3.0-t2i-250415',
  })
})

export default router
