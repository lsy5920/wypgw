import { FormEvent, useEffect, useMemo, useState } from 'react'
import { genderOptions } from '../../data/siteContent'
import type {
  AccountSecurityInfo,
  CloudLantern,
  GuiyuntangSetting,
  JoinApplication,
  MemberGender,
  Profile,
  RosterProfileUpdateInput,
  UserNotification,
  YardEventItem,
  YardOverview
} from '../../lib/types'
import {
  bindMyEmail,
  cancelEventRegistration,
  confirmMyGuiyuntangJoined,
  fetchMyAccountSecurity,
  fetchMyApplications,
  fetchMyLanterns,
  fetchMyNotifications,
  fetchMyProfile,
  fetchYardEvents,
  fetchYardOverview,
  markNotificationRead,
  registerForEvent,
  submitCloudLantern,
  updateMyPassword,
  updateMyProfile,
  updateMyRosterProfile,
  validateCloudLantern
} from '../../shared/services'
import { EmptyState, Field, LoadingBlock, MetricCard, MissionCard, StatusNotice, StatusPill, TaskButton, TaskLink, TimelineItem, formatDateTime } from '../../shared/ui/TaskUi'

// 这个函数创建默认小院总览，入参为空，返回值用于加载前占位。
function createEmptyOverview(): YardOverview {
  return {
    profile: {
      id: '',
      nickname: '问云同门',
      avatar_url: null,
      role: 'member',
      city: null,
      bio: null,
      is_public: false,
      created_at: '',
      updated_at: ''
    },
    applications: [],
    lanterns: [],
    registrations: [],
    notifications: [],
    quizResult: null,
    guiyuntangSetting: null
  }
}

// 这个函数创建账号安全默认值，入参为空，返回值用于加载前占位。
function createEmptySecurity(): AccountSecurityInfo {
  return {
    email: '',
    is_legacy_email: false,
    pending_email: null,
    email_confirmed_at: null
  }
}

// 这个函数选择最适合维护的名帖，入参是名帖列表，返回值是已通过名帖或最新名帖。
function pickEditableApplication(items: JoinApplication[]): JoinApplication | null {
  return items.find((item) => item.status === 'approved' || item.status === 'contacted') ?? items[0] ?? null
}

// 这个函数选择可查看归云堂二维码的名帖，入参是名帖列表，返回值是已通过或已联系的名帖。
function pickGuiyuntangApplication(items: JoinApplication[]): JoinApplication | null {
  return items.find((item) => item.status === 'approved' || item.status === 'contacted') ?? null
}

// 这个组件展示归云堂二维码弹窗，入参是二维码设置、名帖和操作方法，返回值是全屏入群提示。
function GuiyuntangDialog({
  application,
  setting,
  confirming,
  onConfirm,
  onClose
}: {
  // 当前可入群的名帖，用于判断是否已经确认入群。
  application: JoinApplication
  // 归云堂二维码设置，来自后台受保护配置。
  setting: GuiyuntangSetting
  // 当前是否正在确认入群。
  confirming: boolean
  // 点击“我已入群”时执行的方法。
  onConfirm: () => void
  // 点击“暂时关闭”时执行的方法。
  onClose: () => void
}) {
  return (
    <div className="guiyuntang-dialog" role="dialog" aria-modal="true" aria-labelledby="guiyuntang-dialog-title">
      <div className="guiyuntang-dialog__panel">
        <div className="guiyuntang-dialog__copy">
          <p className="section-eyebrow">归云堂入群</p>
          <h2 id="guiyuntang-dialog-title">名帖已通过，可扫码入归云堂</h2>
          <p>{setting.instruction}</p>
          <p className="guiyuntang-dialog__warning">{setting.warning}</p>
        </div>
        <div className="guiyuntang-dialog__qr">
          <img alt="归云堂入群二维码" src={setting.qr_image_data_url ?? ''} />
          <span>{application.guiyuntang_joined ? '你已确认入归云堂，可再次查看二维码。' : '扫码后请点击“我已入群”，小院会同步名册状态。'}</span>
        </div>
        <div className="guiyuntang-dialog__actions">
          <TaskButton disabled={application.guiyuntang_joined || confirming} onClick={onConfirm} tone="primary" type="button" icon="check">
            {application.guiyuntang_joined ? '已记录入群' : confirming ? '正在记录' : '我已入群'}
          </TaskButton>
          <TaskButton onClick={onClose} tone="secondary" type="button">
            暂时关闭
          </TaskButton>
        </div>
      </div>
    </div>
  )
}

