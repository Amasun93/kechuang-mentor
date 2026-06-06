/**
 * AI 代理服务
 * 负责:
 * 1. 拼 system + messages 调 LLM
 * 2. 后端优先级:OpenAI 兼容中转站 > 火山豆包 > mock
 * 3. 没配 KEY 时返回 mock 响应(不阻塞前端)
 *
 * 后端配置(任选其一,优先级从上到下):
 * - OpenAI 兼容中转站(推荐):OPENAI_COMPAT_BASE / OPENAI_COMPAT_KEY / OPENAI_COMPAT_MODEL
 * - 火山豆包(原方案):VOLC_ACCESS_KEY / VOLC_MODEL
 */

const ARK_BASE = 'https://ark.cn-beijing.volces.com/api/v3'

/**
 * 后端探测:openai | volc | mock
 * 注意:'your_xxx_here' 是 .env.example 的占位符,等同于未配
 */
function getBackend() {
  const openaiKey = process.env.OPENAI_COMPAT_KEY
  if (openaiKey && openaiKey !== 'your_openai_key_here') return 'openai'
  const volcKey = process.env.VOLC_ACCESS_KEY
  if (volcKey && volcKey !== 'your_volc_access_key_here') return 'volc'
  return 'mock'
}

export function isMockMode() {
  return getBackend() === 'mock'
}

function defaultModel(backend) {
  if (backend === 'openai') return process.env.OPENAI_COMPAT_MODEL || 'deepseek-v4-pro'
  if (backend === 'volc') return process.env.VOLC_MODEL || 'Doubao-Seed-1.6-flash'
  return 'mock'
}

/**
 * 调 LLM chat completion
 * @param {object} opts
 * @param {string} opts.system - system prompt
 * @param {Array<{role, content}>} opts.messages - 历史消息
 * @param {string} [opts.model] - 模型名(不传则按后端默认)
 * @returns {Promise<{content: string, usage: object, mock: boolean, backend: string, model: string}>}
 */
export async function chatCompletion({ system, messages, model }) {
  const backend = getBackend()
  const modelName = model || defaultModel(backend)

  if (backend === 'mock') {
    return mockChat({ system, messages, modelName })
  }
  if (backend === 'openai') {
    return openaiCompat({ system, messages, modelName })
  }
  return arkChat({ system, messages, modelName })
}

/**
 * OpenAI 兼容中转站(本次使用:https://api.yz.rs)
 */
async function openaiCompat({ system, messages, modelName }) {
  const base = (process.env.OPENAI_COMPAT_BASE || 'https://api.openai.com/v1').replace(/\/+$/, '')
  const url = `${base}/chat/completions`
  const body = {
    model: modelName,
    messages: [
      { role: 'system', content: system },
      ...messages,
    ],
    temperature: 0.7,
    max_tokens: 800,
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
    throw new Error(`OpenAI 兼容 API 错误 ${res.status}: ${text.slice(0, 200)}`)
  }
  const data = await res.json()
  return {
    content: data.choices?.[0]?.message?.content || '',
    usage: data.usage,
    mock: false,
    backend: 'openai',
    model: modelName,
  }
}

/**
 * 火山引擎豆包(原方案,保留兼容)
 */
