import { useEffect, useMemo, useState, type CSSProperties } from 'react'
import { canonText, sectRoles, spiritItems } from '../../data/siteContent'
import { getGuofengVisualPath } from '../../data/visualAssets'
import type { Announcement, CloudLantern, RosterEntry, SiteSetting, WenyunEvent } from '../../lib/types'
import { fetchApprovedLanterns, fetchPublishedAnnouncements, fetchPublishedEvents, fetchPublicRoster, fetchSettings } from '../../shared/services'
import { CloudGlassCard, CloudGoldDivider } from '../../shared/ui/CloudTheme'
import { EmptyState, LoadingBlock, MetricCard, MissionCard, MissionHero, StatusPill, TaskLink, TimelineItem, brandLogoPath, formatDateTime } from '../../shared/ui/TaskUi'

// 这个接口描述金典章节，入参来自原始文本，返回值用于目录、阅读器和正文展示。
export interface CanonSection {
  // 章节编号，用于页面内部稳定识别。
  id: string
  // 章节标题，用于目录按钮和正文标题。
  title: string
  // 章节正文，用于阅读器展示。
  body: string
}

// 这个数组保存首页四象互动内容，返回值用于首屏和精神说明。
const homeSignals = [
  { key: '云', title: '辽阔与流动', text: '不急着给人生下定论，允许人重新开始，也允许关系慢慢生长。' },
  { key: '灯', title: '陪伴与希望', text: '人疲惫时不需要被训诫，先被看见，再一起整理下一步。' },
  { key: '舟', title: '渡己也渡人', text: '我们可以同行，可以扶一把，但不替任何人掌舵。' },
  { key: '竹', title: '有节有界', text: '温柔不是没有边界，清醒才能让陪伴走得更久。' }
]

// 这个数组保存首页重点入口，返回值用于把核心业务变成清晰路径。
const homeRouteCards = [
  { title: '读金典', eyebrow: '先明愿', text: '了解问云派的宗旨、边界、七愿、十禁与同门盟约。', to: '/canon', icon: 'scroll' as const },
  { title: '赴考核', eyebrow: '再自照', text: '用一份问云考核确认自己是否读懂金典，不靠热闹入山。', to: '/wenxin-quiz', icon: 'shieldCheck' as const },
  { title: '递名帖', eyebrow: '后同行', text: '完成登录与考核后递交名帖，由云纪执事人工审核。', to: '/join', icon: 'roster' as const },
  { title: '点云灯', eyebrow: '可停留', text: '不急着加入也可以留一句话，给自己或后来的人一点灯火。', to: '/cloud-lantern', icon: 'lantern' as const }
]

