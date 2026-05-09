import { FormEvent, useEffect, useState } from 'react'
import { CloudButton } from '../../components/CloudButton'
import { EmptyState } from '../../components/EmptyState'
import { StatusNotice } from '../../components/StatusNotice'
import { createEvent, fetchAdminEvents, fetchAdminRegistrations, updateEventRegistrationStatus } from '../../lib/services'
import type { EventRegistration, EventRegistrationStatus, PublishStatus, WenyunEvent } from '../../lib/types'
import { AdminPageShell, AdminPanel, AdminStatusPill, formatAdminDate } from './AdminUi'

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

// 这个常量保存活动表单初始值，返回值用于表单重置。
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

// 这个数组保存活动类型选项，返回值用于活动类型下拉框。
const eventTypeOptions = ['线上清谈', '读书会', '茶会', '徒步', '公益', '节日雅集']

// 这个数组保存报名状态选项，返回值用于报名状态下拉框。
const registrationStatuses: Array<{ label: string; value: EventRegistrationStatus }> = [
  { label: '已报名', value: 'registered' },
  { label: '已取消', value: 'cancelled' },
  { label: '已参加', value: 'attended' }
]

// 这个对象保存报名状态颜色，入参是报名状态，返回值用于状态章。
const registrationToneMap: Record<EventRegistrationStatus, 'green' | 'gray' | 'gold'> = {
  registered: 'green',
  cancelled: 'gray',
  attended: 'gold'
}

// 这个对象保存活动发布状态中文文案，入参是数据库状态，返回值用于后台表格展示。
const publishStatusLabels: Record<PublishStatus, string> = {
  draft: '草稿',
  published: '已发布',
  closed: '已关闭',
  ended: '已结束'
}

// 这个对象保存活动发布状态颜色，入参是数据库状态，返回值用于状态章。
const publishStatusTones: Record<PublishStatus, 'green' | 'gold' | 'gray'> = {
  draft: 'gold',
  published: 'green',
  closed: 'gray',
  ended: 'gray'
}

