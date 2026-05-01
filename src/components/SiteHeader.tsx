import { Menu, UserRound, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { siteNavItems } from '../data/siteContent'
import { getPublicAsset } from '../lib/assets'

// 这个函数渲染官网顶部导航，入参为空，返回值是桌面和手机共用的导航栏。
export function SiteHeader() {
  // 这个状态控制手机菜单是否展开。
  const [open, setOpen] = useState(false)

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

  // 这个函数用于关闭手机菜单，入参为空，返回值为空。
  const closeMenu = () => setOpen(false)

  return (
    <header className="fixed inset-x-3 top-3 z-40 pointer-events-none md:top-5">
      <div className="pointer-events-auto mx-auto flex h-[4.5rem] max-w-7xl items-center justify-between rounded-[2rem] border border-[#c9a45c]/28 bg-[#fffaf0]/88 px-4 shadow-2xl shadow-[#143044]/16 backdrop-blur-2xl md:h-20 md:px-6">
        {/* 这里展示门派正式 Logo 和站点名称。 */}
        <Link className="flex items-center gap-3" to="/" onClick={closeMenu}>
          <img className="h-12 w-12 rounded-full border border-[#c9a45c]/35 bg-white object-cover p-0.5 shadow-md md:h-14 md:w-14" src={getPublicAsset('wenyun-logo.png')} alt="问云派门派 Logo" />
          <div>
            <p className="ink-title text-2xl font-bold leading-none text-[#143044]">问云派</p>
            <p className="mt-1 text-xs tracking-[0.18em] text-[#7a6a48]">乱世问云 心有所栖</p>
          </div>
        </Link>

        {/* 这里展示桌面端导航，手机端会隐藏。 */}
        <nav className="hidden items-center gap-1 lg:flex">
          {siteNavItems.map((item) => (
            <NavLink
              className={({ isActive }) =>
                `rounded-full px-3 py-2 text-sm font-semibold transition ${
                  isActive ? 'bg-[#143044] !text-white shadow-md shadow-[#143044]/12' : 'text-[#263238] hover:bg-white/75'
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
          <Link className="hidden items-center gap-2 rounded-full border border-[#c9a45c]/50 bg-white/50 px-4 py-2 text-sm font-semibold text-[#143044] transition hover:-translate-y-0.5 hover:bg-white md:inline-flex" to="/yard">
            <UserRound className="h-4 w-4" />
            问云小院
          </Link>
          <button
            aria-label={open ? '关闭菜单' : '打开菜单'}
            className="focus-ring rounded-full border border-[#6f8f8b]/30 bg-white/75 p-3 shadow-md shadow-[#143044]/8 lg:hidden"
            onClick={() => setOpen((value) => !value)}
            type="button"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* 这里展示手机端展开菜单。 */}
      {open ? (
        <div className="pointer-events-auto mx-auto mt-3 max-w-7xl rounded-[1.75rem] border border-[#c9a45c]/28 bg-[#fffaf0]/96 px-4 pb-4 shadow-2xl shadow-[#143044]/18 backdrop-blur-2xl lg:hidden">
          <nav className="grid gap-2 pt-3 sm:grid-cols-2">
            {siteNavItems.map((item) => (
              <NavLink
                className={({ isActive }) =>
                  `rounded-2xl px-4 py-3 text-sm font-semibold ${
                    isActive ? 'bg-[#143044] !text-white shadow-md shadow-[#143044]/16' : 'bg-white/80 text-[#263238]'
                  }`
                }
                key={item.path}
                onClick={closeMenu}
                to={item.path}
              >
                {item.label}
              </NavLink>
            ))}
            <NavLink className="rounded-2xl bg-[#9e3d32] px-4 py-3 text-sm font-semibold text-white sm:col-span-2" onClick={closeMenu} to="/yard">
              问云小院
            </NavLink>
          </nav>
        </div>
      ) : null}
    </header>
  )
}
