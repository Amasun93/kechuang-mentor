import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Vite 配置:React 19 + 开发代理
// - 端口 5173 (前端)
// - 代理 /api -> 后端 3000
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
    sourcemap: false, // 生产不输出 sourcemap(省 1.2MB)
    chunkSizeWarningLimit: 1200,
    rollupOptions: {
      output: {
        manualChunks: {
          // html2pdf 独立分块,按需加载(670KB)
          'html2pdf': ['html2pdf.js'],
          // React 独立分块(缓存友好)
          'react-vendor': ['react', 'react-dom'],
        },
      },
    },
  },
  optimizeDeps: {
    // html2pdf.js 是浏览器端库,不需要预构建
    exclude: ['html2pdf.js'],
  },
})
