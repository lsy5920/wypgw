import { NavLink, Navigate, Outlet } from 'react-router-dom'
import { TaskButton, TaskLink, TaskSeal } from '../../shared/ui/TaskUi'
import { isAdminProfile, useAuthState } from '../../shared/services'

// 这个数组保存小院导航入口，入参为空，返回值用于侧栏和手机横向导航。
const yardNavItems = [
  { label: '任务册', path: '/yard' },
  { label: '我的资料', path: '/yard/profile' },
  { label: '我的名帖', path: '/yard/applications' },
  { label: '我的云灯', path: '/yard/lanterns' },
  { label: '问云雅集', path: '/yard/events' },
  { label: '小院提醒', path: '/yard/notifications' }
]

// 这个组件展示问云小院布局，入参为空，返回值是带权限保护的小院页面壳。
export function YardLayout() {
  // 这个状态来自认证服务，用于判断是否允许进入小院。
  const auth = useAuthState()
  // 这个变量判断当前账号是否有后台权限，返回值用于展示执事入口。
  const canEnterAdmin = isAdminProfile(auth.profile)

  if (auth.loading) {
    return <div className="page-shell page-stack">正在打开问云小院...</div>
  }

  if (!auth.profile) {
    return <Navigate replace to="/login" />
  }

  return (
    <div className="work-layout work-layout--yard">
      <div className="work-shell">
        <aside className="work-sidebar">
          <TaskSeal caption="我的任务册" />
          <div className="work-sidebar__panel">
            <strong>问云小院</strong>
            <p>这里记录你的名帖、云灯、雅集与山门提醒。每一项都可回看，也可慢慢维护。</p>
            {canEnterAdmin ? (
              <TaskLink to="/admin" tone="primary" icon="shieldCheck">
                前往执事后台
              </TaskLink>
            ) : null}
          </div>
          <nav className="work-nav" aria-label="问云小院导航">
            {yardNavItems.map((item) => (
              <NavLink end={item.path === '/yard'} key={item.path} to={item.path}>
                {item.label}
              </NavLink>
            ))}
          </nav>
          <TaskButton icon="logOut" onClick={auth.signOut} tone="secondary" type="button">
            退出小院
          </TaskButton>
        </aside>
        <main className="work-main">
          <Outlet />
        </main>
      </div>
      <nav className="work-mobile-dock" aria-label="手机官网小院导航">
        {canEnterAdmin ? (
          <NavLink to="/admin">
            执事后台
          </NavLink>
        ) : null}
        {yardNavItems.map((item) => (
          <NavLink end={item.path === '/yard'} key={item.path} to={item.path}>
            {item.label}
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
