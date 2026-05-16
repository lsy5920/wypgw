import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from 'react'
import { genderOptions, memberRoleOptions } from '../../data/siteContent'
import type {
  AdminRoleUser,
  Announcement,
  CloudLantern,
  GuiyuntangSetting,
  JoinApplication,
  JoinApplicationStatus,
  JoinApplicationUpdateInput,
  MemberGender,
  MusicPlayerSettingInput,
  ProfileRole,
  PublishStatus,
  SiteSetting,
  SmtpSetting,
  WenyunMemberRole,
  WenyunEvent
} from '../../lib/types'
import {
  createAnnouncement,
  createEvent,
  deleteApplicationPermanently,
  fetchAdminAnnouncements,
  fetchAdminApplications,
  fetchAdminEvents,
  fetchAdminLanterns,
  fetchAdminOverview,
  fetchAdminRegistrations,
  fetchAdminRoleUsers,
  fetchGuiyuntangSetting,
  fetchSettings,
  fetchSmtpSetting,
  saveContactSetting,
  saveGuiyuntangSetting,
  saveMusicPlayerSetting,
  saveSmtpSetting,
  updateAdminUserAccount,
  updateAdminUserRole,
  updateApplicationDetails,
  updateApplicationStatus,
  updateEventRegistrationStatus,
  updateLanternStatus
} from '../../shared/services'
import type { EventFormInput } from '../../shared/services'
import {
  EmptyState,
  Field,
  LoadingBlock,
  MetricCard,
  MissionCard,
  StatusNotice,
  StatusPill,
  TaskButton,
  TaskLink,
  formatDateTime
} from '../../shared/ui/TaskUi'

// 这个组件展示后台顶部标题，入参是标题和说明，返回值是统一后台页首。
function AdminTopbar({ title, description }: { title: string; description: string }) {
  return (
    <header className="work-topbar">
      <div>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      <TaskLink to="/yard" tone="quiet">
        去小院
      </TaskLink>
    </header>
  )
}

// 这个函数把联系设置整理成表单，入参是设置列表，返回值是联系表单。
function createContactForm(settings: SiteSetting[]) {
  const contact = settings.find((item) => item.key === 'contact')?.value ?? {}
  return {
    wechatName: String(contact.wechatName ?? '问云派执事'),
    contactTip: String(contact.contactTip ?? '请先递交名帖，执事查看后会择时联系。'),
    qrDescription: String(contact.qrDescription ?? '山门不公开永久群码，避免无关打扰。')
  }
}

// 这个函数从网易云歌单链接里提取编号，入参是链接或编号，返回值是歌单编号。
function extractNeteasePlaylistId(value: string): string {
  const text = value.trim()
  const idMatch = text.match(/[?&#]id=(\d+)/)
  const pathMatch = text.match(/playlist(?:\/|\?id=)(\d+)/)
  const pureMatch = text.match(/^\d+$/)

  return idMatch?.[1] ?? pathMatch?.[1] ?? pureMatch?.[0] ?? ''
}

// 这个函数把音乐播放器设置整理成后台表单，入参是设置列表，返回值是音乐表单。
function createMusicForm(settings: SiteSetting[]): MusicPlayerSettingInput {
  const music = settings.find((item) => item.key === 'music_player')?.value ?? {}
  const playlistUrl = String(music.playlist_url ?? '')
  const playlistId = String(music.playlist_id ?? '') || extractNeteasePlaylistId(playlistUrl)

  return {
    enabled: Boolean(music.enabled ?? false),
    playlist_id: playlistId,
    playlist_url: playlistUrl,
    title: String(music.title ?? '问云派山门歌单'),
    lyric_lines: String(music.lyric_lines ?? ''),
    autoplay: Boolean(music.autoplay ?? false)
  }
}

// 这个数组保存名帖状态选项，入参为空，返回值用于后台直接控制名册流转。
const applicationStatusOptions: Array<{ value: JoinApplicationStatus; label: string }> = [
  { value: 'pending', label: '待审核' },
  { value: 'approved', label: '已通过' },
  { value: 'contacted', label: '已联系' },
  { value: 'rejected', label: '未通过' },
  { value: 'draft', label: '暂存' },
  { value: 'retired', label: '已退派' }
]

// 这个常量保存二维码图片最大体积，入参为空，返回值用于避免把过大的图片写入数据库文本字段。
const maxQrImageSize = 2 * 1024 * 1024

// 这个函数把上传的图片读取成数据地址，入参是图片文件，返回值是可保存到数据库的图片文本。
function readImageFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    // 这里使用浏览器原生读取器，避免引入额外依赖。
    const reader = new FileReader()

    // 这里处理读取失败，常见原因是文件被系统占用或浏览器拒绝读取。
    reader.onerror = () => reject(new Error('二维码图片读取失败，请重新选择图片。'))
    // 这里处理读取完成，只有字符串数据地址才可以保存。
    reader.onload = () => {
      if (typeof reader.result !== 'string') {
        reject(new Error('二维码图片格式异常，请重新上传。'))
        return
      }

      resolve(reader.result)
    }
    reader.readAsDataURL(file)
  })
}

// 这个函数把名帖数据转换为可编辑表单，入参是名帖记录，返回值是后台保存所需字段。
function createApplicationEditForm(item: JoinApplication): JoinApplicationUpdateInput {
  return {
    nickname: item.nickname,
    jianghu_name: item.jianghu_name ?? '',
    real_name: item.real_name ?? '',
    wechat_id: item.wechat_id,
    age_range: item.age_range ?? '',
    gender: item.gender ?? '女',
    city: item.city ?? '',
    public_region: item.public_region ?? '',
    raw_region: item.raw_region ?? '',
    reason: item.reason,
    accept_rules: item.accept_rules,
    admin_note: item.admin_note ?? '',
    member_role: item.member_role ?? '同门',
    generation_name: item.generation_name ?? '云',
    member_code: item.member_code ?? '',
    roster_serial: item.roster_serial ? String(item.roster_serial) : '',
    motto: item.motto ?? '',
    tags: item.tags ?? '',
    companion_expectation: item.companion_expectation ?? '',
    legacy_contact: item.legacy_contact ?? '',
    requested_nickname: item.requested_nickname ?? '',
    requested_legacy_contact: item.requested_legacy_contact ?? '',
    joined_at: item.joined_at ? item.joined_at.slice(0, 16) : '',
    guiyuntang_joined: item.guiyuntang_joined,
    guiyuntang_joined_at: item.guiyuntang_joined_at ? item.guiyuntang_joined_at.slice(0, 16) : '',
    status: item.status
  }
}