// 这个组件展示小院顶部标题，入参是标题和说明，返回值是小院页面统一页首。
function YardTopbar({ title, description }: { title: string; description: string }) {
  return (
    <header className="work-topbar">
      <div>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      <TaskLink to="/" tone="quiet">
        回山门
      </TaskLink>
    </header>
  )
}

// 这个组件展示小院总览，入参为空，返回值是任务册首页。
export function YardDashboardPage() {
  // 这个状态保存小院总览数据。
  const [overview, setOverview] = useState<YardOverview>(createEmptyOverview)
  // 这个状态保存加载标记。
  const [loading, setLoading] = useState(true)
  // 这个状态保存归云堂弹窗是否打开。
  const [guiyuntangOpen, setGuiyuntangOpen] = useState(false)
  // 这个状态保存本次访问是否手动关闭过弹窗，避免点击暂时关闭后立刻再次弹出。
  const [guiyuntangDismissed, setGuiyuntangDismissed] = useState(false)
  // 这个状态保存确认入群中的标记。
  const [confirmingGuiyuntang, setConfirmingGuiyuntang] = useState(false)
  // 这个状态保存小院总览页操作反馈。
  const [message, setMessage] = useState('')

  useEffect(() => {
    // 这里读取小院任务册首页需要的整包数据。
    async function loadOverview() {
      const result = await fetchYardOverview()
      setOverview(result.data)
      setLoading(false)
    }

    void loadOverview()
  }, [])

  // 这个变量计算当前任务进度，返回值用于进度条。
  const progress = useMemo(() => {
    const steps = [
      Boolean(overview.quizResult?.passed),
      overview.applications.length > 0,
      overview.applications.some((item) => item.status === 'approved' || item.status === 'contacted'),
      overview.lanterns.length > 0,
      overview.registrations.length > 0
    ]
    return Math.round((steps.filter(Boolean).length / steps.length) * 100)
  }, [overview])

  // 这个变量保存可入群名帖，返回值用于自动弹窗和手动查看入口。
  const guiyuntangApplication = useMemo(() => pickGuiyuntangApplication(overview.applications), [overview.applications])
  // 这个变量保存可用二维码设置，返回值用于判断是否展示归云堂模块。
  const guiyuntangSetting = overview.guiyuntangSetting
  // 这个变量判断当前用户是否能查看二维码，返回值用于展示入口和弹窗。
  const canViewGuiyuntang = Boolean(guiyuntangApplication && guiyuntangSetting?.enabled && guiyuntangSetting.qr_image_data_url)

  useEffect(() => {
    // 这里在名帖已通过且尚未确认入群时主动弹出二维码，本次手动关闭后不重复打扰。
    if (!loading && canViewGuiyuntang && guiyuntangApplication && !guiyuntangApplication.guiyuntang_joined && !guiyuntangDismissed) {
      setGuiyuntangOpen(true)
    }
  }, [canViewGuiyuntang, guiyuntangApplication, guiyuntangDismissed, loading])

  // 这个函数临时关闭归云堂弹窗，入参为空，返回值为空。
  function closeGuiyuntangTemporarily() {
    setGuiyuntangDismissed(true)
    setGuiyuntangOpen(false)
  }

  // 这个函数确认本人已入归云堂，入参为空，返回值为空。
  async function confirmGuiyuntangJoined() {
    if (!guiyuntangApplication) {
      setMessage('没有找到可确认入群的名帖。')
      return
    }

    setConfirmingGuiyuntang(true)
    const result = await confirmMyGuiyuntangJoined(guiyuntangApplication.id)
    setConfirmingGuiyuntang(false)
    setMessage(result.message)

    if (result.ok && result.data) {
      const nextApplication = result.data as JoinApplication
      setOverview((current) => ({
        ...current,
        applications: current.applications.map((item) => (item.id === nextApplication.id ? nextApplication : item))
      }))
      setGuiyuntangDismissed(true)
      setGuiyuntangOpen(false)
    }
  }

  if (loading) {
    return (
      <div className="work-content">
        <YardTopbar title="我的任务册" description="正在整理你的问云小院。" />
        <LoadingBlock label="正在翻看任务册" />
      </div>
    )
  }

  return (
    <div className="work-content">
      <YardTopbar title="我的任务册" description={`今日小院已开，${overview.profile.nickname} 可在这里查看自己的同行记录。`} />
      {message ? <StatusNotice tone={message.includes('失败') || message.includes('没有') ? 'warning' : 'success'}>{message}</StatusNotice> : null}
      <section className="metric-row">
        <MetricCard label="任务进度" value={`${progress}%`} hint="金典、考核、名帖、云灯、雅集合并计算" />
        <MetricCard label="名帖记录" value={overview.applications.length} hint="递帖与审核状态" />
        <MetricCard label="我的云灯" value={overview.lanterns.length} hint="已递出的云灯" />
        <MetricCard label="未读提醒" value={overview.notifications.filter((item) => !item.read_at).length} hint="小院内待查看消息" />
      </section>

      <section className="mission-card">
        <div className="task-progress">
          <strong>本册进度</strong>
          <div className="task-progress__bar">
            <span style={{ width: `${progress}%` }} />
          </div>
        </div>
      </section>

      <section className="mission-grid mission-grid--two">
        <MissionCard title="下一步可做" eyebrow="今日任务">
          <ul className="timeline">
            <TimelineItem done={Boolean(overview.quizResult?.passed)} index={1} text="考核合格后才可递交名帖。" title="问云考核" />
            <TimelineItem done={overview.applications.length > 0} index={2} text="名帖递出后，等待执事查看。" title="递交名帖" />
            <TimelineItem done={overview.lanterns.length > 0} index={3} text="给自己或同行者留一句灯上文字。" title="点一盏云灯" />
          </ul>
        </MissionCard>
        {canViewGuiyuntang && guiyuntangApplication ? (
          <MissionCard
            title="归云堂入群"
            eyebrow={guiyuntangApplication.guiyuntang_joined ? '已入归云堂' : '待扫码入群'}
            meta={<StatusPill value={guiyuntangApplication.guiyuntang_joined ? 'approved' : 'pending'} />}
            action={
              <TaskButton onClick={() => setGuiyuntangOpen(true)} tone="primary" type="button" icon="roster">
                {guiyuntangApplication.guiyuntang_joined ? '再次查看二维码' : '查看入群二维码'}
              </TaskButton>
            }
          >
            <p>{guiyuntangApplication.guiyuntang_joined ? '你已确认入归云堂，二维码不再主动弹出；需要时仍可在这里再次查看。' : '名帖已通过，可扫码进入归云堂。若暂时不方便，可以先关闭弹窗，稍后从这里再次打开。'}</p>
          </MissionCard>
        ) : null}
        <MissionCard title="最近提醒" eyebrow="小院回音">
          {overview.notifications.length === 0 ? (
            <p>暂无提醒。山门安静，任务册也安静。</p>
          ) : (
            overview.notifications.slice(0, 4).map((item) => (
              <div className="ledger-row" key={item.id}>
                <div>
                  <strong>{item.title}</strong>
                  <span>{item.content}</span>
                </div>
                <StatusPill value={item.read_at ? 'approved' : 'pending'} />
              </div>
            ))
          )}
        </MissionCard>
      </section>
      {guiyuntangOpen && canViewGuiyuntang && guiyuntangApplication && guiyuntangSetting?.qr_image_data_url ? (
        <GuiyuntangDialog
          application={guiyuntangApplication}
          confirming={confirmingGuiyuntang}
          onClose={closeGuiyuntangTemporarily}
          onConfirm={confirmGuiyuntangJoined}
          setting={guiyuntangSetting}
        />
      ) : null}
    </div>
  )
}

