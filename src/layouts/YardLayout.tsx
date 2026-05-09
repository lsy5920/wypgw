import {
  Bell,
  CalendarDays,
  FileText,
  Home,
  Lamp,
  LogOut,
  Menu,
  ScrollText,
  ShieldCheck,
  UserRound,
  X
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, Navigate, NavLink, Outlet, useLocation } from 'react-router-dom'
import { BrandMark } from '../components/BrandMark'
import { StatusNotice } from '../components/StatusNotice'
import { isAdminProfile, useAuth } from '../hooks/useAuth'

// 这个数组保存问云小院导航项，返回值用于桌面侧栏和手机抽屉菜单。
const yardNavItems = [
  { label: '小院总览', path: '/yard', icon: Home },
  { label: '我的资料', path: '/yard/profile', icon: UserRound },
  { label: '我的名帖', path: '/yard/applications', icon: ScrollText },
  { label: '我的云灯', path: '/yard/lanterns', icon: Lamp },
  { label: '我的雅集', path: '/yard/events', icon: CalendarDays },
  { label: '消息提醒', path: '/yard/notifications', icon: Bell }
]

// 这个函数渲染一组小院导航链接，入参是是否为手机抽屉，返回值是可复用导航节点。
function renderYardNavItems(isDrawer = false) {
  return yardNavItems.map((item) => {
    const Icon = item.icon

    return (
      <NavLink
        className={({ isActive }) => `yard-reference-nav-link ${isActive ? 'yard-reference-nav-link-active' : ''}`}
        end={item.path === '/yard'}
        key={`${isDrawer ? 'drawer' : 'desktop'}-${item.path}`}
        to={item.path}
      >
        <Icon className="h-4 w-4" />
        <span>{item.label}</span>
      </NavLink>
    )
  })
}

// 这个函数渲染问云小院布局，入参为空，返回值是带登录保护的用户后台框架。
export function YardLayout() {
  // 这里读取当前登录资料和退出函数。
  const { profile, loading, message, signOut } = useAuth()
  // 这里读取当前路由，用于手机端切换页面后自动收起抽屉。
  const location = useLocation()
  // 这个状态保存手机侧栏是否展开。
  const [drawerOpen, setDrawerOpen] = useState(false)

  useEffect(() => {
    // 这里每次路由变化都收起手机抽屉，避免新页面被菜单遮住。
    setDrawerOpen(false)
  }, [location.pathname])

  // 这里加载中时展示提示，避免页面闪动。
  if (loading) {
    return (
      <main className="min-h-screen bg-[#f7f0df] p-6">
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
    <div className="yard-reference-shell">
      {/* 这里复刻设计稿里的桌面端深青固定侧栏，承载小院所有页面入口。 */}
      <aside className="yard-reference-sidebar" aria-label="问云小院导航">
        <Link className="yard-reference-brand" to="/">
          <BrandMark className="yard-reference-brand-mark" size="normal" />
          <strong>问云小院</strong>
        </Link>

        <nav className="yard-reference-nav">{renderYardNavItems()}</nav>

        {canManageAdmin ? (
          <Link className="yard-reference-admin-link" to="/admin">
            <ShieldCheck className="h-4 w-4" />
            <span>管理后台</span>
          </Link>
        ) : null}

        <div className="yard-reference-sidebar-foot">
          <Link className="yard-reference-foot-link" to="/">
            <FileText className="h-4 w-4" />
            <span>返回官网</span>
          </Link>
          <button className="yard-reference-foot-link" onClick={() => void signOut()} type="button">
            <LogOut className="h-4 w-4" />
            <span>退出登录</span>
          </button>
        </div>
      </aside>

      {/* 这里是手机端顶部菜单按钮，点击后展开与桌面一致的侧栏入口。 */}
      <button
        aria-label={drawerOpen ? '收起小院菜单' : '展开小院菜单'}
        className="yard-mobile-menu-button"
        onClick={() => setDrawerOpen((current) => !current)}
        type="button"
      >
        {drawerOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      {/* 这里是手机端抽屉遮罩，点击空白处可以收起侧栏。 */}
      {drawerOpen ? <button aria-label="关闭小院菜单" className="yard-mobile-drawer-mask" onClick={() => setDrawerOpen(false)} type="button" /> : null}

      {/* 这里是手机端抽屉导航，保持与桌面侧栏同一套入口。 */}
      <aside className={`yard-mobile-drawer ${drawerOpen ? 'yard-mobile-drawer-open' : ''}`} aria-label="问云小院手机导航">
        <Link className="yard-reference-brand" to="/">
          <BrandMark className="yard-reference-brand-mark" size="normal" />
          <strong>问云小院</strong>
        </Link>
        <nav className="yard-reference-nav">{renderYardNavItems(true)}</nav>
        {canManageAdmin ? (
          <Link className="yard-reference-admin-link" to="/admin">
            <ShieldCheck className="h-4 w-4" />
            <span>管理后台</span>
          </Link>
        ) : null}
        <button className="yard-reference-foot-link" onClick={() => void signOut()} type="button">
          <LogOut className="h-4 w-4" />
          <span>退出登录</span>
        </button>
      </aside>

      <div className="yard-reference-main">
        <section className="yard-reference-stage">
          {/* 这里复刻设计稿里的浅色顶部条，放置菜单、提醒和当前账号。 */}
          <header className="yard-reference-topbar">
            <div className="yard-reference-topbar-left">
              <span aria-hidden="true" className="yard-reference-topbar-icon">
                <Menu className="h-4 w-4" />
              </span>
              <span>问云小院</span>
            </div>
            <div className="yard-reference-topbar-right">
              <span aria-hidden="true" className="yard-reference-topbar-icon yard-reference-bell-dot">
                <Bell className="h-4 w-4" />
              </span>
              <span className="yard-reference-avatar">
                {profile.avatar_url ? <img alt="" src={profile.avatar_url} /> : <UserRound className="h-4 w-4" />}
              </span>
              <span className="yard-reference-account">{profile.nickname}</span>
            </div>
          </header>

          {/* 这里承载六个小院页面的真实内容，页面内部只关注自身业务与视觉卡片。 */}
          <main className="yard-reference-content">
            <Outlet />
          </main>
        </section>
      </div>
    </div>
  )
}