// 这个组件展示后台总览，入参为空，返回值是执事任务台首页。
export function AdminDashboardPage() {
  // 这个状态保存后台聚合数据。
  const [loading, setLoading] = useState(true)
  const [counts, setCounts] = useState({
    pendingApplications: 0,
    pendingLanterns: 0,
    activeEvents: 0,
    publishedAnnouncements: 0,
    quizResults: 0
  })

  useEffect(() => {
    // 这里读取后台全部待办并统计关键数量。
    async function loadOverview() {
      const result = await fetchAdminOverview()
      setCounts({
        pendingApplications: result.data.applications.filter((item) => item.status === 'pending').length,
        pendingLanterns: result.data.lanterns.filter((item) => item.status === 'pending').length,
        activeEvents: result.data.events.filter((item) => item.status === 'published').length,
        publishedAnnouncements: result.data.announcements.filter((item) => item.status === 'published').length,
        quizResults: result.data.quizResults.length
      })
      setLoading(false)
    }

    void loadOverview()
  }, [])

  if (loading) {
    return (
      <div className="work-content">
        <AdminTopbar title="执事任务台" description="正在聚合今日待办。" />
        <LoadingBlock label="正在整理后台任务" />
      </div>
    )
  }

  return (
    <div className="work-content">
      <AdminTopbar title="执事任务台" description="把待审核、待发布、待维护的事务汇总在一处。" />
      <section className="metric-row">
        <MetricCard label="待审名帖" value={counts.pendingApplications} hint="需要掌门或云纪执事查看" />
        <MetricCard label="待审云灯" value={counts.pendingLanterns} hint="适合公开的灯才上墙" />
        <MetricCard label="开放雅集" value={counts.activeEvents} hint="正在公开报名或展示" />
        <MetricCard label="已发告示" value={counts.publishedAnnouncements} hint="山门墙上可见内容" />
      </section>
      <section className="mission-grid mission-grid--two">
        <MissionCard
          title="优先处理"
          eyebrow="今日待办"
          action={
            <>
              <TaskLink to="/admin/applications" tone="primary">
                控名册
              </TaskLink>
              <TaskLink to="/admin/lanterns" tone="secondary">
                审云灯
              </TaskLink>
            </>
          }
        >
          <p>名帖和云灯会直接影响访客与同门体验，建议优先处理待审记录。</p>
        </MissionCard>
        <MissionCard
          title="持续维护"
          eyebrow="山门运转"
          action={
            <>
              <TaskLink to="/admin/announcements" tone="secondary">
                发告示
              </TaskLink>
              <TaskLink to="/admin/events" tone="secondary">
                管雅集
              </TaskLink>
            </>
          }
        >
          <p>考核记录共 {counts.quizResults} 条。可结合名帖审核判断来者是否已明白金典。</p>
        </MissionCard>
      </section>
    </div>
  )
}

