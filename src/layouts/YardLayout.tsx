import { Bell, CalendarDays, FileText, Home, Lamp, LogOut, ScrollText, ShieldCheck, UserRound } from 'lucide-react'
import { Link, Navigate, NavLink, Outlet } from 'react-router-dom'
import { BrandMark } from '../components/BrandMark'
import { StatusNotice } from '../components/StatusNotice'
import { WorkbenchFrame } from '../components/WorkbenchFrame'
import { isAdminProfile, useAuth } from '../hooks/useAuth'

// 这个数组保存问云小院导航项，返回值用于桌面侧栏和手机横向导航。
const yardNavItems = [
  { label: '小院总览', path: '/yard', icon: Home },
  { label: '我的资料', path: '/yard/profile', icon: UserRound },
  { label: '我的名帖', path: '/yard/applications', icon: ScrollText },
  { label: '我的云灯', path: '/yard/lanterns', icon: Lamp },
  { label: '我的雅集', path: '/yard/events', icon: CalendarDays },
  { label: '消息提醒', path: '/yard/notifications', icon: Bell }
]

// 这个函数渲染问云小院布局，入参为空，返回值是带登录保护的用户后台框架。
export function YardLayout() {
  // 这里读取当前登录资料和退出函数。
  const { profile, loading, message, signOut } = useAuth()

  // 这里加载中时展示提示，避免页面闪动。
  if (loading) {
    return (
      <main className="min-h-screen bg-[#f6f4ef] p-6">
        <StatusNotice title="正在推开院门" message="请稍候，正在读取问云小院登录状态。" />
      </main>
    )
  }

  // 这里未登录时跳转到问云小院入口。
  if (!profile) {
    return <Navigate to="/login" replace state={{ message: message || '请先登录问云小院。' }} />
  }

  // 这个变量表示当前账号是否拥有后台管理权限，管理员也保留问云小院入口。
  const canManageAdmin = isAdminProfile(profile)

  return (
    <div className="wenyun-shell min-h-screen bg-[#eef3ef] text-[#172b2c]">
      <aside className="yard-sidebar fixed inset-y-0 left-0 hidden w-72 p-5 text-[#f6f4ef] backdrop-blur-xl lg:block">
        <Link className="mb-8 flex items-center gap-3" to="/">
          <BrandMark className="border-[#f8df9d]/45 shadow-lg shadow-[#07171d]/20" size="normal" />
          <div>
            <p className="ink-title text-xl font-bold text-[#fff8e8]">问云小院</p>
            <p className="text-xs text-[#f8df9d]">一方清净，安放来路</p>
          </div>
        </Link>

        <nav className="grid gap-2">
          {yardNavItems.map((item) => {
            const Icon = item.icon

            return (
              <NavLink
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-lg px-4 py-3 text-sm transition ${
                    isActive ? 'bg-[#fff8e8] !text-[#102a31] shadow-md shadow-[#07171d]/16' : 'text-[#f4efe0] hover:bg-white/10'
                  }`
                }
                end={item.path === '/yard'}
                key={item.path}
                to={item.path}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </NavLink>
            )
          })}
        </nav>

        {/* 这里给掌门和执事额外展示管理后台入口，不影响普通同门的小院体验。 */}
        {canManageAdmin ? (
          <Link
            className="mt-4 flex items-center justify-center gap-2 rounded-lg border border-[#b8473f]/18 bg-[#b8473f] px-4 py-3 text-sm text-white shadow-lg shadow-[#b8473f]/20"
            to="/admin"
          >
            <ShieldCheck className="h-4 w-4" />
            进入管理后台
          </Link>
        ) : null}

        <div className="absolute bottom-5 left-5 right-5 grid gap-3">
          <Link className="flex items-center justify-center gap-2 rounded-lg border border-[#f8df9d]/28 bg-white/8 px-4 py-3 text-sm text-[#fff8e8]" to="/">
            <FileText className="h-4 w-4" />
            返回官网
          </Link>
          <button
            className="flex items-center justify-center gap-2 rounded-lg border border-[#b8473f]/18 bg-[#b8473f]/90 px-4 py-3 text-sm text-white"
            onClick={() => void signOut()}
            type="button"
          >
            <LogOut className="h-4 w-4" />
            退出小院
          </button>
        </div>
      </aside>

      <div className="lg:pl-72">
        <header className="yard-topbar sticky top-0 z-30 px-4 py-3 text-[#173332] lg:hidden">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <Link className="flex items-center gap-2" to="/">
                <Home className="h-4 w-4" />
                返回官网
              </Link>
              {canManageAdmin ? (
                <Link className="flex items-center gap-1 text-sm text-[#b8473f]" to="/admin">
                  <ShieldCheck className="h-4 w-4" />
                  后台
                </Link>
              ) : null}
            </div>
            <button className="text-sm text-[#b8473f]" onClick={() => void signOut()} type="button">
              退出
            </button>
          </div>
          <nav className="mt-3 flex gap-2 overflow-x-auto pb-1">
            {yardNavItems.map((item) => (
              <NavLink
                className={({ isActive }) =>
                    `shrink-0 rounded-full px-3 py-2 text-xs font-semibold shadow-sm ${isActive ? 'bg-[#b8473f] !text-white shadow-[#b8473f]/18' : 'bg-white/75 text-[#40524f]'}`
                }
                end={item.path === '/yard'}
                key={item.path}
                to={item.path}
              >
                {item.label}
              </NavLink>
            ))}
            {canManageAdmin ? (
              <NavLink className="shrink-0 rounded-full bg-[#a83b32] px-3 py-2 text-xs text-white" to="/admin">
                管理后台
              </NavLink>
            ) : null}
          </nav>
        </header>

        <main className="mx-auto max-w-[1540px] px-3 py-5 md:px-8 md:py-8">
          <WorkbenchFrame subtitle="桌面端为主，移动端从顶部菜单进入" title="问云小院">
          <Outlet />
          </WorkbenchFrame>
        </main>
      </div>
    </div>
  )
}
