import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

// 这个配置用于告诉 Vite 如何启动、构建和兼容 GitHub Pages 静态部署。
export default defineConfig({
  // 这里使用相对路径，方便 GitHub Pages 子路径部署时资源仍能正常加载。
  base: './',
  // 这里开启 React 与 Tailwind 插件，让页面组件和样式可以被正确编译。
  plugins: [react(), tailwindcss()],
  // 这里设置测试环境，当前测试只校验纯数据和工具函数，不需要浏览器模拟。
  test: {
    environment: 'node',
    globals: true
  }
})
