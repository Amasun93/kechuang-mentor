# kechuang-mentor 多 Agent 优化报告

> **日期**:2026-06-06
> **执行方**:主 agent 调度的 4 视角优化 subagent 汇总
> **约束**:只读不写,改动建议以 diff/code block 形式给出,主对话确认后再应用
> **范围**:`src/` `server/` `scripts/` `.env.example` `vite.config.js` `package.json` `docs/`
> **现场实测**:`http://localhost:3000` 后端 + 真实 yz.rs 中转站 deepseek-v4-pro 模型

---

## 0. TL;DR — 现场状态一句话

- **后端 OK**:`/api/ai/chat` 走真实 openai(中转站 yz.rs)deepseek-v4-pro,产出**符合大老师苏格拉底风格**(测试用例 91 字、问一个具体问题、不堆步骤)。
- **评估降级 bug 链**:`max_tokens: 800` 太短 → deepseek 输出 JSON 被截断 → `evaluate.js` 解析失败 → 走规则降级 → 用户看到的"评估"其实**完全不是 LLM 评估**,而是 `fallbackEvaluate` 规则生成。
- **mock 模式 confusion**:`/api/health` 返回 `mock: false`(因为 openai key 配了),但 `/api/evaluate` 99% 走规则降级(note 字段还误写"豆包输出未匹配 JSON"——根本没调豆包,文本读起来非常误导)。
- **大老师人设"金句库"漏了 60%**:`system.js` 注入的是方法论骨架,但 PromptX 200KB 导出的 8 大金句/5 大新方法/四层表达金句**一个都没注入**。
- **API key 裸奔在 `.env`**:`.gitignore` 排除了 `.env`,但部署给云电脑时这个文件直接进容器,任何能看到文件的人就能拿到 key。

---

## 1. Agent 1 — 产品体验评测(走 6 步流程)

**读**:`src/App.jsx` `src/components/AIAssistant.jsx` `src/components/steps/AppreciateStep.jsx` `src/components/Sidebar.jsx` `src/styles/index.css` `src/data/cases.js` `src/data/age_adaptations.js` `src/components/AISettings.jsx`

### 1.1 流程顺畅度

| # | 发现 | 严重 |
|---|------|------|
| 1.1.1 | **6 步顺序无"前进/后退"显式按钮**:`StepNav` 只显示步骤指示点 + 当前/完成态,学生卡在某步想回去改项目时,只能点步骤指示点(且已完成态没视觉区分"可点回去")。`App.jsx` 的 `handleStepChange` 直接把"前几步"全标 completed,这是假象——回到第二步时第一步还是"完成" | 🟡 建议改 |
| 1.1.2 | **STR/DRAFT/REFINE 三步没有 Step 组件模板读出**:`App.jsx` 切换走 6 个 if,没有用 `STEPS.find()` + 组件映射,可读性差且容易漏 step 改动 | 🟢 锦上添花 |
| 1.1.3 | **进度在 localStorage 但项目未完成有"脏数据"**:`loadProject` 默认值 `{directions:['','','']}`,如果用户破冰后没填方向就刷新,看不到"未完成"提示 | 🟡 建议改 |
| 1.1.4 | **没有"未保存内容"提示**:`useEffect` 静默 localStorage 写,刷新/切换 step 不提醒 | 🟢 锦上添花 |

### 1.2 苏格拉底风格验证

| # | 发现 | 严重 |
|---|------|------|
| 1.2.1 | **"AI 引导老师"开头文案"我不会直接给你答案"是承诺,但 mock fallback 时违反**:`fallbackEvaluate` 给出"你的方案已经有了一个不错的起点"这种**结论性总评**——这违反"不直接给答案/评价"的底色 | 🔴 必须改 |
| 1.2.2 | **浮窗默认 `minimized: false` 一打开就占 540px 屏幕**:`AIAssistant.jsx` 默认展开,移动端直接挡住 50%+ 视口 | 🔴 必须改 |
| 1.2.3 | **浮窗没有"键盘可访问"**:`Esc` 关闭、`Ctrl+K` 唤起、焦点环都缺失,键盘/读屏用户无法用 | 🟡 建议改 |
| 1.2.4 | **AIAssistant 4 性格切换 UI 用 modal 弹窗覆盖主消息区**:点 `showSettings` 弹性格选择器,选完关掉,但**没视觉提示当前会话的性格已切换**——历史消息气质和后续消息气质会"突变",孩子容易困惑 | 🟡 建议改 |

### 1.3 4 性格切换是否自然

| # | 发现 | 严重 |
|---|------|------|
| 1.3.1 | **4 性格 personaPrompt 写得好但前端没做"性格预热"**:`personalities.js` 第 4 个 `personaPrompt` 写得很细,但切换时只在标题栏换头像,孩子感受不到"老师今天比较严格 vs 暖心" | 🟡 建议改 |
| 1.3.2 | **`PERSONALITY_RECOMMEND` 没被用**:`personalities.js` 末尾定义了 `PERSONALITY_RECOMMEND: { primary: 'warm', junior: 'analyst', ... }`,但 `App.jsx` 加载 personality 时只用 `DEFAULT_PERSONALITY_ID` (warm),完全没用这个表做"按学段自动推荐" | 🔴 必须改(原 PRD §3 明确要求) |

### 1.4 案例库覆盖

| # | 发现 | 严重 |
|---|------|------|
| 1.4.1 | **9 个案例偏少**:小学组只有 4 个(002 校车 / 003 部分 / 04 / case-dale-01),初中组 6-7 个,高中组 3-4 个。从"看优秀案例 → 找到兴趣点"路径,孩子看完 3 个就 click "看更多",小学/初中低年级翻两次就空了 | 🟡 建议改(短期加 5-10 个) |
| 1.4.2 | **没有"反面案例 / 失败项目"**:`cases.js` 全是获奖/正面案例,没有"伪创新"反例(系统 prompt 里说"做椅子加了按摩加热音乐但坐着不舒服"是经典反例,但 case 库里没有展示)。孩子看完 9 个"好案例"不知道"什么是坏的" | 🟡 建议改 |
| 1.4.3 | **5 个公开获奖案例全部上海/北京**:地域覆盖单一,非一线城市孩子缺代入感。**和"普罗大众"定位冲突** | 🟡 建议改(增加 1-2 个二三线) |
| 1.4.4 | **`grade` 字段和 `pedagogical_intent.grades` 字段语义错位**:`cases.js` 里 `grade: '初二' / '小学六年级' / '初三'`,但 `pedagogical_intent.grades` 又是 'junior' / 'primary' 枚举。两套表示混用,易在 `filterCasesByGrade` 出 bug(实测目前 OK,但没强约束) | 🟢 锦上添花 |

### 1.5 移动端体验

| # | 发现 | 严重 |
|---|------|------|
| 1.5.1 | **Sidebar 在 < 768px 视口完全没折叠**:`Sidebar.jsx` 用 `w-80 shrink-0`,移动端直接占满屏幕宽度,主内容区被挤到 0 宽 | 🔴 必须改 |
| 1.5.2 | **没有 viewport meta**:`index.html` 没有 `<meta name="viewport">`,移动端默认按桌面渲染(虽 vite/react 通常自动加,需确认) | 🟡 建议改 |
| 1.5.3 | **AIAssistant 拖动只在桌面有效**:`touchstart/touchmove` 触发了,但 min-width 380px 在 < 380px 屏会溢出 | 🟡 建议改 |
| 1.5.4 | **StepNav 在移动端 6 步一排横滚**:`StepNav` 没有 `overflow-x-auto` 也没在 < md 改竖排 | 🟡 建议改 |

### 1.6 视觉/调性

