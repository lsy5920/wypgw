import { Bell, CalendarDays, Lamp, QrCode, ScrollText, ShieldQuestion, X } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { EmptyState } from '../../components/EmptyState'
import { ScrollPanel } from '../../components/ScrollPanel'
import { SectionTitle } from '../../components/SectionTitle'
import { StatusNotice } from '../../components/StatusNotice'
import { applicationStatusLabels, lanternStatusLabels } from '../../data/siteContent'
import { fetchGuiyuntangSetting, fetchYardOverview } from '../../lib/services'
import type { GuiyuntangSetting, JoinApplication, YardOverview } from '../../lib/types'

// 这个函数格式化日期，入参是数据库时间字符串，返回值是中文日期。
function formatDate(value: string): string {
  try {
    return new Date(value).toLocaleDateString('zh-CN')
  } catch {
    return value
  }
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

  return '暂无报名'
}

// 这个函数判断名帖是否已经可以查看归云堂二维码，入参是名帖，返回值表示是否允许展示入口。
function canViewGuiyuntang(application: JoinApplication | undefined): boolean {
  // 这里只有审核通过、已联系、已入群三种状态能看到二维码，未审核和拒绝都不能看到。
  return Boolean(application && ['approved', 'contacted', 'joined'].includes(application.status))
}

// 这个函数判断是否需要醒目弹窗提醒入群，入参是名帖，返回值表示是否弹窗。
function shouldPopupGuiyuntang(application: JoinApplication | undefined): boolean {
  // 这里已入群表示管理员确认完成，不再弹窗；但仍会保留查看入口。
  return Boolean(application && ['approved', 'contacted'].includes(application.status))
}

