import { FileText, Lamp, Megaphone, Users } from 'lucide-react'
import { useEffect, useState } from 'react'
import { ScrollPanel } from '../../components/ScrollPanel'
import { SectionTitle } from '../../components/SectionTitle'
import { StatusNotice } from '../../components/StatusNotice'
import {
  fetchAdminAnnouncements,
  fetchAdminApplications,
  fetchAdminEvents,
  fetchAdminLanterns
} from '../../lib/services'

// 这个接口描述后台总览统计，入参来自各列表接口，返回值用于卡片展示。
interface DashboardStats {
  // 待审核名册登记数。
  pendingApplications: number
  // 待审核云灯留言数。
  pendingLanterns: number
  // 公告总数。
  announcements: number
  // 活动总数。
  events: number
}

// 这个函数渲染后台首页，入参为空，返回值是数据总览。
export function AdminDashboardPage() {
  // 这个状态保存总览统计。
  const [stats, setStats] = useState<DashboardStats>({
    pendingApplications: 0,
    pendingLanterns: 0,
    announcements: 0,
    events: 0
  })
  // 这个状态保存提示信息。
  const [notice, setNotice] = useState('')

  useEffect(() => {
    // 这个函数读取后台总览数据，入参为空，返回值为空。
    async function loadStats() {
      const [applications, lanterns, announcements, events] = await Promise.all([
        fetchAdminApplications(),
        fetchAdminLanterns(),
        fetchAdminAnnouncements(),
        fetchAdminEvents()
      ])

      setStats({
        pendingApplications: applications.data.filter((item) => item.status === 'pending').length,
        pendingLanterns: lanterns.data.filter((item) => item.status === 'pending').length,
        announcements: announcements.data.length,
        events: events.data.length
      })

      if (applications.demoMode || lanterns.demoMode) {
        setNotice('当前为演示后台数据，配置 Supabase 并登录管理员后会读取真实数据。')
      }
    }

    void loadStats()
  }, [])

  return (
    <div>
      <SectionTitle eyebrow="后台总览" title="护灯与守门">
        查看名册登记、云灯留言、公告和雅集的当前状态。
      </SectionTitle>

      {notice ? <StatusNotice title="演示模式提示" message={notice} /> : null}

      <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        {[
          { title: '待审核登记', value: stats.pendingApplications, icon: Users },
          { title: '待审核云灯', value: stats.pendingLanterns, icon: Lamp },
          { title: '公告数量', value: stats.announcements, icon: Megaphone },
          { title: '活动数量', value: stats.events, icon: FileText }
        ].map((item) => {
          const Icon = item.icon

          return (
            <ScrollPanel key={item.title}>
              <Icon className="mb-5 h-8 w-8 text-[#6f8f8b]" />
              <p className="text-sm text-[#526461]">{item.title}</p>
              <p className="mt-2 text-4xl font-bold text-[#143044]">{item.value}</p>
            </ScrollPanel>
          )
        })}
      </div>
    </div>
  )
}
