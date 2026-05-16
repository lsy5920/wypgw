import { NavLink, Navigate, Outlet } from 'react-router-dom'
import { isAdminProfile, useAuthState } from '../../shared/services'
import { TaskButton, TaskLink, TaskSeal } from '../../shared/ui/TaskUi'
import { MobileSlideNav, type MobileSlideNavItem } from '../../shared/ui/MobileSlideNav'

// 这个数组保存后台导航入口，入参为空，返回值用于执事任务台侧栏和手机滑出导航。
const adminNavItems = [
  { label: '任务台', path: '/admin', hint: '今日总览' },
  { label: '名帖审核', path: '/admin/applications', hint: '名册控制' },
  { label: '云灯审核', path: '/admin/lanterns', hint: '公开筛选' },
  { label: '山门告示', path: '/admin/announcements', hint: '公告发布' },
  { label: '雅集管理', path: '/admin/events', hint: '活动维护' },
  { label: '执事权限', path: '/admin/stewards', hint: '身份授权' },
  { label: '山门设置', path: '/admin/settings', hint: '二维码配置' }
]

// 这个组件展示后台布局，入参为空，返回值是带权限保护的执事任务台。
export function AdminLayout() {
  // 这个状态来自认证服务，用于判断当前用户是否有后台权限。
  const auth = useAuthState()
  // 这个数组整理手机后台入口，返回值用于右侧滑出菜单。
  const mobileAdminNavItems: MobileSlideNavItem[] = adminNavItems.map((item) => ({ ...item, end: item.path === '/admin' }))

  if (auth.loading) {
    return <div className="page-shell page-stack">正在核对执事身份...</div>
  }

  if (!auth.profile) {
    return <Navigate replace to="/login" />
  }

  if (!isAdminProfile(auth.profile)) {
    return <Navigate replace to="/yard" />
  }

  return (
    <div className="work-layout work-layout--admin">
      <div className="work-ambient" aria-hidden="true" />
      <div className="work-shell">
        <aside className="work-sidebar">
          <div className="work-sidebar__brand">
            <TaskSeal caption="执事任务台" />
            <span>后台</span>
          </div>
          <div className="work-sidebar__panel work-sidebar__panel--featured">
            <small>当前执事</small>
            <strong>{auth.profile.nickname}</strong>
            <p>名册、云灯、告示、雅集和权限集中处理，所有入口按高频事务排列。</p>
          </div>
          <nav className="work-nav" aria-label="执事后台导航">
            {adminNavItems.map((item) => (
              <NavLink end={item.path === '/admin'} key={item.path} to={item.path}>
                <span>{item.label}</span>
                <small>{item.hint}</small>
              </NavLink>
            ))}
          </nav>
          <div className="work-sidebar__quick">
            <TaskLink to="/yard" tone="quiet" icon="home">
              去小院
            </TaskLink>
            <TaskLink to="/admin/settings" tone="primary" icon="sliders">
              设置
            </TaskLink>
          </div>
          <TaskButton className="work-sidebar__exit" icon="logOut" onClick={auth.signOut} tone="secondary" type="button">
            退出后台
          </TaskButton>
        </aside>
        <main className="work-main">
          <section className="work-mobile-identity work-mobile-identity--admin" aria-label="手机后台身份">
            <div>
              <span>执事后台</span>
              <strong>{auth.profile.nickname}</strong>
            </div>
            <TaskLink to="/yard" tone="quiet" icon="home">
              小院
            </TaskLink>
          </section>
          <Outlet />
        </main>
      </div>
      <MobileSlideNav ariaLabel="手机执事后台导航" description="审核、名册和设置入口" items={mobileAdminNavItems} title="执事后台" variant="admin" />
    </div>
  )
}
