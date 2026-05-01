import { BarChart3, FileText, Home, Lamp, LogOut, Megaphone, Settings, ShieldCheck, UserRound, UsersRound } from 'lucide-react'
import { Link, NavLink, Outlet, Navigate } from 'react-router-dom'
import { StatusNotice } from '../components/StatusNotice'
import { WorkbenchFrame } from '../components/WorkbenchFrame'
import { isAdminProfile, useAuth } from '../hooks/useAuth'
import { getPublicAsset } from '../lib/assets'

// 这个数组保存后台导航项，返回值用于侧栏和移动端后台入口。
const adminNavItems = [
  { label: '后台总览', path: '/admin', icon: BarChart3 },
  { label: '名册管理', path: '/admin/applications', icon: ShieldCheck },
  { label: '云灯审核', path: '/admin/lanterns', icon: Lamp },
  { label: '公告管理', path: '/admin/announcements', icon: Megaphone },
  { label: '活动管理', path: '/admin/events', icon: FileText },
  { label: '执事管理', path: '/admin/stewards', icon: UsersRound },
  { label: '站点设置', path: '/admin/settings', icon: Settings }
]

// 这个函数渲染后台管理布局，入参为空，返回值是带权限保护的后台框架。
export function AdminLayout() {
  // 这里读取当前登录和角色信息。
  const { profile, loading, message, signOut } = useAuth()

  // 这里加载中时展示友好提示，避免页面闪烁。
  if (loading) {
    return (
      <main className="min-h-screen bg-[#f6f4ef] p-6">
        <StatusNotice title="正在验明身份" message="请稍候，正在读取登录状态与后台权限。" />
      </main>
    )
  }

  // 这里未登录时跳转登录页，保证后台不会被游客直接进入。
  if (!profile) {
    return <Navigate to="/login" replace state={{ message }} />
  }

  // 这里已登录但不是管理员时进入问云小院，避免普通成员看到管理后台数据。
  if (!isAdminProfile(profile)) {
    return <Navigate to="/yard" replace />
  }

  return (
    <div className="wenyun-shell min-h-screen bg-[#eef3ef] text-[#172b2c]">
      <aside className="workbench-sidebar fixed inset-y-0 left-0 hidden w-72 p-5 text-[#f6f4ef] backdrop-blur-xl lg:block">
        {/* 这里展示后台品牌信息。 */}
        <Link className="mb-8 flex items-center gap-3" to="/">
          <img className="h-12 w-12 rounded-full border border-[#f8df9d]/45 bg-[#fff8e8]/88 object-cover p-0.5 shadow-lg shadow-[#07171d]/20" src={getPublicAsset('wenyun-logo.png')} alt="问云派门派 Logo" />
          <div>
            <p className="ink-title text-xl font-bold text-[#fff8e8]">问云后台</p>
            <p className="text-xs text-[#f8df9d]">护灯、守门、安放归心</p>
          </div>
        </Link>

        {/* 这里展示后台侧栏导航。 */}
        <nav className="grid gap-2">
          {adminNavItems.map((item) => {
            const Icon = item.icon

            return (
              <NavLink
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-xl px-4 py-3 text-sm transition ${
                    isActive ? 'bg-[#fff8e8] !text-[#102a31] shadow-md shadow-[#07171d]/16' : 'text-[#f4efe0] hover:bg-white/10'
                  }`
                }
                end={item.path === '/admin'}
                key={item.path}
                to={item.path}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </NavLink>
            )
          })}
        </nav>

        {/* 这里展示问云小院入口和退出登录按钮，管理员也可以回到自己的用户后台。 */}
        <div className="absolute bottom-5 left-5 right-5 grid gap-3">
          <Link className="flex items-center justify-center gap-2 rounded-xl border border-[#f8df9d]/28 bg-white/8 px-4 py-3 text-sm text-[#fff8e8]" to="/yard">
            <UserRound className="h-4 w-4" />
            返回问云小院
          </Link>
          <button
            className="flex items-center justify-center gap-2 rounded-xl border border-[#f8df9d]/24 bg-[#a83b32]/86 px-4 py-3 text-sm text-white"
            onClick={() => void signOut()}
            type="button"
          >
            <LogOut className="h-4 w-4" />
            退出后台
          </button>
        </div>
      </aside>

      <div className="lg:pl-72">
        {/* 这里展示移动端后台顶部导航。 */}
        <header className="workbench-topbar sticky top-0 z-30 px-4 py-3 text-[#fff8e8] lg:hidden">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <Link className="flex items-center gap-2" to="/">
                <Home className="h-4 w-4" />
                返回官网
              </Link>
              <Link className="flex items-center gap-1 text-sm text-[#f8df9d]" to="/yard">
                <UserRound className="h-4 w-4" />
                小院
              </Link>
            </div>
            <button className="text-sm text-[#f8df9d]" onClick={() => void signOut()} type="button">
              退出
            </button>
          </div>
          <nav className="mt-3 flex gap-2 overflow-x-auto pb-1">
            {adminNavItems.map((item) => (
              <NavLink
                className={({ isActive }) =>
                  `shrink-0 rounded-full px-3 py-2 text-xs font-semibold shadow-sm ${isActive ? 'bg-[#fff8e8] !text-[#102a31] shadow-[#07171d]/18' : 'bg-white/12 text-[#fff8e8]'}`
                }
                end={item.path === '/admin'}
                key={item.path}
                to={item.path}
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        </header>

        {/* 这里放置各个后台页面内容。 */}
        <main className="mx-auto max-w-6xl px-3 py-5 md:px-8 md:py-8">
          <WorkbenchFrame>
          <Outlet />
          </WorkbenchFrame>
        </main>
      </div>
    </div>
  )
}