// 这个数组保存首页精神短语，返回值用于云主题首页精神区。
const homeSpiritCards = [
  { title: '清雅书院', text: '以学为修，以雅为居。' },
  { title: '线上山门', text: '山门在心，处处可入。' },
  { title: '清醒温柔', text: '带着清醒的眼，做出温柔的选择。' },
  { title: '同行自渡', text: '各自渡河，却不孤单。' },
  { title: '真诚有界', text: '真实在场，也知道底线。' }
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

// 这个组件展示首页四象互动盘，入参为空，返回值是可点击切换的精神象征。
function SignalCompass() {
  // 这个状态保存当前选中的精神象征。
  const [activeIndex, setActiveIndex] = useState(0)
  // 这个变量保存当前象征内容，返回值用于说明卡片。
  const activeSignal = homeSignals[activeIndex]

  return (
    <section className="signal-compass" aria-label="问云四象">
      <div className="signal-compass__dial">
        {homeSignals.map((item, index) => (
          <button
            className={index === activeIndex ? 'active' : ''}
            key={item.key}
            onClick={() => setActiveIndex(index)}
            style={{ '--signal-angle': `${index * 90}deg`, '--signal-angle-reverse': `${index * -90}deg` } as CSSProperties}
            type="button"
          >
            {item.key}
          </button>
        ))}
      </div>
      <MissionCard title={activeSignal.title} eyebrow={`四象 · ${activeSignal.key}`}>
        <p>{activeSignal.text}</p>
        <p>点击云、灯、舟、竹，可切换问云派不同精神侧面。</p>
      </MissionCard>
    </section>
  )
}

// 这个组件展示首页，入参为空，返回值是公开官网的完整首屏与业务入口。
export function HomePage() {
  // 这些状态保存首页公开数据，失败时服务层会返回演示数据。
  const [lanterns, setLanterns] = useState<CloudLantern[]>([])
  const [roster, setRoster] = useState<RosterEntry[]>([])
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [events, setEvents] = useState<WenyunEvent[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // 这里并行读取首页需要的公开数据，减少首屏等待。
    async function loadHomeData() {
      const [lanternResult, rosterResult, announcementResult, eventResult] = await Promise.all([
        fetchApprovedLanterns(),
        fetchPublicRoster(),
        fetchPublishedAnnouncements(),
        fetchPublishedEvents()
      ])

      setLanterns(lanternResult.data)
      setRoster(rosterResult.data)
      setAnnouncements(announcementResult.data)
      setEvents(eventResult.data)
      setLoading(false)
    }

    void loadHomeData()
  }, [])

  return (
    <div className="page-stack official-home">
      <section className="home-hero">
        <img alt="问云派山门远景" src={getGuofengVisualPath('homeHero')} />
        <div className="home-hero__veil" />
        <div className="page-shell home-hero__inner">
          <img alt="问云派标识" className="home-hero__logo" src={brandLogoPath} />
          <p className="section-eyebrow">线上山门 · 古风现代陪伴社群</p>
          <h1>问云派</h1>
          <p>以云为幕，以灯为证。这里不立神坛，不售焦虑，只愿让疲惫的人有一处可停、可问、可重新整理自己的地方。</p>
          <div className="home-hero__actions">
            <TaskLink to="/canon" tone="primary" icon="scroll">
              读立派金典
            </TaskLink>
            <TaskLink to="/cloud-lantern" tone="secondary" icon="lantern">
              点一盏云灯
            </TaskLink>
          </div>
        </div>
        <div className="home-hero__motto" aria-label="问云派派训">
          清醒温柔
          <span>同行自渡</span>
        </div>
      </section>

      <div className="page-shell page-stack">
        {loading ? (
          <LoadingBlock label="正在展开山门近况" />
        ) : (
          <section className="metric-row" aria-label="山门近况">
            <MetricCard label="公开云灯" value={lanterns.length} hint="来客与同门留下的温柔片刻" />
            <MetricCard label="名册同门" value={roster.length} hint="已列入公开名册的同行者" />
            <MetricCard label="山门告示" value={announcements.length} hint="近期公开公告与规则说明" />
            <MetricCard label="开放雅集" value={events.length} hint="正在展示或报名的活动" />
          </section>
        )}

        <CloudGoldDivider />

        <section className="section-title">
          <p className="section-eyebrow">山门五道</p>
          <h2>进入问云派的几条路径，各自通向不同的风景。</h2>
          <p>问云派把加入前的路径做得明确：读金典、赴考核、递名帖、经审核。若暂时只想停一停，也可以先点一盏云灯。</p>
        </section>

        <section className="cloud-feature-grid">
          {homeRouteCards.map((item) => (
            <CloudGlassCard className="cloud-feature-card" key={item.title}>
              <p className="section-eyebrow">{item.eyebrow}</p>
              <h3>{item.title}</h3>
              <p>{item.text}</p>
              <TaskLink icon={item.icon} to={item.to} tone="primary">
                进入
              </TaskLink>
            </CloudGlassCard>
          ))}
          <CloudGlassCard className="cloud-feature-card" gold>
            <p className="section-eyebrow">常回院</p>
            <h3>问云小院</h3>
            <p>登录后可查看名帖、云灯、雅集、提醒与归云堂入群提示。</p>
            <TaskLink to="/yard" tone="primary" icon="home">
              入小院
            </TaskLink>
          </CloudGlassCard>
        </section>

        <CloudGoldDivider />

        <section className="section-title section-title--center">
          <p className="section-eyebrow">门派精神</p>
          <h2>清醒温柔，同行自渡。</h2>
          <p>它们不是口号，而是每次发言、审核、活动和陪伴时都要守住的尺度。</p>
        </section>

        <section className="cloud-spirit-grid">
          {homeSpiritCards.map((item) => (
            <CloudGlassCard className="cloud-spirit-card" gold key={item.title}>
              <strong>{item.title}</strong>
              <p>{item.text}</p>
            </CloudGlassCard>
          ))}
        </section>

        <SignalCompass />

        <CloudGoldDivider />

        <section className="section-title section-title--center">
          <p className="section-eyebrow">云灯长廊</p>
          <h2>每盏灯，都是某个真实瞬间的留存。</h2>
          <p>这里只展示已经通过审核的公开云灯；未公开的内容仍会被妥善保护。</p>
        </section>

        <section className="cloud-lantern-grid">
          {(lanterns.length > 0 ? lanterns.slice(0, 3) : [null, null, null]).map((item, index) => (
            <CloudGlassCard className="cloud-lantern-card" key={item?.id ?? `empty-lantern-${index}`}>
              <span>{item?.mood || ['宁静', '感恩', '希望'][index]}</span>
              <h3>{item?.author_name || (index === 1 ? '匿名同门' : '问云云灯')}</h3>
              <p>{item?.content || ['人在风里，彼此递一盏灯。', '愿疲惫的人能在这里停一下。', '今日有光，留给后来者。'][index]}</p>
            </CloudGlassCard>
          ))}
        </section>

        <section className="mission-grid mission-grid--two">
          <MissionCard
            action={
              <TaskLink to="/announcements" tone="secondary" icon="megaphone">
                查看告示
              </TaskLink>
            }
            eyebrow="山门回声"
            title={announcements[0]?.title ?? '山门安静'}
          >
            <p>{announcements[0]?.summary ?? '暂时没有新的告示。你可以先读金典，或给后来的人留一句云灯。'}</p>
          </MissionCard>
          <MissionCard
            action={
              <TaskLink to="/cloud-lantern" tone="secondary" icon="lantern">
                继续点灯
              </TaskLink>
            }
            className="lantern-card"
            eyebrow={lanterns[0]?.mood ?? '云灯'}
            title={lanterns[0]?.author_name ?? '匿名同门'}
          >
            <p>{lanterns[0]?.content ?? '人在风里，彼此递一盏灯。'}</p>
          </MissionCard>
        </section>

        <section className="cloud-home-cta">
          <CloudGlassCard gold>
            <h2>山门已开，等你入云</h2>
            <p>读金典，赴考核，递名帖。无需表演强大，只需真实有界。</p>
            <div>
              <TaskLink to="/canon" tone="primary" icon="scroll">
                阅读金典
              </TaskLink>
              <TaskLink to="/login" tone="secondary" icon="logIn">
                进入小院
              </TaskLink>
            </div>
          </CloudGlassCard>
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
