import { BarChart3, FileText, Home, Lamp, LogOut, Megaphone, Settings, ShieldCheck } from 'lucide-react'
import { Link, NavLink, Outlet, Navigate } from 'react-router-dom'
import { StatusNotice } from '../components/StatusNotice'
import { isAdminProfile, useAuth } from '../hooks/useAuth'
import { getPublicAsset } from '../lib/assets'

// 这个数组保存后台导航项，返回值用于侧栏和移动端后台入口。
const adminNavItems = [
  { label: '后台总览', path: '/admin', icon: BarChart3 },
  { label: '入派审核', path: '/admin/applications', icon: ShieldCheck },
  { label: '云灯审核', path: '/admin/lanterns', icon: Lamp },
  { label: '公告管理', path: '/admin/announcements', icon: Megaphone },
  { label: '活动管理', path: '/admin/events', icon: FileText },
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

  // 这里已登录但不是管理员时展示拒绝访问，避免普通成员看到后台数据。
  if (!isAdminProfile(profile)) {
    return (
      <main className="min-h-screen bg-[#f6f4ef] p-6">
        <div className="mx-auto max-w-2xl">
          <StatusNotice
            type="error"
            title="尚无后台权限"
            message="当前账号已登录，但 profiles.role 不是 admin 或 founder。请在 Supabase SQL 中手动指定管理员身份。"
          />
          <Link className="mt-6 inline-flex rounded-full bg-[#6f8f8b] px-5 py-3 text-white" to="/">
            返回官网
          </Link>
        </div>
      </main>
    )
  }

  return (
    <div className="min-h-screen bg-[#eef3ef] text-[#263238]">
      <aside className="fixed inset-y-0 left-0 hidden w-72 border-r border-[#6f8f8b]/20 bg-[#fffaf0]/95 p-5 lg:block">
        {/* 这里展示后台品牌信息。 */}
        <Link className="mb-8 flex items-center gap-3" to="/">
          <img className="h-12 w-12 rounded-full object-cover" src={getPublicAsset('wenyun-logo.png')} alt="问云派门派 Logo" />
          <div>
            <p className="ink-title text-xl font-bold">问云后台</p>
            <p className="text-xs text-[#7a6a48]">护灯、守门、安放归心</p>
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
                    isActive ? 'bg-[#6f8f8b] text-white' : 'text-[#526461] hover:bg-white'
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

        {/* 这里展示退出登录按钮。 */}
        <button
          className="absolute bottom-5 left-5 right-5 flex items-center justify-center gap-2 rounded-xl border border-[#9e3d32]/30 px-4 py-3 text-sm text-[#9e3d32]"
          onClick={() => void signOut()}
          type="button"
        >
          <LogOut className="h-4 w-4" />
          退出后台
        </button>
      </aside>

      <div className="lg:pl-72">
        {/* 这里展示移动端后台顶部导航。 */}
        <header className="sticky top-0 z-30 border-b border-[#6f8f8b]/20 bg-[#fffaf0]/92 px-4 py-3 backdrop-blur lg:hidden">
          <div className="flex items-center justify-between">
            <Link className="flex items-center gap-2" to="/">
              <Home className="h-4 w-4" />
              返回官网
            </Link>
            <button className="text-sm text-[#9e3d32]" onClick={() => void signOut()} type="button">
              退出
            </button>
          </div>
          <nav className="mt-3 flex gap-2 overflow-x-auto pb-1">
            {adminNavItems.map((item) => (
              <NavLink
                className={({ isActive }) =>
                  `shrink-0 rounded-full px-3 py-2 text-xs ${isActive ? 'bg-[#6f8f8b] text-white' : 'bg-white text-[#526461]'}`
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
        <main className="mx-auto max-w-6xl px-4 py-6 md:px-8 md:py-10">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
