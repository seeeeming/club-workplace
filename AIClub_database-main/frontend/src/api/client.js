import axios from 'axios'

// 通过 Vite 代理访问后端，因此使用相对路径 /api
const client = axios.create({
  baseURL: '/api',
  timeout: 60000,
})

export default client
