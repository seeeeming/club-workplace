import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  server: {
    // 监听所有网络接口：同一局域网的同学/老师可通过 http://本机IP:5173 访问
    host: true,
    // 长前缀优先：/api/deepseek 先匹配 → 同学的 AI 策划助手 Node 服务（3000，调 DeepSeek）
    // 其余 /api → 社团资料库的 FastAPI 后端（8000）
    proxy: {
      '/api/deepseek': {
        target: 'http://127.0.0.1:3000',
        changeOrigin: true,
      },
      '/api': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
    },
  },
})