// 这个组件展示小院资料页，入参为空，返回值是资料、账号和安全表单。
export function YardProfilePage() {
  // 这些状态保存资料、账号和表单反馈。
  const [profile, setProfile] = useState<Profile | null>(null)
  const [security, setSecurity] = useState<AccountSecurityInfo>(createEmptySecurity)
  const [bio, setBio] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')
  const [isPublic, setIsPublic] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // 这里并行读取资料和账号安全信息。
    async function loadProfile() {
      const [profileResult, securityResult] = await Promise.all([fetchMyProfile(), fetchMyAccountSecurity()])
      setProfile(profileResult.data)
      setBio(profileResult.data.bio ?? '')
      setAvatarUrl(profileResult.data.avatar_url ?? '')
      setIsPublic(profileResult.data.is_public)
      setSecurity(securityResult.data)
      setEmail(securityResult.data.email)
      setLoading(false)
    }

    void loadProfile()
  }, [])

  // 这个函数保存资料，入参是表单事件，返回值为空。
  async function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const result = await updateMyProfile({ avatar_url: avatarUrl, bio, is_public: isPublic })
    setProfile(result.data)
    setMessage(result.message)
  }

  // 这个函数绑定邮箱，入参是表单事件，返回值为空。
  async function saveEmail(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const result = await bindMyEmail({ email })
    setSecurity(result.data)
    setMessage(result.message)
  }

  // 这个函数修改密码，入参是表单事件，返回值为空。
  async function savePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const result = await updateMyPassword({ new_password: password, confirm_password: confirmPassword })
    setMessage(result.message)
    if (result.ok) {
      setPassword('')
      setConfirmPassword('')
    }
  }

  if (loading || !profile) {
    return (
      <div className="work-content">
        <YardTopbar title="我的资料" description="正在取出小院资料。" />
        <LoadingBlock label="正在整理资料" />
      </div>
    )
  }

  return (
    <div className="work-content">
      <YardTopbar title="我的资料" description="维护头像、简介、公开状态和账号安全。" />
      {message ? <StatusNotice tone={message.includes('失败') ? 'danger' : 'success'}>{message}</StatusNotice> : null}
      <section className="mission-grid mission-grid--two">
        <MissionCard title="公开资料" eyebrow={profile.nickname}>
          <form className="form-grid form-grid--single" onSubmit={saveProfile}>
            <Field label="头像地址">
              <input onChange={(event) => setAvatarUrl(event.target.value)} value={avatarUrl} />
            </Field>
            <Field label="个人简介">
              <textarea onChange={(event) => setBio(event.target.value)} value={bio} />
            </Field>
            <div className="checkbox-row">
              <label>
                <input checked={isPublic} onChange={(event) => setIsPublic(event.target.checked)} type="checkbox" />
                允许公开展示资料
              </label>
            </div>
            <TaskButton tone="primary" type="submit">
              保存资料
            </TaskButton>
          </form>
        </MissionCard>
        <MissionCard title="账号安全" eyebrow={security.is_legacy_email ? '建议绑定真实邮箱' : '邮箱已记录'}>
          <form className="form-grid form-grid--single" onSubmit={saveEmail}>
            <Field label="登录邮箱">
              <input onChange={(event) => setEmail(event.target.value)} value={email} />
            </Field>
            <TaskButton tone="secondary" type="submit">
              绑定或更换邮箱
            </TaskButton>
          </form>
          <form className="form-grid form-grid--single" onSubmit={savePassword}>
            <Field label="新密码">
              <input onChange={(event) => setPassword(event.target.value)} type="password" value={password} />
            </Field>
            <Field label="确认新密码">
              <input onChange={(event) => setConfirmPassword(event.target.value)} type="password" value={confirmPassword} />
            </Field>
            <TaskButton tone="secondary" type="submit">
              修改密码
            </TaskButton>
          </form>
        </MissionCard>
      </section>
    </div>
  )
}

