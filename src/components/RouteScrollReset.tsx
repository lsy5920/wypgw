import { useLayoutEffect } from 'react'
import { useLocation } from 'react-router-dom'

// 这个函数在页面路由变化后把窗口滚动到顶部，入参为空，返回值为空组件。
export function RouteScrollReset() {
  // 这个变量保存当前路由信息，用于判断用户是否切换到了新页面。
  const location = useLocation()

  useLayoutEffect(() => {
    try {
      // 这里关闭浏览器默认的历史滚动恢复，避免返回或切页时沿用旧位置。
      if ('scrollRestoration' in window.history) {
        window.history.scrollRestoration = 'manual'
      }

      // 这里在路由切换后立刻回到页面顶部，避免新页面停在旧页面的滚动位置。
      window.scrollTo({ top: 0, left: 0, behavior: 'auto' })

      // 这里同步清理根节点滚动值，兼容少数浏览器把滚动位置放在 html 或 body 上的情况。
      document.documentElement.scrollTop = 0
      document.body.scrollTop = 0
    } catch {
      // 这里兜底处理极少数无窗口对象或浏览器拒绝滚动的情况，失败时不影响页面正常渲染。
    }
  }, [location.pathname, location.search])

  // 这个组件只负责副作用，不需要渲染任何可见内容。
  return null
}
