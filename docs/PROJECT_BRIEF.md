# KeChuang Mentor 产品需求文档（PRD）

> 仓库：`kechuang-mentor`
> 类型：AI 引导式科创课题陪练产品（**AI 引导老师 = 大老师（孙大卫 / ideaLab 课程总监）**）
> 目标用户：小学（3-6 年级）/ 初中 / 高中三档学生
> MVP 状态：开发中（多 Agent 协同）· **大老师人设已注入**
> 最后更新：2026-06-06（大老师人设整合）

---

## 1. 一句话定位

**给学生用的"苏格拉底型 AI 科创导师"**——不直接给答案，通过提问一步步引导孩子从生活中的兴趣点出发，挖出能拿奖的科创课题，并设计出可落地的研究方案。

---

## 2. 目标用户与画像

| 学段 | 年龄 | 认知特征 | 引导深度 |
|---|---|---|---|
| **小学（3-6 年级）** | 9-12 岁 | 直觉思维、具体形象、需要"打比方" | 看观察力和动手能力，不要求"科学方法" |
| **初中（初一-初三）** | 12-15 岁 | 抽象思维开始发展、可以"做实验" | 看科学方法的规范使用、调研深度、可行性 |
| **高中（高一-高三）** | 15-18 岁 | 抽象思维成熟、能做"研究" | 看研究深度、学术规范、独立创新 |

**核心洞察**：同一个比赛，3 段学生评估标准差异极大（见 `docs/competitions/*.json` 的 `scoring_by_age` 字段）。导师的语言、提问深度、案例推荐都要按学段自适应。

---

## 3. 核心功能（6 步引导流程）

| Step | 名称 | 阶段 ID | AI 引导任务 | 交付物 |
|------|------|---------|------------|--------|
| 0 | **破冰对话** | `ONBOARDING` | 询问 3-5 个基本情况（年级/兴趣/经历/目标比赛/想解决的问题） | `student_profile` 写入 localStorage |
| 1 | **看优秀案例** | `APPRECIATE` | 展示内置获奖课题库，按学生学段和兴趣领域筛选 | 3-5 个案例摘要 + 评委视角解读 |
| 2 | **找到兴趣点** | `INSPIRATION` | 五感式提问帮孩子从宽泛兴趣收敛到具体方向 | 一句话方向（如"我想做……因为……"） |
| 3 | **课题方向聚焦** | `STRUCTURE` | 反问、对比、假设，引导聚焦到"可研究的具体问题" | 3-5 个候选方向 + 收敛到 1 个 |
| 4 | **研究方案设计** | `DRAFT` | 引导调研计划、实验设计、时间线、资源清单 | 完整研究方案骨架 |
| 5 | **方案评估** | `REFINE` | 后端调用评估引擎，**孩子端只给鼓励性反馈** | 评估分数（家长端可见）+ 改进建议（孩子端委婉） |
| 6 | **项目档案** | `ACHIEVEMENT` | 保存课题设计，可导出"我的科创想法卡" | 4 格式导出（MD / TXT / HTML / PDF） |

**MVP 范围**：6 步全做。第 5 步评估路由先用内置 3 比赛 JSON 占位 prompt，等主人提供 PromptX 角色设定后再注入。

---

## 4. 苏格拉底教学哲学（产品最高优先级）

> 这是产品的灵魂，所有 agent 写 prompt 都要遵守。

### 5 条铁律

1. **永远不直接给答案**——学生说"我想做 XX" → 反问"为什么是 XX？"
2. **一个回复最多 1-2 个问题**——不要轰炸
3. **鼓励说出思考过程**——"我不懂"→"如果随便说一个最接近的答案？"
4. **错误方向不直接否定**——"永动机"→"如果真要做，最大挑战会是什么？"
5. **用中小学生能听懂的语言**——按学段动态调整

### 4 种性格（都遵守苏格拉底底色，只在"提问侧重"上不同）