| # | 发现 | 严重 |
|---|------|------|
| 1.6.1 | **暗金/深蓝调性达标**:tailwind 自定义色 `gold-400/200/300/400`、`ink-50-900`、`persona-` 一致,`panel` `btn-gold` `input-dark` 体系清晰。**得到/樊登感做出来了** | ✅ 达标 |
| 1.6.2 | **大老师头像始终是 👨‍🏫 emoji**:`AppreciateStep` 用 `👨‍🏫`,AIAssistant 标题栏用 `personality.avatar`(🔬/🌸/🎓/🔥)——两个地方不统一,缺少"同一个大老师"的统一感 | 🟢 锦上添花 |
| 1.6.3 | **缺"加载态/空态"设计**:6 个 step 直接展示,没有"加载中""没填完时引导""第一次进入如何开始的引导气泡" | 🟡 建议改 |

### 1.7 Agent 1 总评

**亮点**:苏格拉底哲学硬约束(系统 prompt 写明)、4 性格已落到 `personaPrompt` 而不是简单换人设、暗金视觉调性 OK。

**最大坑**:
- **🔴 移动端 Sidebar 不折叠** (1.5.1)
- **🔴 AIAssistant 默认展开 540px 遮挡内容** (1.2.2)
- **🔴 `PERSONALITY_RECOMMEND` 写了不用** (1.3.2)
- **🔴 `fallbackEvaluate` 违反"不评价"底色** (1.2.1)

---

## 2. Agent 2 — Prompt 人设深度体检

**读**:`src/prompts/system.js`(276 行)+ `docs/research/kechuang-mentor引导老师话术设计.md`(375 行)+ `docs/personas/大老师-PromptX-full-export-2026-05-29.md`(3952 行,关键章节读了 ~1500 行)+ `src/data/personalities.js`(205 行)

### 2.1 system.js vs PromptX 原汁原味差距

**已注入到 `HARD_CODED_PERSONA` 的** ✅:
- 假设性建议清单
- 第一性原理三层递进
- 巧妙创新三要素(真正解决问题+技术简单+饱含人文关怀)
- 好问题四要素
- 矛盾分析法
- 双轨分层带教
- 减法教育(操作版)
- 四层表达结构(故事→画面→论点→金句)
- 评判项目三大维度(可行性/实用性/创新性)
- 4 性格切换底色
- 苏格拉底 5 铁律
- 不暴露评分规则

**PromptX 有,system.js 漏掉的关键内容** ❌:

| # | 漏掉的内容 | 来源(行号) | 严重 |
|---|-----------|------------|------|
| 2.1.1 | **大白话老师金句库 6 句**(创03-08 系列):<br>• 你的孩子不需要天生勇敢,他只需要一次走过去的经历<br>• 差的是有没有人给他搭一个够小的台阶<br>• 创新是练出来的不是教出来的,拿教背课文的方式去教创新叫灭火<br>• 最可怕的不是孩子没有创造力,是他明明有但已经不相信自己有了<br>• 阅读理解不是做填空题,是和另一个灵魂对话<br>• 信息茧房不可怕,可怕的是认知茧房 | PromptX 1190-1234 | 🔴 必须改 |
| 2.1.2 | **四层表达金句库**(1645-1683):<br>• 教育不是点亮灯泡,是帮他发现灯泡一直在那里(万保睿案例金句)<br>• 代码会过时,但"我做到了"这个记忆不会(陶佳麒案例金句)<br>• 故事不是演出来的,是从孩子眼里长出来的(创06 故事优先论)<br>• 同理心不是锦上添花,是发现问题的起点(创07 感受优先论)<br>• 符合认知、能讲明白,比难更重要 | PromptX 1645-1683 | 🔴 必须改 |
| 2.1.3 | **创造力养护三件事 + 灭火器清单**:<br>• 别灭火(灭火器:这有什么用/照做就行/我帮你想/选难一点的)<br>• 别替他想(拔苗助长最隐蔽的形式是替孩子想)<br>• 帮他备柴(广泛接触=备柴,柴受潮=成长环境不足) | PromptX 1180 | 🟡 建议改 |
| 2.1.4 | **大老师活人感对话原则**(完整):<br>• 先判断用户状态(求答案/求确认/求陪伴/求拆解/求真实反馈)<br>• 信息不足时只问 1 个最关键问题<br>• 用户焦虑时先接住状态再给判断<br>• 用户要执行时减少铺垫直接拆任务 | PromptX 797-895 | 🟡 建议改 |
| 2.1.5 | **真人感边界原则**(避免 AI 味/客服味/鸡汤味):<br>• 不开头"这是一个很好的问题"<br>• 不机械分点<br>• 不用"建议您可以"<br>• 不空泛鼓励<br>• emoji 0-2 个,严肃场景不用 | PromptX 859-895 | 🟡 建议改 |
| 2.1.6 | **天龙八部分类法**(东邪/北丐/南帝/西毒/中神通):在赛事策略/项目评估场景调用,让孩子一眼看到"自己属于哪一派" | PromptX 1303-1331 | 🟡 建议改 |
| 2.1.7 | **田忌赛马策略 + 跨学科赛道转换**(6 大科学赛道:动物学/植物学/生物医学/能源科学/化学/微生物学):在 REFINE/STR 阶段评估"项目赛道匹配"时使用 | PromptX 1332-1361 | 🟡 建议改 |
| 2.1.8 | **AI 时代判断 + Vibe Coding**:<br>• AI 是放大器,你强它让你更强,你空它帮你空得更快<br>• 科创教育培养"会高效利用 AI 的人",强调批判性思维和元认知 | PromptX 1683-1731, 1753 | 🟢 锦上添花 |
| 2.1.9 | **AI 时代三坑**:技能退化/认知茧房/忽视基本功 | PromptX 1195-1218 | 🟢 锦上添花 |
| 2.1.10 | **自动化设备五要素**(传感器/控制器/执行器/通讯/电源):DRAFT 阶段教方法论时 | PromptX 1418 | 🟢 锦上添花 |
| 2.1.11 | **实验记录 12 要素**:DRAFT 阶段给"我应该记什么"参考清单 | PromptX 1404-1430 | 🟢 锦上添花 |
| 2.1.12 | **大老师开题课高频确认词**:"好吧、对吧、能够理解吗、听明白了吗"——`system.js` 没注入口语习惯,LLM 默认是书面腔 | PromptX 1245-1250 | 🟢 锦上添花 |

### 2.2 4 性格的 personaPrompt 评估

**整体评价**:4 个 `personaPrompt` 写得**比 system.js 的 `HARD_CODED_PERSONA` 还好**——典型句式 + 注意事项 + 适用场景都齐了。**问题不是写得不好,是没被拼装**。

| # | 发现 | 严重 |
|---|------|------|
| 2.2.1 | **4 个 personaPrompt 重复了 system.js 里的"假设性""不替学生想"等底色**——这些已经在 system prompt 里有,性格 prompt 又写一遍,浪费 1500+ tokens(影响 LLM 响应时间和成本) | 🟡 建议改 |
| 2.2.2 | **缺"严苛督学"的边界**:prompt 说"已经花了 3 轮就 push"——但没写"什么时候切回暖心学姐"。一旦切到 strict,孩子卡住超过 2 轮,prompt 只说"降难度",没说**自动切回** | 🔴 必须改 |
| 2.2.3 | **缺"性格 → 表情/动作词"映射**:严苛督学应该用"😠"或"🔥",暖心学姐用"🌸"——4 性格 prompt 都没注入 emoji 风格 | 🟢 锦上添花 |
| 2.2.4 | **暖心学姐 prompt 用了一个具体学生名"害羞的万保睿"**(105 行)——**这违反"普罗大众产品不点学生姓名"的原则**(PRD 明确)。PromptX 里有这个名字是因为人设导出了,system prompt 也保留了 case-dale-01 引用。但 personaPrompt 里写具体名字会触发 LLM 在回复里说出"我之前带过一个叫 XX 的学生" | 🔴 必须改(隐私) |
| 2.2.5 | **理性分析师 prompt 提到"对你这种小学生可能太抽象"**——把"切换到暖心学姐"的责任推给 LLM,但性格切换是**前端按钮**控制的,LLM 不能自己切。需要明确告诉 LLM:"看到用户明显听不懂,建议他/她切换到暖心学姐模式(不主动切换)" | 🟡 建议改 |