async function arkChat({ system, messages, modelName }) {
  const url = `${ARK_BASE}/chat/completions`
  const body = {
    model: modelName,
    messages: [
      { role: 'system', content: system },
      ...messages,
    ],
    temperature: 0.7,
    max_tokens: 800,
  }

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.VOLC_ACCESS_KEY}`,
    },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`豆包 API 错误 ${res.status}: ${text.slice(0, 200)}`)
  }
  const data = await res.json()
  return {
    content: data.choices?.[0]?.message?.content || '',
    usage: data.usage,
    mock: false,
    backend: 'volc',
    model: modelName,
  }
}

/**
 * Mock 响应 - 没配 KEY 时降级使用
 * 根据 system 提示里的"step"和最近用户消息,生成符合苏格拉底底色的回复
 */
function mockChat({ system, messages, modelName }) {
  const last = messages[messages.length - 1]?.content || ''
  // 简单从 system 里抠 step
  const stepMatch = system.match(/现在是.+?step\s+(\w+)/i) || system.match(/ONBOARDING|APPRECIATE|INSPIRATION|STRUCTURE|DRAFT|REFINE|ACHIEVEMENT/)
  const step = stepMatch ? (stepMatch[1] || stepMatch[0]) : 'INSTRUCTION'

  // 从 system 抠性格
  const personaMatch = system.match(/你当前的提问风格:(\S+)/)
  const persona = personaMatch ? personaMatch[1] : '暖心学姐'

  const responses = buildMockResponses(step, persona)
  const reply = responses[Math.floor(Math.random() * responses.length)]

  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        content: reply,
        usage: { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 },
        mock: true,
        model: modelName,
        note: '未配置 VOLC_ACCESS_KEY,使用 mock 响应。配置后即可调用真实豆包。',
      })
    }, 600 + Math.random() * 400)
  })
}

function buildMockResponses(step, persona) {
  // 通用库 + 步骤特化
  const common = [
    '我注意到你刚才说的事,能再多说一点为什么让你在意吗?',
    '如果让你只做 1 周,你最想先做哪一步?',
    '你身边有没有朋友/家人遇到过这种问题?',
    '如果这件事做成了,对你身边的人会有什么改变?',
    '你说"挺喜欢"——能告诉我喜欢到哪种程度吗?',
  ]

  const stepResponses = {
    ONBOARDING: [
      '你好!我是你的科创课题陪练老师。在我们开始之前,我想先认识一下你——你今年上几年级啦?',
      '好嘞~ 那你平时课余时间,什么事让你觉得时间过得特别快?',
      '听起来挺有意思的。那你有没有做过什么小研究、小调查、小发明,或者参加过什么科创比赛?',
      '嗯嗯~ 那你最近有没有遇到什么让你觉得"挺烦的"或者"挺想搞清楚"的事?',
      '最后一个问题——你听说过青创赛、宋庆龄奖、雏鹰杯这些科创比赛吗?',
    ],
    APPRECIATE: [
      '你读完这个课题,最让你意外的是哪一点?',
      '如果换成是你做这个课题,你觉得最难的一步是什么?',
      '作者做的这件事,跟你的生活有没有一点像的地方?',
      '你觉得这个课题如果让评委来看,会先看哪一部分?',
    ],
    INSPIRATION: [
      '你说喜欢 XX——能告诉我一次具体被它打动的瞬间吗?',
      '你最近看到什么让你觉得不太对劲的东西?',
      '有没有什么重复出现的声音/气味/触感让你印象深刻?',
      '你说的"挺喜欢"——能改成"喜欢到哪种程度"说说看吗?',
    ],
    STRUCTURE: [
      '你刚才提到 3 个方向,如果只让你做 1 个月,你会先做哪个?为什么?',
      '你这 3 个方向,你心里最想做的是哪个?哪怕说不出理由,凭感觉说一个也行。',
      '你确定?咱们一旦定了就不改了。说说看,为什么是这个而不是其他两个?',
    ],
    DRAFT: [
      '你打算先查什么?能说出 1-2 个关键词吗?',
      '你打算怎么做这个研究?能分"对照组"和"实验组"吗?为什么这么分?',
      '从今天到比赛截止,中间有几个大节点?你能给我 3 个时间点吗?',
      '你做这件事需要什么?能列出 3 个最关键的资源吗?',
    ],
    REFINE: [
      '你的方案已经成型了,挺完整的!如果我是评委,我看到这一段,可能会问:这个结论是基于几个数据?你心里有数吗?',
      '你刚才那句说得很具体,评委能一眼看懂——这种地方多放一些就更好。',
      '评委看到这一段,可能挑的刺,你自己先想想是哪一处?',
    ],
    ACHIEVEMENT: [
      '你从最初想"我喜欢 XX"到定下这个研究问题,中间拐了几次弯?',
      '如果你把这个方案交给你最好的朋友,他/她最可能问的 1 句话是什么?',
      '接下来一周,你能做的最小一步是什么?——不是"做完课题",而是"迈出第一步"。',
    ],
  }

  return stepResponses[step] || common
}
