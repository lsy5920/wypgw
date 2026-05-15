import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

// 这个组件在路由变化时回到页面顶部，入参为空，返回值为空组件。
export function RouteScrollReset() {
  // 这个变量保存当前路由地址，用于监听页面切换。
  const location = useLocation()

  useEffect(() => {
    // 这里用 window.scrollTo 保持预览环境稳定，不使用会干扰外层滚动的接口。
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
  }, [location.pathname])

  return null
}
