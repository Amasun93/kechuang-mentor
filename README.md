# 科创导师 · KeChuang Mentor

> 给中小学生的「苏格拉底型 AI 科创课题陪练」
>
> **完全自主实现**——不 fork 任何参考站,所有代码、prompt、数据、文档均为本仓库原创。
>
> 仓库名:`kechuang-mentor`  ·  状态:MVP 跑通  ·  最后更新:2026-06-06

---

## 🎯 一句话定位

**给学生用的"苏格拉底型 AI 科创导师"**——不直接给答案,通过提问一步步引导孩子从生活中的兴趣点出发,挖出能拿奖的科创课题,并设计出可落地的研究方案。

---

## 📦 项目结构

```
kechuang-mentor/
├── README.md                   ← 你正在看
├── package.json                ← 依赖与脚本
├── vite.config.js              ← Vite 配置(端口 5173)
├── tailwind.config.js          ← 暗金/深蓝主题
├── postcss.config.js
├── index.html
├── .env.example                ← 环境变量示例
│
├── src/                        ← 前端(React 19 + Vite + Tailwind)
│   ├── main.jsx
│   ├── App.jsx                 ← 6 步流程主组件
│   ├── styles/index.css
│   ├── components/
│   │   ├── StepNav.jsx         ← 顶部 6 步导航
│   │   ├── Sidebar.jsx         ← 左侧栏
│   │   ├── AIAssistant.jsx     ← 浮动 AI 引导窗(可拖动)
│   │   ├── AISettings.jsx      ← AI 配置面板
│   │   ├── ExportButton.jsx    ← 4 格式导出
│   │   ├── StudentProfile.jsx  ← 破冰对话 + 档案展示
│   │   └── steps/              ← 6 个步骤组件
│   │       ├── AppreciateStep.jsx
│   │       ├── InspirationStep.jsx
│   │       ├── StructureStep.jsx
│   │       ├── DraftStep.jsx
│   │       ├── RefineStep.jsx
│   │       └── AchievementStep.jsx
│   ├── data/
│   │   ├── cases.js            ← 5+ 真实获奖课题
│   │   ├── competitions.js     ← 3 比赛元数据 + 路由
│   │   ├── personalities.js    ← 4 性格
│   │   └── age_adaptations.js  ← 3 段年级适配
│   └── prompts/                ← 6 阶段 + 总人设 prompt
│       ├── system.js           ← ★苏格拉底教学哲学(最高优先级)
│       ├── onboarding.js       ← 破冰对话
│       ├── appreciate.js
│       ├── inspiration.js
│       ├── structure.js
│       ├── draft.js
│       ├── refine.js
│       ├── achievement.js
│       └── index.js
│
├── server/                     ← 后端(Express)
│   ├── index.js
│   ├── routes/
│   │   ├── ai.js               ← /api/ai/chat
│   │   ├── evaluate.js         ← /api/evaluate(注入 3 比赛 JSON)
│   │   └── health.js
│   └── services/
│       └── volcengine.js       ← 火山引擎豆包代理
│
├── docs/
│   ├── 产品PRD.md
│   ├── 技术架构.md
│   ├── 开发路线图.md
│   ├── competitions/           ← 3 比赛评估 JSON(调研产出)
│   │   ├── 青创赛-评估标准.json
│   │   ├── 宋庆龄-评估标准.json
│   │   ├── 雏鹰杯-评估标准.json
│   │   └── 汇总分析.md
│   ├── PROJECT_BRIEF.md        ← 中央契约(开发前必读)
│   └── MULTI_AGENT_PLAN.md     ← 多 Agent 协同计划
│
└── examples/
    └── sample_topic.json       ← 示例课题
```

---

## 🚀 启动步骤

### 1. 安装依赖

```bash
cd kechuang-mentor
npm install
```

### 2. 配置环境变量(可选)

```bash
cp .env.example .env
# 编辑 .env,填入火山引擎 API Key
# 申请:https://www.volcengine.com/product/doubao
```

> **不配也能跑**——后端会自动用 mock 响应,前端所有功能(包括 AI 对话、评估)都可演示。

### 3. 启动开发环境

```bash
npm run dev
```

这会**同时**启动:
- **后端** Express:http://localhost:3000
- **前端** Vite:http://localhost:5173

打开 http://localhost:5173 即可使用。

### 4. 验证

```bash
# 健康检查
curl http://localhost:3000/api/health

# AI 模式
curl http://localhost:3000/api/ai/modes

# 评估接口(需要 6 步流程走到第 5 步时才有完整数据)
curl -X POST http://localhost:3000/api/evaluate \
  -H "Content-Type: application/json" \
  -d '{"competitionId":"qingchuang","profile":{"grade":"junior"},"project":{"question":"示例研究问题"}}'
```

---

## 🎨 核心功能

### 1. 6 步引导流程

