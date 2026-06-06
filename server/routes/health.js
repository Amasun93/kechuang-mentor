/**
 * /api/health - 健康检查
 */

import { Router } from 'express'
import { isMockMode } from '../services/volcengine.js'

const router = Router()

router.get('/', (req, res) => {
  res.json({
    status: 'ok',
    service: 'kechuang-mentor-backend',
    mock: isMockMode(),
    volcConfigured: !isMockMode(),
    promptxInjected: !!process.env.PROMPTX_PERSONA_JSON,
    timestamp: new Date().toISOString(),
  })
})

export default router
