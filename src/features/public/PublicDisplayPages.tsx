import { useEffect, useMemo, useState } from 'react'
import { canonText, sectRoles, spiritItems } from '../../data/siteContent'
import { getGuofengVisualPath } from '../../data/visualAssets'
import type { Announcement, RosterEntry, SiteSetting, WenyunEvent } from '../../lib/types'
import { fetchPublishedAnnouncements, fetchPublishedEvents, fetchPublicRoster, fetchSettings } from '../../shared/services'
import { EmptyState, LoadingBlock, MissionCard, MissionHero, StatusPill, TaskLink, TimelineItem, formatDateTime } from '../../shared/ui/TaskUi'

// 这个接口描述金典章节，入参来自原始文本，返回值用于目录、阅读器和正文展示。
export interface CanonSection {
  // 章节编号，用于页面内部稳定识别。
  id: string
  // 章节标题，用于目录按钮和正文标题。
  title: string
  // 章节正文，用于阅读器展示。
  body: string
}

// 这个数组保存首页宗旨卡内容，顺序和 Figma 设计稿保持一致。
const homePurposeCards = [
  { title: '陪伴', text: '以其诚之心，彼此照见，在陪伴中温暖前行。' },
  { title: '清醒', text: '明心见性，觉察当下，不随境转，清明自在。' },
  { title: '成长', text: '持续精进，知行合一，在修身中遇见更好的自己。' },
  { title: '守正', text: '坚守本心，敬畏规律，不偏不倚，行稳致远。' }
]

// 这个数组保存问云七愿，返回值用于首页左侧愿文卡片。
const homeWishes = [
  '一愿 心有明灯，照见本心。',
  '二愿 清醒觉察，不负当下。',
  '三愿 温柔而行，不伤彼此。',
  '四愿 持续精进，日日向上。',
  '五愿 彼此成就，共同成长。',
  '六愿 守正笃行，不逾底线。',
  '七愿 同行自渡，予人渡己。'
]

// 这个数组保存没有线上活动时的首页兜底展示，避免真实数据为空导致设计区块塌陷。
const fallbackEvents = [
  { date: '06/01', title: '云下夜话 · 清醒与温柔', status: '报名中' },
  { date: '06/08', title: '《立派金典》共读会', status: '报名中' },
  { date: '06/15', title: '问心冥想 · 月下静修', status: '即将开始' }
]

// 这个数组保存没有公开名册时的首页兜底展示，保持名册预览和设计稿一致。
const fallbackRosterItems = [
  { name: '云舟', meta: '问云派成员 · 入派时间 2024.03.12' },
  { name: '竹心', meta: '问云派成员 · 入派时间 2024.04.12' },
  { name: '听澜', meta: '问云派成员 · 入派时间 2024.05.12' },
  { name: '若水', meta: '问云派成员 · 入派时间 2024.06.12' }
]

// 这个函数把标题转换为页面锚点，入参是章节标题和序号，返回值是稳定锚点。
function createSectionId(title: string, index: number): string {
  return `canon-${index + 1}-${title.replace(/[^\w\u4e00-\u9fa5]+/g, '-').replace(/^-+|-+$/g, '')}`
}