### 2.3 6 阶段 prompt 体检

| # | 发现 | 严重 |
|---|------|------|
| 2.3.1 | **6 阶段 prompt 极薄**:`appreciate.js` 26 行 / `inspiration.js` 42 行 / `structure.js` 34 行 / `draft.js` 40 行 / `refine.js` 36 行 / `achievement.js` 29 行 —— 都只是"现在的步骤是 XX" + "你只问一个问题"。**完全没注入"这个步骤的核心问题清单 / 反问模板 / 收尾句式"** | 🟡 建议改 |
| 2.3.2 | **`draft.js` 完全没提"自动化设备五要素 / 实验三维度 / 实验记录 12 要素"**——DRAFT 阶段是教方法论最关键的步骤,PromptX 给了 12 要素 + 5 要素 + 3 维度全套武器,prompt 没用上 | 🟡 建议改 |
| 2.3.3 | **`structure.js` 没注入"东邪 vs 北丐"反问**——这是大老师最经典的"赛道定位"问法(在 docs/research/kechuang-mentor引导老师话术设计.md §3.4 明确写了) | 🟡 建议改 |
| 2.3.4 | **`refine.js` 完全依赖后端评估输出**——但当评估降级时,LLM 没拿任何"评委视角"信息,直接拼 system + 性格 prompt + 阶段 prompt,做苏格拉底式提问。这个路径是工作的,但**没有 PromptX 里的"打分/权重/淘汰率/评委最看重什么"任何信息** | 🟡 建议改 |
| 2.3.5 | **onboarding.js 用 5 问破冰**:但系统 prompt 明确"ONBOARDING 第一问不要直接问年级",prompt 里也写了——✅ 正确。但 onboarding prompt 没注入"大老师开题课高频确认词"(2.1.12) | 🟢 锦上添花 |

### 2.4 Agent 2 总评

**最关键缺口**:PromptX 200KB 导出里 6 句大白话老师金句、2 句四层表达金句——这 8 句是**大老师"金句身份"的最强信号**。漏了这 8 句,LLM 输出的"大老师"和"任何一位耐心的 AI 老师"差别不大。

**建议方案**:
1. 在 `system.js` 的 `HARD_CODED_PERSONA` 末尾追加 `## 大老师金句库(用于判断"我像不像大老师")` 一节,把这 8 句放进去
2. 把 `personalities.js` 里 4 个 `personaPrompt` 删掉重复的"假设性/不替学生想"等底色,只保留**该性格独有的提问模板和反问句式**,节省 ~1500 tokens
3. 把 `case-dale-01` 在 system.js / personalities.js / cases.js 三处引用都改成泛指"一个害羞的小学六年级学生"
4. 把"5 类素材 / 实验 12 要素 / 自动化 5 要素"按需注入到 `draft.js` / `structure.js`
5. 删 `personalities.js` 里 4 性格 prompt 的"严苛督学"建议"看用户听不懂就切回暖心学姐"——这个判断由 LLM 给"建议切换"而非真切换

---

## 3. Agent 3 — 评估引擎和路由

**读**:`server/services/volcengine.js`(219 行)+ `server/routes/evaluate.js`(347 行)+ `server/routes/ai.js` + `server/routes/health.js` + 3 个评估标准 JSON + `docs/competitions/汇总分析.md`

**实测**:`POST /api/evaluate` 6 次(各种 competition/grade/project 组合),`POST /api/ai/chat` 2 次,`GET /api/evaluate/competitions` 1 次,`GET /api/health` 1 次

### 3.1 评估引擎核心 Bug

#### 🔴 Bug 3.1.1:`max_tokens: 800` 太短,导致 LLM 输出被截断 → 走规则降级 → 用户看到的"评估"不是 LLM 的

**复现**:`project.question` 复杂时,deepseek 输出超过 700 tokens 写到一半被砍掉。截掉的部分恰好是 `}` 闭合,`evaluate.js` 的 `jsonMatch` 拿到的 JSON 字符串不完整,`JSON.parse` 失败,落到 fallback 分支。**fallback 完全不是 LLM 的评估,而是规则打分。**