// 这个组件展示后台名册控制台，入参为空，返回值是可直接编辑名册全量字段的工作台。
export function AdminApplicationsPage() {
  // 这些状态保存名帖列表、筛选和反馈。
  const [items, setItems] = useState<JoinApplication[]>([])
  const [statusFilter, setStatusFilter] = useState('all')
  const [keyword, setKeyword] = useState('')
  const [selectedId, setSelectedId] = useState('')
  const [editForm, setEditForm] = useState<JoinApplicationUpdateInput | null>(null)
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    // 这里读取全部名帖台账。
    async function loadApplications() {
      const result = await fetchAdminApplications()
      const nextItems = result.data
      const firstItem = nextItems[0]
      setItems(nextItems)
      setSelectedId(firstItem?.id ?? '')
      setEditForm(firstItem ? createApplicationEditForm(firstItem) : null)
      setLoading(false)
    }

    void loadApplications()
  }, [])

  // 这个变量按筛选条件过滤名帖，返回值用于台账展示。
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchesStatus = statusFilter === 'all' || item.status === statusFilter
      const text = `${item.nickname} ${item.jianghu_name ?? ''} ${item.real_name ?? ''} ${item.wechat_id} ${item.legacy_contact ?? ''} ${item.member_code ?? ''} ${item.public_region ?? ''} ${item.city ?? ''}`.toLowerCase()
      const matchesKeyword = !keyword.trim() || text.includes(keyword.trim().toLowerCase())
      return matchesStatus && matchesKeyword
    })
  }, [items, keyword, statusFilter])

  // 这个变量保存当前选中的名帖，返回值用于编辑器显示。
  const selectedApplication = useMemo(() => items.find((item) => item.id === selectedId) ?? null, [items, selectedId])

  // 这个数组保存后台身份选项，返回值兼容历史身份。
  const roleOptions = useMemo(() => {
    const currentRole = editForm?.member_role
    const basicRoles = [...memberRoleOptions] as WenyunMemberRole[]

    return currentRole && !basicRoles.includes(currentRole) ? [...basicRoles, currentRole] : basicRoles
  }, [editForm?.member_role])

  // 这个函数选择要编辑的名帖，入参是名帖记录，返回值为空。
  function selectApplication(item: JoinApplication) {
    setSelectedId(item.id)
    setEditForm(createApplicationEditForm(item))
    setMessage('')
  }

  // 这个函数更新编辑表单字段，入参是字段名和值，返回值为空。
  function updateEditField<K extends keyof JoinApplicationUpdateInput>(key: K, value: JoinApplicationUpdateInput[K]) {
    setEditForm((current) => (current ? { ...current, [key]: value } : current))
  }

  // 这个函数保存名帖全量资料，入参是表单事件，返回值为空。
  async function saveApplicationDetails(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!selectedApplication || !editForm) {
      setMessage('请先选择一条名帖。')
      return
    }

    setSaving(true)
    const result = await updateApplicationDetails(selectedApplication.id, editForm)
    setSaving(false)
    setMessage(result.message)

    if (result.ok && result.data) {
      const nextApplication = result.data as JoinApplication
      setItems((current) => current.map((item) => (item.id === nextApplication.id ? nextApplication : item)))
      setEditForm(createApplicationEditForm(nextApplication))
    }
  }

  // 这个函数更新名帖状态，入参是名帖编号和状态，返回值为空。
  async function changeStatus(id: string, status: JoinApplicationStatus) {
    const result = await updateApplicationStatus(id, status)
    setMessage(result.message)
    if (result.ok && result.data) {
      const nextApplication = result.data as JoinApplication
      setItems((current) => current.map((item) => (item.id === id ? nextApplication : item)))
      if (selectedId === id) {
        setEditForm(createApplicationEditForm(nextApplication))
      }
    }
  }

  // 这个函数删除名帖，入参是名帖编号，返回值为空。
  async function removeApplication(id: string) {
    const result = await deleteApplicationPermanently(id)
    setMessage(result.message)
    if (result.ok) {
      const nextItems = items.filter((item) => item.id !== id)
      const nextSelected = selectedId === id ? nextItems[0] : selectedApplication
      setItems(nextItems)
      setSelectedId(nextSelected?.id ?? '')
      setEditForm(nextSelected ? createApplicationEditForm(nextSelected) : null)
    }
  }

  return (
    <div className="work-content">
      <AdminTopbar title="名册控制台" description="执事可直接编辑名册资料、编号、身份、状态、联系方式与审核记录。" />
      {message ? <StatusNotice tone={message.includes('失败') ? 'danger' : 'success'}>{message}</StatusNotice> : null}
      {loading ? <LoadingBlock label="正在读取名帖" /> : null}
      {!loading ? (
        <section className="admin-roster-workbench">
          <aside className="admin-roster-list" aria-label="名帖列表">
            <div className="admin-roster-list__head">
              <div>
                <p className="section-eyebrow">名册索引</p>
                <h2>{filteredItems.length} 条记录</h2>
              </div>
              <StatusPill value={statusFilter === 'all' ? 'published' : statusFilter} />
            </div>
            <div className="admin-roster-filters">
              <input className="search-input" onChange={(event) => setKeyword(event.target.value)} placeholder="搜索道名、姓名、编号、联系方式" value={keyword} />
              <select className="search-input" onChange={(event) => setStatusFilter(event.target.value)} value={statusFilter}>
                <option value="all">全部状态</option>
                {applicationStatusOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            {filteredItems.length === 0 ? <EmptyState title="没有匹配名帖" description="换个筛选条件再查。" /> : null}
            <div className="admin-roster-items">
              {filteredItems.map((item) => (
                <button className={item.id === selectedId ? 'active' : ''} key={item.id} onClick={() => selectApplication(item)} type="button">
                  <span>
                    <strong>{item.nickname}</strong>
                    <small>{item.member_code ?? '待编号'} · {item.member_role ?? '同门'}</small>
                  </span>
                  <StatusPill value={item.status} />
                </button>
              ))}
            </div>
          </aside>

          <section className="admin-roster-editor" aria-label="名帖编辑器">
            {!selectedApplication || !editForm ? (
              <EmptyState title="请选择名帖" description="左侧点选一条记录后，可在这里直接编辑完整名册资料。" />
            ) : (
              <form className="admin-editor-form" onSubmit={saveApplicationDetails}>
                <div className="admin-editor-title">
                  <div>
                    <p className="section-eyebrow">正在编辑</p>
                    <h2>{selectedApplication.nickname}</h2>
                    <span>{selectedApplication.real_name ?? '未填姓名'} · {formatDateTime(selectedApplication.created_at)}</span>
                  </div>
                  <div className="admin-editor-title__actions">
                    <TaskButton disabled={saving} icon="save" tone="primary" type="submit">
                      {saving ? '正在保存' : '保存名册'}
                    </TaskButton>
                    <TaskButton icon="trash" onClick={() => removeApplication(selectedApplication.id)} tone="danger" type="button">
                      删除
                    </TaskButton>
                  </div>
                </div>

                <div className="admin-editor-section">
                  <h3>名册身份</h3>
                  <div className="form-grid">
                    <Field label="道名">
                      <input onChange={(event) => updateEditField('nickname', event.target.value)} value={editForm.nickname} />
                    </Field>
                    <Field label="江湖名">
                      <input onChange={(event) => updateEditField('jianghu_name', event.target.value)} value={editForm.jianghu_name} />
                    </Field>
                    <Field label="名册编号">
                      <input onChange={(event) => updateEditField('member_code', event.target.value)} value={editForm.member_code} />
                    </Field>
                    <Field label="入册序号">
                      <input inputMode="numeric" onChange={(event) => updateEditField('roster_serial', event.target.value)} value={editForm.roster_serial} />
                    </Field>
                    <Field label="辈分字">
                      <input onChange={(event) => updateEditField('generation_name', event.target.value)} value={editForm.generation_name} />
                    </Field>
                    <Field label="门派身份">
                      <select onChange={(event) => updateEditField('member_role', event.target.value as WenyunMemberRole)} value={editForm.member_role}>
                        {roleOptions.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    </Field>
                    <Field label="名帖状态">
                      <select onChange={(event) => updateEditField('status', event.target.value as JoinApplicationStatus)} value={editForm.status}>
                        {applicationStatusOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </Field>
                    <Field label="入册时间">
                      <input onChange={(event) => updateEditField('joined_at', event.target.value)} type="datetime-local" value={editForm.joined_at} />
                    </Field>
                  </div>
                </div>

                <div className="admin-editor-section">
                  <h3>真实资料与联系</h3>
                  <div className="form-grid">
                    <Field label="真实姓名">
                      <input onChange={(event) => updateEditField('real_name', event.target.value)} value={editForm.real_name} />
                    </Field>
                    <Field label="微信号">
                      <input onChange={(event) => updateEditField('wechat_id', event.target.value)} value={editForm.wechat_id} />
                    </Field>
                    <Field label="备用联系">
                      <input onChange={(event) => updateEditField('legacy_contact', event.target.value)} value={editForm.legacy_contact} />
                    </Field>
                    <Field label="出生年份">
                      <input inputMode="numeric" onChange={(event) => updateEditField('age_range', event.target.value)} value={editForm.age_range} />
                    </Field>
                    <Field label="公开性别">
                      <select onChange={(event) => updateEditField('gender', event.target.value as MemberGender)} value={editForm.gender}>
                        {genderOptions.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    </Field>
                    <Field label="所在城市">
                      <input onChange={(event) => updateEditField('city', event.target.value)} value={editForm.city} />
                    </Field>
                    <Field label="公开地区">
                      <input onChange={(event) => updateEditField('public_region', event.target.value)} value={editForm.public_region} />
                    </Field>
                    <Field label="后台地区原文">
                      <input onChange={(event) => updateEditField('raw_region', event.target.value)} value={editForm.raw_region} />
                    </Field>
                  </div>
                </div>

                <div className="admin-editor-section">
                  <h3>公开名册内容</h3>
                  <div className="form-grid">
                    <Field label="入派宣言">
                      <textarea onChange={(event) => updateEditField('motto', event.target.value)} value={editForm.motto} />
                    </Field>
                    <Field label="兴趣爱好">
                      <textarea onChange={(event) => updateEditField('tags', event.target.value)} value={editForm.tags} />
                    </Field>
                    <Field label="同行期待">
                      <textarea onChange={(event) => updateEditField('companion_expectation', event.target.value)} value={editForm.companion_expectation} />
                    </Field>
                    <Field label="申请理由">
                      <textarea onChange={(event) => updateEditField('reason', event.target.value)} value={editForm.reason} />
                    </Field>
                  </div>
                </div>

                <div className="admin-editor-section">
                  <h3>审核与归云堂</h3>
                  <div className="form-grid">
                    <Field label="管理员备注">
                      <textarea onChange={(event) => updateEditField('admin_note', event.target.value)} value={editForm.admin_note} />
                    </Field>
                    <Field label="申请改道名">
                      <input onChange={(event) => updateEditField('requested_nickname', event.target.value)} value={editForm.requested_nickname} />
                    </Field>
                    <Field label="申请改联系方式">
                      <input onChange={(event) => updateEditField('requested_legacy_contact', event.target.value)} value={editForm.requested_legacy_contact} />
                    </Field>
                    <Field label="入归云堂时间">
                      <input onChange={(event) => updateEditField('guiyuntang_joined_at', event.target.value)} type="datetime-local" value={editForm.guiyuntang_joined_at} />
                    </Field>
                    <div className="checkbox-row admin-editor-checks">
                      <label>
                        <input checked={editForm.accept_rules} onChange={(event) => updateEditField('accept_rules', event.target.checked)} type="checkbox" />
                        已认同立派金典
                      </label>
                      <label>
                        <input checked={editForm.guiyuntang_joined} onChange={(event) => updateEditField('guiyuntang_joined', event.target.checked)} type="checkbox" />
                        已进入归云堂
                      </label>
                    </div>
                  </div>
                </div>

                <div className="admin-editor-footer">
                  <div className="admin-editor-quick">
                    <TaskButton icon="check" onClick={() => changeStatus(selectedApplication.id, 'approved')} tone="secondary" type="button">
                      快速通过
                    </TaskButton>
                    <TaskButton icon="mail" onClick={() => changeStatus(selectedApplication.id, 'contacted')} tone="secondary" type="button">
                      标为已联系
                    </TaskButton>
                    <TaskButton icon="alertTriangle" onClick={() => changeStatus(selectedApplication.id, 'rejected')} tone="danger" type="button">
                      标为未通过
                    </TaskButton>
                  </div>
                  <TaskButton disabled={saving} icon="save" tone="primary" type="submit">
                    {saving ? '正在保存' : '保存全部修改'}
                  </TaskButton>
                </div>
              </form>
            )}
          </section>
        </section>
      ) : null}
    </div>
  )
}

// 这个组件展示云灯审核，入参为空，返回值是云灯台账和审核动作。
export function AdminLanternsPage() {
  // 这些状态保存云灯列表、筛选和反馈。
  const [items, setItems] = useState<CloudLantern[]>([])
  const [statusFilter, setStatusFilter] = useState('all')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // 这里读取全部云灯。
    async function loadLanterns() {
      const result = await fetchAdminLanterns()
      setItems(result.data)
      setLoading(false)
    }

    void loadLanterns()
  }, [])

  // 这个变量保存筛选后的云灯列表。
  const filteredItems = useMemo(() => items.filter((item) => statusFilter === 'all' || item.status === statusFilter), [items, statusFilter])

  // 这个函数更新云灯状态，入参是云灯编号和状态，返回值为空。
  async function changeStatus(id: string, status: CloudLantern['status']) {
    const result = await updateLanternStatus(id, status)
    setMessage(result.message)
    if (result.ok && result.data) {
      setItems((current) => current.map((item) => (item.id === id ? result.data as CloudLantern : item)))
    }
  }

  return (
    <div className="work-content">
      <AdminTopbar title="云灯审核" description="审核来客寄语，决定是否公开点亮。" />
      {message ? <StatusNotice tone={message.includes('失败') ? 'danger' : 'success'}>{message}</StatusNotice> : null}
      <div className="filter-bar">
        <select className="search-input" onChange={(event) => setStatusFilter(event.target.value)} value={statusFilter}>
          <option value="all">全部云灯</option>
          <option value="pending">待审核</option>
          <option value="approved">已公开</option>
          <option value="rejected">已拒绝</option>
        </select>
      </div>
      {loading ? <LoadingBlock label="正在读取云灯" /> : null}
      <section className="mission-grid mission-grid--two">
        {filteredItems.map((item) => (
          <MissionCard key={item.id} title={item.author_name} eyebrow={formatDateTime(item.created_at)} meta={<StatusPill value={item.status} />}>
            <p>{item.content}</p>
            <div className="mission-card__action">
              <TaskButton onClick={() => changeStatus(item.id, 'approved')} tone="secondary" type="button">
                公开
              </TaskButton>
              <TaskButton onClick={() => changeStatus(item.id, 'rejected')} tone="danger" type="button">
                拒绝
              </TaskButton>
            </div>
          </MissionCard>
        ))}
      </section>
    </div>
  )
}

// 这个组件展示公告管理，入参为空，返回值是公告创建表单和台账。
export function AdminAnnouncementsPage() {
  // 这些状态保存公告列表、表单和反馈。
  const [items, setItems] = useState<Announcement[]>([])
  const [form, setForm] = useState({ title: '', category: '山门告示', summary: '', content: '', isPinned: false, status: 'draft' as PublishStatus })
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // 这里读取公告台账。
    async function loadAnnouncements() {
      const result = await fetchAdminAnnouncements()
      setItems(result.data)
      setLoading(false)
    }

    void loadAnnouncements()
  }, [])

  // 这个函数创建公告，入参是表单事件，返回值为空。
  async function saveAnnouncement(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const result = await createAnnouncement(form)
    setMessage(result.message)
    if (result.ok && result.data) {
      setItems((current) => [result.data as Announcement, ...current])
      setForm({ title: '', category: '山门告示', summary: '', content: '', isPinned: false, status: 'draft' })
    }
  }

  return (
    <div className="work-content">
      <AdminTopbar title="山门告示" description="创建、查看和区分公告发布状态。" />
      {message ? <StatusNotice tone={message.includes('失败') || message.includes('请填写') ? 'warning' : 'success'}>{message}</StatusNotice> : null}
      <section className="mission-grid mission-grid--two">
        <MissionCard title="创建告示" eyebrow="发布前可先存草稿">
          <form className="form-grid form-grid--single" onSubmit={saveAnnouncement}>
            <Field label="标题">
              <input onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))} value={form.title} />
            </Field>
            <Field label="分类">
              <input onChange={(event) => setForm((current) => ({ ...current, category: event.target.value }))} value={form.category} />
            </Field>
            <Field label="摘要">
              <textarea onChange={(event) => setForm((current) => ({ ...current, summary: event.target.value }))} value={form.summary} />
            </Field>
            <Field label="正文">
              <textarea onChange={(event) => setForm((current) => ({ ...current, content: event.target.value }))} value={form.content} />
            </Field>
            <Field label="状态">
              <select onChange={(event) => setForm((current) => ({ ...current, status: event.target.value as PublishStatus }))} value={form.status}>
                <option value="draft">草稿</option>
                <option value="published">发布</option>
                <option value="closed">关闭</option>
              </select>
            </Field>
            <div className="checkbox-row">
              <label>
                <input checked={form.isPinned} onChange={(event) => setForm((current) => ({ ...current, isPinned: event.target.checked }))} type="checkbox" />
                置顶告示
              </label>
            </div>
            <TaskButton tone="primary" type="submit">
              保存告示
            </TaskButton>
          </form>
        </MissionCard>
        <MissionCard title="告示台账" eyebrow="已建记录">
          {loading ? <LoadingBlock label="正在读取告示" /> : null}
          {items.map((item) => (
            <div className="ledger-row" key={item.id}>
              <div>
                <strong>{item.title}</strong>
                <span>{item.category} · {formatDateTime(item.created_at)}</span>
              </div>
              <StatusPill value={item.status} />
            </div>
          ))}
        </MissionCard>
      </section>
    </div>
  )
}

