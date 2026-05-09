import { CalendarDays, MapPin, Users } from 'lucide-react'
import { useEffect, useState } from 'react'
import { StatusNotice } from '../../components/StatusNotice'
import { YardEmptyBox, YardPageBanner, YardPaperCard, YardStatusPill } from '../../components/YardGuofengFrame'
import { getGuofengVisualPath } from '../../data/visualAssets'
import { getFriendlyErrorMessage } from '../../lib/errorMessage'
import { cancelEventRegistration, fetchYardEvents, registerForEvent } from '../../lib/services'
import type { EventRegistrationStatus, YardEventItem } from '../../lib/types'

// 这个函数格式化活动时间，入参是时间字符串，返回值是中文时间。
function formatEventTime(value: string | null): string {
  if (!value) {
    return '时间待定'
  }

  try {
    return new Intl.DateTimeFormat('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(value))
  } catch {
    // 这里时间异常时返回原始内容，避免活动列表整体报错。
    return value
  }
}

// 这个函数把报名状态转为中文，入参是状态，返回值是中文展示。
function formatRegistrationStatus(value: EventRegistrationStatus | null): string {
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

// 这个函数把报名状态转换成标签色调，入参是状态，返回值是样式色调。
function getRegistrationTone(value: EventRegistrationStatus | null): 'gold' | 'jade' | 'seal' | 'muted' | 'danger' {
  if (value === 'registered') {
    return 'jade'
  }

  if (value === 'cancelled') {
    return 'muted'
  }

  if (value === 'attended') {
    return 'gold'
  }

  return 'seal'
}

// 这个函数渲染我的雅集页，入参为空，返回值是活动列表和报名按钮。
export function YardEventsPage() {
  // 这个状态保存活动和报名状态。
  const [items, setItems] = useState<YardEventItem[]>([])
  // 这个状态保存每个活动的报名备注。
  const [notes, setNotes] = useState<Record<string, string>>({})
  // 这个状态保存正在操作的编号。
  const [workingId, setWorkingId] = useState('')
  // 这个状态保存页面是否正在读取。
  const [loading, setLoading] = useState(true)
  // 这个状态保存页面提示。
  const [notice, setNotice] = useState<{ type: 'success' | 'error' | 'info'; title: string; message: string } | null>(null)

  // 这个函数读取活动和报名状态，入参为空，返回值为空。
  async function loadEvents() {
    try {
      const result = await fetchYardEvents()
      setItems(result.data)

      if (!result.ok) {
        setNotice({ type: 'error', title: '读取失败', message: result.message })
      } else if (result.demoMode) {
        setNotice({ type: 'info', title: '演示模式提示', message: result.message })
      }
    } catch (error) {
      // 这里捕获活动读取异常，避免网络异常时白屏。
      setNotice({ type: 'error', title: '读取失败', message: getFriendlyErrorMessage(error) })
    } finally {
      // 这里结束加载状态，让空活动和错误状态都能正确显示。
      setLoading(false)
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
    } catch (error) {
      // 这里捕获报名异常，保证按钮不会一直停在处理中。
      setNotice({ type: 'error', title: '报名失败', message: getFriendlyErrorMessage(error) })
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
    } catch (error) {
      // 这里捕获取消异常，提示用户稍后重试。
      setNotice({ type: 'error', title: '取消失败', message: getFriendlyErrorMessage(error) })
    } finally {
      setWorkingId('')
    }
  }

  // 这个变量保存已报名活动数量，返回值用于页签统计。
  const registeredCount = items.filter((item) => item.registration?.status === 'registered').length
  // 这个变量保存已参加活动数量，返回值用于页签统计。
  const attendedCount = items.filter((item) => item.registration?.status === 'attended').length
  // 这个变量保存已取消活动数量，返回值用于页签统计。
  const cancelledCount = items.filter((item) => item.registration?.status === 'cancelled').length

  return (
    <div className="yard-page-stack">
      <YardPageBanner
        action={<span className="yard-banner-tag">发布后可报名</span>}
        center
        indexLabel="5 我的雅集"
        subtitle="以文会友，以道相亲，雅集相守。"
        title="清谈可赴，山水可约"
        visual="yardEvents"
      />

      {notice ? <StatusNotice type={notice.type} title={notice.title} message={notice.message} /> : null}
      {loading ? <StatusNotice title="正在读取雅集" message="请稍候，正在查看可报名的问云雅集。" /> : null}

      <YardPaperCard className="yard-filter-card">
        <div className="yard-filter-tabs" aria-label="雅集状态统计">
          <span className="yard-filter-tab-active">已报名 {registeredCount}</span>
          <span>已参加 {attendedCount}</span>
          <span>已取消 {cancelledCount}</span>
          <span>活动记录 {items.length}</span>
        </div>

        {!loading && items.length === 0 ? (
          <YardEmptyBox title="暂无雅集" message="待后台发布活动后，这里会出现可报名的问云雅集。" />
        ) : (
          <div className="yard-event-list">
            {items.map(({ event, registration }) => {
              const registered = registration?.status === 'registered'

              return (
                <article className="yard-event-row" key={event.id}>
                  <img alt="" src={event.cover_url || getGuofengVisualPath('yardEvents')} />
                  <div className="yard-event-main">
                    <div className="yard-event-row-head">
                      <div>
                        <h2>{event.title}</h2>
                        <p>{event.description ?? '暂无活动说明。'}</p>
                      </div>
                      <YardStatusPill tone={getRegistrationTone(registration?.status ?? null)}>{formatRegistrationStatus(registration?.status ?? null)}</YardStatusPill>
                    </div>
                    <div className="yard-event-meta">
                      <span>
                        <CalendarDays className="h-4 w-4" />
                        {formatEventTime(event.event_time)}
                      </span>
                      <span>
                        <MapPin className="h-4 w-4" />
                        {event.location ?? '地点待定'}
                      </span>
                      <span>
                        <Users className="h-4 w-4" />
                        {event.capacity ? `人数上限 ${event.capacity} 人` : '人数不限或待定'}
                      </span>
                    </div>
                    <div className="yard-event-actions">
                      <input
                        className="yard-input"
                        disabled={registered}
                        onChange={(inputEvent) => updateNote(event.id, inputEvent.target.value)}
                        placeholder="报名备注，可不填"
                        value={notes[event.id] ?? registration?.note ?? ''}
                      />
                      {registered && registration ? (
                        <button className="yard-action-button-danger" disabled={workingId === registration.id} onClick={() => void handleCancel(registration.id)} type="button">
                          {workingId === registration.id ? '正在取消...' : '取消报名'}
                        </button>
                      ) : (
                        <button className="yard-action-button" disabled={workingId === event.id} onClick={() => void handleRegister(event.id)} type="button">
                          {workingId === event.id ? '正在报名...' : registration ? '重新报名' : '报名雅集'}
                        </button>
                      )}
                    </div>
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </YardPaperCard>
    </div>
  )
}
