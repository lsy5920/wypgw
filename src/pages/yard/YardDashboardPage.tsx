import { Bell, CalendarDays, Lamp, QrCode, ScrollText, ShieldQuestion, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { StatusNotice } from '../../components/StatusNotice'
import { YardEmptyBox, YardMetricCard, YardPageBanner, YardPaperCard, YardStatusPill } from '../../components/YardGuofengFrame'
import { applicationStatusLabels, lanternStatusLabels } from '../../data/siteContent'
import { confirmMyGuiyuntangJoined, fetchGuiyuntangSetting, fetchYardOverview } from '../../lib/services'
import type { GuiyuntangSetting, JoinApplication, YardOverview } from '../../lib/types'
import { getFriendlyErrorMessage } from '../../lib/errorMessage'

// 这个函数格式化日期时间，入参是数据库时间字符串，返回值是中文短日期。
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
    // 这里兜底返回原始内容，避免异常日期让页面报错。
    return value
  }
}

// 这个函数把报名状态转为中文，入参是报名状态，返回值是中文展示。
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

  return '暂无报名'
}

// 这个函数判断名帖是否已经可以查看归云堂二维码，入参是名帖，返回值表示是否允许展示入口。
function canViewGuiyuntang(application: JoinApplication | undefined): boolean {
  // 这里只有审核通过和已联系两种审核状态能看到二维码，未审核和拒绝都不能看到。
  return Boolean(application && ['approved', 'contacted'].includes(application.status))
}

// 这个函数判断是否需要醒目弹窗提醒入群，入参是名帖，返回值表示是否弹窗。
function shouldPopupGuiyuntang(application: JoinApplication | undefined): boolean {
  // 这里使用独立入群字段判断是否弹窗，避免把“已入群”混进名帖审核状态。
  return Boolean(application && canViewGuiyuntang(application) && !application.guiyuntang_joined)
}