// 这个组件展示活动管理，入参为空，返回值是活动创建、活动台账和报名流转。
export function AdminEventsPage() {
  // 这些状态保存活动、报名、表单和反馈。
  const [events, setEvents] = useState<WenyunEvent[]>([])
  const [registrationCount, setRegistrationCount] = useState(0)
  const [form, setForm] = useState<EventFormInput>({ title: '', type: '清谈', mode: 'online', location: '', eventTime: '', description: '', capacity: '', status: 'draft' as PublishStatus })
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // 这里读取活动和报名数据。
    async function loadEvents() {
      const [eventResult, registrationResult] = await Promise.all([fetchAdminEvents(), fetchAdminRegistrations()])
      setEvents(eventResult.data)
      setRegistrationCount(registrationResult.data.length)
      setLoading(false)
    }

    void loadEvents()
  }, [])

  // 这个函数创建雅集，入参是表单事件，返回值为空。
  async function saveEvent(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const result = await createEvent(form)
    setMessage(result.message)
    if (result.ok && result.data) {
      setEvents((current) => [result.data as WenyunEvent, ...current])
      setForm({ title: '', type: '清谈', mode: 'online', location: '', eventTime: '', description: '', capacity: '', status: 'draft' })
    }
  }

  // 这个函数演示报名状态流转，入参为空，返回值为空。
  async function markFirstRegistrationAttended() {
    const registrations = await fetchAdminRegistrations()
    const first = registrations.data[0]
    if (!first) {
      setMessage('暂无报名记录可流转。')
      return
    }
    const result = await updateEventRegistrationStatus(first.id, 'attended')
    setMessage(result.message)
  }

  return (
    <div className="work-content">
      <AdminTopbar title="雅集管理" description="创建活动、查看开放状态，并维护报名记录。" />
      {message ? <StatusNotice tone={message.includes('失败') || message.includes('暂无') ? 'warning' : 'success'}>{message}</StatusNotice> : null}
      <section className="metric-row">
        <MetricCard label="活动记录" value={events.length} hint="包含草稿和公开活动" />
        <MetricCard label="报名记录" value={registrationCount} hint="所有雅集累计报名" />
        <MetricCard label="公开活动" value={events.filter((item) => item.status === 'published').length} hint="访客当前可见" />
        <MetricCard label="草稿活动" value={events.filter((item) => item.status === 'draft').length} hint="仅后台可见" />
      </section>
      <section className="mission-grid mission-grid--two">
        <MissionCard title="创建雅集" eyebrow="可先存草稿">
          <form className="form-grid form-grid--single" onSubmit={saveEvent}>
            <Field label="标题">
              <input onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))} value={form.title} />
            </Field>
            <Field label="类型">
              <input onChange={(event) => setForm((current) => ({ ...current, type: event.target.value }))} value={form.type} />
            </Field>
            <Field label="方式">
              <select onChange={(event) => setForm((current) => ({ ...current, mode: event.target.value as 'online' | 'offline' }))} value={form.mode}>
                <option value="online">线上</option>
                <option value="offline">线下</option>
              </select>
            </Field>
            <Field label="地点">
              <input onChange={(event) => setForm((current) => ({ ...current, location: event.target.value }))} value={form.location} />
            </Field>
            <Field label="时间">
              <input onChange={(event) => setForm((current) => ({ ...current, eventTime: event.target.value }))} type="datetime-local" value={form.eventTime} />
            </Field>
            <Field label="人数上限">
              <input inputMode="numeric" onChange={(event) => setForm((current) => ({ ...current, capacity: event.target.value }))} value={form.capacity} />
            </Field>
            <Field label="说明">
              <textarea onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} value={form.description} />
            </Field>
            <Field label="状态">
              <select onChange={(event) => setForm((current) => ({ ...current, status: event.target.value as PublishStatus }))} value={form.status}>
                <option value="draft">草稿</option>
                <option value="published">发布</option>
                <option value="closed">关闭</option>
                <option value="ended">结束</option>
              </select>
            </Field>
            <TaskButton tone="primary" type="submit">
              保存雅集
            </TaskButton>
          </form>
        </MissionCard>
        <MissionCard
          title="活动台账"
          eyebrow="报名与状态"
          action={
            <TaskButton onClick={markFirstRegistrationAttended} tone="secondary" type="button">
              流转首条报名
            </TaskButton>
          }
        >
          {loading ? <LoadingBlock label="正在读取雅集" /> : null}
          {events.map((item) => (
            <div className="ledger-row" key={item.id}>
              <div>
                <strong>{item.title}</strong>
                <span>{item.type} · {formatDateTime(item.event_time)}</span>
              </div>
              <StatusPill value={item.status} />
            </div>
          ))}
        </MissionCard>
      </section>
    </div>
  )
}

