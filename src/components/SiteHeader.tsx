import { Menu, UserRound, X } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { siteNavItems } from '../data/siteContent'
import { getPublicAsset } from '../lib/assets'

// 这个函数渲染官网顶部导航，入参为空，返回值是桌面和手机共用的导航栏。
export function SiteHeader() {
  // 这个状态控制手机菜单是否展开。
  const [open, setOpen] = useState(false)
  // 这个状态记录页面是否已经向下滚动，用于让导航在阅读中更凝练。
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    // 这里在手机端首次打开官网时自动展开菜单，让新用户知道导航入口在哪里。
    const isMobile = typeof window !== 'undefined' && window.matchMedia('(max-width: 1023px)').matches

    if (!isMobile) {
      return undefined
    }

    setOpen(true)

    // 这里两秒后自动收回菜单，避免遮挡首屏内容。
    const timer = window.setTimeout(() => {
      setOpen(false)
    }, 2000)

    // 这里清理定时器，避免页面切换时继续执行。
    return () => window.clearTimeout(timer)
  }, [])

  useEffect(() => {
    // 这个函数根据滚动位置更新导航质感，入参为空，返回值为空。
    function handleScroll() {
      setScrolled(window.scrollY > 24)
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
    ? 'border-[#f8df9d]/28 bg-[#07171d]/88 shadow-[#07171d]/32'
    : 'border-[#f8df9d]/32 bg-[#07171d]/62 shadow-[#07171d]/22'

  return (
    <header className="fixed inset-x-3 top-3 z-40 pointer-events-none md:top-5">
      <motion.div
        animate={{ y: 0, opacity: 1 }}
        className={`pointer-events-auto mx-auto flex h-[4.5rem] max-w-7xl items-center justify-between rounded-[2rem] border px-4 shadow-2xl backdrop-blur-2xl transition duration-300 md:h-20 md:px-6 ${headerSurfaceClass}`}
        initial={{ y: -18, opacity: 0 }}
        transition={{ duration: 0.48, ease: 'easeOut' }}
      >
        {/* 这里展示门派正式 Logo 和站点名称。 */}
        <Link className="flex items-center gap-3" to="/" onClick={closeMenu}>
          <img className="h-12 w-12 rounded-full border border-[#f8df9d]/55 bg-[#fff8e8]/92 object-cover p-0.5 shadow-md shadow-[#07171d]/18 md:h-14 md:w-14" src={getPublicAsset('wenyun-logo.png')} alt="问云派门派 Logo" />
          <div>
            <p className="ink-title text-2xl font-bold leading-none text-[#fff8e8] drop-shadow">问云派</p>
            <p className="mt-1 text-xs text-[#f8df9d]">乱世问云 心有所栖</p>
          </div>
        </Link>

        {/* 这里展示桌面端导航，手机端会隐藏。 */}
        <nav className="hidden items-center gap-1 lg:flex">
          {siteNavItems.map((item) => (
            <NavLink
              className={({ isActive }) =>
                `rounded-full px-3 py-2 text-sm font-semibold transition ${
                  isActive ? 'bg-[#fff8e8] !text-[#102a31] shadow-md shadow-[#07171d]/16' : '!text-[#f6f4ef] hover:bg-white/12'
                }`
              }
              key={item.path}
              to={item.path}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* 这里展示后台入口和手机菜单按钮。 */}
        <div className="flex items-center gap-2">
          <Link className="cloud-button hidden items-center gap-2 rounded-full border border-[#f8df9d]/42 bg-[#fff8e8]/12 px-4 py-2 text-sm font-semibold !text-[#fff8e8] transition hover:-translate-y-0.5 hover:bg-[#fff8e8]/20 md:inline-flex" to="/yard">
            <UserRound className="h-4 w-4" />
            问云小院
          </Link>
          <button
            aria-label={open ? '关闭菜单' : '打开菜单'}
            className="focus-ring rounded-full border border-[#f8df9d]/35 bg-[#fff8e8]/12 p-3 text-[#fff8e8] shadow-md shadow-[#07171d]/18 lg:hidden"
            onClick={() => setOpen((value) => !value)}
            type="button"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </motion.div>

      {/* 这里展示手机端展开菜单。 */}
      <AnimatePresence>
        {open ? (
          <motion.div
            animate={{ opacity: 1, y: 0, scale: 1 }}
            className="pointer-events-auto mx-auto mt-3 max-w-7xl rounded-[1.75rem] border border-[#f8df9d]/32 bg-[#07171d]/94 px-4 pb-4 shadow-2xl shadow-[#07171d]/26 backdrop-blur-2xl lg:hidden"
            exit={{ opacity: 0, y: -10, scale: 0.98 }}
            initial={{ opacity: 0, y: -10, scale: 0.98 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
          >
            <nav className="grid grid-cols-2 auto-rows-fr gap-2 pt-3">
              {siteNavItems.map((item) => (
                <NavLink
                  className={({ isActive }) =>
                    `flex min-h-12 items-center justify-center rounded-2xl border px-3 py-3 text-center text-base font-semibold leading-5 shadow-md shadow-[#07171d]/10 transition ${
                      isActive
                        ? 'border-[#f8df9d]/70 bg-[#fff8e8] text-[#102a31]'
                        : 'border-[#d6aa54]/28 bg-[#fff8e8]/96 text-[#102a31] hover:bg-white'
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
                  `flex min-h-12 items-center justify-center rounded-2xl border px-3 py-3 text-center text-base font-semibold leading-5 shadow-md shadow-[#07171d]/10 transition ${
                    isActive
                      ? 'border-[#f8df9d]/70 bg-[#fff8e8] text-[#102a31]'
                      : 'border-[#d6aa54]/22 bg-[#a83b32] text-white hover:bg-[#8f312b]'
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