// 这个函数渲染问云小院总览页，入参为空，返回值是用户后台首页。
export function YardDashboardPage() {
  // 这个状态保存小院总览数据。
  const [overview, setOverview] = useState<YardOverview | null>(null)
  // 这个状态保存归云堂二维码设置，只有符合条件的用户才能通过数据库权限读取。
  const [guiyuntangSetting, setGuiyuntangSetting] = useState<GuiyuntangSetting | null>(null)
  // 这个状态控制归云堂二维码弹窗是否打开。
  const [guiyuntangOpen, setGuiyuntangOpen] = useState(false)
  // 这个状态表示用户正在点击“我已入群”，用于避免重复提交。
  const [confirmingGuiyuntang, setConfirmingGuiyuntang] = useState(false)
  // 这个状态保存页面提示。
  const [notice, setNotice] = useState<{ type: 'success' | 'error' | 'info'; title: string; message: string } | null>(null)

  useEffect(() => {
    // 这个函数读取小院总览，入参为空，返回值为空。
    async function loadOverview() {
      try {
        const [result, guiyuntangResult] = await Promise.all([fetchYardOverview(), fetchGuiyuntangSetting()])
        setOverview(result.data)
        setGuiyuntangSetting(guiyuntangResult.ok ? guiyuntangResult.data : null)

        if (!result.ok) {
          setNotice({ type: 'error', title: '读取小院失败', message: result.message })
        } else if (result.demoMode) {
          setNotice({ type: 'info', title: '演示模式提示', message: result.message })
        }

        // 这里在名帖审核通过后自动弹出归云堂二维码，用户已入群后不再弹窗。
        const application = result.data.applications.find((item) => canViewGuiyuntang(item))

        if (
          result.ok &&
          guiyuntangResult.ok &&
          guiyuntangResult.data?.enabled &&
          guiyuntangResult.data.qr_image_data_url &&
          shouldPopupGuiyuntang(application)
        ) {
          setGuiyuntangOpen(true)
        }
      } catch (error) {
        // 这里捕获网络或运行时异常，保证页面长期运行时不会白屏。
        setNotice({ type: 'error', title: '读取小院失败', message: getFriendlyErrorMessage(error) })
      }
    }

    void loadOverview()
  }, [])

  if (!overview) {
    return <StatusNotice title="正在整理小院" message="请稍候，正在读取你的名帖、云灯、雅集和提醒。" />
  }

  // 这个变量保存最新名帖，返回值用于总览指标和资料卡片。
  const latestApplication = overview.applications[0]
  // 这个变量保存最新云灯，返回值用于总览指标。
  const latestLantern = overview.lanterns[0]
  // 这个变量保存最新雅集报名，返回值用于总览指标。
  const latestRegistration = overview.registrations[0]
  // 这个变量保存最近提醒列表，返回值用于总览提醒卡。
  const latestNotifications = overview.notifications.slice(0, 4)
  // 这个变量保存最新问心考核结果，返回值用于指标卡。
  const latestQuiz = overview.quizResult
  // 这个变量保存可查看归云堂二维码的名帖，返回值用于弹窗和卡片入口。
  const guiyuntangApplication = overview.applications.find((item) => canViewGuiyuntang(item))
  // 这个变量表示是否可以展示归云堂二维码入口。
  const canShowGuiyuntang = Boolean(guiyuntangSetting?.enabled && guiyuntangSetting.qr_image_data_url && guiyuntangApplication)

  // 这个函数确认用户已进入归云堂，入参为空，返回值为空。
  async function handleConfirmGuiyuntangJoined() {
    if (!overview || !guiyuntangApplication) {
      setNotice({ type: 'error', title: '确认失败', message: '没有找到可确认的名帖，请刷新小院后再试。' })
      return
    }

    try {
      // 这里进入提交状态，防止用户连续点击按钮。
      setConfirmingGuiyuntang(true)
      const result = await confirmMyGuiyuntangJoined(guiyuntangApplication.id)

      if (result.ok && result.data) {
        // 这里把更新后的名帖同步到当前总览，弹窗会立即收起。
        setOverview((current) =>
          current
            ? {
                ...current,
                applications: current.applications.map((item) => (item.id === result.data?.id ? result.data : item))
              }
            : current
        )
        setGuiyuntangOpen(false)
      }

      setNotice({
        type: result.ok ? 'success' : 'error',
        title: result.ok ? '已确认入群' : '确认失败',
        message: result.message
      })
    } catch (error) {
      // 这里捕获提交异常，避免按钮卡住或页面崩溃。
      setNotice({ type: 'error', title: '确认失败', message: getFriendlyErrorMessage(error) })
    } finally {
      // 这里无论成功失败都恢复按钮可点击。
      setConfirmingGuiyuntang(false)
    }
  }

  return (
    <div className="yard-page-stack">
      <YardPageBanner
        indexLabel="1 小院总览"
        subtitle="愿你在小院安心停靠，今日也从清明处出发。"
        title={`${overview.profile.nickname}，欢迎回院`}
        visual="yardDashboard"
      />

      {notice ? <StatusNotice type={notice.type} title={notice.title} message={notice.message} /> : null}

      {guiyuntangOpen && canShowGuiyuntang ? (
        <div className="yard-modal-backdrop">
          <div className="yard-modal-card">
            <div className="yard-modal-head">
              <div>
                <p>名帖已通过</p>
                <h2>请入归云堂</h2>
              </div>
              <button aria-label="关闭归云堂二维码" onClick={() => setGuiyuntangOpen(false)} type="button">
                <X className="h-5 w-5" />
              </button>
            </div>
            <p className="yard-modal-text">{guiyuntangSetting?.instruction}</p>
            <div className="yard-qr-card">
              <img alt="归云堂入群二维码" src={guiyuntangSetting?.qr_image_data_url ?? ''} />
            </div>
            <div className="yard-modal-warning">{guiyuntangSetting?.warning}</div>
            <button className="yard-action-button yard-action-button-full" disabled={confirmingGuiyuntang} onClick={() => void handleConfirmGuiyuntangJoined()} type="button">
              {confirmingGuiyuntang ? '正在确认...' : '我已入群'}
            </button>
            <button className="yard-action-button-muted yard-action-button-full" onClick={() => setGuiyuntangOpen(false)} type="button">
              我已知晓，暂先收起
            </button>
          </div>
        </div>
      ) : null}

      <div className="yard-metric-grid">
        <YardMetricCard icon="roster" label="我的名帖" note={latestApplication ? applicationStatusLabels[latestApplication.status] : '等待递帖'} tone="gold" value={overview.applications.length} />
        <YardMetricCard icon="lantern" label="我的云灯" note={latestLantern ? lanternStatusLabels[latestLantern.status] : '尚未点灯'} tone="paper" value={overview.lanterns.length} />
        <YardMetricCard icon="calendar" label="我的雅集" note={formatRegistrationStatus(latestRegistration?.status ?? null)} tone="jade" value={overview.registrations.length} />
        <YardMetricCard icon="shieldCheck" label="问心考核" note={latestQuiz?.passed ? '已合格' : '未合格或未参加'} tone="purple" value={latestQuiz ? `${latestQuiz.score}分` : '未考'} />
        <YardMetricCard icon="bell" label="消息提醒" note={`未读 ${overview.notifications.filter((item) => !item.read_at).length} 条`} tone="seal" value={overview.notifications.length} />
      </div>

      <div className="yard-two-column">
        <YardPaperCard
          action={
            <Link className="yard-small-link" to="/yard/notifications">
              查看全部提醒
            </Link>
          }
          subtitle="名帖、云灯、雅集有回音时，会先落到这里。"
          title="最近提醒"
        >
          {latestNotifications.length === 0 ? (
            <YardEmptyBox title="暂无提醒" message="等山门有回音，消息会在这里亮起。" />
          ) : (
            <div className="yard-brief-list">
              {latestNotifications.map((item) => (
                <article className="yard-brief-row" key={item.id}>
                  <div>
                    <YardStatusPill tone={item.read_at ? 'muted' : 'seal'}>{item.read_at ? '已读' : '未读'}</YardStatusPill>
                    <strong>{item.title}</strong>
                    <p>{item.content}</p>
                  </div>
                  <time>{formatDateTime(item.created_at)}</time>
                </article>
              ))}
            </div>
          )}
        </YardPaperCard>

        <YardPaperCard
          action={
            <Link className="yard-small-link" to="/yard/profile">
              查看我的资料
            </Link>
          }
          subtitle="道名、城市、自述与问心状态汇总。"
          title="小院资料"
        >
          <div className="yard-profile-card">
            <div className="yard-profile-avatar">
              {overview.profile.avatar_url ? <img alt="" src={overview.profile.avatar_url} /> : <ScrollText className="h-8 w-8" />}
            </div>
            <div>
              <h3>{overview.profile.nickname}</h3>
              <p>同门 · {overview.profile.city ?? '未填写城市'}</p>
            </div>
          </div>
          <dl className="yard-info-list">
            <div>
              <dt>资料公开</dt>
              <dd>{overview.profile.is_public ? '已公开' : '未公开'}</dd>
            </div>
            <div>
              <dt>小院自述</dt>
              <dd>{overview.profile.bio ?? '尚未写下小院自述。'}</dd>
            </div>
            <div>
              <dt>问心考核</dt>
              <dd>
                {latestQuiz ? `${latestQuiz.score}/${latestQuiz.total_score}，${latestQuiz.passed ? '已合格' : '未合格'}` : '尚未参加'}
                <Link className="yard-inline-link" to="/wenxin-quiz">
                  去考核
                </Link>
              </dd>
            </div>
          </dl>

          {canShowGuiyuntang ? (
            <div className="yard-quiet-callout">
              <QrCode className="h-5 w-5" />
              <div>
                <strong>{guiyuntangApplication?.guiyuntang_joined ? '归云堂二维码' : '待加入归云堂'}</strong>
                <p>{guiyuntangApplication?.guiyuntang_joined ? '你已确认进入归云堂，仍可在此查看二维码。' : '名帖通过后可扫码入群，请勿外传二维码。'}</p>
              </div>
              <button className="yard-mini-button" onClick={() => setGuiyuntangOpen(true)} type="button">
                查看
              </button>
            </div>
          ) : null}
        </YardPaperCard>
      </div>
    </div>
  )
}