// 这个函数渲染问云小院总览页，入参为空，返回值是用户后台首页。
export function YardDashboardPage() {
  // 这个状态保存小院总览数据。
  const [overview, setOverview] = useState<YardOverview | null>(null)
  // 这个状态保存归云堂二维码设置，只有符合条件的用户才能通过数据库 RLS 读取。
  const [guiyuntangSetting, setGuiyuntangSetting] = useState<GuiyuntangSetting | null>(null)
  // 这个状态控制归云堂二维码弹窗是否打开。
  const [guiyuntangOpen, setGuiyuntangOpen] = useState(false)
  // 这个状态保存页面提示。
  const [notice, setNotice] = useState<{ type: 'success' | 'error' | 'info'; title: string; message: string } | null>(null)

  useEffect(() => {
    // 这个函数读取小院总览，入参为空，返回值为空。
    async function loadOverview() {
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
    }

    void loadOverview()
  }, [])

  if (!overview) {
    return <StatusNotice title="正在整理小院" message="请稍候，正在读取你的名帖、云灯、雅集和提醒。" />
  }

  const latestApplication = overview.applications[0]
  const latestLantern = overview.lanterns[0]
  const latestRegistration = overview.registrations[0]
  const latestNotifications = overview.notifications.slice(0, 4)
  const latestQuiz = overview.quizResult
  const guiyuntangApplication = overview.applications.find((item) => canViewGuiyuntang(item))
  const canShowGuiyuntang = Boolean(guiyuntangSetting?.enabled && guiyuntangSetting.qr_image_data_url && guiyuntangApplication)

  return (
    <div>
      <SectionTitle eyebrow="问云小院" title={`${overview.profile.nickname}，欢迎回院`}>
        这里收着你的名帖、云灯、雅集报名和状态提醒。愿小院清静，也愿来路从容。
      </SectionTitle>

      {notice ? <StatusNotice type={notice.type} title={notice.title} message={notice.message} /> : null}

      {guiyuntangOpen && canShowGuiyuntang ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#143044]/55 px-4 py-8 backdrop-blur-sm">
          <div className="max-h-[92vh] w-full max-w-md overflow-auto rounded-[2rem] border border-[#c9a45c]/45 bg-[#fffaf0] p-5 shadow-2xl shadow-[#143044]/25">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-[#9e3d32]">名帖已通过</p>
                <h2 className="ink-title mt-1 text-3xl font-bold text-[#143044]">请入归云堂</h2>
              </div>
              <button
                aria-label="关闭归云堂二维码"
                className="rounded-full border border-[#6f8f8b]/20 bg-white/80 p-2 text-[#526461]"
                onClick={() => setGuiyuntangOpen(false)}
                type="button"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <p className="mt-3 text-sm leading-7 text-[#526461]">{guiyuntangSetting?.instruction}</p>
            <div className="mt-5 rounded-3xl border border-[#c9a45c]/35 bg-white p-4">
              <img
                alt="归云堂入群二维码"
                className="mx-auto aspect-square w-full max-w-72 rounded-2xl object-contain"
                src={guiyuntangSetting?.qr_image_data_url ?? ''}
              />
            </div>
            <div className="mt-4 rounded-2xl border border-[#9e3d32]/25 bg-[#fff1ee] p-4 text-sm leading-7 text-[#7a342d]">
              {guiyuntangSetting?.warning}
            </div>
            <button
              className="mt-5 w-full rounded-full bg-[#9e3d32] px-5 py-3 font-semibold text-white shadow-lg shadow-[#9e3d32]/20"
              onClick={() => setGuiyuntangOpen(false)}
              type="button"
            >
              我已知晓，暂先收起
            </button>
          </div>
        </div>
      ) : null}

      <div className="mt-8 grid gap-4 md:grid-cols-5">
        <ScrollPanel>
          <ScrollText className="h-5 w-5 text-[#9e3d32]" />
          <p className="mt-3 text-sm text-[#7a6a48]">我的名帖</p>
          <p className="mt-2 text-3xl font-bold text-[#143044]">{overview.applications.length}</p>
          <p className="mt-2 text-sm text-[#526461]">
            {latestApplication ? applicationStatusLabels[latestApplication.status] : '尚未递帖'}
          </p>
        </ScrollPanel>
        <ScrollPanel>
          <Lamp className="h-5 w-5 text-[#c9a45c]" />
          <p className="mt-3 text-sm text-[#7a6a48]">我的云灯</p>
          <p className="mt-2 text-3xl font-bold text-[#143044]">{overview.lanterns.length}</p>
          <p className="mt-2 text-sm text-[#526461]">
            {latestLantern ? lanternStatusLabels[latestLantern.status] : '尚未点灯'}
          </p>
        </ScrollPanel>
        <ScrollPanel>
          <CalendarDays className="h-5 w-5 text-[#6f8f8b]" />
          <p className="mt-3 text-sm text-[#7a6a48]">雅集报名</p>
          <p className="mt-2 text-3xl font-bold text-[#143044]">{overview.registrations.length}</p>
          <p className="mt-2 text-sm text-[#526461]">{formatRegistrationStatus(latestRegistration?.status ?? null)}</p>
        </ScrollPanel>
        <ScrollPanel>
          <ShieldQuestion className="h-5 w-5 text-[#6f8f8b]" />
          <p className="mt-3 text-sm text-[#7a6a48]">问心考核</p>
          <p className="mt-2 text-3xl font-bold text-[#143044]">{latestQuiz ? latestQuiz.score : '未考'}</p>
          <p className="mt-2 text-sm text-[#526461]">{latestQuiz?.passed ? '已合格，可登记' : '未合格或未参加'}</p>
        </ScrollPanel>
        <ScrollPanel>
          <Bell className="h-5 w-5 text-[#9e3d32]" />
          <p className="mt-3 text-sm text-[#7a6a48]">消息提醒</p>
          <p className="mt-2 text-3xl font-bold text-[#143044]">{overview.notifications.length}</p>
          <p className="mt-2 text-sm text-[#526461]">最近 {latestNotifications.length} 条</p>
        </ScrollPanel>
      </div>

      <div className="mt-8 grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
        <ScrollPanel>
          <h2 className="ink-title text-2xl font-bold text-[#143044]">最近提醒</h2>
          <div className="mt-5 grid gap-3">
            {latestNotifications.length === 0 ? (
              <EmptyState title="暂无提醒" message="名帖、云灯和雅集有变化时，会在这里亮起一盏小灯。" />
            ) : (
              latestNotifications.map((item) => (
                <div className="rounded-2xl border border-[#c9a45c]/25 bg-white/60 p-4" key={item.id}>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-semibold text-[#143044]">{item.title}</p>
                    <span className="text-xs text-[#7a6a48]">{formatDate(item.created_at)}</span>
                  </div>
                  <p className="mt-2 text-sm leading-7 text-[#526461]">{item.content}</p>
                </div>
              ))
            )}
          </div>
        </ScrollPanel>

        <ScrollPanel>
          <h2 className="ink-title text-2xl font-bold text-[#143044]">小院资料</h2>
          <div className="mt-5 grid gap-3 text-sm leading-7 text-[#526461]">
            <p>道名：{overview.profile.nickname}</p>
            <p>城市：{overview.profile.city ?? '未填写'}</p>
            <p>资料公开：{overview.profile.is_public ? '公开' : '不公开'}</p>
            <p>简介：{overview.profile.bio ?? '尚未写下小院自述。'}</p>
            <p>
              问心考核：
              {latestQuiz ? `${latestQuiz.score}/${latestQuiz.total_score}，${latestQuiz.passed ? '已合格' : '未合格'}` : '尚未参加'}
              <Link className="ml-2 font-semibold text-[#9e3d32]" to="/wenxin-quiz">
                去考核
              </Link>
            </p>
          </div>

          {canShowGuiyuntang ? (
            <div className="mt-5 rounded-2xl border border-[#c9a45c]/30 bg-white/65 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <QrCode className="h-5 w-5 text-[#9e3d32]" />
                  <p className="font-semibold text-[#143044]">
                    {guiyuntangApplication?.status === 'joined' ? '归云堂二维码' : '待加入归云堂'}
                  </p>
                </div>
                <button
                  className="rounded-full border border-[#9e3d32]/25 px-4 py-2 text-sm text-[#9e3d32]"
                  onClick={() => setGuiyuntangOpen(true)}
                  type="button"
                >
                  查看二维码
                </button>
              </div>
              <p className="mt-2 text-sm leading-7 text-[#526461]">
                {guiyuntangApplication?.status === 'joined'
                  ? '管理员已确认你进入归云堂，因此不再自动弹窗，但你仍可在此查看。'
                  : '名帖通过后可扫码入群，请勿外传二维码。'}
              </p>
            </div>
          ) : null}
        </ScrollPanel>
      </div>
    </div>
  )
}
