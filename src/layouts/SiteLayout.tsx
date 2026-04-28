import { Outlet, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { MobileBottomNav } from '../components/MobileBottomNav'
import { SiteFooter } from '../components/SiteFooter'
import { SiteHeader } from '../components/SiteHeader'

// 这个函数渲染前台页面布局，入参为空，返回值是带导航、动效和页脚的页面框架。
export function SiteLayout() {
  // 这个变量保存当前路径，页面切换时用于触发淡入动效。
  const location = useLocation()

  return (
    <div className="min-h-screen overflow-x-hidden text-[#263238]">
      <SiteHeader />
      {/* 这里给每个页面增加轻微淡入上浮动效，让站点更有层次。 */}
      <motion.main
        animate={{ opacity: 1, y: 0 }}
        className="pt-24 md:pt-28"
        initial={{ opacity: 0, y: 12 }}
        key={location.pathname}
        transition={{ duration: 0.42, ease: 'easeOut' }}
      >
        <Outlet />
      </motion.main>
      <SiteFooter />
      <MobileBottomNav />
    </div>
  )
}
