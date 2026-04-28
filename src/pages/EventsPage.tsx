import { CalendarDays, MapPin, Users } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { CloudButton } from '../components/CloudButton'
import { EmptyState } from '../components/EmptyState'
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
    <main className="mx-auto max-w-6xl px-4 py-14 md:px-6">
      <SectionTitle center eyebrow="问云雅集" title="线上清谈，线下相逢">
        问云派日常不求繁杂，但求有温度、有秩序、有意义。
      </SectionTitle>

      {notice ? <StatusNotice title="演示模式提示" message={notice} /> : null}

      <div className="mt-8 grid gap-5 md:grid-cols-2">
        {events.length === 0 ? (
          <EmptyState title="暂无雅集" message="待后台发布活动后，这里会展示线上或线下安排。" />
        ) : (
          events.map((item) => {
            const registration = findRegistration(item.id)
            const registered = registration?.status === 'registered'

            return (
              <ScrollPanel key={item.id}>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-[#edf3ef] px-3 py-1 text-sm text-[#6f8f8b]">{item.type}</span>
                  <span className="rounded-full bg-[#fff1ee] px-3 py-1 text-sm text-[#9e3d32]">
                    {item.mode === 'online' ? '线上' : '线下'}
                  </span>
                  {registered ? <span className="rounded-full bg-[#f7efd8] px-3 py-1 text-sm text-[#7a6a48]">已报名</span> : null}
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

                <div className="mt-5 rounded-2xl border border-[#c9a45c]/25 bg-white/55 p-4">
                  {profile ? (
                    <div className="grid gap-3">
                      <input
                        className="rounded-xl border border-[#6f8f8b]/25 bg-white/80 px-4 py-3 text-sm outline-none focus:border-[#6f8f8b]"
                        disabled={registered}
                        onChange={(event) => updateNote(item.id, event.target.value)}
                        placeholder="报名备注，可不填"
                        value={notes[item.id] ?? ''}
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
                        <CloudButton disabled={workingId === item.id} onClick={() => void handleRegister(item.id)} variant="seal">
                          {workingId === item.id ? '正在报名...' : registration ? '重新报名' : '报名雅集'}
                        </CloudButton>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm leading-7 text-[#526461]">
                      报名雅集需要先进入问云小院。
                      <Link className="ml-2 font-semibold text-[#9e3d32]" to="/login">
                        去登录或注册
                      </Link>
                    </p>
                  )}
                </div>
              </ScrollPanel>
            )
          })
        )}
      </div>
    </main>
  )
}