// 这个函数解析立派金典，入参是金典原文，返回值是章节数组。
export function parseCanonSections(raw: string): CanonSection[] {
  // 这里按二级标题切分，保留卷首说明，避免金典首页内容丢失。
  const blocks = raw
    .split(/\n(?=##\s+)/)
    .map((block) => block.trim())
    .filter(Boolean)

  return blocks.map((block, index) => {
    // 这里优先读取二级标题，第一段没有二级标题时使用金典卷首。
    const titleMatch = block.match(/^##\s+(.+)$/m)
    const title = titleMatch?.[1]?.trim() ?? '金典卷首'
    const body = block
      .replace(/^#\s+.+$/m, '')
      .replace(/^##\s+.+$/m, '')
      .replace(/^---$/gm, '')
      .trim()

    return {
      id: createSectionId(title, index),
      title,
      body
    }
  })
}

// 这个函数把长正文拆成段落，入参是正文文本，返回值是适合逐段阅读的文本数组。
function splitBodyParagraphs(body: string): string[] {
  return body
    .split(/\n{2,}/)
    .map((item) => item.trim())
    .filter(Boolean)
}

// 这个组件展示真实国风视觉图，入参是图片键和说明，返回值是带层次的官网画面。
function VisualPlate({ visual, caption }: { visual: Parameters<typeof getGuofengVisualPath>[0]; caption: string }) {
  return (
    <figure className="visual-plate">
      <img alt={caption} src={getGuofengVisualPath(visual)} />
      <figcaption className="visual-plate__caption">{caption}</figcaption>
    </figure>
  )
}

// 这个组件展示首页，入参为空，返回值是公开官网的完整首屏与业务入口。
export function HomePage() {
  // 这些状态保存首页公开数据，失败时服务层会返回演示数据。
  const [roster, setRoster] = useState<RosterEntry[]>([])
  const [events, setEvents] = useState<WenyunEvent[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // 这里并行读取首页需要的公开数据，减少首屏等待。
    async function loadHomeData() {
      const [rosterResult, eventResult] = await Promise.all([
        fetchPublicRoster(),
        fetchPublishedEvents()
      ])

      setRoster(rosterResult.data)
      setEvents(eventResult.data)
      setLoading(false)
    }

    void loadHomeData()
  }, [])

  // 这个变量整理首页活动行，优先使用真实活动数据，没有数据时使用设计稿兜底内容。
  const homeEvents = events.length > 0
    ? events.slice(0, 3).map((event) => ({
      date: event.event_time
        ? new Intl.DateTimeFormat('zh-CN', { month: '2-digit', day: '2-digit' }).format(new Date(event.event_time)).replace('-', '/')
        : '待定',
      title: event.title,
      status: event.status === 'published' ? '报名中' : '即将开始'
    }))
    : fallbackEvents

  // 这个变量整理首页名册行，优先展示公开同门，没有数据时使用设计稿兜底内容。
  const rosterPreview = roster.length > 0
    ? roster.slice(0, 4).map((item) => ({
      name: item.dao_name,
      meta: `${item.member_role} · 入派时间 ${item.joined_at ? formatDateTime(item.joined_at).slice(0, 10) : '待记录'}`
    }))
    : fallbackRosterItems

  return (
    <div className="official-home">
      <section className="home-hero" aria-label="问云派首页首屏">
        <img alt="问云派山水首屏" src={getGuofengVisualPath('homeHero')} />
        <div className="home-hero__veil" />
        <span className="home-hero__mist home-hero__mist--left" aria-hidden="true" />
        <span className="home-hero__mist home-hero__mist--right" aria-hidden="true" />
        <span className="home-hero__mist home-hero__mist--low" aria-hidden="true" />
        <div className="page-shell home-hero__inner">
          <h1>问云派</h1>
          <p>以云为幕，以灯为证；清醒温柔，同行自渡。</p>
          <div className="home-hero__actions">
            <TaskLink to="/canon" tone="primary">
              阅读立派金典
            </TaskLink>
            <TaskLink to="/wenxin-quiz" tone="secondary">
              参加问心考核
            </TaskLink>
          </div>
        </div>
      </section>

      <div className="page-shell official-home__body">
        <section className="home-purpose-grid" aria-label="问云派宗旨">
          {homePurposeCards.map((item) => (
            <article className="home-purpose-card" key={item.title}>
              <span aria-hidden="true" />
              <div>
                <h2>{item.title}</h2>
                <p>{item.text}</p>
              </div>
            </article>
          ))}
        </section>

        <section className="home-showcase-grid" aria-label="问云派公开信息">
          <article className="home-panel home-wishes-panel">
            <h2>问云七愿</h2>
            <div className="home-wishes-panel__body">
              <figure aria-hidden="true">
                <img alt="" src={getGuofengVisualPath('canonBanner')} />
              </figure>
              <ul>
                {homeWishes.map((wish) => (
                  <li key={wish}>{wish}</li>
                ))}
              </ul>
            </div>
          </article>

          <article className="home-panel home-events-panel">
            <div className="home-panel__head">
              <h2>雅集活动预告</h2>
              <TaskLink to="/events" tone="quiet">
                更多
              </TaskLink>
            </div>
            {loading ? <p className="home-panel__loading">正在读取雅集近况</p> : null}
            <div className="home-events-list">
              {homeEvents.map((event) => (
                <div className="home-event-row" key={`${event.date}-${event.title}`}>
                  <time>{event.date}</time>
                  <strong>{event.title}</strong>
                  <span>{event.status}</span>
                </div>
              ))}
            </div>
          </article>

          <article className="home-panel home-roster-panel">
            <div className="home-panel__head">
              <h2>公开名册预览</h2>
              <TaskLink to="/join" tone="quiet">
                入册
              </TaskLink>
            </div>
            {loading ? <p className="home-panel__loading">正在展开名册</p> : null}
            <div className="home-roster-list">
              {rosterPreview.map((item) => (
                <div className="home-roster-row" key={`${item.name}-${item.meta}`}>
                  <span aria-hidden="true">{item.name.slice(0, 1)}</span>
                  <div>
                    <strong>{item.name}</strong>
                    <p>{item.meta}</p>
                  </div>
                </div>
              ))}
            </div>
          </article>
        </section>
      </div>
    </div>
  )
}

// 这个组件展示立派金典，入参为空，返回值是可切换章节的阅读页。
export function CanonPage() {
  // 这个变量保存拆分后的章节，返回值用于正文和侧边目录。
  const sections = useMemo(() => parseCanonSections(canonText), [])
  // 这个状态保存当前阅读章节序号。
  const [activeIndex, setActiveIndex] = useState(0)
  // 这个变量保存当前章节，返回值用于正文阅读器。
  const activeSection = sections[activeIndex] ?? sections[0]

  return (
    <div className="page-shell page-stack">
      <MissionHero
        eyebrow="立派之本"
        title="立派金典"
        lead="读金典不是背条款，而是确认问云派为何存在、哪些事可为、哪些边界必须守住。"
        aside={<VisualPlate visual="canonBanner" caption="卷轴已展" />}
      />

      <section className="canon-layout canon-layout--reader">
        <nav className="canon-index" aria-label="立派金典目录">
          {sections.map((section, index) => (
            <button className={index === activeIndex ? 'active' : ''} key={section.id} onClick={() => setActiveIndex(index)} type="button">
              <span>{String(index + 1).padStart(2, '0')}</span>
              {section.title}
            </button>
          ))}
        </nav>
        <article className="canon-content canon-reader" id={activeSection.id}>
          <p className="section-eyebrow">第 {String(activeIndex + 1).padStart(2, '0')} 章</p>
          <h2>{activeSection.title}</h2>
          {splitBodyParagraphs(activeSection.body).map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </article>
      </section>
    </div>
  )
}

// 这个组件展示山门介绍，入参为空，返回值是组织气质、职分和边界页面。
export function AboutPage() {
  // 这个状态保存当前选中的职分。
  const [activeRoleIndex, setActiveRoleIndex] = useState(0)
  // 这个变量保存当前职分，返回值用于说明卡片。
  const activeRole = sectRoles[activeRoleIndex]

  return (
    <div className="page-shell page-stack">
      <MissionHero
        eyebrow="山门介绍"
        title="一方可停之处"
        lead="问云派不是高台，也不是闹市。它把古风仪式感、现代社群治理和真实陪伴放在同一张桌上。"
        aside={<VisualPlate visual="aboutVision" caption="同行有界" />}
      />

      <section className="mission-grid mission-grid--two">
        <VisualPlate visual="aboutPavilion" caption="清谈有处" />
        <MissionCard title="问云三不立" eyebrow="防止社群走偏">
          <ul className="timeline">
            <TimelineItem done index={1} text="无神化领袖，无绝对权威，管理者是服务者。" title="不立神坛" />
            <TimelineItem done index={2} text="不借迷茫、孤独、情伤、低谷牟利。" title="不售焦虑" />
            <TimelineItem done index={3} text="不替代心理、医疗、法律、财务等专业服务。" title="不替专业" />
          </ul>
        </MissionCard>
      </section>

      <section className="mission-grid">
        {spiritItems.map((item) => (
          <MissionCard key={item.title} title={item.title}>
            <p>{item.text}</p>
          </MissionCard>
        ))}
      </section>

      <section className="role-stage">
        <div className="role-stage__nav" aria-label="山门职分">
          {sectRoles.map((role, index) => (
            <button className={index === activeRoleIndex ? 'active' : ''} key={role.title} onClick={() => setActiveRoleIndex(index)} type="button">
              {role.title}
            </button>
          ))}
        </div>
        <MissionCard title={activeRole.title} eyebrow="职分非尊卑，乃分工也">
          <p>{activeRole.text}</p>
          <p>职分越清楚，边界越清楚；边界越清楚，温柔才越能长久。</p>
        </MissionCard>
      </section>
    </div>
  )
}

// 这个组件展示公告列表，入参为空，返回值是山门告示页。
export function AnnouncementsPage() {
  // 这个状态保存公告列表和加载标记。
  const [items, setItems] = useState<Announcement[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // 这里读取已发布公告，失败时使用服务层兜底数据。
    async function loadAnnouncements() {
      const result = await fetchPublishedAnnouncements()
      setItems(result.data)
      setLoading(false)
    }

    void loadAnnouncements()
  }, [])

  return (
    <div className="page-shell page-stack">
      <MissionHero
        eyebrow="山门告示"
        title="云简在墙"
        lead="这里放山门近况、规则提醒与雅集消息。所有告示都以清楚、克制、可查为准。"
        aside={<VisualPlate visual="announcementBoard" caption="告示已悬" />}
      />

      {loading ? <LoadingBlock label="正在读取山门告示" /> : null}
      {!loading && items.length === 0 ? <EmptyState title="暂未张贴告示" description="山门此刻安静。等有新消息，会贴在此处。" /> : null}
      <section className="mission-grid mission-grid--two">
        {items.map((item) => (
          <MissionCard key={item.id} meta={<StatusPill value={item.status} />} title={item.title} eyebrow={item.category}>
            <p>{item.summary ?? item.content}</p>
            <small>{formatDateTime(item.published_at ?? item.created_at)}</small>
          </MissionCard>
        ))}
      </section>
    </div>
  )
}

// 这个组件展示雅集列表，入参为空，返回值是可赴活动页。
export function EventsPage() {
  // 这个状态保存活动列表和加载标记。
  const [items, setItems] = useState<WenyunEvent[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // 这里读取已发布雅集，失败时使用服务层兜底数据。
    async function loadEvents() {
      const result = await fetchPublishedEvents()
      setItems(result.data)
      setLoading(false)
    }

    void loadEvents()
  }, [])

  return (
    <div className="page-shell page-stack">
      <MissionHero
        eyebrow="问云雅集"
        title="能来则来，不来无亏欠"
        lead="雅集有线上清谈，也有线下相逢。所有相聚都以自愿、安全、透明为先。"
        aside={<VisualPlate visual="eventPavilion" caption="雅集待赴" />}
      />

      {loading ? <LoadingBlock label="正在翻看雅集帖" /> : null}
      {!loading && items.length === 0 ? <EmptyState title="暂无可赴雅集" description="此刻还没有开放报名的雅集。你可以先读金典或点一盏云灯。" /> : null}
      <section className="mission-grid mission-grid--two">
        {items.map((item) => (
          <MissionCard
            key={item.id}
            title={item.title}
            eyebrow={`${item.type} · ${item.mode === 'online' ? '线上' : '线下'}`}
            meta={<StatusPill value={item.status} />}
            action={
              <TaskLink to="/login" tone="primary" icon="calendar">
                入小院报名
              </TaskLink>
            }
          >
            <p>{item.description ?? '这场雅集尚未写下详细说明。'}</p>
            <ul className="inline-list">
              <li>{formatDateTime(item.event_time)}</li>
              <li>{item.location ?? '地点待定'}</li>
              <li>{item.capacity ? `限 ${item.capacity} 人` : '人数从简'}</li>
            </ul>
          </MissionCard>
        ))}
      </section>
    </div>
  )
}

// 这个组件展示联系山门，入参为空，返回值是公开联系说明页。
export function ContactPage() {
  // 这个状态保存联系设置，服务失败时显示默认信息。
  const [setting, setSetting] = useState<SiteSetting | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // 这里读取后台维护的联系说明。
    async function loadSettings() {
      const result = await fetchSettings()
      setSetting(result.data.find((item) => item.key === 'contact') ?? null)
      setLoading(false)
    }

    void loadSettings()
  }, [])

  // 这个变量整理联系内容，缺省时给出山门可理解的说明。
  const contactValue = setting?.value ?? {}
  const wechatName = String(contactValue.wechatName ?? '问云派执事')
  const contactTip = String(contactValue.contactTip ?? '请先递交名帖，执事查看后会择时联系。')
  const qrDescription = String(contactValue.qrDescription ?? '山门不公开永久群码，避免无关打扰。')

  return (
    <div className="page-shell page-stack">
      <MissionHero
        eyebrow="山门信笺"
        title="联系山门"
        lead="若你已读金典，也愿守边界，可由这里传来一封信。执事会在合适的时候回应。"
        aside={<VisualPlate visual="contactNote" caption="信笺可递" />}
      />

      {loading ? <LoadingBlock label="正在取联系信笺" /> : null}
      {!loading ? (
        <section className="mission-grid mission-grid--two">
          <MissionCard title="传信方式" eyebrow="执事收信">
            <p>
              <strong>{wechatName}</strong>
            </p>
            <p>{contactTip}</p>
          </MissionCard>
          <MissionCard
            action={
              <TaskLink to="/join" tone="primary" icon="send">
                递交名帖
              </TaskLink>
            }
            title="入群说明"
            eyebrow="守界提醒"
          >
            <p>{qrDescription}</p>
            <p>任何相识都应以自愿为先。若你只是路过，也可以在云灯墙留一句话。</p>
          </MissionCard>
        </section>
      ) : null}
    </div>
  )
}

// 这个组件展示不存在页面，入参为空，返回值是中文 404 页面。
export function NotFoundPage() {
  return (
    <div className="page-shell page-stack">
      <MissionHero
        eyebrow="迷路提示"
        title="此径未开"
        lead="你走到了一条尚未张贴云简的小径。可回山门首页，或直接去读金典。"
        aside={<VisualPlate visual="notFoundScene" caption="请回山门" />}
      />
      <section className="mission-card">
        <div className="mission-card__action">
          <TaskLink to="/" tone="primary" icon="home">
            回到首页
          </TaskLink>
          <TaskLink to="/canon" tone="secondary" icon="scroll">
            读立派金典
          </TaskLink>
        </div>
      </section>
    </div>
  )
}
