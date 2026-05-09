import { CalendarDays, MapPin, ScrollText, Users } from 'lucide-react'
import { useEffect, useState } from 'react'
import { CloudButton } from '../components/CloudButton'
import { LoginRequiredNotice } from '../components/LoginRequiredNotice'
import { PageShell } from '../components/PageShell'
import { ScrollPanel } from '../components/ScrollPanel'
import { SectionTitle } from '../components/SectionTitle'
import { StatusNotice } from '../components/StatusNotice'
import { useAuth } from '../hooks/useAuth'
import { cancelEventRegistration, fetchMyRegistrations, fetchPublishedEvents, registerForEvent } from '../lib/services'
import type { EventRegistration, WenyunEvent } from '../lib/types'

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

// 这个数组保存暂无雅集时的占位卡片，入参为空，返回值用于保持设计稿的活动三卡布局。
const emptyEventCards = [
  { title: '春日品茶', type: '线上清谈', mode: '线上', location: '问云小院', capacity: '待定', description: '待后台发布后，会展示清谈主题、报名时间与参与方式。' },
  { title: '山水静行', type: '线下雅集', mode: '线下', location: '地点待定', capacity: '待定', description: '若安排线下相逢，会提前写明地点、安全提示和人数上限。' },
  { title: '灯下共读', type: '金典共读', mode: '线上', location: '云端书案', capacity: '待定', description: '金典共读、门风讨论和新人答疑，会在活动发布后开放报名。' }
]