// 这个组件展示小院名帖页，入参为空，返回值是名帖状态和公开资料维护。
export function YardApplicationsPage() {
  // 这些状态保存名帖列表、当前表单和反馈。
  const [items, setItems] = useState<JoinApplication[]>([])
  const [form, setForm] = useState<RosterProfileUpdateInput | null>(null)
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // 这里读取本人名帖并生成维护表单。
    async function loadApplications() {
      const result = await fetchMyApplications()
      const selected = pickEditableApplication(result.data)
      setItems(result.data)
      setForm(
        selected
          ? {
              application_id: selected.id,
              jianghu_name: selected.jianghu_name ?? '',
              gender: selected.gender ?? '女',
              city: selected.public_region ?? selected.city ?? '',
              motto: selected.motto ?? '',
              hobbies: selected.tags ?? '',
              companion_expectation: selected.companion_expectation ?? '',
              requested_nickname: '',
              requested_legacy_contact: ''
            }
          : null
      )
      setLoading(false)
    }

    void loadApplications()
  }, [])

  // 这个函数更新名帖维护表单，入参是字段和值，返回值为空。
  function updateField<K extends keyof RosterProfileUpdateInput>(key: K, value: RosterProfileUpdateInput[K]) {
    setForm((current) => (current ? { ...current, [key]: value } : current))
  }

  // 这个函数保存公开名册资料，入参是表单事件，返回值为空。
  async function saveRosterProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!form) {
      return
    }
    const result = await updateMyRosterProfile(form)
    setMessage(result.message)
  }

  // 这个函数确认进入归云堂，入参是名帖编号，返回值为空。
  async function confirmJoined(id: string) {
    const result = await confirmMyGuiyuntangJoined(id)
    setMessage(result.message)
  }

  if (loading) {
    return (
      <div className="work-content">
        <YardTopbar title="我的名帖" description="正在翻看递帖记录。" />
        <LoadingBlock label="正在整理名帖" />
      </div>
    )
  }

  return (
    <div className="work-content">
      <YardTopbar title="我的名帖" description="查看递帖状态，维护公开名册资料。" />
      {message ? <StatusNotice tone={message.includes('失败') ? 'danger' : 'success'}>{message}</StatusNotice> : null}
      {items.length === 0 ? (
        <EmptyState
          title="还没有递出名帖"
          description="先完成问云考核，再递交第一份名帖。"
          action={
            <TaskLink to="/join" tone="primary">
              去递名帖
            </TaskLink>
          }
        />
      ) : (
        <section className="mission-grid mission-grid--two">
          <MissionCard title="名帖时间线" eyebrow="递帖记录">
            <ul className="timeline">
              {items.map((item, index) => (
                <TimelineItem done={item.status === 'approved' || item.status === 'contacted'} index={index + 1} key={item.id} text={`${formatDateTime(item.created_at)} · ${item.member_code ?? '待编号'}`} title={`${item.nickname} · ${item.status}`} />
              ))}
            </ul>
          </MissionCard>
          {form ? (
            <MissionCard title="公开名册资料" eyebrow="可维护">
              <form className="form-grid form-grid--single" onSubmit={saveRosterProfile}>
                <Field label="江湖名">
                  <input onChange={(event) => updateField('jianghu_name', event.target.value)} value={form.jianghu_name} />
                </Field>
                <Field label="公开性别">
                  <select onChange={(event) => updateField('gender', event.target.value as MemberGender)} value={form.gender}>
                    {genderOptions.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="公开城市">
                  <input onChange={(event) => updateField('city', event.target.value)} value={form.city} />
                </Field>
                <Field label="宣言">
                  <textarea onChange={(event) => updateField('motto', event.target.value)} value={form.motto} />
                </Field>
                <Field label="兴趣爱好">
                  <textarea onChange={(event) => updateField('hobbies', event.target.value)} value={form.hobbies} />
                </Field>
                <Field label="同行期待">
                  <textarea onChange={(event) => updateField('companion_expectation', event.target.value)} value={form.companion_expectation} />
                </Field>
                <Field label="申请改道名">
                  <input onChange={(event) => updateField('requested_nickname', event.target.value)} value={form.requested_nickname} />
                </Field>
                <Field label="申请改联系方式">
                  <input onChange={(event) => updateField('requested_legacy_contact', event.target.value)} value={form.requested_legacy_contact} />
                </Field>
                <TaskButton tone="primary" type="submit">
                  保存名册资料
                </TaskButton>
              </form>
              {items
                .filter((item) => item.status === 'approved' && !item.guiyuntang_joined)
                .map((item) => (
                  <TaskButton key={item.id} onClick={() => confirmJoined(item.id)} tone="secondary" type="button">
                    已进入归云堂
                  </TaskButton>
                ))}
            </MissionCard>
          ) : null}
        </section>
      )}
    </div>
  )
}

