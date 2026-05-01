import { Megaphone } from 'lucide-react'
import { useEffect, useState } from 'react'
import { EmptyState } from '../components/EmptyState'
import { PageShell } from '../components/PageShell'
import { ScrollPanel } from '../components/ScrollPanel'
import { SectionTitle } from '../components/SectionTitle'
import { StatusNotice } from '../components/StatusNotice'
import { fetchPublishedAnnouncements } from '../lib/services'
import type { Announcement } from '../lib/types'

// 这个函数格式化日期，入参是时间字符串，返回值是适合中文页面展示的日期。
function formatDate(value: string | null): string {
  if (!value) {
    return '暂未发布'
  }

  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(value))
}

// 这个函数渲染公告列表页，入参为空，返回值是公开公告列表。
export function AnnouncementsPage() {
  // 这个状态保存公告数据。
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  // 这个状态保存提示信息。
  const [notice, setNotice] = useState('')

  useEffect(() => {
    // 这个函数读取公告，入参为空，返回值为空。
    async function loadAnnouncements() {
      const result = await fetchPublishedAnnouncements()
      setAnnouncements(result.data)

      if (result.demoMode) {
        setNotice('当前为演示公告，配置 Supabase 后会读取后台发布的真实公告。')
      }
    }

    void loadAnnouncements()
  }, [])

  return (
    <PageShell size="narrow">
      <SectionTitle center eyebrow="门派公告" title="山门有讯，灯火相传">
        山门公告、门规更新、活动通知与金典修订都会在这里发布。
      </SectionTitle>

      {notice ? <StatusNotice title="演示模式提示" message={notice} /> : null}

      <div className="mt-8 grid gap-5">
        {announcements.length === 0 ? (
          <EmptyState title="暂无公告" message="待后台发布公告后，这里会展示山门近讯。" />
        ) : (
          announcements.map((item) => (
          <ScrollPanel className="seal-mark-bg" key={item.id}>
              <div className="flex flex-wrap items-center gap-3">
                <span className="inline-flex items-center gap-2 rounded-full bg-[#edf3ef] px-3 py-1 text-sm text-[#6f8f8b]">
                  <Megaphone className="h-4 w-4" />
                  {item.category}
                </span>
                {item.is_pinned ? <span className="rounded-full bg-[#9e3d32] px-3 py-1 text-sm text-white">置顶</span> : null}
                <span className="text-sm text-[#7a6a48]">{formatDate(item.published_at)}</span>
              </div>
              <h2 className="mt-4 text-2xl font-bold text-[#143044]">{item.title}</h2>
              <p className="mt-4 leading-8 text-[#526461]">{item.summary}</p>
              <p className="mt-5 border-t border-[#c9a45c]/25 pt-5 leading-8 text-[#40524f]">{item.content}</p>
            </ScrollPanel>
          ))
        )}
      </div>
    </PageShell>
  )
}
