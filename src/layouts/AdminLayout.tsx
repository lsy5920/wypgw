import { BarChart3, FileText, Home, Lamp, LogOut, Megaphone, Settings, ShieldCheck, UserRound, UsersRound } from 'lucide-react'
import { Link, Navigate, NavLink, Outlet } from 'react-router-dom'
import { StatusNotice } from '../components/StatusNotice'
import { isAdminProfile, useAuth } from '../hooks/useAuth'

// 这个数组保存后台导航项，入参来自路由路径，返回值用于桌面侧栏和移动端横向导航。
const adminNavItems = [
  { label: '总览', fullLabel: '后台总览', path: '/admin', icon: BarChart3 },
  { label: '名册', fullLabel: '名册管理', path: '/admin/applications', icon: ShieldCheck },
  { label: '云灯', fullLabel: '云灯审核', path: '/admin/lanterns', icon: Lamp },
  { label: '公告', fullLabel: '公告管理', path: '/admin/announcements', icon: Megaphone },
  { label: '活动', fullLabel: '活动管理', path: '/admin/events', icon: FileText },
  { label: '执事', fullLabel: '执事管理', path: '/admin/stewards', icon: UsersRound },
  { label: '设置', fullLabel: '站点设置', path: '/admin/settings', icon: Settings }
]

// 这个函数渲染后台管理布局，入参为空，返回值是带权限保护的国风后台框架。
export function AdminLayout() {
  // 这里读取当前登录资料和退出登录方法，用于后台访问保护与顶部操作。
  const { profile, loading, message, signOut } = useAuth()

  // 这里加载中时展示稳定提示，避免权限状态未确认时页面闪动。
  if (loading) {
    return (
      <main className="min-h-screen bg-[#f7f0df] p-6">
        <StatusNotice title="正在验明身份" message="请稍候，正在读取登录状态与后台权限。" />
      </main>
    )
  }

  // 这里未登录时跳转登录页，保证后台不会被游客直接进入。
  if (!profile) {
    return <Navigate to="/login" replace state={{ message }} />
  }

  // 这里已登录但没有后台身份时跳回问云小院，避免普通成员看到管理数据。
  if (!isAdminProfile(profile)) {
    return <Navigate to="/yard" replace />
  }

  return (
    <div className="admin-reference-app min-h-screen text-[#1f2f2d]">
      {/* 这里绘制桌面端固定深青侧栏，复刻设计稿中每一屏左侧的管理导航。 */}
      <aside className="admin-reference-sidebar">
        <Link className="admin-sidebar-brand" to="/">
          <span aria-hidden="true">问</span>
          <div>
            <strong>问云后台</strong>
            <p>深青执事堂</p>
          </div>
        </Link>

        <nav className="admin-sidebar-nav">
          {adminNavItems.map((item) => {
            // 这里把图标组件取出，方便每一项渲染同样结构。
            const Icon = item.icon

            return (
              <NavLink
                className={({ isActive }) => (isActive ? 'admin-sidebar-link admin-sidebar-link-active' : 'admin-sidebar-link')}
                end={item.path === '/admin'}
                key={item.path}
                to={item.path}
              >
                <Icon className="h-4 w-4" />
                {item.fullLabel}
              </NavLink>
            )
          })}
        </nav>

        <div className="admin-sidebar-footer">
          <Link className="admin-sidebar-ghost" to="/yard">
            <UserRound className="h-4 w-4" />
            返回问云小院
          </Link>
          <button className="admin-sidebar-danger" onClick={() => void signOut()} type="button">
            <LogOut className="h-4 w-4" />
            退出后台
          </button>
        </div>
      </aside>

      <div className="admin-reference-main">
        {/* 这里渲染移动端顶部栏，让窄屏也能完整切换后台页面。 */}
        <header className="admin-mobile-topbar">
          <div className="admin-mobile-topbar-row">
            <Link className="inline-flex items-center gap-2" to="/">
              <Home className="h-4 w-4" />
              官网
            </Link>
            <button onClick={() => void signOut()} type="button">
              退出
            </button>
          </div>
          <nav className="admin-mobile-nav">
            {adminNavItems.map((item) => (
              <NavLink
                className={({ isActive }) => (isActive ? 'admin-mobile-link admin-mobile-link-active' : 'admin-mobile-link')}
                end={item.path === '/admin'}
                key={item.path}
                to={item.path}
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        </header>

        {/* 这里放置后台页面内容，所有页面都重写为设计稿中的宣纸台账风格。 */}
        <main className="admin-reference-canvas">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
