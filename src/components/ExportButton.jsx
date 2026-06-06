/**
 * ExportButton - 4 格式导出
 * 支持:Markdown / 纯文本 / 网页 / PDF
 */

import { useState } from 'react'
import { marked } from 'marked'

function buildContent(format, project) {
  const md = projectToMarkdown(project)
  if (format === 'md') return { content: md, mime: 'text/markdown', ext: 'md' }
  if (format === 'txt') {
    return {
      content: md.replace(/[#*`>]/g, '').replace(/\n{3,}/g, '\n\n').trim(),
      mime: 'text/plain',
      ext: 'txt',
    }
  }
  if (format === 'html') {
    const html = `<!doctype html>
<html lang="zh-CN"><head>
<meta charset="utf-8">
<title>${project.title || '我的科创想法卡'}</title>
<style>
body{font-family:'Noto Sans SC',system-ui,sans-serif;max-width:780px;margin:40px auto;padding:0 20px;color:#222;line-height:1.7}
h1{color:#0a0d1f;border-bottom:3px solid #c8a52a;padding-bottom:12px}
h2{color:#a8841c;margin-top:32px;border-left:4px solid #c8a52a;padding-left:12px}
.meta{background:#fbf7e8;border-left:4px solid #c8a52a;padding:12px 16px;border-radius:4px;margin:20px 0}
.quote{background:#0a0d1f;color:#e8d77f;padding:16px 20px;border-radius:6px;margin:20px 0;font-style:italic}
footer{margin-top:40px;text-align:center;color:#999;font-size:12px;border-top:1px solid #eee;padding-top:16px}
</style></head><body>
${marked.parse(md)}
<footer>由「科创导师」生成 · ${new Date().toLocaleDateString('zh-CN')}</footer>
</body></html>`
    return { content: html, mime: 'text/html', ext: 'html' }
  }
  return { content: md, mime: 'text/markdown', ext: 'md' }
}

function projectToMarkdown(p) {
  return `# ${p.title || '我的科创想法卡'}

<div class="meta">

> **作者**:${p.author || '我'}
> **年级**:${p.grade || '未填'}
> **目标比赛**:${p.competition || '未填'}
> **生成时间**:${new Date().toLocaleString('zh-CN')}

</div>

## 1. 灵感来源
${p.inspiration || '_(待补充)_'}

## 2. 研究问题
${p.question || '_(待补充)_'}

## 3. 候选方向
${(p.directions || ['_(待补充)_']).map((d, i) => `${i + 1}. ${d}`).join('\n')}

## 4. 研究方案
${p.method || '_(待补充)_'}

## 5. 时间线
${(p.timeline || ['_(待补充)_']).map((t, i) => `- 第 ${i + 1} 阶段:${t}`).join('\n')}

## 6. 资源清单
${(p.resources || ['_(待补充)_']).map((r) => `- ${r}`).join('\n')}

## 7. 评估反馈
${p.refine || '_(待补充)_'}

## 8. 我的科创信条
${p.credo || '_(待补充)_'}
`
}

async function exportAsPDF(project) {
  // 动态加载 html2pdf.js(浏览器端库)
  const html2pdf = (await import('html2pdf.js')).default
  const md = projectToMarkdown(project)
  const container = document.createElement('div')
  container.innerHTML = `
    <div style="font-family:'Noto Sans SC',sans-serif;padding:32px;color:#222;line-height:1.7;max-width:720px">
      ${marked.parse(md)}
      <hr style="margin-top:32px;border:0;border-top:1px solid #eee">
      <p style="text-align:center;color:#999;font-size:12px">由「科创导师」生成 · ${new Date().toLocaleDateString('zh-CN')}</p>
    </div>
  `
  document.body.appendChild(container)
  await html2pdf().set({
    margin: 10,
    filename: `${project.title || '科创想法卡'}.pdf`,
    html2canvas: { scale: 2, backgroundColor: '#fff' },
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
  }).from(container).save()
  document.body.removeChild(container)
}

function downloadFile(filename, content, mime) {
  const blob = new Blob([content], { type: mime + ';charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export default function ExportButton({ project }) {
  const [open, setOpen] = useState(false)
  const [exporting, setExporting] = useState(false)

  const handle = async (fmt) => {
    setOpen(false)
    if (fmt === 'pdf') {
      setExporting(true)
      try { await exportAsPDF(project) } finally { setExporting(false) }
      return
    }
    const { content, mime, ext } = buildContent(fmt, project)
    const safeName = (project.title || '科创想法卡').replace(/[\\/:*?"<>|]/g, '_')
    downloadFile(`${safeName}.${ext}`, content, mime)
  }

  return (
    <div className="relative">
      <button onClick={() => setOpen(!open)} className="btn-ghost text-sm" disabled={exporting}>
        {exporting ? <><i className="fa-solid fa-spinner fa-spin" /> 生成 PDF</> : <><i className="fa-solid fa-download" /> 导出</>}
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-48 panel bg-ink-800/95 z-30 animate-fade-in">
          {[
            { id: 'md',   icon: 'fa-brands fa-markdown', name: 'Markdown' },
            { id: 'txt',  icon: 'fa-solid fa-file-lines', name: '纯文本' },
            { id: 'html', icon: 'fa-brands fa-html5',     name: '网页' },
            { id: 'pdf',  icon: 'fa-solid fa-file-pdf',   name: 'PDF' },
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => handle(f.id)}
              className="w-full px-3 py-2 text-left text-sm text-ink-200 hover:bg-ink-700 hover:text-gold-200 flex items-center gap-2"
            >
              <i className={`${f.icon} w-4`} />
              {f.name}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