// 这个函数渲染问云雅集页，入参为空，返回值是公开活动列表。
export function EventsPage() {
  // 这里读取当前登录资料，雅集报名要求先进入问云小院。
  const { profile } = useAuth()
  // 这个状态保存活动数据。
  const [events, setEvents] = useState<WenyunEvent[]>([])
  // 这个状态保存当前用户的报名数据。
  const [registrations, setRegistrations] = useState<EventRegistration[]>([])
  // 这个状态保存每个活动的报名备注。
  const [notes, setNotes] = useState<Record<string, string>>({})
  // 这个状态保存演示提示。
  const [notice, setNotice] = useState('')
  // 这个状态保存正在操作的活动编号。
  const [workingId, setWorkingId] = useState('')

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

  useEffect(() => {
    // 这个函数读取当前用户报名，入参为空，返回值为空。
    async function loadRegistrations() {
      if (!profile) {
        setRegistrations([])
        return
      }

      const result = await fetchMyRegistrations()
      setRegistrations(result.data)
    }

    void loadRegistrations()
  }, [profile])

  // 这个函数更新报名备注，入参是活动编号和备注，返回值为空。
  function updateNote(eventId: string, value: string) {
    setNotes((current) => ({ ...current, [eventId]: value }))
  }

  // 这个函数查找某个活动的当前用户报名，入参是活动编号，返回值是报名或空值。
  function findRegistration(eventId: string) {
    return registrations.find((item) => item.event_id === eventId) ?? null
  }

  // 这个函数报名活动，入参是活动编号，返回值为空。
  async function handleRegister(eventId: string) {
    if (!profile) {
      setNotice('请先进入问云小院，再报名问云雅集。')
      return
    }

    try {
      setWorkingId(eventId)
      const result = await registerForEvent(eventId, notes[eventId] ?? '')
      setNotice(result.message)

      if (result.ok) {
        const registrationResult = await fetchMyRegistrations()
        setRegistrations(registrationResult.data)
      }
    } finally {
      setWorkingId('')
    }
  }

  // 这个函数取消活动报名，入参是报名编号，返回值为空。
  async function handleCancel(registrationId: string) {
    try {
      setWorkingId(registrationId)
      const result = await cancelEventRegistration(registrationId)
      setNotice(result.message)

      if (result.ok) {
        const registrationResult = await fetchMyRegistrations()
        setRegistrations(registrationResult.data)
      }
    } finally {
      setWorkingId('')
    }
  }

  return (
    <PageShell className="compact-design-page events-design-page" size="wide">
      <SectionTitle center eyebrow="问云雅集" title="线上清谈，线下相逢" visual="events">
        问云派日常不求繁杂，但求有温度、有秩序、有意义。
      </SectionTitle>

      {notice ? <StatusNotice title="演示模式提示" message={notice} /> : null}

      <div className="events-board-layout mt-8 grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(18rem,0.32fr)]">
        <div className="events-card-grid grid gap-5 md:grid-cols-3">
          {events.length === 0
            ? emptyEventCards.map((item) => (
                <ScrollPanel className="events-card min-h-[28rem]" key={item.title}>
                  <div className="events-card-image" />
                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-[#edf3ef] px-3 py-1 text-sm text-[#6f8f8b]">{item.type}</span>
                    <span className="rounded-full bg-[#fff1ee] px-3 py-1 text-sm text-[#9e3d32]">{item.mode}</span>
                  </div>
                  <h2 className="ink-title mt-4 text-3xl font-bold text-[#143044]">{item.title}</h2>
                  <p className="mt-4 min-h-24 leading-8 text-[#526461]">{item.description}</p>
                  <div className="mt-6 grid gap-3 text-sm text-[#526461]">
                    <p className="flex items-center gap-2">
                      <CalendarDays className="h-4 w-4 text-[#c9a45c]" />
                      时间待定
                    </p>
                    <p className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-[#c9a45c]" />
                      {item.location}
                    </p>
                    <p className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-[#c9a45c]" />
                      人数上限 {item.capacity}
                    </p>
                  </div>
                  <button className="mt-6 min-h-11 w-full rounded-lg border border-[#c9a45c]/35 bg-white/70 px-5 text-sm font-semibold text-[#7a6a48]" type="button">
                    敬候发布
                  </button>
                </ScrollPanel>
              ))
            : events.map((item) => {
                const registration = findRegistration(item.id)
                const registered = registration?.status === 'registered'

                return (
                  <ScrollPanel className="events-card min-h-[28rem]" key={item.id}>
                    <div className="events-card-image" />
                    <div className="mt-4 flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-[#edf3ef] px-3 py-1 text-sm text-[#6f8f8b]">{item.type}</span>
                      <span className="rounded-full bg-[#fff1ee] px-3 py-1 text-sm text-[#9e3d32]">
                        {item.mode === 'online' ? '线上' : '线下'}
                      </span>
                      {registered ? <span className="rounded-full bg-[#f7efd8] px-3 py-1 text-sm text-[#7a6a48]">已报名</span> : null}
                    </div>
                    <h2 className="ink-title mt-4 text-3xl font-bold text-[#143044]">{item.title}</h2>
                    <p className="mt-4 min-h-24 leading-8 text-[#526461]">{item.description}</p>
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

                    <div className="mt-5 rounded-lg border border-[#c9a45c]/25 bg-white/55 p-4">
                      {profile ? (
                        <div className="grid gap-3">
                          <input
                            className="rounded-lg border border-[#6f8f8b]/25 bg-white/80 px-4 py-3 text-sm outline-none focus:border-[#6f8f8b]"
                            disabled={registered}
                            onChange={(event) => updateNote(item.id, event.target.value)}
                            placeholder="报名备注，可不填"
                            value={notes[item.id] ?? ''}
                          />
                          {registered && registration ? (
                            <CloudButton disabled={workingId === registration.id} onClick={() => void handleCancel(registration.id)} variant="ghost">
                              {workingId === registration.id ? '正在取消...' : '取消报名'}
                            </CloudButton>
                          ) : (
                            <CloudButton disabled={workingId === item.id} onClick={() => void handleRegister(item.id)} variant="seal">
                              {workingId === item.id ? '正在报名...' : registration ? '重新报名' : '报名雅集'}
                            </CloudButton>
                          )}
                        </div>
                      ) : (
                        <LoginRequiredNotice
                          title="报名雅集前请先登录"
                          message="雅集报名需要归属到你的问云小院，登录后可查看报名状态并取消报名。"
                        />
                      )}
                    </div>
                  </ScrollPanel>
                )
              })}
        </div>

        <aside className="events-note-stack grid gap-4">
          <ScrollPanel className="events-note-card seal-mark-bg">
            <ScrollText className="h-8 w-8 text-[#9e3d32]" />
            <h2 className="ink-title mt-4 text-2xl font-bold text-[#143044]">雅集须知</h2>
            <div className="mt-5 grid gap-3 text-sm leading-7 text-[#526461]">
              <p>问云雅集不追求热闹，只求彼此尊重、准时赴约、言语有界。</p>
              <p>线下活动会写清地点和安全提醒，报名后若不能参加，请提前取消。</p>
              <p>所有报名状态会同步到问云小院，方便你日后查看。</p>
            </div>
            <CloudButton className="mt-6 w-full" to="/yard/events" variant="ghost">
              查看我的报名
            </CloudButton>
          </ScrollPanel>
        </aside>
      </div>
    </PageShell>
  )
}
