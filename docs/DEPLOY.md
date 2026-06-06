# 部署指南

## 方式 1:本机开发(日常开发)

```bash
git clone https://github.com/Amasun93/kechuang-mentor
cd kechuang-mentor
cp .env.example .env  # 编辑填入 OPENAI_COMPAT_KEY
npm install
npm run dev
# 访问 http://localhost:5173
```

## 方式 2:云电脑 / 远程沙箱演示(短时 URL)

适合:产品演示、给老板/家长看效果、远程手机访问。

```bash
# 1. 启动后端(端口 3000)
nohup node server/index.js > server.log 2>&1 &

# 2. 编译前端(端口 5173)
npx vite build

# 3. 启动合并 server(UI + API 反代到 3000)
nohup node scripts/serve-prod.mjs > serve.log 2>&1 &
# 默认端口 8081

# 4. cloudflared 暴露
cloudflared tunnel --no-autoupdate --url http://localhost:8081
# 输出形如:https://xxxx.trycloudflare.com
```

短时 URL 24h 有效,关掉 cloudflared 就消失。

## 方式 3:生产部署(长期可用)

- **Vercel / Netlify(前端)**:Vite 项目,设 `VITE_API_BASE` 指向后端 URL
- **Railway / Render / Fly.io(后端)**:Node Express,设所有 .env 变量
- 域名 + cloudflared 长效 tunnel 或 Nginx 反代

---

## .env 必填项

```
OPENAI_COMPAT_BASE=https://api.yz.rs/v1
OPENAI_COMPAT_KEY=sk-xxx
OPENAI_COMPAT_MODEL=deepseek-v4-pro
```

可选项(留空走 mock):
- `VOLC_ACCESS_KEY`(豆包直连)
- `VOLC_SEEDREAM_KEY`(火山 seedream 图片,需单独开通)
- `PROMPTX_PERSONA_JSON`(大老师人设 JSON 注入)

## 启动检查

```bash
curl http://localhost:3000/api/health
# 期望:{"status":"ok","mock":false,"volcConfigured":true,...}
```

`mock:false` 说明 AI 后端配置成功。
