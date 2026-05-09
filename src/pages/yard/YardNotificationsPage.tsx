import { CheckCheck, Mail } from 'lucide-react'
import { useEffect, useState } from 'react'
import { StatusNotice } from '../../components/StatusNotice'
import { YardEmptyBox, YardPageBanner, YardPaperCard, YardStatusPill } from '../../components/YardGuofengFrame'
import { getFriendlyErrorMessage } from '../../lib/errorMessage'
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
    // 这里时间异常时返回原始内容，避免单条提醒破坏整页。
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

// 这个函数把提醒业务类型转成中文，入参是类型，返回值是中文标签。
function formatNotificationKind(kind: UserNotification['kind']): string {
  if (kind === 'application') {
    return '名帖'
  }

  if (kind === 'lantern') {
    return '云灯'
  }

  return '雅集'
}

// 这个函数渲染消息提醒页，入参为空，返回值是站内提醒列表。
export function YardNotificationsPage() {
  // 这个状态保存提醒列表。
  const [notifications, setNotifications] = useState<UserNotification[]>([])
  // 这个状态保存正在操作的提醒编号。
  const [workingId, setWorkingId] = useState('')
  // 这个状态保存页面是否正在读取。
  const [loading, setLoading] = useState(true)
  // 这个状态保存页面提示。
  const [notice, setNotice] = useState<{ type: 'success' | 'error' | 'info'; title: string; message: string } | null>(null)

  // 这个函数读取提醒列表，入参为空，返回值为空。
  async function loadNotifications() {
    try {
      const result = await fetchMyNotifications()
      setNotifications(result.data)

      if (!result.ok) {
        setNotice({ type: 'error', title: '读取失败', message: result.message })
      } else if (result.demoMode) {
        setNotice({ type: 'info', title: '演示模式提示', message: result.message })
      }
    } catch (error) {
      // 这里捕获读取异常，让提醒页在网络不稳时仍有可理解提示。
      setNotice({ type: 'error', title: '读取失败', message: getFriendlyErrorMessage(error) })
    } finally {
      // 这里结束加载状态，保证空提醒可以正常显示。
      setLoading(false)
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
    } catch (error) {
      // 这里捕获标记已读异常，避免操作失败后按钮一直卡住。
      setNotice({ type: 'error', title: '操作失败', message: getFriendlyErrorMessage(error) })
    } finally {
      setWorkingId('')
    }
  }

  // 这个变量保存未读提醒数量，返回值用于页签统计。
  const unreadCount = notifications.filter((item) => !item.read_at).length
  // 这个变量保存雅集提醒数量，返回值用于页签统计。
  const eventCount = notifications.filter((item) => item.kind === 'event').length
  // 这个变量保存名帖提醒数量，返回值用于页签统计。
  const applicationCount = notifications.filter((item) => item.kind === 'application').length
  // 这个变量保存云灯提醒数量，返回值用于页签统计。
  const lanternCount = notifications.filter((item) => item.kind === 'lantern').length

  return (
    <div className="yard-page-stack">
      <YardPageBanner
        indexLabel="6 消息提醒"
        subtitle="名帖、云灯和雅集状态变化会写入这里，重要回音不会走丢。"
        title="小院来信，灯火有回音"
        visual="yardNotifications"
      />

      {notice ? <StatusNotice type={notice.type} title={notice.title} message={notice.message} /> : null}
      {loading ? <StatusNotice title="正在读取提醒" message="请稍候，正在整理小院来信。" /> : null}

      <YardPaperCard className="yard-filter-card">
        <div className="yard-filter-tabs" aria-label="消息类型统计">
          <span className="yard-filter-tab-active">全部 {notifications.length}</span>
          <span>未读 {unreadCount}</span>
          <span>雅集 {eventCount}</span>
          <span>名帖 {applicationCount}</span>
          <span>云灯 {lanternCount}</span>
        </div>

        {!loading && notifications.length === 0 ? (
          <YardEmptyBox title="暂无消息" message="等山门有回音，消息会在这里出现。" />
        ) : (
          <div className="yard-notice-timeline">
            {notifications.map((item) => (
              <article className={`yard-notice-row ${item.read_at ? 'yard-notice-row-read' : ''}`} key={item.id}>
                <span className="yard-notice-dot" />
                <div className="yard-notice-content">
                  <div className="yard-notice-head">
                    <div>
                      <YardStatusPill tone={item.read_at ? 'muted' : 'seal'}>{item.read_at ? '已读' : '未读'}</YardStatusPill>
                      <YardStatusPill tone="gold">{formatNotificationKind(item.kind)}</YardStatusPill>
                    </div>
                    <time>{formatDateTime(item.created_at)}</time>
                  </div>
                  <h2>{item.title}</h2>
                  <p>{item.content}</p>
                  <div className="yard-notice-foot">
                    <span>
                      <Mail className="h-4 w-4" />
                      邮件状态：{formatEmailStatus(item.email_status)}
                    </span>
                    {item.email_error ? <strong>失败原因：{item.email_error}</strong> : null}
                    {!item.read_at ? (
                      <button className="yard-mini-button" disabled={workingId === item.id} onClick={() => void handleRead(item.id)} type="button">
                        {workingId === item.id ? '正在标记...' : '标记已读'}
                        <CheckCheck className="h-4 w-4" />
                      </button>
                    ) : null}
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </YardPaperCard>
    </div>
  )
}
