import { CalendarDays, MapPin, Users } from 'lucide-react'
import { useEffect, useState } from 'react'
import { EmptyState } from '../components/EmptyState'
import { ScrollPanel } from '../components/ScrollPanel'
import { SectionTitle } from '../components/SectionTitle'
import { StatusNotice } from '../components/StatusNotice'
import { fetchPublishedEvents } from '../lib/services'
import type { WenyunEvent } from '../lib/types'

// 这个函数格式化活动时间，入参是时间字符串，返回值是中文时间。
function formatEventTime(value: string | null): string {
  if (!value) {
    return '时间待定'
  }

  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(value))
}

// 这个函数渲染问云雅集页，入参为空，返回值是公开活动列表。
export function EventsPage() {
  // 这个状态保存活动数据。
  const [events, setEvents] = useState<WenyunEvent[]>([])
  // 这个状态保存演示提示。
  const [notice, setNotice] = useState('')

  useEffect(() => {
    // 这个函数读取活动列表，入参为空，返回值为空。
    async function loadEvents() {
      const result = await fetchPublishedEvents()
      setEvents(result.data)

      if (result.demoMode) {
        setNotice('当前为演示活动，配置 Supabase 后会读取后台发布的真实雅集。')
      }
    }

    void loadEvents()
  }, [])

  return (
    <main className="mx-auto max-w-6xl px-4 py-14 md:px-6">
      <SectionTitle center eyebrow="问云雅集" title="线上清谈，线下相逢">
        问云派日常不求繁杂，但求有温度、有秩序、有意义。
      </SectionTitle>

      {notice ? <StatusNotice title="演示模式提示" message={notice} /> : null}

      <div className="mt-8 grid gap-5 md:grid-cols-2">
        {events.length === 0 ? (
          <EmptyState title="暂无雅集" message="待后台发布活动后，这里会展示线上或线下安排。" />
        ) : (
          events.map((item) => (
            <ScrollPanel key={item.id}>
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-[#edf3ef] px-3 py-1 text-sm text-[#6f8f8b]">{item.type}</span>
                <span className="rounded-full bg-[#fff1ee] px-3 py-1 text-sm text-[#9e3d32]">
                  {item.mode === 'online' ? '线上' : '线下'}
                </span>
              </div>
              <h2 className="mt-4 text-2xl font-bold text-[#143044]">{item.title}</h2>
              <p className="mt-4 leading-8 text-[#526461]">{item.description}</p>
              <div className="mt-6 grid gap-3 text-sm text-[#526461]">
                <p className="flex items-center gap-2">
                  <CalendarDays className="h-4 w-4 text-[#c9a45c]" />
                  {formatEventTime(item.event_time)}
                </p>
                <p className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-[#c9a45c]" />
                  {item.location ?? '地点待定'}
                </p>
                <p className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-[#c9a45c]" />
                  {item.capacity ? `人数上限 ${item.capacity} 人` : '人数不限或待定'}
                </p>
              </div>
            </ScrollPanel>
          ))
        )}
      </div>
    </main>
  )
}