| Step | 名称 | 阶段 ID | 引导目标 |
|------|------|---------|----------|
| 0 | **破冰对话** | `ONBOARDING` | 3-5 个苏格拉底式问题了解学生 |
| 1 | **看优秀案例** | `APPRECIATE` | 5 个真实获奖课题 + 评委视角解读 |
| 2 | **找到兴趣点** | `INSPIRATION` | 五感式提问收敛到具体方向 |
| 3 | **课题方向聚焦** | `STRUCTURE` | 3-5 个候选 → 收敛到 1 个 |
| 4 | **研究方案设计** | `DRAFT` | 调研/方法/时间线/资源 4 维度 |
| 5 | **方案评估** | `REFINE` | 后端评估引擎,**孩子端只给鼓励性反馈** |
| 6 | **项目档案** | `ACHIEVEMENT` | 导出"我的科创想法卡"(4 格式) |

### 2. 苏格拉底教学哲学(产品灵魂)

- ❌ **永远不直接给答案**——学生说"我想做 XX" → 反问"为什么是 XX?"
- ✅ **一个回复最多 1-2 个问题**——绝不轰炸
- ✅ **鼓励说出思考过程**——"我不懂"→"如果随便说一个最接近的答案?"
- ✅ **错误方向不直接否定**——"永动机"→"如果真要做,最大挑战会是什么?"
- ✅ **用中小学生能听懂的语言**——按学段动态调整

完整规则见 `src/prompts/system.js`。

### 3. 4 种 AI 引导老师性格

| 性格 | 提问侧重 | 视觉 | ID |
|------|----------|------|-----|
| **理性分析师** 🔬 | 问数据、问证据 | 翠绿 | `analyst` |
| **暖心学姐** 🌸 | 问感受、问动机 | 暖橙 | `warm` |
| **资深顾问** 🎓 | 问方向、问取舍 | 暗金 | `advisor` |
| **严苛督学** 🔥 | 问进度、问质量 | 朱红 | `strict` |

**关键设计**:4 种性格**都遵守苏格拉底底色**,只在"提问侧重"上有差异。

### 4. 3 段年级自适应

- **小学**(3-6 年级,9-12 岁):打比方、不要求"科学方法"、看观察力
- **初中**(初一-初三,12-15 岁):避免术语、可以用"实验/对照"等基础概念
- **高中**(高一-高三,15-18 岁):可适度引入"方法论/变量控制"

### 5. 浮动 AI 引导窗

- 可拖动(mousedown/touchstart + mousemove/touchmove)
- 关闭后右下角出现小图标,点击可重新唤起
- 4 种性格可热切换
- 每个步骤一个 session,localStorage 保存历史

### 6. 4 格式导出

- **Markdown** (.md)
- **纯文本** (.txt)
- **网页** (.html)
- **PDF** (html2pdf.js 浏览器端生成)

---

## 🏆 评估机制

### 路由逻辑(来自 docs/competitions/汇总分析.md)

| 学段 | 推荐 |
|------|------|
| 小学中低年级 | 宋庆龄(科技绘画/创意)唯一优选 |
| 小学高年级 | 雏鹰杯 ≈ 宋庆龄 > 青创赛 |
| 初中 | 3 个比赛全面推荐 |
| 高中 | 青创赛 > 宋庆龄,雏鹰杯不参赛 |

### 评估 Prompt 注入顺序(§6.2)

1. 主人提供的 **PromptX 角色设定**(`PROMPTX_PERSONA_JSON` 环境变量)
2. 当前比赛的 `evaluation_dimensions`(按学段自动筛选)
3. 联网搜索补全的"今年最新政策"
4. 学生当前的 `profile` 和 `step` 上下文

### 孩子端呈现(§6.3)

- ❌ **不暴露**具体分数、等级、排名
- ✅ **只返回**鼓励性反馈(`studentFeedback` + `suggestedQuestions` + `strongPoints`)

---

## 🎨 视觉风格

- **主色**:深蓝 `#0a0d1f` → 暗金 `#c8a52a`(得到/樊登读书调)
- **字体**:Noto Sans SC(正文)+ ZCOOL XiaoWei(标题)
- **图标**:Font Awesome 6
- **圆角**:`rounded-2xl`
- **不**用儿童蓝紫渐变,**不**用纯白 SaaS 调
- 适合 9-18 岁全年龄段

---

## 📐 验收清单(对齐 PROJECT_BRIEF §9.1)

| 验收项 | 状态 |
|--------|------|
| `npm install && npm run dev` 跑通 | ✅ |
| 访问 http://localhost:5173 看到深蓝/暗金专业视觉 | ✅ |
| 首次进入触发破冰对话,3-5 题填完写入 `student_profile` | ✅ |
| 6 步顶部导航可切换 | ✅ |
| 浮动 AI 引导窗可拖动/关闭/再唤起 | ✅ |
| 4 种性格可切换 | ✅ |
| AI 对话(豆包 + mock 降级) | ✅ |
| 4 格式导出(MD/TXT/HTML/PDF) | ✅ |
| 内置 ≥ 5 个真实获奖课题 | ✅(5 个) |
| 评估路由 `/api/evaluate` 可调用 | ✅ |
| 评估路由按学段自动筛 `evaluation_dimensions` | ✅ |
| 所有 prompt 遵守苏格拉底 5 条铁律 | ✅ |
| 4 种性格 prompt 都有显著差异 | ✅ |
| 3 段年级 prompt 适配有可见差异 | ✅ |
| 视觉 9 岁和 18 岁都不觉得"这不是给我用的" | ✅ |

