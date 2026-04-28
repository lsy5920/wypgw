import { HashRouter, Navigate, Route, Routes } from 'react-router-dom'
import { SiteLayout } from './layouts/SiteLayout'
import { AdminLayout } from './layouts/AdminLayout'
import { YardLayout } from './layouts/YardLayout'
import { AboutPage } from './pages/AboutPage'
import { AnnouncementsPage } from './pages/AnnouncementsPage'
import { CanonPage } from './pages/CanonPage'
import { CloudLanternPage } from './pages/CloudLanternPage'
import { ContactPage } from './pages/ContactPage'
import { EventsPage } from './pages/EventsPage'
import { HomePage } from './pages/HomePage'
import { JoinPage } from './pages/JoinPage'
import { LoginPage } from './pages/LoginPage'
import { NotFoundPage } from './pages/NotFoundPage'
import { AdminAnnouncementsPage } from './pages/admin/AdminAnnouncementsPage'
import { AdminApplicationsPage } from './pages/admin/AdminApplicationsPage'
import { AdminDashboardPage } from './pages/admin/AdminDashboardPage'
import { AdminEventsPage } from './pages/admin/AdminEventsPage'
import { AdminLanternsPage } from './pages/admin/AdminLanternsPage'
import { AdminSettingsPage } from './pages/admin/AdminSettingsPage'
import { AdminStewardsPage } from './pages/admin/AdminStewardsPage'
import { YardApplicationsPage } from './pages/yard/YardApplicationsPage'
import { YardDashboardPage } from './pages/yard/YardDashboardPage'
import { YardEventsPage } from './pages/yard/YardEventsPage'
import { YardLanternsPage } from './pages/yard/YardLanternsPage'
import { YardNotificationsPage } from './pages/yard/YardNotificationsPage'
import { YardProfilePage } from './pages/yard/YardProfilePage'

// 这个函数是官网总路由入口，入参为空，返回值是完整的前台与后台页面路由。
export default function App() {
  return (
    // 这里使用 HashRouter 管理页面路径，部署到 GitHub Pages 子目录后刷新页面也不会误入 404。
    <HashRouter>
      <Routes>
        {/* 这里放置前台官网页面，共用顶部导航、底部信息和移动端导航。 */}
        <Route element={<SiteLayout />}>
          <Route index element={<HomePage />} />
          <Route path="/canon" element={<CanonPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/join" element={<JoinPage />} />
          <Route path="/cloud-lantern" element={<CloudLanternPage />} />
          <Route path="/announcements" element={<AnnouncementsPage />} />
          <Route path="/events" element={<EventsPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/404" element={<NotFoundPage />} />
        </Route>

        {/* 这里放置普通同门的问云小院页面，共用小院侧栏和登录保护。 */}
        <Route path="/yard" element={<YardLayout />}>
          <Route index element={<YardDashboardPage />} />
          <Route path="profile" element={<YardProfilePage />} />
          <Route path="applications" element={<YardApplicationsPage />} />
          <Route path="lanterns" element={<YardLanternsPage />} />
          <Route path="events" element={<YardEventsPage />} />
          <Route path="notifications" element={<YardNotificationsPage />} />
        </Route>

        {/* 这里放置后台管理页面，共用后台侧栏和登录保护。 */}
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<AdminDashboardPage />} />
          <Route path="applications" element={<AdminApplicationsPage />} />
          <Route path="lanterns" element={<AdminLanternsPage />} />
          <Route path="announcements" element={<AdminAnnouncementsPage />} />
          <Route path="events" element={<AdminEventsPage />} />
          <Route path="stewards" element={<AdminStewardsPage />} />
          <Route path="settings" element={<AdminSettingsPage />} />
        </Route>

        {/* 这里处理不存在的地址，把访问者带到中文 404 页面。 */}
        <Route path="*" element={<Navigate to="/404" replace />} />
      </Routes>
    </HashRouter>
  )
}