// 这个组件展示执事权限管理，入参为空，返回值是用户权限台账和账号维护。
export function AdminStewardsPage() {
  // 这些状态保存执事列表、账号表单和反馈。
  const [items, setItems] = useState<AdminRoleUser[]>([])
  const [emailByUser, setEmailByUser] = useState<Record<string, string>>({})
  const [passwordByUser, setPasswordByUser] = useState<Record<string, string>>({})
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // 这里读取可管理用户列表。
    async function loadUsers() {
      const result = await fetchAdminRoleUsers()
      setItems(result.data)
      setEmailByUser(Object.fromEntries(result.data.map((item) => [item.user_id, item.email])))
      setLoading(false)
    }

    void loadUsers()
  }, [])

  // 这个函数修改权限，入参是用户编号和角色，返回值为空。
  async function changeRole(userId: string, role: ProfileRole) {
    const result = await updateAdminUserRole(userId, role)
    setMessage(result.message)
    if (result.ok && result.data) {
      setItems((current) => current.map((item) => (item.user_id === userId ? result.data as AdminRoleUser : item)))
    }
  }

  // 这个函数保存账号，入参是用户编号，返回值为空。
  async function saveAccount(userId: string) {
    const result = await updateAdminUserAccount({
      user_id: userId,
      email: emailByUser[userId] ?? '',
      password: passwordByUser[userId] ?? ''
    })
    setMessage(result.message)
    if (result.ok && result.data) {
      setItems((current) => current.map((item) => (item.user_id === userId ? result.data as AdminRoleUser : item)))
      setPasswordByUser((current) => ({ ...current, [userId]: '' }))
    }
  }

  return (
    <div className="work-content">
      <AdminTopbar title="执事权限" description="维护后台角色、登录邮箱和必要的密码重置。" />
      {message ? <StatusNotice tone={message.includes('失败') || message.includes('请填写') ? 'warning' : 'success'}>{message}</StatusNotice> : null}
      {loading ? <LoadingBlock label="正在读取执事名册" /> : null}
      <section className="admin-ledger">
        <div className="admin-ledger__head">
          <span>用户</span>
          <span>账号</span>
          <span>角色</span>
          <span>操作</span>
        </div>
        {items.map((item) => (
          <article className="admin-ledger__row" key={item.user_id}>
            <div data-label="用户">
              <strong>{item.nickname}</strong>
              <span>{item.dao_name ?? item.member_code ?? '未入名册'}</span>
            </div>
            <div data-label="账号">
              <input className="search-input" onChange={(event) => setEmailByUser((current) => ({ ...current, [item.user_id]: event.target.value }))} value={emailByUser[item.user_id] ?? ''} />
              <input className="search-input" onChange={(event) => setPasswordByUser((current) => ({ ...current, [item.user_id]: event.target.value }))} placeholder="留空不改密码" type="password" value={passwordByUser[item.user_id] ?? ''} />
            </div>
            <div data-label="角色">
              <StatusPill value={item.role} />
              <select className="search-input" onChange={(event) => changeRole(item.user_id, event.target.value as ProfileRole)} value={item.role}>
                <option value="member">同门</option>
                <option value="admin">执事</option>
                <option value="founder">掌门</option>
              </select>
            </div>
            <div className="admin-ledger__actions" data-label="操作">
              <TaskButton className="compact-button" onClick={() => saveAccount(item.user_id)} tone="secondary" type="button">
                保存账号
              </TaskButton>
            </div>
          </article>
        ))}
      </section>
    </div>
  )
}

