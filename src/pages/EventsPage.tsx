import { CalendarDays, MapPin, Users } from 'lucide-react'
import { useEffect, useState } from 'react'
import { CloudButton } from '../components/CloudButton'
import { getGuofengVisualPath } from '../data/visualAssets'
import { fetchPublishedEvents } from '../lib/services'
import type { WenyunEvent } from '../lib/types'

// 这个数组保存雅集须知说明，属于固定规则文案，不伪造具体活动数据。
const eventNotes = ['同门报名后请准时赴约，若临时不能到场，请尽早取消报名。', '雅集以宁静见长，请尊重他人节奏，守住言语边界。', '具体时间、地点和人数以上方真实活动记录为准。']

// 这个函数格式化活动时间，入参是数据库时间字符串，返回值是中文日期时间。
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
    // 这里兜底处理异常时间，避免单条坏数据影响整个活动页面。
    return '时间待确认'
  }
}

// 这个函数根据活动时间和发布状态生成展示状态，入参是活动对象，返回值是卡片右上角文字。
function getEventStatusLabel(event: WenyunEvent): string {
  if (event.status === 'ended') {
    return '已结束'
  }

  if (event.status === 'closed') {
    return '已关闭'
  }

  if (!event.event_time) {
    return '待定'
  }

  return new Date(event.event_time).getTime() < Date.now() ? '已结束' : '报名中'
}

// 这个函数生成活动人数文案，入参是活动对象，返回值是卡片底部人数说明。
function getEventCapacityText(event: WenyunEvent): string {
  return event.capacity ? `人数上限 ${event.capacity} 人` : '人数不限'
}

// 这个函数渲染问云雅集页面，入参为空，返回值是真实活动数据的三卡展示。
export function EventsPage() {
  // 这个状态保存从服务层读取的真实公开雅集。
  const [events, setEvents] = useState<WenyunEvent[]>([])
  // 这个状态保存读取过程是否完成。
  const [loaded, setLoaded] = useState(false)
  // 这个常量保存活动页共用水墨亭台插图地址。
  const eventImage = getGuofengVisualPath('eventPavilion')

  useEffect(() => {
    // 这个变量记录组件是否仍在当前页面，避免慢请求回来后更新已卸载组件。
    let alive = true
    // 这里设置读取超时，网络卡住时也让页面进入可读的空数据状态。
    const timeoutId = window.setTimeout(() => {
      if (alive) {
        setLoaded(true)
      }
    }, 3200)

    // 这个函数读取真实公开活动，入参为空，返回值为空。
    async function loadEvents() {
      try {
        const result = await fetchPublishedEvents()
        if (alive) {
          setEvents(result.data)
        }
      } finally {
        // 这里无论成功失败都结束加载态，避免页面一直显示读取中。
        if (alive) {
          window.clearTimeout(timeoutId)
          setLoaded(true)
        }
      }
    }

    void loadEvents()

    return () => {
      alive = false
      window.clearTimeout(timeoutId)
    }
  }, [])

  // 这个常量保存前三条公开雅集，维持设计稿的三卡布局密度。
  const visibleEvents = events.slice(0, 3)

  return (
    <section className="public-art-page events-art-page" aria-label="问云雅集">
      <div className="events-reference-layout">
        <div className="events-reference-cards">
          {visibleEvents.length > 0 ? (
            visibleEvents.map((event, index) => {
              const statusLabel = getEventStatusLabel(event)
              const coverImage = event.cover_url?.trim() || eventImage

              return (
                <article className="event-reference-card" key={event.id}>
                  <div className="event-card-image-wrap">
                    <img
                      alt={`${event.title}插图`}
                      className="event-card-image"
                      src={coverImage}
                      style={{ objectPosition: index === 0 ? 'left center' : index === 1 ? 'center center' : 'right center' }}
                    />
                    <span>{statusLabel}</span>
                  </div>
                  <h1>{event.title}</h1>
                  <dl>
                    <div>
                      <CalendarDays aria-hidden="true" />
                      <dd>{formatEventTime(event.event_time)}</dd>
                    </div>
                    <div>
                      <MapPin aria-hidden="true" />
                      <dd>{event.location || (event.mode === 'online' ? '线上雅集' : '地点待定')}</dd>
                    </div>
                    <div>
                      <Users aria-hidden="true" />
                      <dd>{getEventCapacityText(event)}</dd>
                    </div>
                  </dl>
                  <CloudButton className="event-card-button" to="/events" variant={statusLabel === '报名中' ? 'primary' : 'ghost'}>
                    {statusLabel === '报名中' ? '查看报名' : '查看详情'}
                  </CloudButton>
                </article>
              )
            })
          ) : (
            <article className="event-reference-card event-empty-card">
              <div className="event-card-image-wrap">
                <img alt="暂无雅集插图" className="event-card-image" src={eventImage} />
                <span>{loaded ? '暂无' : '读取中'}</span>
              </div>
              <h1>{loaded ? '暂无公开雅集' : '正在读取真实雅集'}</h1>
              <p>山门暂未发布可展示的公开雅集，后续活动发布后会自动出现在这里。</p>
            </article>
          )}
        </div>

        <aside className="events-note-card-reference">
          <h2>雅集须知</h2>
          <ul>
            {eventNotes.map((note) => (
              <li key={note}>{note}</li>
            ))}
          </ul>
          <CloudButton className="events-note-button" to="/yard/events" variant="ghost">
            查看全部活动
          </CloudButton>
        </aside>
      </div>
    </section>
  )
}
