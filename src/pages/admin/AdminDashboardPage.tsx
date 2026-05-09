import { FileText, Lamp, Megaphone, ShieldCheck } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { StatusNotice } from '../../components/StatusNotice'
import { applicationStatusLabels, lanternStatusLabels } from '../../data/siteContent'
import {
  fetchAdminAnnouncements,
  fetchAdminApplications,
  fetchAdminEvents,
  fetchAdminLanterns
} from '../../lib/services'
import type { Announcement, CloudLantern, JoinApplication, WenyunEvent } from '../../lib/types'
import { AdminMetricCard, AdminPageShell, AdminPanel, AdminStatusPill, formatAdminDate } from './AdminUi'

// 这个接口描述后台总览数据，入参来自四个后台列表接口，返回值用于统计卡和待办列表。
interface DashboardData {
  // 名帖列表。
  applications: JoinApplication[]
  // 云灯列表。
  lanterns: CloudLantern[]
  // 公告列表。
  announcements: Announcement[]
  // 活动列表。
  events: WenyunEvent[]
}

// 这个常量保存后台总览的空数据，返回值用于首次渲染和异常兜底。
const emptyDashboardData: DashboardData = {
  applications: [],
  lanterns: [],
  announcements: [],
  events: []
}

// 这个函数渲染后台总览页，入参为空，返回值是七宫格设计中的第一屏后台仪表盘。
export function AdminDashboardPage() {
  // 这个状态保存后台总览所需的全部列表数据。
  const [data, setData] = useState<DashboardData>(emptyDashboardData)
  // 这个状态保存页面提示，接口异常或演示模式时展示。
  const [notice, setNotice] = useState<{ type: 'success' | 'error' | 'info'; title: string; message: string } | null>(null)

  useEffect(() => {
    // 这个函数读取后台总览数据，入参为空，返回值为空。
    async function loadDashboard() {
      try {
        // 这里并行读取四类后台数据，减少后台首页等待时间。
        const [applicationResult, lanternResult, announcementResult, eventResult] = await Promise.all([
          fetchAdminApplications(),
          fetchAdminLanterns(),
          fetchAdminAnnouncements(),
          fetchAdminEvents()
        ])

        setData({
          applications: applicationResult.data,
          lanterns: lanternResult.data,
          announcements: announcementResult.data,
          events: eventResult.data
        })

        // 这里按接口结果给出最重要的提示，避免多个提示同时挤占页面。
        if (!applicationResult.ok || !lanternResult.ok || !announcementResult.ok || !eventResult.ok) {
          setNotice({ type: 'error', title: '读取失败', message: '部分后台数据读取失败，页面已尽量显示可用内容。' })
        } else if (applicationResult.demoMode || lanternResult.demoMode || announcementResult.demoMode || eventResult.demoMode) {
          setNotice({ type: 'info', title: '演示模式提示', message: '当前显示演示后台数据，配置 Supabase 并登录管理员后会读取真实数据。' })
        }
      } catch (error) {
        // 这里兜底捕获意外异常，避免后台首页白屏。
        setNotice({
          type: 'error',
          title: '总览读取异常',
          message: error instanceof Error ? error.message : '后台总览暂时无法读取，请稍后刷新。'
        })
      }
    }

    void loadDashboard()
  }, [])

  // 这个变量保存统计数字，返回值用于四张数据卡。
  const stats = useMemo(
    () => ({
      pendingApplications: data.applications.filter((item) => item.status === 'pending').length,
      pendingLanterns: data.lanterns.filter((item) => item.status === 'pending').length,
      announcements: data.announcements.length,
      events: data.events.length
    }),
    [data]
  )

  // 这个变量保存最新待办，返回值用于总览页左下角列表。
  const recentApplications = data.applications.slice(0, 4)
  // 这个变量保存最新云灯，返回值用于总览页右下角列表。
  const recentLanterns = data.lanterns.slice(0, 4)

  return (
    <AdminPageShell index="1" title="后台总览" description="清风真人，执事辛劳了。今日数据从这里起看。">
      {notice ? <StatusNotice type={notice.type} title={notice.title} message={notice.message} /> : null}

      <div className="admin-metric-grid">
        <AdminMetricCard icon={<ShieldCheck className="h-7 w-7" />} label="待审核登记" value={stats.pendingApplications} hint="较昨日保持守序" tone="teal" />
        <AdminMetricCard icon={<Lamp className="h-7 w-7" />} label="待审核云灯" value={stats.pendingLanterns} hint="温暖内容先过目" tone="gold" />
        <AdminMetricCard icon={<Megaphone className="h-7 w-7" />} label="公告总数" value={stats.announcements} hint="山门近讯可追溯" tone="green" />
        <AdminMetricCard icon={<FileText className="h-7 w-7" />} label="活动总数" value={stats.events} hint="雅集安排有记录" tone="red" />
      </div>

      <div className="admin-dashboard-grid">
        <AdminPanel title="待办事项" description="优先处理未审核名帖和待公开云灯。">
          <ul className="admin-compact-list">
            {recentApplications.length === 0 ? (
              <li className="admin-empty-line">暂无名帖记录。</li>
            ) : (
              recentApplications.map((item) => (
                <li key={item.id}>
                  <div>
                    <strong>{item.nickname || '未填写道名'}</strong>
                    <span>{formatAdminDate(item.created_at)}</span>
                  </div>
                  <AdminStatusPill tone={item.status === 'pending' ? 'red' : 'green'}>{applicationStatusLabels[item.status]}</AdminStatusPill>
                </li>
              ))
            )}
          </ul>
        </AdminPanel>

        <AdminPanel title="最近云灯" description="云灯公开前先确认内容清净。">
          <ul className="admin-compact-list">
            {recentLanterns.length === 0 ? (
              <li className="admin-empty-line">暂无云灯留言。</li>
            ) : (
              recentLanterns.map((item) => (
                <li key={item.id}>
                  <div>
                    <strong>{item.author_name}</strong>
                    <span>{item.content}</span>
                  </div>
                  <AdminStatusPill tone={item.status === 'pending' ? 'red' : item.status === 'approved' ? 'green' : 'gray'}>
                    {lanternStatusLabels[item.status]}
                  </AdminStatusPill>
                </li>
              ))
            )}
          </ul>
        </AdminPanel>
      </div>
    </AdminPageShell>
  )
}
