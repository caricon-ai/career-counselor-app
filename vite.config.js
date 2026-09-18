import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  // ローカル開発時：/api へのリクエストの転送先（未設定なら旧Expressサーバー）
  const apiProxy = env.VITE_API_PROXY || 'http://localhost:3000'
  return {
    plugins: [react()],
    server: {
      proxy: {
        '/api': { target: apiProxy, changeOrigin: true, secure: true },
      },
    },
  }
})