// 这个组件展示小院云灯页，入参为空，返回值是本人云灯和新云灯表单。
export function YardLanternsPage() {
  // 这些状态保存云灯列表、表单和反馈。
  const [items, setItems] = useState<CloudLantern[]>([])
  const [content, setContent] = useState('')
  const [mood, setMood] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // 这里读取本人云灯列表。
    async function loadLanterns() {
      const result = await fetchMyLanterns()
      setItems(result.data as CloudLantern[])
      setLoading(false)
    }

    void loadLanterns()
  }, [])

  // 这个函数提交新的云灯，入参是表单事件，返回值为空。
  async function saveLantern(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const input = { author_name: '', content, mood, is_anonymous: true }
    const errors = validateCloudLantern(input)

    if (errors.length > 0) {
      setMessage(errors.join(' '))
      return
    }

    const result = await submitCloudLantern(input)
    setMessage(result.message)
    if (result.ok) {
      setItems((current) => [result.data as CloudLantern, ...current])
      setContent('')
      setMood('')
    }
  }

  return (
    <div className="work-content">
      <YardTopbar title="我的云灯" description="查看自己递出的云灯，也可再点一盏。" />
      {message ? <StatusNotice tone={message.includes('失败') || message.includes('至少') ? 'warning' : 'success'}>{message}</StatusNotice> : null}
      <section className="mission-grid mission-grid--two">
        <MissionCard title="再点一盏" eyebrow="小院云灯">
          <form className="form-grid form-grid--single" onSubmit={saveLantern}>
            <Field label="灯上文字">
              <textarea onChange={(event) => setContent(event.target.value)} value={content} />
            </Field>
            <Field label="心情小签">
              <input onChange={(event) => setMood(event.target.value)} value={mood} />
            </Field>
            <TaskButton tone="primary" type="submit">
              递出云灯
            </TaskButton>
          </form>
        </MissionCard>
        <MissionCard title="我的灯簿" eyebrow="递灯记录">
          {loading ? <LoadingBlock label="正在取云灯" /> : null}
          {!loading && items.length === 0 ? <p>还没有云灯记录。</p> : null}
          {items.map((item) => (
            <div className="ledger-row" key={item.id}>
              <div>
                <strong>{item.content}</strong>
                <span>{formatDateTime(item.created_at)}</span>
              </div>
              <StatusPill value={item.status} />
            </div>
          ))}
        </MissionCard>
      </section>
    </div>
  )
}

