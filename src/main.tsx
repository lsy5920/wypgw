import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './styles/global.css'

// 这个变量用于找到页面挂载点，入参来自 index.html，返回值是根节点或空值。
const rootElement = document.getElementById('root')

// 这里判断挂载点是否存在，避免页面结构异常时出现空指针报错。
if (!rootElement) {
  throw new Error('未找到页面根节点，请检查 index.html 中是否存在 root 容器。')
}

// 这里创建 React 应用根节点，并把整个官网渲染到浏览器页面上。
createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>
)
