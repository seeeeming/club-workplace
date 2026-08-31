import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // 构建后部署在 Vue 平台的 /archive/ 子路径下
  base: '/archive/',
  server: {
    // 独立开发时用的端口（避开 Vue 平台的 5173）
    port: 5174,
    proxy: {
      // 将 /api 请求代理到后端 FastAPI
      '/api': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
    },
  },
  build: {
    // 一步到位：build 产物直接输出到 Vue 平台的 public/archive
    outDir: path.resolve(__dirname, '../../reflection-prototype/public/archive'),
    emptyOutDir: true,
  },
})
