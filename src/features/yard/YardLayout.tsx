import { NavLink, Navigate, Outlet } from 'react-router-dom'
import { TaskButton, TaskLink, TaskSeal, brandLogoPath } from '../../shared/ui/TaskUi'
import { isAdminProfile, useAuthState } from '../../shared/services'
import { MobileSlideNav, type MobileSlideNavItem } from '../../shared/ui/MobileSlideNav'

// 这个数组保存小院导航入口，入参为空，返回值用于侧栏和手机滑出导航。
const yardNavItems = [
  { label: '任务册', path: '/yard', hint: '今日进度' },
  { label: '我的资料', path: '/yard/profile', hint: '头像与名册' },
  { label: '我的名帖', path: '/yard/applications', hint: '递帖状态' },
  { label: '我的云灯', path: '/yard/lanterns', hint: '灯上留言' },
  { label: '问云雅集', path: '/yard/events', hint: '活动报名' },
  { label: '小院提醒', path: '/yard/notifications', hint: '消息回音' }
]

// 这个组件展示问云小院布局，入参为空，返回值是带权限保护的小院页面壳。
export function YardLayout() {
  // 这个状态来自认证服务，用于判断是否允许进入小院。
  const auth = useAuthState()
  // 这个变量判断当前账号是否有后台权限，返回值用于展示执事入口。
  const canEnterAdmin = isAdminProfile(auth.profile)
  // 这个数组整理手机导航入口，返回值用于右侧滑出菜单。
  const mobileYardNavItems: MobileSlideNavItem[] = [
    ...(canEnterAdmin ? [{ label: '执事后台', path: '/admin' }] : []),
    ...yardNavItems.map((item) => ({ ...item, end: item.path === '/yard' }))
  ]

  if (auth.loading) {
    return <div className="page-shell page-stack">正在打开问云小院...</div>
  }

  if (!auth.profile) {
    return <Navigate replace to="/login" />
  }

  return (
    <div className="work-layout work-layout--yard">
      <div className="work-ambient" aria-hidden="true" />
      <div className="work-shell">
        <aside className="work-sidebar">
          <div className="work-sidebar__brand">
            <TaskSeal caption="我的任务册" />
            <span>小院</span>
          </div>
          <div className="work-sidebar__panel work-sidebar__panel--featured">
            <small>当前同门</small>
            <strong>{auth.profile.nickname}</strong>
            <p>名帖、云灯、雅集与提醒都收在这里，常用入口已按日常动线排列。</p>
          </div>
          <nav className="work-nav" aria-label="问云小院导航">
            {yardNavItems.map((item) => (
              <NavLink end={item.path === '/yard'} key={item.path} to={item.path}>
                <span>{item.label}</span>
                <small>{item.hint}</small>
              </NavLink>
            ))}
          </nav>
          <div className="work-sidebar__quick">
            <TaskLink to="/" tone="quiet" icon="home">
              回山门
            </TaskLink>
            {canEnterAdmin ? (
              <TaskLink to="/admin" tone="primary" icon="shieldCheck">
                执事后台
              </TaskLink>
            ) : null}
          </div>
          <TaskButton className="work-sidebar__exit" icon="logOut" onClick={auth.signOut} tone="secondary" type="button">
            退出小院
          </TaskButton>
        </aside>
        <main className="work-main">
          <section className="work-mobile-identity" aria-label="手机小院身份">
            <div className="work-mobile-identity__brand">
              <img alt="" src={brandLogoPath} />
              <div>
                <span>问云小院</span>
                <strong>{auth.profile.nickname}</strong>
              </div>
            </div>
            {canEnterAdmin ? (
              <TaskLink to="/admin" tone="primary" icon="shieldCheck">
                后台
              </TaskLink>
            ) : (
              <TaskLink to="/" tone="quiet" icon="home">
                山门
              </TaskLink>
            )}
          </section>
          <Outlet />
        </main>
      </div>
      <MobileSlideNav ariaLabel="手机问云小院导航" description="常用入口右侧展开" items={mobileYardNavItems} title="问云小院" variant="yard" />
    </div>
  )
}
