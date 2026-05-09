import { useEffect, useMemo, useState } from 'react'
import { CloudButton } from '../components/CloudButton'
import { getGuofengVisualPath } from '../data/visualAssets'
import { fetchPublishedAnnouncements } from '../lib/services'
import type { Announcement } from '../lib/types'

// 这个数组保存置顶公告下方的分页圆点，返回值用于模拟设计稿的轮播提示。
const announcementDots = [0, 1, 2]

// 这个函数把数据库时间格式化为年月日，入参是时间字符串，返回值是页面展示日期。
function formatAnnouncementDate(value: string | null): string {
  if (!value) {
    return '待发布'
  }

  try {
    return new Intl.DateTimeFormat('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    })
      .format(new Date(value))
      .replace(/\//g, '-')
  } catch {
    // 这里兜底处理异常时间，避免单条坏数据导致整页报错。
    return '时间待确认'
  }
}

// 这个函数生成公告摘要，入参是公告对象，返回值是优先使用摘要、其次截取正文的短文本。
function getAnnouncementSummary(item: Announcement | null): string {
  if (!item) {
    return '山门暂未发布公开公告。'
  }

  const sourceText = item.summary?.trim() || item.content.trim()
  return sourceText.length > 86 ? `${sourceText.slice(0, 86)}……` : sourceText
}

// 这个函数渲染门派公告页面，入参为空，返回值是左侧真实置顶公告和右侧真实公告列表。
export function AnnouncementsPage() {
  // 这个状态保存从服务层读取的真实公开公告。
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  // 这个状态保存读取过程是否完成，用于无数据时给出稳定提示。
  const [loaded, setLoaded] = useState(false)
  // 这个常量保存公告页底部水墨插图地址。
  const announcementImage = getGuofengVisualPath('announcementBoard')

  useEffect(() => {
    // 这个变量记录组件是否仍然挂载，避免慢请求返回后更新已经离开的页面。
    let alive = true
    // 这里设置读取超时，避免网络长期无响应时页面一直停在“正在读取”。
    const timeoutId = window.setTimeout(() => {
      if (alive) {
        setLoaded(true)
      }
    }, 3200)

    // 这个函数读取真实公告数据，入参为空，返回值为空。
    async function loadAnnouncements() {
      try {
        const result = await fetchPublishedAnnouncements()
        if (alive) {
          setAnnouncements(result.data)
        }
      } finally {
        // 这里无论成功失败都结束加载态，服务层失败时已经提供兜底数据或空数据。
        if (alive) {
          window.clearTimeout(timeoutId)
          setLoaded(true)
        }
      }
    }

    void loadAnnouncements()

    return () => {
      alive = false
      window.clearTimeout(timeoutId)
    }
  }, [])

  // 这个常量保存置顶公告，优先使用数据库标记的置顶记录。
  const featuredAnnouncement = useMemo(
    () => announcements.find((item) => item.is_pinned) ?? announcements[0] ?? null,
    [announcements]
  )
  // 这个常量保存右侧公告列表，最多展示五条真实记录。
  const listAnnouncements = announcements.slice(0, 5)
  // 这个常量保存置顶公告封面，数据库有封面时优先使用数据库图片。
  const featuredImage = featuredAnnouncement?.cover_url?.trim() || announcementImage

  return (
    <section className="public-art-page announcement-art-page" aria-label="门派公告">
      <div className="announcement-reference-layout">
        {/* 这里还原左侧置顶公告纸卡，内容来自真实公告数据。 */}
        <article className="announcement-feature-card">
          <span className="announcement-red-label">{featuredAnnouncement?.is_pinned ? '置顶公告' : '最新公告'}</span>
          <h1>
            {featuredAnnouncement?.title ?? (loaded ? '暂无公开公告' : '正在读取公告')}
            {featuredAnnouncement?.is_pinned ? <em>置顶</em> : null}
          </h1>
          <time dateTime={featuredAnnouncement?.published_at ?? undefined}>
            {formatAnnouncementDate(featuredAnnouncement?.published_at ?? null)}
          </time>
          <p>{getAnnouncementSummary(featuredAnnouncement)}</p>
          <img alt="公告水墨山景" className="announcement-feature-image" src={featuredImage} />
          <div className="announcement-dots" aria-hidden="true">
            {announcementDots.map((dot) => (
              <i className={dot === 1 ? 'is-active' : ''} key={dot} />
            ))}
          </div>
        </article>

        {/* 这里还原右侧公告列表表格，行内容全部来自真实公告数据。 */}
        <aside className="announcement-list-card">
          <h2>公告列表</h2>
          <div className="announcement-list-rows">
            {listAnnouncements.length > 0 ? (
              listAnnouncements.map((row) => (
                <a className="announcement-list-row" href="#/announcements" key={row.id}>
                  <span>{row.category || '公告'}</span>
                  <strong>{row.title}</strong>
                  <time dateTime={row.published_at ?? undefined}>{formatAnnouncementDate(row.published_at)}</time>
                </a>
              ))
            ) : (
              <p className="announcement-empty-text">{loaded ? '暂无公开公告。' : '正在读取真实公告……'}</p>
            )}
          </div>
          <CloudButton className="announcement-more-button" to="/announcements" variant="ghost">
            查看更多公告
          </CloudButton>
        </aside>
      </div>
    </section>
  )
}
