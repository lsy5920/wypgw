import { FormEvent, useEffect, useState } from 'react'
import { CloudButton } from '../../components/CloudButton'
import { EmptyState } from '../../components/EmptyState'
import { ScrollPanel } from '../../components/ScrollPanel'
import { SectionTitle } from '../../components/SectionTitle'
import { StatusNotice } from '../../components/StatusNotice'
import { createEvent, fetchAdminEvents } from '../../lib/services'
import type { WenyunEvent } from '../../lib/types'

// 这个接口描述活动表单，入参来自后台输入，返回值用于创建问云雅集。
interface EventForm {
  // 活动标题。
  title: string
  // 活动类型。
  type: string
  // 活动方式。
  mode: 'online' | 'offline'
  // 活动地点。
  location: string
  // 活动时间。
  event_time: string
  // 活动简介。
  description: string
  // 人数上限。
  capacity: string
  // 发布状态。
  status: 'draft' | 'published'
}

// 这个常量保存活动表单初始值，返回值用于重置表单。
const initialForm: EventForm = {
  title: '',
  type: '线上清谈',
  mode: 'online',
  location: '',
  event_time: '',
  description: '',
  capacity: '',
  status: 'draft'
}

// 这个函数渲染活动管理页，入参为空，返回值是活动创建表单和列表。
export function AdminEventsPage() {
  // 这个状态保存活动列表。
  const [events, setEvents] = useState<WenyunEvent[]>([])
  // 这个状态保存表单。
  const [form, setForm] = useState<EventForm>(initialForm)
  // 这个状态保存提示。
  const [notice, setNotice] = useState<{ type: 'success' | 'error' | 'info'; title: string; message: string } | null>(null)

  // 这个函数读取活动列表，入参为空，返回值为空。
  async function loadEvents() {
    const result = await fetchAdminEvents()
    setEvents(result.data)

    if (!result.ok) {
      setNotice({ type: 'error', title: '读取失败', message: result.message })
    } else if (result.demoMode) {
      setNotice({ type: 'info', title: '演示模式提示', message: result.message })
    }
  }

  useEffect(() => {
    void loadEvents()
  }, [])

  // 这个函数更新表单字段，入参是字段和值，返回值为空。
  function updateField(field: keyof EventForm, value: string) {
    setForm((current) => ({ ...current, [field]: value }))
  }

  // 这个函数创建活动，入参是表单事件，返回值为空。
  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    // 这里做基础校验，避免无标题活动进入数据库。
    if (!form.title.trim()) {
      setNotice({ type: 'error', title: '活动还不能创建', message: '请填写活动标题。' })
      return
    }

    const result = await createEvent(form)
    setNotice({
      type: result.ok ? 'success' : 'error',
      title: result.ok ? '活动已创建' : '创建失败',
      message: result.message
    })

    if (result.ok) {
      setForm(initialForm)
      await loadEvents()
    }
  }

  return (
    <div>
      <SectionTitle eyebrow="活动管理" title="筹备问云雅集">
        线上清谈、读书会、茶会、徒步与公益活动都可从这里创建。
      </SectionTitle>

      {notice ? <StatusNotice type={notice.type} title={notice.title} message={notice.message} /> : null}

      <ScrollPanel className="mt-8">
        <form className="grid gap-5" onSubmit={handleSubmit}>
          <div className="grid gap-5 md:grid-cols-2">
            <label className="grid gap-2">
              <span className="text-sm font-semibold">活动标题 *</span>
              <input
                className="rounded-xl border border-[#6f8f8b]/25 bg-white/80 px-4 py-3 outline-none focus:border-[#6f8f8b]"
                onChange={(event) => updateField('title', event.target.value)}
                value={form.title}
              />
            </label>
            <label className="grid gap-2">
              <span className="text-sm font-semibold">活动类型</span>
              <select
                className="rounded-xl border border-[#6f8f8b]/25 bg-white/80 px-4 py-3 outline-none focus:border-[#6f8f8b]"
                onChange={(event) => updateField('type', event.target.value)}
                value={form.type}
              >
                <option value="线上清谈">线上清谈</option>
                <option value="读书会">读书会</option>
                <option value="茶会">茶会</option>
                <option value="徒步">徒步</option>
                <option value="公益">公益</option>
                <option value="节日雅集">节日雅集</option>
              </select>
            </label>
          </div>
          <div className="grid gap-5 md:grid-cols-3">
            <label className="grid gap-2">
              <span className="text-sm font-semibold">活动方式</span>
              <select
                className="rounded-xl border border-[#6f8f8b]/25 bg-white/80 px-4 py-3 outline-none focus:border-[#6f8f8b]"
                onChange={(event) => updateField('mode', event.target.value)}
                value={form.mode}
              >
                <option value="online">线上</option>
                <option value="offline">线下</option>
              </select>
            </label>
            <label className="grid gap-2">
              <span className="text-sm font-semibold">活动时间</span>
              <input
                className="rounded-xl border border-[#6f8f8b]/25 bg-white/80 px-4 py-3 outline-none focus:border-[#6f8f8b]"
                onChange={(event) => updateField('event_time', event.target.value)}
                type="datetime-local"
                value={form.event_time}
              />
            </label>
            <label className="grid gap-2">
              <span className="text-sm font-semibold">人数上限</span>
              <input
                className="rounded-xl border border-[#6f8f8b]/25 bg-white/80 px-4 py-3 outline-none focus:border-[#6f8f8b]"
                min="1"
                onChange={(event) => updateField('capacity', event.target.value)}
                type="number"
                value={form.capacity}
              />
            </label>
          </div>
          <label className="grid gap-2">
            <span className="text-sm font-semibold">活动地点</span>
            <input
              className="rounded-xl border border-[#6f8f8b]/25 bg-white/80 px-4 py-3 outline-none focus:border-[#6f8f8b]"
              onChange={(event) => updateField('location', event.target.value)}
              placeholder="例如：微信群、杭州西湖、线上会议"
              value={form.location}
            />
          </label>
          <label className="grid gap-2">
            <span className="text-sm font-semibold">活动简介</span>
            <textarea
              className="min-h-28 rounded-xl border border-[#6f8f8b]/25 bg-white/80 px-4 py-3 leading-7 outline-none focus:border-[#6f8f8b]"
              onChange={(event) => updateField('description', event.target.value)}
              value={form.description}
            />
          </label>
          <label className="grid gap-2">
            <span className="text-sm font-semibold">状态</span>
            <select
              className="rounded-xl border border-[#6f8f8b]/25 bg-white/80 px-4 py-3 outline-none focus:border-[#6f8f8b]"
              onChange={(event) => updateField('status', event.target.value)}
              value={form.status}
            >
              <option value="draft">草稿</option>
              <option value="published">发布</option>
            </select>
          </label>
          <CloudButton type="submit" variant="seal">
            创建活动
          </CloudButton>
        </form>
      </ScrollPanel>

      <div className="mt-8 grid gap-5">
        {events.length === 0 ? (
          <EmptyState title="暂无活动" message="创建活动后，会在这里显示。" />
        ) : (
          events.map((item) => (
            <ScrollPanel key={item.id}>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-2xl font-bold">{item.title}</h2>
                <span className="rounded-full bg-[#edf3ef] px-3 py-1 text-sm text-[#6f8f8b]">
                  {item.status === 'published' ? '已发布' : '草稿'}
                </span>
              </div>
              <p className="mt-3 text-sm text-[#9e3d32]">
                {item.type} · {item.mode === 'online' ? '线上' : '线下'}
              </p>
              <p className="mt-4 leading-8 text-[#526461]">{item.description}</p>
            </ScrollPanel>
          ))
        )}
      </div>
    </div>
  )
}
