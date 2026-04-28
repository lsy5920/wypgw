import { CheckCheck, Mail } from 'lucide-react'
import { useEffect, useState } from 'react'
import { CloudButton } from '../../components/CloudButton'
import { EmptyState } from '../../components/EmptyState'
import { ScrollPanel } from '../../components/ScrollPanel'
import { SectionTitle } from '../../components/SectionTitle'
import { StatusNotice } from '../../components/StatusNotice'
import { fetchMyNotifications, markNotificationRead } from '../../lib/services'
import type { NotificationEmailStatus, UserNotification } from '../../lib/types'

// 这个函数格式化时间，入参是数据库时间，返回值是中文日期时间。
function formatDateTime(value: string): string {
  try {
    return new Date(value).toLocaleString('zh-CN', {
      hour12: false,
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  } catch {
    return value
  }
}

// 这个函数把邮件状态转成中文，入参是状态，返回值是中文展示。
function formatEmailStatus(status: NotificationEmailStatus): string {
  const labels: Record<NotificationEmailStatus, string> = {
    pending: '待发送',
    sent: '已发送',
    failed: '发送失败',
    skipped: '已跳过'
  }

  return labels[status]
}

// 这个函数渲染消息提醒页，入参为空，返回值是站内提醒列表。
export function YardNotificationsPage() {
  // 这个状态保存提醒列表。
  const [notifications, setNotifications] = useState<UserNotification[]>([])
  // 这个状态保存正在操作的提醒编号。
  const [workingId, setWorkingId] = useState('')
  // 这个状态保存页面提示。
  const [notice, setNotice] = useState<{ type: 'success' | 'error' | 'info'; title: string; message: string } | null>(null)

  // 这个函数读取提醒列表，入参为空，返回值为空。
  async function loadNotifications() {
    const result = await fetchMyNotifications()
    setNotifications(result.data)

    if (!result.ok) {
      setNotice({ type: 'error', title: '读取失败', message: result.message })
    } else if (result.demoMode) {
      setNotice({ type: 'info', title: '演示模式提示', message: result.message })
    }
  }

  useEffect(() => {
    void loadNotifications()
  }, [])

  // 这个函数标记提醒已读，入参是提醒编号，返回值为空。
  async function handleRead(id: string) {
    try {
      setWorkingId(id)
      const result = await markNotificationRead(id)
      setNotice({
        type: result.ok ? 'success' : 'error',
        title: result.ok ? '已读' : '操作失败',
        message: result.message
      })

      if (result.ok) {
        await loadNotifications()
      }
    } finally {
      setWorkingId('')
    }
  }

  return (
    <div>
      <SectionTitle eyebrow="消息提醒" title="小院来信，灯火有回音">
        名帖、云灯和雅集状态变化会写入这里。若 SMTP 已配置，也会同步尝试发送邮件。
      </SectionTitle>

      {notice ? <StatusNotice type={notice.type} title={notice.title} message={notice.message} /> : null}

      <div className="mt-8 grid gap-5">
        {notifications.length === 0 ? (
          <EmptyState title="暂无消息" message="等山门有回音，消息会在这里出现。" />
        ) : (
          notifications.map((item) => (
            <ScrollPanel key={item.id}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs text-[#9e3d32]">{formatDateTime(item.created_at)}</p>
                  <h2 className="mt-2 text-2xl font-bold text-[#143044]">{item.title}</h2>
                </div>
                <span className="rounded-full bg-[#edf3ef] px-3 py-1 text-sm text-[#6f8f8b]">
                  {item.read_at ? '已读' : '未读'}
                </span>
              </div>
              <p className="mt-4 leading-8 text-[#526461]">{item.content}</p>
              <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#c9a45c]/25 bg-white/55 p-4 text-sm text-[#526461]">
                <p className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-[#c9a45c]" />
                  邮件状态：{formatEmailStatus(item.email_status)}
                </p>
                {item.email_error ? <p className="text-[#9e3d32]">失败原因：{item.email_error}</p> : null}
                {!item.read_at ? (
                  <CloudButton className="min-h-10 px-4 py-2" disabled={workingId === item.id} onClick={() => void handleRead(item.id)}>
                    {workingId === item.id ? '正在标记...' : '标记已读'}
                    <CheckCheck className="h-4 w-4" />
                  </CloudButton>
                ) : null}
              </div>
            </ScrollPanel>
          ))
        )}
      </div>
    </div>
  )
}
