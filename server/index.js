/**
 * Express 后端入口
 *
 * 路由:
 * - GET  /api/health            健康检查
 * - POST /api/ai/chat           LLM 对话(中转站/豆包/mock)
 * - POST /api/ai/images         AI 文生图(seedream/中转站/mock)
 * - POST /api/evaluate          评估引擎(注入 3 比赛 JSON + PromptX 角色)
 *
 * 启动:node server/index.js  →  http://localhost:3000
 *
 * 关键设计:
 * - 不依赖外部 SDK,直接用 fetch 调各家 API
 * - 后端优先级:OpenAI 兼容中转站 > 火山豆包/seedream > mock
 * - PromptX 角色设定从环境变量 PROMPTX_PERSONA_JSON 读,空时跳过注入
 */

import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import aiRouter from './routes/ai.js'
import imagesRouter from './routes/images.js'
import evaluateRouter from './routes/evaluate.js'
import healthRouter from './routes/health.js'
import { rateLimit } from './middleware/rateLimit.js'
import { isMockMode as llmMockMode } from './services/volcengine.js'
import { isMockMode as imgMockMode } from './services/imagegen.js'

const app = express()
const PORT = process.env.PORT || 3000

app.use(cors({
  origin: process.env.CORS_ORIGIN === '*' ? true : (process.env.CORS_ORIGIN || 'http://localhost:5173'),
  credentials: true,
}))
app.use(express.json({ limit: '2mb' }))

// Rate limit:AI 接口每 IP 每分钟 20 次,健康检查不限
const aiRateLimit = rateLimit({ windowMs: 60000, maxRequests: 20 })

// 路由
app.use('/api/health', healthRouter)
app.use('/api/ai', aiRateLimit, aiRouter)
app.use('/api/ai/images', aiRateLimit, imagesRouter) // 注意:必须挂在 /api/ai 下,但 images 路径优先
app.use('/api/evaluate', aiRateLimit, evaluateRouter)

// 生产环境:serve 前端静态文件(dist)
import { fileURLToPath } from 'url'
import path from 'path'
import fs from 'fs'
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const distPath = path.resolve(__dirname, '../dist')
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath, { maxAge: '1h' }))
  app.get(/^\/(?!api).*/, (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'))
  })
  console.log(`[server] 静态文件已挂载: ${distPath}`)
} else {
  console.log(`[server] 未找到 dist/，仅 API 模式。生产前请先 npm run build`)
}

// 兜底
app.use((err, req, res, next) => {
  console.error('[server error]', err)
  res.status(500).json({ error: err.message || 'Internal Server Error' })
})
app.use((req, res) => {
  res.status(404).json({ error: 'Not Found', path: req.path })
})

app.listen(PORT, '0.0.0.0', () => {
  const hasText = !llmMockMode()
  const hasImage = !imgMockMode()
  const hasPromptX = !!process.env.PROMPTX_PERSONA_JSON
  console.log(`\n🚀 科创导师后端已启动`)
  console.log(`   端口:  http://localhost:${PORT}`)
  console.log(`   健康:  http://localhost:${PORT}/api/health`)
  console.log(`   文字:  ${hasText ? '✅ 已配置(中转站或豆包)' : '⚠️  未配置(使用 mock 响应)'}`)
  console.log(`   图片:  ${hasImage ? '✅ 已配置(seedream 或中转站)' : '⚠️  未配置(MVP 走占位)'}`)
  console.log(`   PromptX: ${hasPromptX ? '✅ 已注入' : '⚠️  未注入(使用内置人设)'}`)
  console.log()
})
