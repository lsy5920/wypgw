import { CalendarDays, MapPin, Users } from 'lucide-react'
import { useEffect, useState } from 'react'
import { CloudButton } from '../../components/CloudButton'
import { EmptyState } from '../../components/EmptyState'
import { ScrollPanel } from '../../components/ScrollPanel'
import { SectionTitle } from '../../components/SectionTitle'
import { StatusNotice } from '../../components/StatusNotice'
import { cancelEventRegistration, fetchYardEvents, registerForEvent } from '../../lib/services'
import type { YardEventItem } from '../../lib/types'

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

// 这个函数把报名状态转为中文，入参是状态，返回值是中文展示。
function formatRegistrationStatus(value: string | null): string {
  if (value === 'registered') {
    return '已报名'
  }

  if (value === 'cancelled') {
    return '已取消'
  }

  if (value === 'attended') {
    return '已参加'
  }

  return '未报名'
}

// 这个函数渲染我的雅集页，入参为空，返回值是活动列表和报名按钮。
export function YardEventsPage() {
  // 这个状态保存活动和报名状态。
  const [items, setItems] = useState<YardEventItem[]>([])
  // 这个状态保存每个活动的报名备注。
  const [notes, setNotes] = useState<Record<string, string>>({})
  // 这个状态保存正在操作的编号。
  const [workingId, setWorkingId] = useState('')
  // 这个状态保存页面提示。
  const [notice, setNotice] = useState<{ type: 'success' | 'error' | 'info'; title: string; message: string } | null>(null)

  // 这个函数读取活动和报名状态，入参为空，返回值为空。
  async function loadEvents() {
    const result = await fetchYardEvents()
    setItems(result.data)

    if (!result.ok) {
      setNotice({ type: 'error', title: '读取失败', message: result.message })
    } else if (result.demoMode) {
      setNotice({ type: 'info', title: '演示模式提示', message: result.message })
    }
  }

  useEffect(() => {
    void loadEvents()
  }, [])

  // 这个函数更新报名备注，入参是活动编号和备注，返回值为空。
  function updateNote(eventId: string, value: string) {
    setNotes((current) => ({ ...current, [eventId]: value }))
  }

  // 这个函数报名活动，入参是活动编号，返回值为空。
  async function handleRegister(eventId: string) {
    try {
      setWorkingId(eventId)
      const result = await registerForEvent(eventId, notes[eventId] ?? '')
      setNotice({
        type: result.ok ? 'success' : 'error',
        title: result.ok ? '报名成功' : '报名失败',
        message: result.message
      })

      if (result.ok) {
        await loadEvents()
      }
    } finally {
      setWorkingId('')
    }
  }

  // 这个函数取消报名，入参是报名编号，返回值为空。
  async function handleCancel(registrationId: string) {
    try {
      setWorkingId(registrationId)
      const result = await cancelEventRegistration(registrationId)
      setNotice({
        type: result.ok ? 'success' : 'error',
        title: result.ok ? '已取消报名' : '取消失败',
        message: result.message
      })

      if (result.ok) {
        await loadEvents()
      }
    } finally {
      setWorkingId('')
    }
  }

  return (
    <div>
      <SectionTitle eyebrow="我的雅集" title="清谈可赴，山水可约">
        这里展示已发布雅集，并记录你的报名状态。报名变化会写入小院提醒。
      </SectionTitle>

      {notice ? <StatusNotice type={notice.type} title={notice.title} message={notice.message} /> : null}

      <div className="mt-8 grid gap-5 md:grid-cols-2">
        {items.length === 0 ? (
          <EmptyState title="暂无雅集" message="待后台发布活动后，这里会出现可报名的问云雅集。" />
        ) : (
          items.map(({ event, registration }) => {
            const registered = registration?.status === 'registered'

            return (
              <ScrollPanel key={event.id}>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-[#edf3ef] px-3 py-1 text-sm text-[#6f8f8b]">{event.type}</span>
                  <span className="rounded-full bg-[#fff1ee] px-3 py-1 text-sm text-[#9e3d32]">
                    {event.mode === 'online' ? '线上' : '线下'}
                  </span>
                  <span className="rounded-full bg-[#f7efd8] px-3 py-1 text-sm text-[#7a6a48]">
                    {formatRegistrationStatus(registration?.status ?? null)}
                  </span>
                </div>
                <h2 className="mt-4 text-2xl font-bold text-[#143044]">{event.title}</h2>
                <p className="mt-4 leading-8 text-[#526461]">{event.description}</p>
                <div className="mt-6 grid gap-3 text-sm text-[#526461]">
                  <p className="flex items-center gap-2">
                    <CalendarDays className="h-4 w-4 text-[#c9a45c]" />
                    {formatEventTime(event.event_time)}
                  </p>
                  <p className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-[#c9a45c]" />
                    {event.location ?? '地点待定'}
                  </p>
                  <p className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-[#c9a45c]" />
                    {event.capacity ? `人数上限 ${event.capacity} 人` : '人数不限或待定'}
                  </p>
                </div>
                <div className="mt-5 grid gap-3 rounded-2xl border border-[#c9a45c]/25 bg-white/55 p-4">
                  <input
                    className="rounded-xl border border-[#6f8f8b]/25 bg-white/80 px-4 py-3 text-sm outline-none focus:border-[#6f8f8b]"
                    disabled={registered}
                    onChange={(inputEvent) => updateNote(event.id, inputEvent.target.value)}
                    placeholder="报名备注，可不填"
                    value={notes[event.id] ?? registration?.note ?? ''}
                  />
                  {registered && registration ? (
                    <CloudButton
                      disabled={workingId === registration.id}
                      onClick={() => void handleCancel(registration.id)}
                      variant="ghost"
                    >
                      {workingId === registration.id ? '正在取消...' : '取消报名'}
                    </CloudButton>
                  ) : (
                    <CloudButton disabled={workingId === event.id} onClick={() => void handleRegister(event.id)} variant="seal">
                      {workingId === event.id ? '正在报名...' : registration ? '重新报名' : '报名雅集'}
                    </CloudButton>
                  )}
                </div>
              </ScrollPanel>
            )
          })
        )}
      </div>
    </div>
  )
}