| 性格 | ID | 提问侧重 | 视觉 |
|------|-----|----------|------|
| **理性分析师** | `analyst` | 问数据、问证据 | 🔬 翠绿 |
| **暖心学姐** | `warm` | 问感受、问动机 | 🌸 暖橙 |
| **资深顾问** | `advisor` | 问方向、问取舍 | 🎓 暗金 |
| **严苛督学** | `strict` | 问进度、问质量 | 🔥 朱红 |

**实现细节**：见 `src/prompts/system.js` 和 `src/data/personalities.js`。

---

## 5. 视觉风格

| 维度 | 选型 | 说明 |
|---|---|---|
| **主背景** | 深蓝 → 暗金 渐变 | 得到/樊登读书调性 |
| **主色** | `#0f172a` (slate-900) → `#1e293b` (slate-800) | 深邃专业 |
| **强调色** | 暗金 `#d4af37` (gold-400) | 高级感、奖项感 |
| **辅助色** | 翠绿（理性）/ 暖橙（暖心）/ 朱红（严苛） | 性格区分 |
| **字体** | Noto Sans SC（正文）+ ZCOOL XiaoWei（标题） | 现代、专业、不低龄 |
| **圆角** | `rounded-2xl` | 友好 |
| **图标** | Font Awesome 6 | 通用 |
| **整体调性** | 专业 + 友好，不幼稚 | 适合 9-18 岁全年龄段 |

> ⚠️ **绝不要用儿童蓝紫渐变**（小作家那种），会吓退高中生。也不要纯白 SaaS 调，会让小学生觉得"这是大人的工具"。

---

## 6. 评估机制（后端）

### 6.1 内置 3 比赛标准（已实现）

见 `docs/competitions/`：
- `青创赛-评估标准.json`（国家级、覆盖小初高，重点年龄段：初高中）
- `宋庆龄-评估标准.json`（国家级、重点：发明创新）
- `雏鹰杯-评估标准.json`（上海市级 / 红领巾科创）

每个 JSON 含：
- `evaluation_dimensions`（含权重、评分细则、获奖案例）
- `common_pitfalls`（常见错误）
- `winning_patterns`（获奖模式）
- `age_group_focus.scoring_by_age`（按学段差异）
- `recommended_topics`（按学段推荐选题方向 + 风险提示）

### 6.2 PromptX 角色设定接入（已注入 · 大老师人设）

主人已从 PromptX 云端导出"大老师"（孙大卫 / ideaLab 课程总监）全量人设（3952 行 / 65 RoleX 节点 / 196 engram）：
- 原始导出：`大老师-PromptX-full-export-2026-05-29.md`（项目根目录软链到 `docs/personas/`）
- 注入位置：
  1. **`src/prompts/system.js`** —— 硬编码大老师人设摘要（身份/信念/性格/表达/方法论武器/四层表达/苏格拉底 5 铁律），保证不依赖外部文件也能跑
  2. **`src/data/personalities.js`** —— 4 性格改为"大老师的 4 种模式切换"（理性分析师/暖心学姐/资深顾问/严苛督学），每种 personaPrompt 都带大老师底色
  3. **`src/data/cases.js`** —— 在原 5 个公开案例基础上追加 4 个大老师实战案例（去名改写：害羞男孩边哭边讲/骨骼关键点跑通/福建 maker 同学/罕见病手部康复辅具）
  4. **`docs/research/kechuang-mentor引导老师话术设计.md`** —— 完整话术设计文档（6 种话术模式 / 6 步 prompt 模板 / 4 性格×6 步 / 案例库使用规则 / 评分不暴露规则 / 自检 checklist）

- 可选增强：主人将 PromptX JSON 导出后粘到 `.env` 的 `PROMPTX_PERSONA_JSON=...`，`system.js` 启动时会用 `mergePromptXPersona()` 把它 merge 到硬编码人设的末尾（**不替换硬编码**——避免主人 JSON 残缺时人格崩）