---

## 🐙 GitHub Push 指引

### 首次推送

```bash
# 1. 在 GitHub 创建仓库(空仓库)
#    https://github.com/new
#    仓库名:kechuang-mentor
#    不要勾选 "Add a README file"

# 2. 本地初始化
cd kechuang-mentor
git init
git add .
git commit -m "feat: 科创导师 MVP 跑通

- 6 步引导流程(看案例/找兴趣/聚焦/方案/评估/档案)
- 苏格拉底型 AI 引导(4 性格可切换)
- 浮动 AI 引导窗(可拖动/关闭/唤起)
- 3 段年级自适应(小学/初中/高中)
- 3 比赛评估引擎(青创赛/宋庆龄/雏鹰杯)
- 4 格式导出(MD/TXT/HTML/PDF)
- 暗金/深蓝专业视觉(得到/樊登读书调)"

# 3. 关联远程仓库
git remote add origin https://github.com/Amasun93/kechuang-mentor.git
git branch -M main
git push -u origin main
```

### 后续推送

```bash
git add .
git commit -m "your message"
git push
```

---

## 🤔 关键决策与假设

> 主人提到:"你有最高决策权,遇到不清楚的假设要明确写进 README"

| 决策点 | 假设 | 影响 |
|--------|------|------|
| 目标用户 | 小学/初中/高中三档(主人追加) | 视觉/Prompt/案例都按三档自适应 |
| 破冰 | 3-5 个苏格拉底式问题,不是表单 | 写入 `localStorage.kechuang_student_profile` |
| 苏格拉底哲学 | 4 性格都遵守,只在提问侧重不同 | system.js + personalities.js |
| AI 老师不直接给方案 | 这是产品最高优先级 | 写进 system.js 顶部 |
| 评估路由注入顺序 | PromptX → 比赛 JSON(按学段)→ 联网 → profile | 已在 `evaluate.js` 落地 |
| PromptX 角色设定 | 主人会从云端导出 JSON 放 `PROMPTX_PERSONA_JSON` 环境变量 | `evaluate.js` 读 env,空时跳过 |
| 3 比赛 JSON | 并行 deep_research agent 已输出到 `docs/competitions/` | `evaluate.js` 直接读取并按学段筛 |
| 视觉调性 | 暗金/深蓝,得到/樊登读书调,适合 9-18 岁 | `tailwind.config.js` + 组件 |
| 4 种性格颜色 | 翠绿/暖橙/暗金/朱红(对齐 BRIEF §4) | `personalities.js` |
| mock 降级 | 没配豆包 KEY 时,后端返回结构化 mock 响应 | 前端所有功能可演示 |
| localStorage 存储 | MVP 用 localStorage,V0.1 切后端 | `App.jsx` 持久化 |
| 案例数量 | 内置 5 个真实获奖课题摘要 | `src/data/cases.js` |
| 案例年级过滤 | 按 `CASE_GRADE_TAGS` 过滤推荐 | `age_adaptations.js` |
| 评估路由降级 | 没配豆包 KEY 时用规则评分(基于维度字段填充情况) | `evaluate.js.fallbackEvaluate` |
| 评估路由不暴露评分 | 孩子端只看到 `studentFeedback/suggestedQuestions/strongPoints` | `evaluate.js` 严格只返回这 3 字段 + 元数据 |
| PDF 导出 | 用 html2pdf.js 浏览器端生成,无后端依赖 | `ExportButton.jsx` |
| 浮动 AI 窗位置 | 默认屏幕右下角,初始位置 `window.innerWidth - 420` | `AIAssistant.jsx` |

---

## 🗺️ 后续路线图(对齐 PROJECT_BRIEF §10)

| 版本 | 范围 |
|------|------|
| **V0.1** | 学生档案后端化 + 5 维理解笔记 + 自动提炼 |
| **V0.2** | 多设备同步 + 多学生账号 + 微信扫码登录 |
| **V1.0** | 智能召回(向量检索)+ 主动建议 + 数据看板 |
| **V2.0** | 家长端(看进度/订阅/管理)+ 付费墙 |

---

## 📚 关键文档

- [产品 PRD](docs/产品PRD.md)
- [技术架构](docs/技术架构.md)
- [开发路线图](docs/开发路线图.md)
- [中央契约 PROJECT_BRIEF](docs/PROJECT_BRIEF.md) — 开发前必读
- [多 Agent 协同计划](docs/MULTI_AGENT_PLAN.md)
- [3 比赛评估标准](docs/competitions/) — 含按学段适配

---

## 🔗 关键资源

| 资源 | 链接 |
|------|------|
| GitHub 仓库 | https://github.com/Amasun93/kechuang-mentor(待主人创建) |
| 火山引擎方舟 | https://ark.cn-beijing.volces.com/api/v3 |
| 豆包模型 | `Doubao-Seed-1.6-flash` (默认 `ep-20260125095517-z49n4`) |

---

## 📝 License

MIT(主人未指定,先按 MIT)
