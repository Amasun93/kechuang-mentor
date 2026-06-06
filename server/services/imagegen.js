/**
 * 图片生成服务
 * 负责:
 * 1. 调 AI 生图(火山 seedream / OpenAI 兼容中转站)
 * 2. 后端优先级:OpenAI 兼容 > 火山 seedream > mock
 * 3. 没配 KEY 时返回 mock(占位 SVG,前端能展示)
 *
 * 后端配置(任选其一,优先级从上到下):
 * - OpenAI 兼容中转站(支持 /v1/images/generations):OPENAI_COMPAT_BASE / OPENAI_COMPAT_KEY / OPENAI_COMPAT_IMAGE_MODEL
 * - 火山 seedream(单独 KEY,后续开通):VOLC_SEEDREAM_KEY / VOLC_SEEDREAM_MODEL
 *
 * MVP 状态:方案 C 纯文字,本服务返回 mock(占位图),
 * 但代码骨架已就位,主人开通任一后端后填环境变量即可启用。
 */

const ARK_BASE = 'https://ark.cn-beijing.volces.com/api/v3'

function getBackend() {
  const openaiKey = process.env.OPENAI_COMPAT_KEY
  if (openaiKey && openaiKey !== 'your_openai_key_here') return 'openai'
  const seedreamKey = process.env.VOLC_SEEDREAM_KEY
  if (seedreamKey && seedreamKey !== 'your_seedream_key_here') return 'seedream'
  return 'mock'
}

export function isMockMode() {
  return getBackend() === 'mock'
}

function defaultModel(backend) {
  if (backend === 'openai') return process.env.OPENAI_COMPAT_IMAGE_MODEL || 'cogview-3'
  if (backend === 'seedream') return process.env.VOLC_SEEDREAM_MODEL || 'doubao-seedream-3.0-t2i-250415'
  return 'mock'
}

/**
 * 生成图片
 * @param {object} opts
 * @param {string} opts.prompt - 图片描述
 * @param {string} [opts.size] - 尺寸,如 '1024x1024' / '2048x2048' (seedream) / '1024x1792' (dall-e)
 * @param {string} [opts.model] - 模型名
 * @returns {Promise<{url: string, mock: boolean, backend: string, model: string, note?: string}>}
 */
export async function generateImage({ prompt, size, model }) {
  const backend = getBackend()
  const modelName = model || defaultModel(backend)
  const finalSize = size || (backend === 'seedream' ? '1024x1024' : '1024x1024')

  if (backend === 'mock') {
    return mockImage({ prompt, modelName, size: finalSize })
  }
  if (backend === 'openai') {
    return openaiCompatImage({ prompt, modelName, size: finalSize })
  }
  return seedreamImage({ prompt, modelName, size: finalSize })
}

/**
 * 火山 seedream 图片生成
 * 端点:POST {ARK_BASE}/images/generations
 * 文档:https://www.volcengine.com/docs/82379/1541523
 */
async function seedreamImage({ prompt, modelName, size }) {
  const [width, height] = size.split('x').map((n) => parseInt(n, 10))
  const url = `${ARK_BASE}/images/generations`
  const body = {
    model: modelName,
    prompt,
    image: undefined, // 文生图场景不传
    size: '2K', // seedream 支持 '1K' / '2K' / '4K'
    width: width || 1024,
    height: height || 1024,
    response_format: 'url', // 或 'b64_json'
    seed: -1, // -1 表示随机
    guidance_scale: 3.0, // 1-10,越高越贴近 prompt
    watermark: false,
  }

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.VOLC_SEEDREAM_KEY}`,
    },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`火山 seedream 错误 ${res.status}: ${text.slice(0, 200)}`)
  }
  const data = await res.json()
  const firstImage = data?.data?.[0]
  return {
    url: firstImage?.url || firstImage?.b64_json || '',
    mock: false,
    backend: 'seedream',
    model: modelName,
    usage: data.usage,
  }
}

/**
 * OpenAI 兼容中转站图片生成(/v1/images/generations)
 * 注意:yz.rs 是否支持图片生成,需要看它代理了哪些 provider
 */
async function openaiCompatImage({ prompt, modelName, size }) {
  const base = (process.env.OPENAI_COMPAT_BASE || 'https://api.openai.com/v1').replace(/\/+$/, '')
  const url = `${base}/images/generations`
  const body = {
    model: modelName,
    prompt,
    n: 1,
    size: size || '1024x1024',
    response_format: 'url',
  }

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.OPENAI_COMPAT_KEY}`,
    },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`OpenAI 兼容图片 API 错误 ${res.status}: ${text.slice(0, 200)}`)
  }
  const data = await res.json()
  const firstImage = data?.data?.[0]
  return {
    url: firstImage?.url || '',
    b64: firstImage?.b64_json || '',
    mock: false,
    backend: 'openai',
    model: modelName,
  }
}

/**
 * Mock 占位图(MVP 阶段用)
 * 返回 1x1 透明 PNG 的 data URL,前端用 emoji/SVG 模板替代
 */
function mockImage({ prompt, modelName, size }) {
  return Promise.resolve({
    url: '', // 空 url 表示需要前端用占位
    prompt,
    size,
    mock: true,
    backend: 'mock',
    model: modelName,
    note: '未配置图片生成 KEY (OPENAI_COMPAT_KEY 用于图片 或 VOLC_SEEDREAM_KEY)。前端请用占位图(SVG/emoji)。开通任一后端后填环境变量即可启用。',
  })
}
