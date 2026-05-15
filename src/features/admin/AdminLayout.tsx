import { NavLink, Navigate, Outlet } from 'react-router-dom'
import { isAdminProfile, useAuthState } from '../../shared/services'
import { TaskButton, TaskSeal } from '../../shared/ui/TaskUi'

// 这个数组保存后台导航入口，入参为空，返回值用于执事任务台侧栏。
const adminNavItems = [
  { label: '任务台', path: '/admin' },
  { label: '名帖审核', path: '/admin/applications' },
  { label: '云灯审核', path: '/admin/lanterns' },
  { label: '山门告示', path: '/admin/announcements' },
  { label: '雅集管理', path: '/admin/events' },
  { label: '执事权限', path: '/admin/stewards' },
  { label: '山门设置', path: '/admin/settings' }
]

// 这个组件展示后台布局，入参为空，返回值是带权限保护的执事任务台。
export function AdminLayout() {
  // 这个状态来自认证服务，用于判断当前用户是否有后台权限。
  const auth = useAuthState()

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
      <div className="work-shell">
        <aside className="work-sidebar">
          <TaskSeal caption="执事任务台" />
          <div className="work-sidebar__panel">
            <strong>执事后台</strong>
            <p>聚合待办、审核、发布与权限维护，让山门运转清楚、留痕、有边界。</p>
          </div>
          <nav className="work-nav" aria-label="执事后台导航">
            {adminNavItems.map((item) => (
              <NavLink end={item.path === '/admin'} key={item.path} to={item.path}>
                {item.label}
              </NavLink>
            ))}
          </nav>
          <TaskButton icon="logOut" onClick={auth.signOut} tone="secondary" type="button">
            退出后台
          </TaskButton>
        </aside>
        <main className="work-main">
          <Outlet />
        </main>
      </div>
      <nav className="work-mobile-dock work-mobile-dock--admin" aria-label="手机执事后台导航">
        {adminNavItems.map((item) => (
          <NavLink end={item.path === '/admin'} key={item.path} to={item.path}>
            {item.label}
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
