import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const ocrProxyTarget = env.VITE_OCR_PROXY_TARGET || 'http://101.47.12.170:8080'
  const dashscopeApiKey = env.DASHSCOPE_API_KEY || ''

  return {
    plugins: [react()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    server: {
      port: 5816,
      proxy: {
        '/api/ocr': {
          target: ocrProxyTarget,
          changeOrigin: true,
          rewrite: (requestPath) => requestPath.replace(/^\/api\/ocr/, ''),
        },
        // 阿里云 DashScope TTS 代理（注入 API Key，避免前端暴露密钥）
        '/api/tts': {
          target: 'https://dashscope.aliyuncs.com',
          changeOrigin: true,
          secure: true,
          headers: {
            'Authorization': `Bearer ${dashscopeApiKey}`,
          },
          rewrite: (requestPath) => requestPath.replace(/^\/api\/tts/, '/api/v1/services/aigc/multimodal-generation/generation'),
        },
      },
    },
  }
})