- 评估时按以下顺序注入 prompt：
  1. 主人提供的 PromptX 角色设定（可选）
  2. 大老师硬编码人设（始终存在）
  3. 当前比赛的 `evaluation_dimensions`（自动按学生学段筛选）
  4. 学生当前的 `student_profile` 和 `step` 上下文

- 评估路由已对齐：`server/routes/evaluate.js` 给孩子端只返 {studentFeedback, suggestedQuestions, strongPoints} 3 件套，**不暴露评分**。

### 6.3 给孩子端的呈现

**孩子端只看到鼓励性反馈**（不直接暴露评分）：
- ❌ "你的项目评分 3.2/5，不及格"
- ✅ "评委可能会对你的 XX 部分感兴趣，但也可能在 YY 上有疑问。咱们可以怎么把 YY 改得更扎实？"

---

## 7. 技术栈

| 层 | 选型 | 理由 |
|---|---|---|
| 前端框架 | React 19 + Vite | 快速开发、HMR |
| 样式 | Tailwind CSS | 与小作家架构对齐 |
| 后端 | Node.js + Express | 轻量、易部署 |
| AI | 火山引擎豆包系列（默认 `ep-20260125095517-z49n4` / Doubao-Seed-1.6-flash） | 性价比、已验证 |
| 存储（MVP） | localStorage | 简化、无后端依赖 |
| 存储（V0.1+） | 后端 SQLite + 简单 REST | 多设备同步 |
| PDF | html2pdf.js | 浏览器端生成 |
| 字体 | Noto Sans SC + ZCOOL XiaoWei | 跨平台中文 |
| 图标 | Font Awesome 6 | 通用 |

---

## 8. 项目结构

```
kechuang-mentor/
├── README.md               # 启动 + 部署 + GitHub push 指引
├── package.json
├── vite.config.js
├── tailwind.config.js
├── index.html
├── .env.example
│
├── src/                    # 前端
│   ├── main.jsx
│   ├── App.jsx             # 6 步流程主组件
│   ├── components/
│   │   ├── StepNav.jsx     # 顶部 6 步导航
│   │   ├── Sidebar.jsx     # 左侧栏（提纲/素材）
│   │   ├── AIAssistant.jsx # 浮动 AI 引导窗
│   │   ├── AISettings.jsx  # AI 配置（模型/性格）
│   │   ├── ExportButton.jsx
│   │   ├── StudentProfile.jsx # 破冰对话
│   │   └── steps/          # 6 个步骤组件
│   ├── data/
│   │   ├── cases.js        # 5+ 真实获奖课题
│   │   ├── competitions.js # 3 比赛元数据
│   │   ├── personalities.js # 4 性格
│   │   └── age_adaptations.js # 3 段年级适配
│   ├── prompts/            # 6 阶段 prompt + system
│   └── styles/
│
├── server/                 # 后端
│   ├── index.js
│   ├── routes/
│   │   ├── ai.js          # /api/ai/chat, /api/ai/images
│   │   ├── evaluate.js    # /api/evaluate（评估路由）
│   │   └── health.js
│   └── services/
│       └── volcengine.js  # 火山引擎代理
│
├── docs/
│   ├── PROJECT_BRIEF.md    # 本文件 - 中央契约
│   ├── MULTI_AGENT_PLAN.md # 多 Agent 协同计划
│   ├── 产品PRD.md          # 简化版 PRD
│   ├── 技术架构.md
│   ├── 开发路线图.md
│   ├── competitions/       # 3 比赛评估 JSON
│   │   ├── 青创赛-评估标准.json
│   │   ├── 宋庆龄-评估标准.json
│   │   └── 雏鹰杯-评估标准.json
│   └── research/           # 参考调研
│       ├── 徐老师沟通模式拆解.md
│       └── kechuang-mentor引导老师话术设计.md
│
└── examples/
    └── sample_topic.json   # 1 个示例课题完整引导流程
```