// 这个组件展示小院雅集页，入参为空，返回值是可报名活动和报名状态。
export function YardEventsPage() {
  // 这些状态保存雅集、备注和反馈。
  const [items, setItems] = useState<YardEventItem[]>([])
  const [noteByEvent, setNoteByEvent] = useState<Record<string, string>>({})
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // 这里读取雅集和本人报名状态。
    async function loadEvents() {
      const result = await fetchYardEvents()
      setItems(result.data)
      setLoading(false)
    }

    void loadEvents()
  }, [])

  // 这个函数报名雅集，入参是活动编号，返回值为空。
  async function joinEvent(id: string) {
    const result = await registerForEvent(id, noteByEvent[id] ?? '')
    setMessage(result.message)
  }

  // 这个函数取消报名，入参是报名编号，返回值为空。
  async function cancelRegistration(id: string) {
    const result = await cancelEventRegistration(id)
    setMessage(result.message)
  }

  return (
    <div className="work-content">
      <YardTopbar title="问云雅集" description="查看可赴雅集，报名或取消自己的记录。" />
      {message ? <StatusNotice tone={message.includes('失败') ? 'danger' : 'success'}>{message}</StatusNotice> : null}
      {loading ? <LoadingBlock label="正在读取雅集" /> : null}
      {!loading && items.length === 0 ? <EmptyState title="暂无雅集" description="此刻没有开放的雅集。" /> : null}
      <section className="mission-grid mission-grid--two">
        {items.map(({ event, registration }) => (
          <MissionCard
            key={event.id}
            title={event.title}
            eyebrow={`${event.type} · ${event.mode === 'online' ? '线上' : '线下'}`}
            meta={<StatusPill value={registration?.status ?? event.status} />}
          >
            <p>{event.description ?? '这场雅集尚未写下详细说明。'}</p>
            <ul className="inline-list">
              <li>{formatDateTime(event.event_time)}</li>
              <li>{event.location ?? '地点待定'}</li>
              <li>{event.capacity ? `限 ${event.capacity} 人` : '人数从简'}</li>
            </ul>
            <Field label="报名备注">
              <input onChange={(inputEvent) => setNoteByEvent((current) => ({ ...current, [event.id]: inputEvent.target.value }))} value={noteByEvent[event.id] ?? ''} />
            </Field>
            <div className="mission-card__action">
              {registration && registration.status !== 'cancelled' ? (
                <TaskButton onClick={() => cancelRegistration(registration.id)} tone="danger" type="button">
                  取消报名
                </TaskButton>
              ) : (
                <TaskButton onClick={() => joinEvent(event.id)} tone="primary" type="button">
                  报名雅集
                </TaskButton>
              )}
            </div>
          </MissionCard>
        ))}
      </section>
    </div>
  )
}

