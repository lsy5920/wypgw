import { Menu, UserRound, X } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { siteNavItems } from '../data/siteContent'
import { BrandMark } from './BrandMark'

// 这个函数渲染官网顶部导航，入参为空，返回值是桌面和手机共用的导航栏。
export function SiteHeader() {
  // 这个状态控制手机菜单是否展开。
  const [open, setOpen] = useState(false)
  // 这个状态记录页面是否已经向下滚动，用于让导航在阅读中更凝练。
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    // 这个函数根据滚动位置更新导航质感，入参为空，返回值为空。
    function handleScroll() {
      try {
        // 这里读取滚动距离，滚动后让导航背景更实，方便阅读。
        setScrolled(window.scrollY > 24)
      } catch {
        // 这里兜底处理少数浏览器读取滚动失败的情况，失败时保持默认导航样式。
        setScrolled(false)
      }
    }

    handleScroll()
    window.addEventListener('scroll', handleScroll, { passive: true })

    // 这里移除滚动监听，避免页面卸载后继续占用资源。
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // 这个函数用于关闭手机菜单，入参为空，返回值为空。
  const closeMenu = () => setOpen(false)
  // 这个变量保存导航主容器质感，返回值用于滚动前后平滑切换。
  const headerSurfaceClass = scrolled
    ? 'border-[#173332]/12 bg-white/90 shadow-[#173332]/16'
    : 'border-white/22 bg-white/72 shadow-[#173332]/10'

  return (
    <header className="pointer-events-none fixed inset-x-3 top-3 z-40 md:top-5">
      <motion.div
        animate={{ y: 0, opacity: 1 }}
        className={`site-header-bar site-header-shell pointer-events-auto relative mx-auto flex h-16 max-w-7xl items-center justify-between rounded-lg border px-3 shadow-xl backdrop-blur-2xl transition duration-300 md:h-[4.5rem] md:px-4 ${headerSurfaceClass}`}
        initial={{ y: -18, opacity: 0 }}
        transition={{ duration: 0.48, ease: 'easeOut' }}
      >
        {/* 这里展示门派正式 Logo 和站点名称。 */}
        <Link className="flex min-w-0 items-center gap-3" to="/" onClick={closeMenu}>
          <BrandMark className="shadow-[#173332]/10" size="normal" />
          <div className="min-w-0">
            <p className="ink-title truncate text-2xl font-bold leading-none text-[#173332]">问云派</p>
            <p className="mt-1 hidden text-xs text-[#7b6b4a] sm:block">乱世问云 心有所栖</p>
          </div>
        </Link>

        {/* 这里把手机菜单按钮固定推到右侧，避免 785 宽度下按钮偏向中间。 */}
        <button
          aria-expanded={open}
          aria-label={open ? '关闭菜单' : '打开菜单'}
          className="mobile-menu-button-inline focus-ring ml-auto items-center justify-center rounded-lg border border-[#0f3d3e]/16 bg-white/84 p-3 text-[#173332] shadow-md shadow-[#173332]/10"
          onClick={() => setOpen((value) => !value)}
          type="button"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>

        {/* 这里展示桌面端导航，较窄屏幕会切换为菜单按钮。 */}
        <nav className="hidden min-w-0 items-center gap-1 xl:flex">
          {siteNavItems.map((item) => (
            <NavLink
              className={({ isActive }) =>
                `rounded-lg px-2.5 py-2 text-xs font-semibold transition ${
                  isActive ? 'bg-[#173332] !text-white shadow-md shadow-[#173332]/16' : '!text-[#173332] hover:bg-[#e4f0eb]'
                }`
              }
              key={item.path}
              to={item.path}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* 这里展示桌面端小院入口，手机端改由右侧菜单承接。 */}
        <div className="flex shrink-0 items-center gap-2">
          <Link
            className="cloud-button hidden items-center gap-2 rounded-lg border border-[#0f3d3e]/16 bg-[#173332] px-4 py-2 text-sm font-semibold !text-white shadow-md shadow-[#173332]/14 transition hover:-translate-y-0.5 hover:bg-[#0f3d3e] xl:inline-flex"
            to="/yard"
          >
            <UserRound className="h-4 w-4" />
            问云小院
          </Link>
        </div>
      </motion.div>

      {/* 这里展示手机和平板端展开菜单。 */}
      <AnimatePresence>
        {open ? (
          <motion.div
            animate={{ opacity: 1, y: 0, scale: 1 }}
            className="pointer-events-auto mx-auto mt-3 max-w-7xl rounded-lg border border-[#173332]/12 bg-white/94 px-3 pb-3 shadow-xl shadow-[#173332]/16 backdrop-blur-2xl xl:hidden"
            exit={{ opacity: 0, y: -10, scale: 0.98 }}
            initial={{ opacity: 0, y: -10, scale: 0.98 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
          >
            <nav className="grid grid-cols-2 auto-rows-fr gap-2 pt-3 md:grid-cols-3">
              {siteNavItems.map((item) => (
                <NavLink
                  className={({ isActive }) =>
                    `flex min-h-12 items-center justify-center rounded-lg border px-3 py-3 text-center text-sm font-semibold leading-5 shadow-sm shadow-[#173332]/6 transition ${
                      isActive
                        ? 'border-[#173332]/18 bg-[#173332] text-white'
                        : 'border-[#0f3d3e]/12 bg-[#edf4ef] text-[#173332] hover:bg-white'
                    }`
                  }
                  key={item.path}
                  onClick={closeMenu}
                  to={item.path}
                >
                  {item.label}
                </NavLink>
              ))}
              <NavLink
                className={({ isActive }) =>
                  `flex min-h-12 items-center justify-center rounded-lg border px-3 py-3 text-center text-sm font-semibold leading-5 shadow-sm shadow-[#173332]/6 transition ${
                    isActive ? 'border-[#b8473f]/22 bg-[#7f3347] text-white' : 'border-[#b8473f]/18 bg-[#b8473f] text-white hover:bg-[#9e3a3f]'
                  }`
                }
                onClick={closeMenu}
                to="/yard"
              >
                问云小院
              </NavLink>
            </nav>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </header>
  )
}