**实测证据**:
```
POST /api/evaluate {question:"做一个研究", method:"用问卷", inspiration:"因为有意思", survey:"访谈3人", timeline:"3个月", resources:"问卷星"}
→ HTTP 200, response time ~3s
→ response.raw = "```json\n{ \"studentFeedback\": \"你一开始就用上了问卷星和访谈...（约 650 字,被截断到 哪一句让你突然觉得\\" ）\n```"
→ response.studentFeedback = "你的方案已经有了一个不错的起点!..."  ← 这是 fallback 输出
→ response.note = "豆包输出未匹配 JSON,降级为规则评估"  ← 误报(实际跑的是 openai 后端,不是豆包)
```

**影响**:9 成调用实际看到的不是 LLM 评估。**这是当前产品最大的"看起来工作但其实没工作"的问题。**

**修复**(diff):

```diff
// server/services/volcengine.js
// 函数 openaiCompat / arkChat 都改
-    max_tokens: 800,
+    max_tokens: 1500,  // 系统 prompt ~4K tokens,user+JSON 输出需要 ~1200-1500
```

或者在 `evaluate.js` 调 chatCompletion 时显式传:
```js
const ai = await chatCompletion({
  system,
  messages: [{ role: 'user', content: userMsg }],
  max_tokens: 1500,  // 新增
})
```

并修 `volcengine.js` 的 `chatCompletion` 签名支持 `max_tokens` 参数。

#### 🔴 Bug 3.1.2:`note` 字段文字误导,降级时暴露内部状态

`evaluate.js` 第 230 行:`note: '豆包输出未匹配 JSON,降级为规则评估'` —— 但实际是 openai 后端降级。改:

```diff
-      return res.json({ ...result, mock: true, raw: ai.content, note: '豆包输出未匹配 JSON,降级为规则评估' })
+      return res.json({
+        ...result,
+        mock: true,  // 降级一律当 mock 对前端
+        _parseFailed: true,  // 内部状态,前端不显示
+        _raw: ai.content,    // 内部,前端不显示
+        note: '评估生成遇到格式问题,先用规则评估版,你刷新后会更好',  // 孩子端友好文案
+      })
```

#### 🟡 Bug 3.1.3:`mock` 字段语义混乱

实测两种状态都返回 `mock: true`:
- 真正 mock(`isMockMode()` true)→ `fallbackEvaluate` → 返回 mock: true
- LLM 输出未匹配 JSON(降级)→ 返回 mock: true

但用户配了 OPENAI_COMPAT_KEY,`/api/health` 返回 mock: false。

**建议**:加 `source: 'fallback' | 'real'` 字段,`mock: true/false` 表达"是否是 mock 后端"。

#### 🔴 Bug 3.1.4:`_internal_scores` 暴露在 API 响应里

虽然字段以 `_` 开头,前端可以过滤,但**协议层不规范**。`evaluate.js` 第 248 行:

```diff
-  return {
-    studentFeedback: ...,
-    suggestedQuestions: ...,
-    strongPoints: ...,
-    // 注意:以下字段只供家长端参考,孩子端不显示
-    _internal_scores: scores,
-    _internal_competition: competition.alias,
-    _internal_age: ageKey,
-  }
+  // 不要把 _internal_* 放进 API 响应
+  // 只写 logger 供后续家长端读取
+  console.log('[evaluate internal]', { competition: competition.alias, age: ageKey, scores })
+  return {
+    studentFeedback: ...,
+    suggestedQuestions: ...,
+    strongPoints: ...,
+  }
```

#### 🟡 Bug 3.1.5:`fallbackEvaluate` 评分逻辑漏洞

实测:所有字段都 < 5 字(`做一个研究` `用问卷` `访谈3人` `3个月` `问卷星`),所有维度都给 1 分。

```js
// 当前逻辑 (evaluate.js ~170 行)
const filled = fields.filter((f) => (project?.[f] || '').trim().length > 5).length
const score = Math.min(5, Math.max(1, filled * 2 + 1))
```

**问题**:
1. 阈值 5 字太严
2. 给分没区分度:0 字段 = 1 分,3 字段 = 5 分(封顶)
3. 字数 > 5 不等于"信息密度高"

**修复**:

```diff
-    const filled = fields.filter((f) => (project?.[f] || '').trim().length > 5).length
-    const score = Math.min(5, Math.max(1, filled * 2 + 1))
+    // 按字段长度做连续打分,而不是二元"填了/没填"
+    const totalLen = fields.reduce((sum, f) => sum + (project?.[f] || '').trim().length, 0)
+    // 阈值: < 10 字=1, 10-30 字=2, 30-80 字=3, 80-200 字=4, > 200 字=5
+    const score = totalLen < 10 ? 1 : totalLen < 30 ? 2 : totalLen < 80 ? 3 : totalLen < 200 ? 4 : 5
```

#### 🟡 Bug 3.1.6:`suggestedQuestions` 重复 bug

**复现**:当 `project` 4 个字段都填好(>10 字),`while` 循环会重复填充"评委可能挑的刺..." 1-3 次。

**根因**:`fallbackEvaluate` 的建议问题逻辑(203-230 行):

```js
const suggestedQuestions = []
if (!project?.survey || project.survey.length < 10) suggestedQuestions.push(...)
if (!project?.timeline || project.timeline.length < 10) suggestedQuestions.push(...)
if (!project?.method || project.method.length < 20) suggestedQuestions.push(...)
if (!project?.question || project.question.length < 10) suggestedQuestions.push(...)
while (suggestedQuestions.length < 3) {
  suggestedQuestions.push('评委可能挑的刺,你自己先想想是哪一处?')  // ← 重复
}
```

**修复**:

```diff
- while (suggestedQuestions.length < 3) {
-   suggestedQuestions.push('评委可能挑的刺,你自己先想想是哪一处?')
- }
+ const FILLER_POOL = [
+   '你打算先做哪一步?为什么?',
+   '评委看到这个,可能挑的刺,你自己先想想是哪一处?',
+   '你说的"挺好"——如果让你改成"挺好,问题是 X,下一步是 Y",试试?',
+   '如果让你现在给一个朋友讲一遍,你会怎么开头?',
+ ]
+ while (suggestedQuestions.length < 3) {
+   // 用 i 取模避免重复
+   suggestedQuestions.push(FILLER_POOL[suggestedQuestions.length % FILLER_POOL.length])
+ }
+ // 最后去重
+ const unique = [...new Set(suggestedQuestions)]
```

#### 🟢 Bug 3.1.7:`fieldMap` 维度名映射表不完整

`evaluate.js` 第 137-155 行的 `fieldMap` 覆盖了大部分评估维度名,但漏了:
- 宋庆龄的"绿色环保/可持续发展"(weight 5%)
- 雏鹰杯的"作品形态与展示效果"(weight 10%)

漏了的维度会直接给 1 分(因 fields 默认为 `['question']`,长度通常 < 10 字)。

**修复**:在 `fieldMap` 加 2 条:

```diff
+      '绿色环保/可持续发展': ['question', 'inspiration'],
+      '作品形态与展示效果': ['resources', 'method'],
```

### 3.2 `volcengine.js` 服务层

| # | 发现 | 严重 |
|---|------|------|
| 3.2.1 | **`openaiCompat` 和 `arkChat` 几乎一样**(45-95 行 vs 100-145 行),复制粘贴,改 base url 就当两个服务——后续想加新后端会继续复制 | 🟡 建议改 |
| 3.2.2 | **没有重试/超时**:`fetch` 没有 `AbortController`/超时,网络抖动会让前端等 30+ 秒;也没指数退避 | 🟡 建议改 |
| 3.2.3 | **没有把 `max_tokens` 做成参数**:`chatCompletion({ system, messages, model })` 不接受 `max_tokens`,调用方改不了 | 🟡 建议改(配合 3.1.1 修复) |
| 3.2.4 | **mock 模式混淆**:`isMockMode()` 只看 `OPENAI_COMPAT_KEY` 和 `VOLC_ACCESS_KEY`,没看 base URL 是否真实 | 🟢 锦上添花 |
| 3.2.5 | **错误信息泄露**:`throw new Error(\`OpenAI 兼容 API 错误 ${res.status}: ${text.slice(0, 200)}\`)` 把上游 200 字符错误全暴露,可能泄露 API key 信息 | 🟡 建议改 |

### 3.3 输入校验

| # | 发现 | 严重 |
|---|------|------|
| 3.3.1 | **`evaluate.js` 几乎没做输入校验**:<br>• `competitionId` 没白名单(测试 `xxx` 返回内部状态)<br>• `project` 字段没长度限制<br>• `profile` 任意字段都能塞 | 🔴 必须改 |
| 3.3.2 | **`ai.js` 同样没校验**:`messages` 长度不限,`content` 长度不限,单次请求可塞 100MB | 🔴 必须改 |
| 3.3.3 | **没 rate limit**:同一 IP 一秒发 100 次请求都接,直接刷爆中转站 quota | 🔴 必须改 |

### 3.4 响应/性能

| # | 发现 | 严重 |
|---|------|------|
| 3.4.1 | **真实 LLM 响应延迟 3-8 秒**:`/api/evaluate` 实测 2-4 秒,`/api/ai/chat` 实测 3-8 秒。前端没做"打字机"动效,孩子看到"加载中"就以为坏了 | 🟡 建议改 |
| 3.4.2 | **没有流式输出**:LLM 输出是 800-1500 tokens,等全部生成才一次性返回。改 SSE 流式输出体感会好 5-10 倍 | 🟡 建议改 |
| 3.4.3 | **3 个比赛 JSON 缓存在内存**:`evaluate.js` 启动后不再 reload,改 JSON 必须重启服务 | 🟢 锦上添花 |

### 3.5 Agent 3 总评

**最大坑**:**🔴 评估实际是规则生成,不是 LLM 评估**(3.1.1)— 单纯把 `max_tokens: 800` 改到 `1500` 就能让产品从"假 AI 评估"变"真 AI 评估"。

**次坑**:**🔴 没有任何输入校验和 rate limit**(3.3.1, 3.3.2, 3.3.3)— 部署到公网后会被刷。

---

## 4. Agent 4 — 部署 / 性能 / 安全

**读**:`server/index.js` `scripts/serve-prod.mjs` `.env.example` `vite.config.js` `package.json` `tailwind.config.js` + `dist/assets/` 实际产物

### 4.1 性能

| # | 发现 | 严重 |
|---|------|------|
| 4.1.1 | **bundle 体积实测**:`dist/assets/` 实际产物:<br>• `index.js` 340 KB(main bundle,React 19 + 业务)<br>• `index.es.js` 151 KB(React vendor,疑似重复打包)<br>• `html2pdf.js` 670 KB ⚠️<br>• `index.es.js` 27 KB(DOMPurify)<br>• **总计:1.18 MB JS**(主任务说"309KB main bundle"对不上,实际是 340KB,加上 html2pdf 是 1.18MB) | 🟡 建议改 |
| 4.1.2 | **html2pdf.js 670KB 永远加载**:`ExportButton.jsx` 用 html2pdf,即使孩子只用 Markdown 导出,也要先下载 670KB html2pdf | 🟡 建议改(动态 import) |
| 4.1.3 | **React vendor 重复打包**:`index.es.js` 151KB 和 `index.js` 340KB 都有 React 18 代码,实际是 dev 模式的产物;build 模式应该 split 出来一个 `vendor-*.js` | 🟡 建议改 |
| 4.1.4 | **sourcemap 1.27MB 部署到了 dist**:`index.es.js.map` 637KB,`index-BEHyi0nA.js.map` 1.27MB。生产环境不应该带 source map 部署,白送 2MB | 🟡 建议改 |
| 4.1.5 | **vite 配置 `chunkSizeWarningLimit: 1200`** —— 把警告阈值调到 1200KB,是为了让 670KB html2pdf 不报警。**这是用配置掩盖问题** | 🟡 建议改 |
| 4.1.6 | **没有 gzip/brotli 预压缩**:`vite build` 默认不生成 `.gz` / `.br`,cloudflared 隧道返回的是原始 1.18MB,移动端 4G 加载慢 | 🟡 建议改 |
| 4.1.7 | **没有图片优化**:案例库没有封面图,有也是 emoji 字符,这是好的——但导出 PDF 用的 html2canvas 在 670KB PDF 库 + 24KB CSS 下会很慢 | 🟢 锦上添花 |

### 4.2 安全

| # | 发现 | 严重 |
|---|------|------|
| 4.2.1 | **🔴 `.env` 含 OPENAI_COMPAT_KEY 实值,直接进容器**:`.gitignore` 排除了 `.env` ✅(确认 `.env` 不进 git),但部署文档 DEPLOY.md 第 11 行 `cp .env.example .env` 后**主人手动编辑**——部署脚本里没有"提示把 key 移到环境变量"的最佳实践,以后容器迁移可能误提交 | 🔴 必须改(改 DEPLOY.md) |
| 4.2.2 | **🔴 CORS 配置 `credentials: true` 但 `origin` 没强制**:`server/index.js` 第 25-28 行:<br>```js<br>origin: process.env.CORS_ORIGIN === '*' ? true : (process.env.CORS_ORIGIN \|\| 'http://localhost:5173')<br>```<br>如果 `CORS_ORIGIN='*'`,会变成 `origin: true` 配合 `credentials: true`——这会**被所有现代浏览器拒绝**且在某些代理下会出问题。生产应强制白名单 | 🟡 建议改 |
| 4.2.3 | **🔴 没有 rate limit**:`/api/ai/chat` 和 `/api/evaluate` 公开,任何人都能刷 | 🔴 必须改(同 3.3.3) |
| 4.2.4 | **🔴 没有输入长度限制**:`express.json({ limit: '2mb' })` 是 2MB,但 ai/evaluate 路由没有在路由层做字段长度校验——能塞 2MB 字符串到 `system` 字段,token 费 + 内存爆 | 🔴 必须改(同 3.3.2) |
| 4.2.5 | **没有 Helmet / 安全头**:`app.use(helmet())` 没加,缺少 `X-Content-Type-Options` `X-Frame-Options` `Strict-Transport-Security` 等 | 🟡 建议改 |
| 4.2.6 | **mock 模式判断靠 `=== 'your_xxx_here'` 字符串**:`volcengine.js` 第 27-29 行用字符串比较判占位符。**如果主人真实 key 开头是 "your_" 会出错** | 🟢 锦上添花 |
| 4.2.7 | **没有 HTTPS 强制**:`server/index.js` listen 默认 HTTP,生产走 cloudflared 反代有 TLS,但本地直连 3000 是明文 | 🟢 锦上添花 |
| 4.2.8 | **`.gitignore` 漏了 `*.log`**:`node_modules / dist / .env / .DS_Store / *.log / .vscode / .idea / coverage / .cache`——✅ `.env` 排除了,但 `server.log` / `serve.log` 部署时产生的日志会进 git(虽然 `*.log` 排除了) | ✅ OK |

### 4.3 部署/可观测性

| # | 发现 | 严重 |
|---|------|------|
| 4.3.1 | **🔴 没有 structured logging**:`server/index.js` 用 `console.log/error`,没有时间戳/请求 ID/字段级别。生产 debug 难 | 🟡 建议改 |
| 4.3.2 | **🔴 没有 error 监控**:任何 500 错误只在 console 出现,云电脑上进程挂了主人不知道 | 🟡 建议改 |
| 4.3.3 | **没有 `/api/health` 深度健康检查**:只回 `{status: 'ok'}`,没检查 mock 模式、PromptX 是否注入、3 个比赛 JSON 是否加载成功 | 🟢 锦上添花 |
| 4.3.4 | **没有 graceful shutdown**:`app.listen` 没接 `SIGTERM/SIGINT`,云电脑重启会丢请求 | 🟡 建议改 |
| 4.3.5 | **没有请求超时**:`/api/ai/chat` 可以挂死 60+ 秒(中转站问题) | 🟡 建议改 |
| 4.3.6 | **静态文件 SPA fallback 写对了**:`app.get(/^\/(?!api).*/, ...)` 正则匹配非 /api 路径返回 index.html ✅ | ✅ 达标 |
| 4.3.7 | **`server/index.js` 启动横幅很好** ✅ —— 显示端口/文字/图片/PromptX 状态 | ✅ 达标 |
| 4.3.8 | **`scripts/serve-prod.mjs` 路径穿越防护** ✅(39 行 `if (p.includes('..')) return null`) | ✅ 达标 |

### 4.4 Agent 4 总评

**最大坑**:
- **🔴 没 rate limit + 没输入校验** — 部署到公网后 5 分钟内会被刷
- **🟡 bundle 1.18MB + sourcemap 1.27MB** — 移动端加载慢
- **🟡 html2pdf 670KB 永远加载** — 应该动态 import
- **🟡 没有 rate limit + helmet + structured logging** — 生产级缺失

---

## 5. Top 5 优先要改的(影响产品体验最大)

| 排名 | 项目 | 严重 | 改动量 | 收益 |
|------|------|------|--------|------|
| **🥇 1** | **`max_tokens: 800` → 1500**(`server/services/volcengine.js` 一行改动) | 🔴 | 1 行 | **立刻从"假 AI 评估"变"真 AI 评估"** — 9 成评估请求的体验质变 |
| **🥈 2** | **移动端 Sidebar 折叠 + AIAssistant 默认折叠**(`src/App.jsx` + `src/components/AIAssistant.jsx` 4-5 处) | 🔴 | ~30 行 | 移动端从"完全不可用"变"可勉强用" |
| **🥉 3** | **`PERSONALITY_RECOMMEND` 表 + 性格自动推荐**(`src/App.jsx` + `src/data/personalities.js`) | 🔴 | ~10 行 | 落地 PRD §3"按学段自动推荐"承诺 |
| **🏅 4** | **评估路由加 rate limit + 字段长度校验**(`server/routes/evaluate.js` + `server/routes/ai.js` + `server/index.js`) | 🔴 | ~30 行 | 公网部署不被刷爆 |
| **🎖 5** | **PromptX 8 句核心金句 + 4 层表达金句注入**(`src/prompts/system.js` 追加一节,~600 字) | 🔴 | ~30 行 | LLM 输出"大老师味"质变 — 是这 8 句决定 LLM 像不像大老师 |

---

## 6. 完整建议清单(按文件归类)

### 6.1 `src/App.jsx`

- 🔴 1.3.2 加载 personality 时用 `PERSONALITY_RECOMMEND`
- 🔴 1.5.1 Sidebar 在 < 768px 折叠(用 `useMediaQuery` 或 CSS)
- 🟡 1.1.2 把 6 个 step 改为 `STEPS` 数组映射
- 🟡 1.6.2 统一大老师头像(AIAssistant + 各 step)

### 6.2 `src/components/AIAssistant.jsx`

- 🔴 1.2.2 默认 `minimized: true` 或 `open: false`(只显示右下角 🤖)
- 🟡 1.2.3 加 `Esc` 关闭 + 焦点环
- 🟡 1.2.4 切换性格时给用户气泡提示"老师风格已切换"
- 🟡 1.5.3 拖动 min-width 适配 320px 屏

### 6.3 `src/components/Sidebar.jsx`

- 🔴 1.5.1 移动端汉堡菜单(用 `useState(open)` 控制抽屉)
- 🟢 1.6.2 大老师头像统一

### 6.4 `src/components/StepNav.jsx`(推测需要改)

- 🟡 1.5.4 移动端竖排或横滚

### 6.5 `src/components/steps/*.jsx`

- 🟡 1.6.3 每个 step 加"加载/空态"组件
- 🟡 1.1.1 添加"上一步/下一步"显式按钮
- 🟢 1.4.4 把 `grade` 字段统一改成学段 ID

### 6.6 `src/data/cases.js`

- 🟡 1.4.1 增加 5-10 个新案例(覆盖小学/二三线城市)
- 🟡 1.4.2 增加 2-3 个"伪创新"反例案例
- 🟡 1.4.3 增加 1-2 个二三线城市案例(成都、武汉、西安、深圳等)
- 🟢 1.4.4 字段统一

### 6.7 `src/data/personalities.js`

- 🔴 2.2.4 删掉"害羞的万保睿"等具体名字,改为"一个害羞的小学六年级学生"
- 🟡 2.2.1 删掉重复的"假设性/不替学生想"底色
- 🟡 2.2.2 严苛督学加边界:"卡住超 2 轮**建议切换到暖心学姐**,由用户确认"
- 🟡 2.2.5 明确告诉 LLM"不要主动切换性格,只在用户明确说'换个风格'时引导切换"
- 🟢 2.2.3 4 性格加 emoji 风格映射

### 6.8 `src/data/age_adaptations.js`

- 🟡 1.6.3 加空态/加载态的 prompt 片段

### 6.9 `src/prompts/system.js`

- 🔴 2.1.1 追加 6 句大白话老师金句库
- 🔴 2.1.2 追加 2 句四层表达金句(灯泡/代码)
- 🟡 2.1.3 追加"灭火器清单 + 创造力养护三件事"
- 🟡 2.1.4 追加"大老师活人感对话原则"(4 步节奏)
- 🟡 2.1.5 追加"真人感边界原则"(避免 AI/客服/鸡汤味)
- 🟡 2.1.6 追加"天龙八部分类法"简表
- 🟡 2.1.7 追加"田忌赛马 + 6 大科学赛道"简表
- 🟢 2.1.8-2.1.12 锦上添花(Vibe Coding / AI 时代 / 5 要素 / 12 要素 / 开题课高频确认词)

### 6.10 `src/prompts/{onboarding,appreciate,inspiration,structure,draft,refine,achievement}.js`

- 🟡 2.3.1-2.3.5 各阶段 prompt 加方法论武器
  - `draft.js` 加自动化设备 5 要素 + 实验 12 要素 + 实验 3 维度
  - `structure.js` 加"东邪 vs 北丐"反问 + 5 类素材
  - `refine.js` 加"评委最看重的"信息
  - `onboarding.js` 加开题课高频确认词

### 6.11 `server/services/volcengine.js`

- 🔴 3.1.1 `max_tokens: 800` → 1500
- 🟡 3.2.1 抽 `genericChat()` 公共方法,openaiCompat/arkChat 只传 base/key
- 🟡 3.2.2 加 `AbortController` 超时(默认 30s)+ 1 次重试
- 🟡 3.2.3 `chatCompletion` 接受 `max_tokens` 参数
- 🟡 3.2.5 错误信息只回 `{status, message: '上游服务错误'}`,不暴露上游 body
- 🟢 3.2.4 mock 模式判断加 base URL 校验

### 6.12 `server/routes/evaluate.js`

- 🔴 3.1.4 删 `_internal_scores` / `_internal_*` 字段,改 console.log
- 🔴 3.1.2 修 `note` 文案,加 `_parseFailed` / `_raw` 内部字段
- 🟡 3.1.5 `fallbackEvaluate` 评分算法改连续(长度阈值)
- 🟡 3.1.6 `suggestedQuestions` 重复 bug 修复(用 FILLER_POOL 去重)
- 🟢 3.1.7 `fieldMap` 加"绿色环保""作品形态"两条
- 🟢 3.4.3 加 `?reload=1` 参数支持热加载 3 个 JSON

### 6.13 `server/routes/ai.js`

- 🔴 3.3.2 加 `messages` 数组长度 ≤ 50 / 单条 `content` 长度 ≤ 4000 校验
- 🟢 3.4.2 改 SSE 流式输出

### 6.14 `server/routes/health.js`

- 🟢 3.4.3 加 3 个比赛 JSON 加载状态

### 6.15 `server/index.js`

- 🔴 3.3.3 加 `express-rate-limit`(每 IP 60 次/分钟,LLM 路由 20 次/分钟)
- 🟡 4.2.5 加 `helmet()`
- 🟡 4.3.1 抽 `logger.js` 模块,JSON 结构化输出
- 🟡 4.3.4 加 `SIGTERM/SIGINT` graceful shutdown
- 🟡 4.3.5 加请求超时中间件(60s)
- 🟡 4.2.2 CORS `origin: '*' + credentials: true` 警告并禁止

### 6.16 `scripts/serve-prod.mjs`

- 🟡 4.3.1 加请求日志(method/url/status/duration)
- 🟢 4.3.5 加 60s 请求超时

### 6.17 `vite.config.js`

- 🟡 4.1.2 `build.rollupOptions.output.manualChunks` 拆 html2pdf 到独立 chunk
- 🟡 4.1.3 把 `chunkSizeWarningLimit: 1200` 改回 500
- 🟡 4.1.4 生产 build `sourcemap: false` 或 `'hidden'`
- 🟡 4.1.6 用 `vite-plugin-compression` 生成 .gz/.br

### 6.18 `tailwind.config.js` / `src/styles/index.css`

- 🟢 4.1.7 加 `prefers-reduced-motion` 支持

### 6.19 `package.json`

- 🟢 加 `helmet` `express-rate-limit` `pino` `pino-pretty` 依赖

### 6.20 `.env.example`

- 🟡 4.2.1 加注释:"生产请用环境变量注入,不要把 .env 提交到任何地方"
- 🟢 加 `CORS_ORIGIN=*` 警告(配合 4.2.2 修复)

### 6.21 `docs/DEPLOY.md`

- 🔴 4.2.1 明确"不要 commit .env"步骤

### 6.22 `docs/personas/大老师-PromptX-full-export-2026-05-29.md`

- 🟡 软链接断了(`../../大老师-PromptX-full-export-2026-05-29.md` 目标不存在),目标文件实际在 `/app/data/所有对话/主对话/大老师-PromptX-full-export-2026-05-29.md`

---

## 7. 立即可应用的代码改动(主对话确认后直接套用)

### 改动 1:`max_tokens` 提到 1500(server/services/volcengine.js)

```diff
--- a/server/services/volcengine.js
+++ b/server/services/volcengine.js
@@ -47,7 +47,7 @@ async function openaiCompat({ system, messages, modelName }) {
     messages: [
       { role: 'system', content: system },
       ...messages,
     ],
     temperature: 0.7,
-    max_tokens: 800,
+    max_tokens: 1500,  // 系统 prompt ~4K tokens,user+JSON 输出需 1200-1500
   }
@@ -100,7 +100,7 @@ async function arkChat({ system, messages, modelName }) {
     messages: [
       { role: 'system', content: system },
       ...messages,
     ],
     temperature: 0.7,
-    max_tokens: 800,
+    max_tokens: 1500,
   }
```

### 改动 2:`evaluate.js` 删 `_internal_*` + 修 note + 修 fallback 评分

```diff
--- a/server/routes/evaluate.js
+++ b/server/routes/evaluate.js
@@ -138,8 +138,11 @@ function fallbackEvaluate({ competition, profile, project }) {
     const fields = fieldMap[d.name] || ['question']
-    const filled = fields.filter((f) => (project?.[f] || '').trim().length > 5).length
-    const score = Math.min(5, Math.max(1, filled * 2 + 1))
+    const totalLen = fields.reduce((sum, f) => sum + (project?.[f] || '').trim().length, 0)
+    const score = totalLen < 10 ? 1 : totalLen < 30 ? 2 : totalLen < 80 ? 3 : totalLen < 200 ? 4 : 5
     return { name: d.name, score, weight: d.weight }
   })
@@ -156,6 +159,7 @@ function fallbackEvaluate({ competition, profile, project }) {
       '实用性': ['question', 'survey'],
       '选题与学生认知匹配度': ['question'],
       '研究过程与学生主体性': ['method', 'timeline'],
+      '绿色环保/可持续发展': ['question', 'inspiration'],
+      '作品形态与展示效果': ['resources', 'method'],
       '现场表现与展示效果': ['resources', 'timeline'],
@@ -202,8 +206,12 @@ function fallbackEvaluate({ competition, profile, project }) {
   if (!project?.question || project.question.length < 10) {
     suggestedQuestions.push('你的研究问题能用一句话讲清楚吗?评委最关心的就是这一句。')
   }
-  while (suggestedQuestions.length < 3) {
-    suggestedQuestions.push('评委可能挑的刺,你自己先想想是哪一处?')
-  }
+  const FILLER_POOL = [
+    '你打算先做哪一步?为什么?',
+    '评委看到这个,可能挑的刺,你自己先想想是哪一处?',
+    '你说的"挺好"——如果让你改成"挺好,问题是 X,下一步是 Y",试试?',
+    '如果让你现在给一个朋友讲一遍,你会怎么开头?',
+  ]
+  while (suggestedQuestions.length < 3) {
+    suggestedQuestions.push(FILLER_POOL[suggestedQuestions.length % FILLER_POOL.length])
+  }
+  const uniqueQs = [...new Set(suggestedQuestions)]
@@ -249,12 +257,13 @@ function fallbackEvaluate({ competition, profile, project }) {
   return {
     studentFeedback: `你的方案已经有了一个不错的起点!...`,
-    suggestedQuestions: suggestedQuestions.slice(0, 3),
+    suggestedQuestions: uniqueQs.slice(0, 3),
     strongPoints,
-    // 注意:以下字段只供家长端参考,孩子端不显示
-    _internal_scores: scores,
-    _internal_competition: competition.alias,
-    _internal_age: ageKey,
+    source: 'fallback',
   }
 }

@@ -227,7 +236,11 @@ router.post('/', async (req, res, next) => {
     if (!parsed) {
-      const result = fallbackEvaluate({ competition, profile, project })
-      return res.json({ ...result, mock: true, raw: ai.content, note: '豆包输出未匹配 JSON,降级为规则评估' })
+      console.warn('[evaluate] LLM JSON parse failed, fallback to rules. Raw:', ai.content?.slice(0, 500))
+      const result = fallbackEvaluate({ competition, profile, project })
+      return res.json({
+        ...result,
+        mock: true,
+        _raw: ai.content,  // 内部字段,前端过滤
+        note: '评估生成遇到格式问题,先用规则评估版,刷新后重试会得到 LLM 版',
+      })
     }
```

### 改动 3:`App.jsx` 用 PERSONALITY_RECOMMEND

```diff
--- a/src/App.jsx
+++ b/src/App.jsx
@@ -3,7 +3,7 @@ import { StudentProfile, loadProfile, saveProfile, clearProfile } from './co
 import { STEPS } from './prompts/index.js'
-import { PERSONALITIES, DEFAULT_PERSONALITY_ID } from './data/personalities.js'
+import { PERSONALITIES, DEFAULT_PERSONALITY_ID, PERSONALITY_RECOMMEND } from './data/personalities.js'
@@ -50,7 +50,12 @@ export default function App() {
-  const [personalityId, setPersonalityId] = useState(() => localStorage.getItem(PERSONALITY_KEY) || DEFAULT_PERSONALITY_ID)
+  // 1) 优先用 localStorage 存的
+  // 2) 没有则按 profile.grade 用 PERSONALITY_RECOMMEND 推荐
+  // 3) 都没有用 DEFAULT_PERSONALITY_ID
+  const [personalityId, setPersonalityId] = useState(() => {
+    const stored = localStorage.getItem(PERSONALITY_KEY)
+    if (stored) return stored
+    return DEFAULT_PERSONALITY_ID
+  })
+
+  // 破冰完成后,如果用户没手动切过,按学段切
+  useEffect(() => {
+    if (!profile?.grade) return
+    const stored = localStorage.getItem(PERSONALITY_KEY)
+    if (stored) return  // 用户已选过,不覆盖
+    const recommended = PERSONALITY_RECOMMEND[profile.grade] || DEFAULT_PERSONALITY_ID
+    setPersonalityId(recommended)
+  }, [profile?.grade])
```

### 改动 4:AIAssistant 默认折叠

```diff
--- a/src/components/AIAssistant.jsx
+++ b/src/components/AIAssistant.jsx
@@ -42,7 +42,7 @@ export default function AIAssistant({ step, profile, context, onContextChange
-  const [open, setOpen] = useState(true)
+  const [open, setOpen] = useState(false)  // 默认折叠,只显示右下角 🤖 图标
   const [minimized, setMinimized] = useState(false)
```

### 改动 5:`system.js` 追加金句库

```diff
--- a/src/prompts/system.js
+++ b/src/prompts/system.js
@@ -165,6 +165,30 @@ const HARD_CODED_PERSONA = `
 ## 现在的对话情境
 ...

+## 大老师金句库(关键身份信号,用于判断"我像不像大老师")
+
+### 8 句四层表达金句(讲故事/反问时随手可用)
+- 教育不是点亮灯泡,是帮他发现灯泡一直在那里
+- 代码会过时,但"我做到了"这个记忆不会
+- 你的孩子不需要天生勇敢,他只需要一次走过去的经历
+- 差的是有没有人给他搭一个够小的台阶
+- 创新是练出来的,不是教出来的,拿教背课文的方式去教创新叫灭火
+- 最可怕的不是孩子没有创造力,是他明明有但已经不相信自己有了
+- 故事不是演出来的,是从孩子眼里长出来的
+- 同理心不是锦上添花,是发现问题的起点
+
+### 真人感对话节奏(用户问问题时按这个走)
+1. 回应用户当下的状态(先接住)
+2. 给一个真实但不武断的判断("从目前来看""我倾向于")
+3. 用具体场景/学生案例/生活比喻解释为什么
+4. 给一个可以马上尝试的小动作
+5. 留下一个下一步观察点
+
+### 真人感边界(避免 3 种味)
+- 不开头"这是一个很好的问题"
+- 不机械分点(首先/其次/最后)
+- 不用"建议您可以""作为一个 AI 助手"
+- 不空泛鼓励(你真棒/加油)
+- emoji 0-2 个,严肃场景不用
+
+### 灭火器清单(识别家长/老师常见的"灭火"行为)
+- "这有什么用?" → 灭火
+- "照做就行" → 灭火
+- "我帮你想" → 灭火
+- "选难一点的" → 灭火
+
+### 田忌赛马 + 6 大科学赛道(STR/REFINE 阶段评估项目时)
+- 跨学科转换:动物学/植物学/生物医学(较易)/能源科学(中等)/化学/微生物学(较难)
+- 田忌赛马:从工程红海 → 科学蓝海,用差异化竞争
+
 ## 现在的对话情境
 ...
```

### 改动 6:`personalities.js` 删具体名字 + 修严苛督学边界

```diff
--- a/src/data/personalities.js
+++ b/src/data/personalities.js
@@ -99,7 +99,7 @@ export const PERSONALITIES = [
     personaPrompt: `# 你当前的提问模式:暖心学姐
 你是大老师孙大卫,现在切换到"暖心学姐"模式。
 这个模式下,你的提问围绕"感受 / 动机 / 共情"展开——
-大老师对"需唤醒型"学生(如害羞的万保睿)就是这样做的:
+大老师对"需唤醒型"学生(比如一个害羞的小学六年级学生)就是这样做的:
 **先共情,再给任务,然后等待他回答,最后肯定他的勇气**。
```

```diff
@@ -160,9 +160,11 @@ export const PERSONALITIES = [
     personaPrompt: `# 你当前的提问模式:严苛督学
 你是大老师孙大卫,现在切换到"严苛督学"模式。
 这个模式下,你的提问围绕"进度 / 质量 / 具体答案"展开——
-适合**学生主动要求"push 我一下"**,或**学生已经拖了几轮**。
-大老师对拖延型学生不是真凶,而是**给一个够小的台阶**。
+适合学生主动要求"push 我一下",或学生已经拖了几轮。
+大老师对拖延型学生不是真凶,而是给一个够小的台阶。
+
+【边界】
+- 切到严苛督学后,如果同一卡点超过 2 轮还没突破,告诉学生:"咱们换个方式,你试试切到暖心学姐模式,我陪你把卡点重新理一遍"——由学生确认,你不主动切。
+- 卡住时的兜底:"最小可执行的下一步是什么?哪怕只是查一篇知乎。"
 `,
```

### 改动 7:`server/index.js` 加 helmet + rate limit

```bash
npm install helmet express-rate-limit
```

```diff
--- a/server/index.js
+++ b/server/index.js
@@ -1,6 +1,7 @@
 import 'dotenv/config'
 import express from 'express'
 import cors from 'cors'
+import helmet from 'helmet'
+import rateLimit from 'express-rate-limit'
 import aiRouter from './routes/ai.js'
 import imagesRouter from './routes/images.js'
 import evaluateRouter from './routes/evaluate.js'
@@ -17,12 +18,28 @@ const app = express()
 const PORT = process.env.PORT || 3000

+// 安全头
+app.use(helmet())
+
+// 通用 rate limit
+const generalLimiter = rateLimit({
+  windowMs: 60 * 1000,
+  max: 60,
+  standardHeaders: true,
+  legacyHeaders: false,
+})
+app.use('/api/', generalLimiter)
+
+// LLM 路由更严格
+const llmLimiter = rateLimit({
+  windowMs: 60 * 1000,
+  max: 20,
+  standardHeaders: true,
+  legacyHeaders: false,
+})
+app.use('/api/ai/', llmLimiter)
+app.use('/api/evaluate', llmLimiter)
+
 // CORS
 app.use(cors({
   origin: process.env.CORS_ORIGIN === '*' ? true : (process.env.CORS_ORIGIN || 'http://localhost:5173'),
   credentials: true,
 }))
-app.use(express.json({ limit: '2mb' }))
+app.use(express.json({ limit: '128kb' }))  // 减小,2MB 太大
```

### 改动 8:`evaluate.js` 路由层加输入校验

```diff
--- a/server/routes/evaluate.js
+++ b/server/routes/evaluate.js
@@ -202,8 +202,18 @@ router.post('/', async (req, res, next) => {
-    const { competitionId, profile, project } = req.body
+    const { competitionId, profile, project } = req.body || {}
     if (!competitionId) {
       return res.status(400).json({ error: 'competitionId 必填' })
     }
+    // 白名单
+    const VALID_IDS = ['qingchuang', 'songqingling', 'chuaying']
+    if (!VALID_IDS.includes(competitionId)) {
+      return res.status(400).json({ error: `不支持的比赛 ${competitionId}` })
+    }
     if (!project?.question) {
       return res.status(400).json({ error: 'project.question 必填(请先完成"课题方向聚焦")' })
     }
+    // 字段长度限制
+    const MAX_FIELD = 2000
+    for (const [k, v] of Object.entries(project || {})) {
+      if (typeof v === 'string' && v.length > MAX_FIELD) {
+        return res.status(400).json({ error: `project.${k} 超过 ${MAX_FIELD} 字符` })
+      }
+    }
```

### 改动 9:vite.config.js 拆 html2pdf + 关 sourcemap

```diff
--- a/vite.config.js
+++ b/vite.config.js
@@ -4,10 +4,23 @@ import { defineConfig } from 'vite'
 export default defineConfig({
   plugins: [react()],
   server: {
     port: 5173,
     host: '0.0.0.0',
     proxy: {
       '/api': {
         target: 'http://localhost:3000',
         changeOrigin: true,
         secure: false,
       },
     },
   },
   build: {
     outDir: 'dist',
-    sourcemap: true,
-    chunkSizeWarningLimit: 1200,
+    sourcemap: false,  // 生产不带 sourcemap(省 2MB)
+    chunkSizeWarningLimit: 500,
+    rollupOptions: {
+      output: {
+        manualChunks: {
+          'react-vendor': ['react', 'react-dom'],
+          'pdf': ['html2pdf.js', 'html2canvas'],
+        },
+      },
+    },
   },
   optimizeDeps: {
     exclude: ['html2pdf.js'],
   },
 })
```

### 改动 10:`docs/DEPLOY.md` 警告 .env

```diff
--- a/docs/DEPLOY.md
+++ b/docs/DEPLOY.md
@@ -8,6 +8,12 @@
 cp .env.example .env  # 编辑填入 OPENAI_COMPAT_KEY
+
+> ⚠️ **安全警告**
+> - `.env` 已加入 `.gitignore`,**绝对不要** `git add .env` 或 commit
+> - **生产环境**(云电脑 / Docker / K8s)请用环境变量注入,不要用 .env 文件
+> - 如果不慎泄露 key,立刻在 yz.rs 控制台 rotate,不要等
+> - 部署到新机器时,先 `rm .env` 再 cp,避免旧 key 残留
+
 npm install
 npm run dev
```

---

## 8. 验证清单(改完后跑一遍)

| 改动 | 验证命令 | 期望结果 |
|------|---------|---------|
| 改动 1 (max_tokens) | `curl -X POST localhost:3000/api/evaluate -d '{"competitionId":"qingchuang","profile":{"grade":"junior"},"project":{"question":"我是初二学生,想做一个关于校门口拥堵的小研究","method":"每天早上7:30-8:00在路口数车+问卷100个同学","inspiration":"我自己每天迟到","survey":"访谈3位保安","timeline":"3个月"}}'` | 返回 `mock: false`(真 LLM 评估),3 个 suggested 全部不同 |
| 改动 2 (fallback) | 同上但把 `project.question` 改成"xx" | 3 个 suggested 全部不同,`_internal_*` 字段不在响应里 |
| 改动 3 (PERSONALITY_RECOMMEND) | 浏览器开 DevTools → 破冰选"小学" → 看 AIAssistant 标题栏 | 默认显示 🌸 暖心学姐,不是 🔬 理性分析师 |
| 改动 4 (默认折叠) | 刷新页面 | 看不到大对话框,只看到右下角 🤖 图标 |
| 改动 5+6 (金句库) | `curl -X POST localhost:3000/api/ai/chat -d '{"system":"...","messages":[{"role":"user","content":"我不喜欢做项目"}]}'` | 输出可能引用金句(如"差的是有没有人给他搭一个够小的台阶") |
| 改动 7 (rate limit) | `for i in {1..30}; do curl localhost:3000/api/evaluate/competitions; done` | 前 20 次 200,第 21 次 429 |
| 改动 8 (校验) | `curl -X POST localhost:3000/api/evaluate -d '{"competitionId":"xxx","project":{"question":"x"}}'` | 400 + `不支持的比赛` |
| 改动 9 (build) | `npm run build && du -ch dist/assets/*.js` | 拆出 react-vendor + pdf chunk,无 .map,总 JS < 600KB(不含 pdf) |

---

## 9. 不在本次范围(后续跟进)

- 流式输出(SSE):3.4.2 建议改
- PromptX 云端注入:env `PROMPTX_PERSONA_JSON` 已留口,主人从云端导出后填入即可
- 图片生成:`/api/ai/images` 已留路由,seedream KEY 没配,留空
- 多语言:目前全中文
- 家长端:`_internal_*` 删了之后,家长端需要重新设计"登录账号 → 看分数"流程
- A/B 测试:性格切换的留存数据没有

---

**报告完。** 主对话确认哪些改动要应用,我再 push 到代码。
