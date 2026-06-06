/**
 * 极简 rate limiter 中间件
 * 按 IP 限流,防刷 API
 */
const windows = new Map() // ip → { count, resetAt }

export function rateLimit({ windowMs = 60000, maxRequests = 30 } = {}) {
  return (req, res, next) => {
    const ip = req.ip || req.socket?.remoteAddress || 'unknown'
    const now = Date.now()
    let entry = windows.get(ip)

    if (!entry || now > entry.resetAt) {
      entry = { count: 0, resetAt: now + windowMs }
      windows.set(ip, entry)
    }

    entry.count++

    if (entry.count > maxRequests) {
      res.writeHead(429, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ error: '请求太频繁,请稍后再试', retryAfter: Math.ceil((entry.resetAt - now) / 1000) }))
      return
    }

    // 定期清理过期条目(每 100 次请求清理一次)
    if (windows.size > 1000) {
      for (const [k, v] of windows) {
        if (now > v.resetAt) windows.delete(k)
      }
    }

    next()
  }
}
