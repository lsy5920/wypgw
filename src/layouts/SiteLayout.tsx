import { Outlet, useLocation } from 'react-router-dom'
import { SiteFooter } from '../components/SiteFooter'
import { SiteHeader } from '../components/SiteHeader'

// 这个函数渲染前台页面布局，入参为空，返回值是带导航、动效和页脚的页面框架。
export function SiteLayout() {
  // 这个变量保存当前路径，页面切换时用于触发淡入动效。
  const location = useLocation()

  return (
    <div className="wenyun-shell min-h-screen overflow-x-hidden pb-20 text-[#263238] md:pb-0">
      {/* 这里给键盘用户提供直达正文的入口，平时隐藏，聚焦时显示。 */}
      <a className="skip-to-content" href="#site-main-content">
        跳到正文
      </a>
      <SiteHeader />
      {/* 这里给每个页面增加轻微淡入上浮动效，让站点更有层次。 */}
      <main className="pt-0" id="site-main-content" key={location.pathname}>
        <Outlet />
      </main>
      <SiteFooter />
    </div>
  )
}