// 这个组件展示小院提醒页，入参为空，返回值是提醒时间线和已读操作。
export function YardNotificationsPage() {
  // 这些状态保存提醒列表和反馈。
  const [items, setItems] = useState<UserNotification[]>([])
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // 这里读取站内提醒。
    async function loadNotifications() {
      const result = await fetchMyNotifications()
      setItems(result.data)
      setLoading(false)
    }

    void loadNotifications()
  }, [])

  // 这个函数标记提醒已读，入参是提醒编号，返回值为空。
  async function readNotification(id: string) {
    const result = await markNotificationRead(id)
    setMessage(result.message)
    if (result.ok && result.data) {
      setItems((current) => current.map((item) => (item.id === id ? result.data as UserNotification : item)))
    }
  }

  return (
    <div className="work-content">
      <YardTopbar title="小院提醒" description="这里记录名帖、云灯和雅集的回音。" />
      {message ? <StatusNotice tone={message.includes('失败') ? 'danger' : 'success'}>{message}</StatusNotice> : null}
      {loading ? <LoadingBlock label="正在读取提醒" /> : null}
      {!loading && items.length === 0 ? <EmptyState title="暂无提醒" description="你的任务册此刻没有新回音。" /> : null}
      <section className="admin-ledger">
        {items.map((item) => (
          <article className="admin-ledger__row" key={item.id}>
            <div data-label="标题">
              <strong>{item.title}</strong>
              <span>{item.content}</span>
            </div>
            <div data-label="模块">
              <span>{item.kind}</span>
            </div>
            <div data-label="时间">
              <span>{formatDateTime(item.created_at)}</span>
            </div>
            <div className="admin-ledger__actions" data-label="操作">
              <StatusPill value={item.read_at ? 'approved' : 'pending'} />
              {!item.read_at ? (
                <TaskButton className="compact-button" onClick={() => readNotification(item.id)} tone="secondary" type="button">
                  标为已读
                </TaskButton>
              ) : null}
            </div>
          </article>
        ))}
      </section>
    </div>
  )
}