---

## 9. 验收标准（MVP）

### 9.1 功能验收

- [ ] `npm install && npm run dev` 跑通
- [ ] 访问 http://localhost:5173 看到深蓝/暗金专业视觉
- [ ] 首次进入触发破冰对话，3-5 个问题填完后写入 `student_profile`
- [ ] 6 步顶部导航可切换
- [ ] 浮动 AI 引导窗可拖动、关闭、再唤起
- [ ] 4 种性格可切换
- [ ] AI 对话能正常调用豆包（或 mock 响应）
- [ ] 4 格式导出（MD / TXT / HTML / PDF）可下载
- [ ] 内置至少 5 个真实获奖课题摘要
- [ ] 评估路由 `/api/evaluate` 可调用，返回结构化结果
- [ ] 评估路由能按学生学段自动筛选 `evaluation_dimensions`

### 9.2 演示流程验收

完整走一遍：破冰 → 看优秀案例 → 找到兴趣点 → 课题方向聚焦 → 研究方案设计 → 方案评估 → 项目档案导出。

### 9.3 质量验收

- [ ] 所有 prompt 都遵守"苏格拉底 5 条铁律"
- [ ] 4 种性格 prompt 都有显著差异（不是套壳）
- [ ] 3 段年级 prompt 适配有可见的语言差异
- [ ] 视觉上 9 岁和 18 岁都不会觉得"这不是给我用的"
- [ ] 代码注释清楚，关键决策有 README 解释

---

## 10. 后续路线图

| 版本 | 范围 | 触发条件 |
|---|---|---|
| **V0.1** | 学生档案后端化 + 5 维理解笔记 + 自动提炼 | MVP 跑通 + 主人确认产品方向 |
| **V0.2** | 多设备同步 + 多学生账号 + 微信扫码登录 | 主人决定开放给真实家长 |
| **V1.0** | 智能召回（向量检索）+ 主动建议 + 数据看板 | 验证留存/转化后 |
| **V2.0** | 家长端（看进度/订阅/管理）+ 付费墙 | 商业化决策后 |

---

## 11. 关键资源

| 资源 | 路径 / 链接 |
|---|---|
| GitHub 仓库 | `https://github.com/Amasun93/kechuang-mentor`（待主人创建） |
| 小作家云课堂参考 | http://42.193.96.107:3002/ |
| 子 session 产品分析报告 | `/app/data/所有对话/主对话/browser/screenshots/小小作家分析/` |
| 子 session 21 张截图 | 同上目录 |
| 3 比赛评估 JSON | `docs/competitions/*.json` |
| 火山引擎方舟 | https://ark.cn-beijing.volces.com/api/v3 |
| 4 性格完整 prompt | `src/data/personalities.js` |
| 苏格拉底教学哲学 | `src/prompts/system.js` |
| 3 段年级适配 | `src/data/age_adaptations.js` |

---

## 12. 待主人决策 / 提供的资源

| 资源 | 状态 | 用途 |
|---|---|---|
| PromptX 大老师人设全量导出 | ✅ **已提供**（`docs/personas/大老师-PromptX-full-export-2026-05-29.md`，软链到项目根） | 注入 system.js / personalities.js / cases.js |
| PromptX 角色 JSON（可选增强） | ⏳ **可选** | 粘到 `.env` 的 `PROMPTX_PERSONA_JSON` |
| GitHub 仓库创建（`Amasun93/kechuang-mentor`） | **待主人创建** | 推送代码 |
| 火山引擎 API Key | **待配置到 `.env`** | 后端 AI 代理（未配置时自动 mock 降级） |
| 真实学生/家长试用反馈 | **MVP 跑通后** | 验证 + 调优 |
| 产品最终命名 | **可改** | 当前用 `kechuang-mentor` 占位 |

---

**这份文档是中央契约。所有 Agent 改实现前先查这份，对齐决策。**
