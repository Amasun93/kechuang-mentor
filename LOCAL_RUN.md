# 本地运行

## 1. 拉取代码

```bash
git clone https://github.com/Amasun93/kechuang-mentor.git
cd kechuang-mentor
```

如果已经 clone 过:

```bash
git pull origin main
```

## 2. 安装依赖

```bash
npm install
```

## 3. 配置环境变量

复制模板:

```bash
cp .env.example .env
```

Windows PowerShell:

```powershell
Copy-Item .env.example .env
```

编辑 `.env`，填入你的中转站或火山引擎配置。不要把 `.env` 提交到 GitHub。

## 4. 启动开发环境

```bash
npm run dev
```

打开:

```text
http://localhost:5173
```

前端运行在 `5173`，后端运行在 `3000`，Vite 会把 `/api` 代理到后端。

## 5. 生产构建

普通后端/隧道部署:

```bash
npm run build
npm start
```

GitHub Pages 静态预览:

```bash
npm run build:pages
```

注意: GitHub Pages 只能展示静态前端，不能运行 Express 后端 API。完整 AI 功能需要本地后端或独立后端部署。
