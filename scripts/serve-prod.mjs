/**
 * 极简合并 server:dist 静态 + API 反向代理到 :3000
 * 用于 cloudflared 隧道对主人展示完整功能
 */
import http from 'node:http'
import { readFile, stat } from 'node:fs/promises'
import { extname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { request as httpRequest } from 'node:http'

const __dirname = fileURLToPath(new URL('.', import.meta.url))
// scripts/ 在 kechuang-mentor/ 下,DIST 在 kechuang-mentor/dist/
const ROOT = resolve(__dirname, '..')
const DIST = resolve(ROOT, 'dist')
const PORT = Number(process.env.PORT || 8081)
const BACKEND = process.env.BACKEND_URL || 'http://127.0.0.1:3000'

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.json': 'application/json; charset=utf-8',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.map': 'application/json; charset=utf-8',
}

async function tryFile(path) {
  // SPA fallback: 任意不存在路径都返回 index.html
  let p = path === '/' ? '/index.html' : path
  // 防止路径穿越
  if (p.includes('..')) return null
  const full = join(DIST, p)
  try {
    const s = await stat(full)
    if (s.isFile()) return full
  } catch {}
  return null
}

const server = http.createServer(async (req, res) => {
  const url = req.url || '/'

  // API 反向代理
  if (url.startsWith('/api/')) {
    const target = BACKEND + url
    const opts = {
      method: req.method,
      headers: { ...req.headers, host: new URL(BACKEND).host },
    }
    try {
      const upstream = await fetch(target, opts)
      const buf = Buffer.from(await upstream.arrayBuffer())
      res.writeHead(upstream.status, Object.fromEntries(upstream.headers))
      res.end(buf)
      console.log(`[proxy] ${req.method} ${url} → ${upstream.status}`)
    } catch (e) {
      res.writeHead(502, { 'content-type': 'application/json' })
      res.end(JSON.stringify({ error: 'upstream_unreachable', message: e.message }))
    }
    return
  }

  // 静态文件
  const file = await tryFile(url)
  if (file) {
    const ext = extname(file).toLowerCase()
    const content = await readFile(file)
    res.writeHead(200, {
      'content-type': MIME[ext] || 'application/octet-stream',
      'cache-control': ext === '.html' ? 'no-cache' : 'public, max-age=3600',
    })
    res.end(content)
    return
  }

  res.writeHead(404, { 'content-type': 'text/plain' })
  res.end('Not Found')
})

server.listen(PORT, '0.0.0.0', () => {
  console.log(`\n🚀 合并服务器已启动`)
  console.log(`   UI:   http://localhost:${PORT}/`)
  console.log(`   API:  http://localhost:${PORT}/api/* → ${BACKEND}`)
  console.log(`   适合 cloudflared tunnel 暴露\n`)
})
