import { Clock3, Megaphone, Pin, ScrollText } from 'lucide-react'
import { useEffect, useState } from 'react'
import { CloudButton } from '../components/CloudButton'
import { PageShell } from '../components/PageShell'
import { ScrollPanel } from '../components/ScrollPanel'
import { SectionTitle } from '../components/SectionTitle'
import { StatusNotice } from '../components/StatusNotice'
import { fetchPublishedAnnouncements } from '../lib/services'
import type { Announcement } from '../lib/types'

// 这个函数格式化日期，入参是时间字符串，返回值是适合中文页面展示的日期。
function formatDate(value: string | null): string {
  if (!value) {
    return '暂未发布'
  }

  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(value))
}

// 这个数组保存暂无公告时的榜文占位内容，入参为空，返回值用于保持设计稿里的右侧公告索引。
const emptyAnnouncementRows = [
  { title: '门规修订', text: '若有新的门规说明，执事会在这里写清缘由与影响范围。' },
  { title: '雅集通知', text: '线上清谈、线下相逢与报名变化，会按发布时间排列。' },
  { title: '金典校订', text: '金典文字若有调整，会同步说明调整位置与阅读建议。' }
]

// 这个函数渲染公告列表页，入参为空，返回值是公开公告列表。
export function AnnouncementsPage() {
  // 这个状态保存公告数据。
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  // 这个状态保存提示信息。
  const [notice, setNotice] = useState('')

  useEffect(() => {
    // 这个函数读取公告，入参为空，返回值为空。
    async function loadAnnouncements() {
      const result = await fetchPublishedAnnouncements()
      setAnnouncements(result.data)

      if (result.demoMode) {
        setNotice('当前为演示公告，配置 Supabase 后会读取后台发布的真实公告。')
      }
    }

    void loadAnnouncements()
  }, [])

  // 这个变量保存置顶公告或最新公告，返回值用于左侧大榜文。
  const featuredAnnouncement = announcements.find((item) => item.is_pinned) ?? announcements[0] ?? null
  // 这个变量保存重点公告之外的短公告，返回值用于设计稿右侧和下方列表。
  const sideAnnouncements = featuredAnnouncement
    ? announcements.filter((item) => item.id !== featuredAnnouncement.id)
    : announcements

  return (
    <PageShell size="wide">
      <SectionTitle center eyebrow="门派公告" title="山门有讯，灯火相传" visual="announcements">
        山门公告、门规更新、活动通知与金典修订都会在这里发布。
      </SectionTitle>

      {notice ? <StatusNotice title="演示模式提示" message={notice} /> : null}

      <div className="announcement-board-layout mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(19rem,0.42fr)]">
        <ScrollPanel className="announcement-feature-panel seal-mark-bg">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="inline-flex items-center gap-2 rounded-full bg-[#fff8e8] px-3 py-1 text-sm font-semibold text-[#9e3d32]">
              <Megaphone className="h-4 w-4" />
              山门榜文
            </span>
            <span className="inline-flex items-center gap-2 rounded-full border border-[#c9a45c]/35 bg-white/70 px-3 py-1 text-sm text-[#7a6a48]">
              <Clock3 className="h-4 w-4" />
              {featuredAnnouncement ? formatDate(featuredAnnouncement.published_at) : '静候发布'}
            </span>
          </div>

          {featuredAnnouncement ? (
            <>
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <span className="rounded-full bg-[#edf3ef] px-3 py-1 text-sm text-[#6f8f8b]">{featuredAnnouncement.category}</span>
                {featuredAnnouncement.is_pinned ? (
                  <span className="inline-flex items-center gap-2 rounded-full bg-[#9e3d32] px-3 py-1 text-sm text-white">
                    <Pin className="h-4 w-4" />
                    置顶
                  </span>
                ) : null}
              </div>
              <h2 className="ink-title mt-6 text-balance text-4xl font-bold leading-tight text-[#143044] md:text-5xl">
                {featuredAnnouncement.title}
              </h2>
              <p className="mt-5 max-w-3xl text-lg leading-9 text-[#526461]">{featuredAnnouncement.summary}</p>
              <p className="mt-6 border-t border-[#c9a45c]/25 pt-6 leading-9 text-[#40524f]">{featuredAnnouncement.content}</p>
            </>
          ) : (
            <div className="announcement-empty-ledger mt-8">
              <ScrollText className="h-10 w-10 text-[#6f8f8b]" />
              <h2 className="ink-title mt-5 text-4xl font-bold text-[#143044]">暂无山门公告</h2>
              <p className="mt-4 max-w-2xl leading-8 text-[#526461]">待后台发布公告后，榜文会在这里铺开；当前先保留完整公告版式，方便查看页面设计。</p>
            </div>
          )}
        </ScrollPanel>

        <aside className="announcement-side-stack grid gap-4">
          <ScrollPanel className="announcement-side-card">
            <p className="text-sm font-semibold text-[#9e3d32]">公告索引</p>
            <h2 className="ink-title mt-2 text-2xl font-bold text-[#143044]">近讯总览</h2>
            <p className="mt-3 text-sm leading-7 text-[#526461]">置顶、门规、雅集和金典修订都会先在这里汇总，便于同门快速确认。</p>
            <div className="mt-5 grid gap-2">
              {announcements.length > 0 ? (
                announcements.map((item) => (
                  <div className="rounded-lg border border-[#c9a45c]/25 bg-white/60 p-3" key={item.id}>
                    <p className="text-sm font-semibold text-[#143044]">{item.title}</p>
                    <p className="mt-1 text-xs text-[#7a6a48]">
                      {item.category} · {formatDate(item.published_at)}
                    </p>
                  </div>
                ))
              ) : (
                emptyAnnouncementRows.map((item) => (
                  <div className="rounded-lg border border-dashed border-[#c9a45c]/35 bg-white/55 p-3" key={item.title}>
                    <p className="text-sm font-semibold text-[#143044]">{item.title}</p>
                    <p className="mt-1 text-xs leading-6 text-[#526461]">{item.text}</p>
                  </div>
                ))
              )}
            </div>
          </ScrollPanel>

          <ScrollPanel className="announcement-side-card">
            <p className="text-sm font-semibold text-[#9e3d32]">山门提醒</p>
            <p className="mt-3 leading-8 text-[#526461]">公告只写确定之事。若内容涉及报名、规则或联系信息，请以此页最新榜文为准。</p>
            <CloudButton className="mt-5 w-full" to="/contact" variant="ghost">
              联系山门确认
            </CloudButton>
          </ScrollPanel>
        </aside>
      </div>

      {sideAnnouncements.length > 0 ? (
        <div className="announcement-list-strip mt-6 grid gap-4 md:grid-cols-2">
          {sideAnnouncements.map((item) => (
            <ScrollPanel key={item.id}>
              <div className="flex flex-wrap items-center gap-3">
                <span className="inline-flex items-center gap-2 rounded-full bg-[#edf3ef] px-3 py-1 text-sm text-[#6f8f8b]">
                  <Megaphone className="h-4 w-4" />
                  {item.category}
                </span>
                <span className="text-sm text-[#7a6a48]">{formatDate(item.published_at)}</span>
              </div>
              <h2 className="mt-4 text-2xl font-bold text-[#143044]">{item.title}</h2>
              <p className="mt-4 leading-8 text-[#526461]">{item.summary}</p>
            </ScrollPanel>
          ))}
        </div>
      ) : null}
    </PageShell>
  )
}