// 这个函数渲染活动管理页，入参为空，返回值是设计稿第五屏样式的活动创建和报名台账。
export function AdminEventsPage() {
  // 这个状态保存活动列表。
  const [events, setEvents] = useState<WenyunEvent[]>([])
  // 这个状态保存活动报名列表。
  const [registrations, setRegistrations] = useState<EventRegistration[]>([])
  // 这个状态保存活动创建表单。
  const [form, setForm] = useState<EventForm>(initialForm)
  // 这个状态保存正在创建活动的标记。
  const [submitting, setSubmitting] = useState(false)
  // 这个状态保存正在修改报名状态的编号。
  const [updatingRegistrationId, setUpdatingRegistrationId] = useState('')
  // 这个状态保存页面提示。
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

  // 这个函数读取报名列表，入参为空，返回值为空。
  async function loadRegistrations() {
    const result = await fetchAdminRegistrations()
    setRegistrations(result.data)

    if (!result.ok) {
      setNotice({ type: 'error', title: '读取报名失败', message: result.message })
    }
  }

  useEffect(() => {
    // 这里并行启动活动和报名读取，页面会在数据返回后自动更新。
    void loadEvents()
    void loadRegistrations()
  }, [])

  // 这个函数更新活动表单字段，入参是字段和值，返回值为空。
  function updateField(field: keyof EventForm, value: string) {
    // 这里只更新当前字段，避免输入时影响其他字段。
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

    try {
      // 这里进入提交状态，避免管理员重复创建同一活动。
      setSubmitting(true)
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
    } finally {
      // 这里恢复提交状态，保证按钮可继续使用。
      setSubmitting(false)
    }
  }

  // 这个函数更新报名状态，入参是报名编号和新状态，返回值为空。
  async function handleRegistrationStatus(id: string, status: EventRegistrationStatus) {
    try {
      // 这里进入更新状态，避免同一条报名重复提交。
      setUpdatingRegistrationId(id)
      const result = await updateEventRegistrationStatus(id, status)
      setNotice({
        type: result.ok ? 'success' : 'error',
        title: result.ok ? '报名状态已更新' : '更新失败',
        message: result.message
      })

      if (result.ok) {
        await loadRegistrations()
      }
    } finally {
      // 这里恢复更新状态，让其他报名可继续处理。
      setUpdatingRegistrationId('')
    }
  }

  return (
    <AdminPageShell index="5" title="活动管理" description="创建雅集、查看活动状态，并及时处理报名回音。">
      {notice ? <StatusNotice type={notice.type} title={notice.title} message={notice.message} /> : null}

      <div className="admin-two-column">
        <AdminPanel title="创建活动" description="活动发布后会出现在前台问云雅集页。">
          <form className="admin-form-grid" onSubmit={handleSubmit}>
            <label>
              <span>活动标题 *</span>
              <input onChange={(event) => updateField('title', event.target.value)} value={form.title} />
            </label>

            <label>
              <span>活动类型</span>
              <select onChange={(event) => updateField('type', event.target.value)} value={form.type}>
                {eventTypeOptions.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </label>

            <div className="admin-form-row">
              <label>
                <span>活动方式</span>
                <select onChange={(event) => updateField('mode', event.target.value)} value={form.mode}>
                  <option value="online">线上</option>
                  <option value="offline">线下</option>
                </select>
              </label>
              <label>
                <span>人数上限</span>
                <input min="1" onChange={(event) => updateField('capacity', event.target.value)} type="number" value={form.capacity} />
              </label>
            </div>

            <label>
              <span>活动时间</span>
              <input onChange={(event) => updateField('event_time', event.target.value)} type="datetime-local" value={form.event_time} />
            </label>

            <label>
              <span>活动地点</span>
              <input onChange={(event) => updateField('location', event.target.value)} placeholder="例如：微信群、杭州西湖、线上会议" value={form.location} />
            </label>

            <label>
              <span>活动简介</span>
              <textarea onChange={(event) => updateField('description', event.target.value)} rows={5} value={form.description} />
            </label>

            <label>
              <span>发布状态</span>
              <select onChange={(event) => updateField('status', event.target.value)} value={form.status}>
                <option value="draft">草稿</option>
                <option value="published">发布</option>
              </select>
            </label>

            <CloudButton disabled={submitting} type="submit" variant="primary">
              {submitting ? '正在创建...' : '保存活动'}
            </CloudButton>
          </form>
        </AdminPanel>

        <AdminPanel title="活动台账" description={`当前共 ${events.length} 场活动。`}>
          {events.length === 0 ? (
            <EmptyState title="暂无活动" message="创建活动后，会在这里显示。" />
          ) : (
            <div className="admin-table-wrap">
              <table className="admin-data-table">
                <thead>
                  <tr>
                    <th>活动</th>
                    <th>类型</th>
                    <th>状态</th>
                    <th>时间</th>
                    <th>人数</th>
                  </tr>
                </thead>
                <tbody>
                  {events.map((item) => (
                    <tr key={item.id}>
                      <td className="admin-table-main">
                        <strong>{item.title}</strong>
                        <span>{item.location ?? '未填写地点'}</span>
                      </td>
                      <td>
                        {item.type} · {item.mode === 'online' ? '线上' : '线下'}
                      </td>
                      <td>
                        <AdminStatusPill tone={publishStatusTones[item.status]}>{publishStatusLabels[item.status]}</AdminStatusPill>
                      </td>
                      <td>{formatAdminDate(item.event_time)}</td>
                      <td>{item.capacity ? `${item.capacity} 人` : '不限'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </AdminPanel>
      </div>

      <AdminPanel title="报名名单" description="调整报名状态后，会写入用户小院提醒并尝试发送邮件。">
        {registrations.length === 0 ? (
          <EmptyState title="暂无报名" message="同门报名问云雅集后，会在这里出现。" />
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-data-table">
              <thead>
                <tr>
                  <th>报名人</th>
                  <th>联系方式</th>
                  <th>备注</th>
                  <th>状态</th>
                  <th>报名时间</th>
                </tr>
              </thead>
              <tbody>
                {registrations.map((item) => (
                  <tr key={item.id}>
                    <td className="admin-table-main">
                      <strong>{item.nickname ?? '未填写昵称'}</strong>
                      <span>活动编号：{item.event_id}</span>
                    </td>
                    <td>{item.contact ?? '未填写'}</td>
                    <td>{item.note ?? '未填写'}</td>
                    <td>
                      <select
                        disabled={updatingRegistrationId === item.id}
                        onChange={(event) => void handleRegistrationStatus(item.id, event.target.value as EventRegistrationStatus)}
                        value={item.status}
                      >
                        {registrationStatuses.map((status) => (
                          <option key={status.value} value={status.value}>
                            {status.label}
                          </option>
                        ))}
                      </select>
                      <AdminStatusPill tone={registrationToneMap[item.status]}>{registrationStatuses.find((status) => status.value === item.status)?.label ?? item.status}</AdminStatusPill>
                    </td>
                    <td>{formatAdminDate(item.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </AdminPanel>
    </AdminPageShell>
  )
}
