import { HashRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AdminLayout } from '../features/admin/AdminLayout'
import {
  AdminAnnouncementsPage,
  AdminApplicationsPage,
  AdminDashboardPage,
  AdminEventsPage,
  AdminLanternsPage,
  AdminSettingsPage,
  AdminStewardsPage
} from '../features/admin/AdminPages'
import { CloudLanternPage, JoinPage, LoginPage, WenxinQuizPage } from '../features/public/PublicActionPages'
import { AboutPage, AnnouncementsPage, CanonPage, ContactPage, EventsPage, HomePage, NotFoundPage } from '../features/public/PublicDisplayPages'
import { PublicLayout } from '../features/public/PublicLayout'
import { YardLayout } from '../features/yard/YardLayout'
import { YardApplicationsPage, YardDashboardPage, YardEventsPage, YardLanternsPage, YardNotificationsPage, YardProfilePage } from '../features/yard/YardPages'
import { RouteScrollReset } from './RouteScrollReset'

// 这个函数判断当前地址是否来自找回密码回跳，入参为空，返回值表示根路径是否进入重置表单。
function isPasswordRecoveryRoute(): boolean {
  try {
    // 这里兼容测试环境没有浏览器对象的情况。
    if (typeof window === 'undefined') {
      return false
    }

    const searchText = window.location.search.toLowerCase()
    const hashText = window.location.hash.toLowerCase()

    return searchText.includes('mode=reset-password') || hashText.includes('type=recovery')
  } catch {
    // 这里兜底避免地址解析异常影响正常访问。
    return false
  }
}

// 这个组件是全站路由入口，入参为空，返回值是公开端、小院和后台全部路由。
export default function App() {
  // 这个变量保存当前是否为密码恢复地址。
  const passwordRecoveryRoute = isPasswordRecoveryRoute()

  return (
    <HashRouter>
      <RouteScrollReset />
      <Routes>
        <Route element={<PublicLayout />}>
          <Route index element={passwordRecoveryRoute ? <LoginPage /> : <HomePage />} />
          <Route path="/canon" element={<CanonPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/wenxin-quiz" element={<WenxinQuizPage />} />
          <Route path="/join" element={<JoinPage />} />
          <Route path="/cloud-lantern" element={<CloudLanternPage />} />
          <Route path="/announcements" element={<AnnouncementsPage />} />
          <Route path="/events" element={<EventsPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/404" element={<NotFoundPage />} />
        </Route>

        <Route path="/login" element={<LoginPage />} />

        <Route path="/yard" element={<YardLayout />}>
          <Route index element={<YardDashboardPage />} />
          <Route path="profile" element={<YardProfilePage />} />
          <Route path="applications" element={<YardApplicationsPage />} />
          <Route path="lanterns" element={<YardLanternsPage />} />
          <Route path="events" element={<YardEventsPage />} />
          <Route path="notifications" element={<YardNotificationsPage />} />
        </Route>

        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<AdminDashboardPage />} />
          <Route path="applications" element={<AdminApplicationsPage />} />
          <Route path="lanterns" element={<AdminLanternsPage />} />
          <Route path="announcements" element={<AdminAnnouncementsPage />} />
          <Route path="events" element={<AdminEventsPage />} />
          <Route path="stewards" element={<AdminStewardsPage />} />
          <Route path="settings" element={<AdminSettingsPage />} />
        </Route>

        <Route path="*" element={passwordRecoveryRoute ? <LoginPage /> : <Navigate replace to="/404" />} />
      </Routes>
    </HashRouter>
  )
}