// 这个组件展示后台设置，入参为空，返回值是联系、邮件和归云堂设置表单。
export function AdminSettingsPage() {
  // 这些状态保存三组设置和反馈。
  const [contact, setContact] = useState(createContactForm([]))
  const [music, setMusic] = useState<MusicPlayerSettingInput>(createMusicForm([]))
  const [smtp, setSmtp] = useState({ enabled: false, host: '', port: '465', secure: true, username: '', password: '', from_email: '' })
  const [guiyuntang, setGuiyuntang] = useState({ enabled: true, qr_image_data_url: '', instruction: '', warning: '' })
  const [qrFileName, setQrFileName] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [uploadingQr, setUploadingQr] = useState(false)

  useEffect(() => {
    // 这里并行读取站点设置、邮件设置和归云堂设置。
    async function loadSettings() {
      const [settingsResult, smtpResult, guiyuntangResult] = await Promise.all([fetchSettings(), fetchSmtpSetting(), fetchGuiyuntangSetting()])
      const smtpData = smtpResult.data as SmtpSetting | null
      const guiyuntangData = guiyuntangResult.data as GuiyuntangSetting | null
      setContact(createContactForm(settingsResult.data))
      setMusic(createMusicForm(settingsResult.data))
      if (smtpData) {
        setSmtp({ enabled: smtpData.enabled, host: smtpData.host, port: String(smtpData.port), secure: smtpData.secure, username: smtpData.username, password: '', from_email: smtpData.from_email })
      }
      if (guiyuntangData) {
        setGuiyuntang({
          enabled: guiyuntangData.enabled,
          qr_image_data_url: guiyuntangData.qr_image_data_url ?? '',
          instruction: guiyuntangData.instruction,
          warning: guiyuntangData.warning
        })
        setQrFileName(guiyuntangData.qr_image_data_url ? '已保存二维码图片' : '')
      }
      setLoading(false)
    }

    void loadSettings()
  }, [])

  // 这个函数保存联系设置，入参是表单事件，返回值为空。
  async function saveContact(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const result = await saveContactSetting(contact)
    setMessage(result.message)
  }

  // 这个函数保存邮件设置，入参是表单事件，返回值为空。
  async function saveMail(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const result = await saveSmtpSetting(smtp)
    setMessage(result.message)
  }

  // 这个函数保存音乐播放器设置，入参是表单事件，返回值为空。
  async function saveMusic(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const playlistId = music.playlist_id.trim() || extractNeteasePlaylistId(music.playlist_url)
    const result = await saveMusicPlayerSetting({ ...music, playlist_id: playlistId })
    setMessage(result.message)
    if (result.ok) {
      setMusic((current) => ({ ...current, playlist_id: playlistId }))
    }
  }

  // 这个函数保存归云堂设置，入参是表单事件，返回值为空。
  async function saveGuiyuntang(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (uploadingQr) {
      setMessage('二维码图片仍在读取，请稍等。')
      return
    }
    if (guiyuntang.enabled && !guiyuntang.qr_image_data_url.trim()) {
      setMessage('请先上传归云堂入群二维码图片。')
      return
    }
    const result = await saveGuiyuntangSetting(guiyuntang)
    setMessage(result.message)
    if (result.ok && result.data) {
      const nextSetting = result.data as GuiyuntangSetting
      setGuiyuntang({
        enabled: nextSetting.enabled,
        qr_image_data_url: nextSetting.qr_image_data_url ?? '',
        instruction: nextSetting.instruction,
        warning: nextSetting.warning
      })
      setQrFileName(nextSetting.qr_image_data_url ? qrFileName || '已保存二维码图片' : '')
    }
  }

  // 这个函数处理二维码图片上传，入参是文件输入事件，返回值为空。
  async function uploadGuiyuntangQr(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]

    if (!file) {
      return
    }

    if (!file.type.startsWith('image/')) {
      setMessage('请上传图片格式的二维码文件。')
      event.target.value = ''
      return
    }

    if (file.size > maxQrImageSize) {
      setMessage('二维码图片不能超过 2MB，请压缩后再上传。')
      event.target.value = ''
      return
    }

    setUploadingQr(true)
    try {
      const dataUrl = await readImageFileAsDataUrl(file)
      setGuiyuntang((current) => ({ ...current, qr_image_data_url: dataUrl, enabled: true }))
      setQrFileName(file.name)
      setMessage('二维码图片已读取，点击保存后才会正式写入后台设置。')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '二维码图片读取失败，请重新选择图片。')
    } finally {
      setUploadingQr(false)
      event.target.value = ''
    }
  }

  // 这个函数移除当前表单里的二维码，入参为空，返回值为空。
  function clearGuiyuntangQr() {
    setGuiyuntang((current) => ({ ...current, enabled: false, qr_image_data_url: '' }))
    setQrFileName('')
    setMessage('已移除表单里的二维码，点击保存后才会同步到后台设置。')
  }

  if (loading) {
    return (
      <div className="work-content">
        <AdminTopbar title="山门设置" description="正在读取设置。" />
        <LoadingBlock label="正在读取设置" />
      </div>
    )
  }

  return (
    <div className="work-content">
      <AdminTopbar title="山门设置" description="维护公开联系、前台音乐、邮件发送和归云堂入群提示。" />
      {message ? <StatusNotice tone={message.includes('失败') || message.includes('请填写') ? 'warning' : 'success'}>{message}</StatusNotice> : null}
      <section className="mission-grid">
        <MissionCard title="联系信笺" eyebrow="公开端可见">
          <form className="form-grid form-grid--single" onSubmit={saveContact}>
            <Field label="联系名">
              <input onChange={(event) => setContact((current) => ({ ...current, wechatName: event.target.value }))} value={contact.wechatName} />
            </Field>
            <Field label="联系说明">
              <textarea onChange={(event) => setContact((current) => ({ ...current, contactTip: event.target.value }))} value={contact.contactTip} />
            </Field>
            <Field label="群码说明">
              <textarea onChange={(event) => setContact((current) => ({ ...current, qrDescription: event.target.value }))} value={contact.qrDescription} />
            </Field>
            <TaskButton tone="primary" type="submit">
              保存联系设置
            </TaskButton>
          </form>
        </MissionCard>
        <MissionCard title="邮件设置" eyebrow="提醒发送">
          <form className="form-grid form-grid--single" onSubmit={saveMail}>
            <div className="checkbox-row">
              <label>
                <input checked={smtp.enabled} onChange={(event) => setSmtp((current) => ({ ...current, enabled: event.target.checked }))} type="checkbox" />
                启用邮件提醒
              </label>
            </div>
            <Field label="SMTP 主机">
              <input onChange={(event) => setSmtp((current) => ({ ...current, host: event.target.value }))} value={smtp.host} />
            </Field>
            <Field label="端口">
              <input onChange={(event) => setSmtp((current) => ({ ...current, port: event.target.value }))} value={smtp.port} />
            </Field>
            <Field label="账号">
              <input onChange={(event) => setSmtp((current) => ({ ...current, username: event.target.value }))} value={smtp.username} />
            </Field>
            <Field label="授权码">
              <input onChange={(event) => setSmtp((current) => ({ ...current, password: event.target.value }))} type="password" value={smtp.password} />
            </Field>
            <Field label="发件人">
              <input onChange={(event) => setSmtp((current) => ({ ...current, from_email: event.target.value }))} value={smtp.from_email} />
            </Field>
            <TaskButton tone="primary" type="submit">
              保存邮件设置
            </TaskButton>
          </form>
        </MissionCard>
        <MissionCard title="前台音乐" eyebrow="网易云歌单">
          <form className="form-grid form-grid--single" onSubmit={saveMusic}>
            <div className="checkbox-row">
              <label>
                <input checked={music.enabled} onChange={(event) => setMusic((current) => ({ ...current, enabled: event.target.checked }))} type="checkbox" />
                启用前台播放器
              </label>
              <label>
                <input checked={music.autoplay} onChange={(event) => setMusic((current) => ({ ...current, autoplay: event.target.checked }))} type="checkbox" />
                请求自动播放
              </label>
            </div>
            <Field label="播放器标题">
              <input onChange={(event) => setMusic((current) => ({ ...current, title: event.target.value }))} value={music.title} />
            </Field>
            <Field label="网易云歌单链接" hint="可直接粘贴 https://music.163.com/#/playlist?id=歌单编号。">
              <input
                onChange={(event) => {
                  const nextUrl = event.target.value
                  setMusic((current) => ({ ...current, playlist_url: nextUrl, playlist_id: extractNeteasePlaylistId(nextUrl) || current.playlist_id }))
                }}
                value={music.playlist_url}
              />
            </Field>
            <Field label="歌单编号" hint="如果链接无法识别，可手动填写纯数字编号。">
              <input inputMode="numeric" onChange={(event) => setMusic((current) => ({ ...current, playlist_id: event.target.value }))} value={music.playlist_id} />
            </Field>
            <Field label="歌词兜底文本" hint="每行一句；真实歌词读取失败时使用这里的文本，前台只显示歌词文字。">
              <textarea onChange={(event) => setMusic((current) => ({ ...current, lyric_lines: event.target.value }))} value={music.lyric_lines} />
            </Field>
            <TaskButton tone="primary" type="submit">
              保存音乐设置
            </TaskButton>
          </form>
        </MissionCard>
        <MissionCard title="归云堂" eyebrow="入群提示">
          <form className="form-grid form-grid--single" onSubmit={saveGuiyuntang}>
            <div className="checkbox-row">
              <label>
                <input checked={guiyuntang.enabled} onChange={(event) => setGuiyuntang((current) => ({ ...current, enabled: event.target.checked }))} type="checkbox" />
                启用入群提示
              </label>
            </div>
            <Field label="上传二维码图片" hint="支持常见图片格式，建议使用清晰方形二维码，文件不超过 2MB。">
              <input accept="image/*" onChange={uploadGuiyuntangQr} type="file" />
            </Field>
            <div className="qr-upload-panel">
              {guiyuntang.qr_image_data_url ? (
                <img alt="归云堂二维码预览" src={guiyuntang.qr_image_data_url} />
              ) : (
                <div className="qr-upload-panel__empty">尚未上传二维码</div>
              )}
              <div>
                <strong>{qrFileName || '等待选择图片'}</strong>
                <span>{guiyuntang.qr_image_data_url ? '当前表单已有二维码预览。' : '上传后会先在这里预览，保存后才正式生效。'}</span>
                {guiyuntang.qr_image_data_url ? (
                  <TaskButton onClick={clearGuiyuntangQr} tone="secondary" type="button">
                    移除二维码
                  </TaskButton>
                ) : null}
              </div>
            </div>
            <Field label="操作说明">
              <textarea onChange={(event) => setGuiyuntang((current) => ({ ...current, instruction: event.target.value }))} value={guiyuntang.instruction} />
            </Field>
            <Field label="保密提醒">
              <textarea onChange={(event) => setGuiyuntang((current) => ({ ...current, warning: event.target.value }))} value={guiyuntang.warning} />
            </Field>
            <TaskButton tone="primary" type="submit">
              保存归云堂设置
            </TaskButton>
          </form>
        </MissionCard>
      </section>
    </div>
  )
}
