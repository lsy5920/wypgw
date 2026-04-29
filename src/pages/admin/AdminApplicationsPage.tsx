import { ChevronDown, ChevronUp, Eye, EyeOff, QrCode, Save, Search, ShieldAlert, Trash2 } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { CloudButton } from '../../components/CloudButton'
import { EmptyState } from '../../components/EmptyState'
import { ScrollPanel } from '../../components/ScrollPanel'
import { SectionTitle } from '../../components/SectionTitle'
import { StatusNotice } from '../../components/StatusNotice'
import { applicationStatusLabels, genderOptions, memberRoleOptions } from '../../data/siteContent'
import { deleteApplicationPermanently, fetchAdminApplications, fetchAdminLatestWenxinQuizResults, fetchGuiyuntangSetting, updateApplicationDetails } from '../../lib/services'
import type {
  GuiyuntangSetting,
  JoinApplication,
  JoinApplicationStatus,
  JoinApplicationUpdateInput,
  MemberGender,
  WenxinQuizResult,
  WenyunMemberRole
} from '../../lib/types'

// 这个类型表示后台名帖筛选按钮，返回值用于区分待办、已处理和特殊状态。
type AdminApplicationFilter = 'pending' | 'reviewed' | 'all' | 'draft' | 'retired'

// 这个数组保存可选审核状态，返回值用于后台下拉框。
const statuses: JoinApplicationStatus[] = ['pending', 'approved', 'contacted', 'joined', 'rejected', 'draft', 'retired']

// 这个数组保存后台筛选项，返回值用于顶部筛选按钮。
const filterItems: Array<{ label: string; value: AdminApplicationFilter }> = [
  { label: '未审核', value: 'pending' },
  { label: '已审核', value: 'reviewed' },
  { label: '全部', value: 'all' },
  { label: '暂存', value: 'draft' },
  { label: '已退派', value: 'retired' }
]

// 这个函数把数据库申请记录转成后台可编辑表单，入参是申请记录，返回值是表单草稿。
function createDraft(item: JoinApplication): JoinApplicationUpdateInput {
  return {
    nickname: item.nickname,
    jianghu_name: item.jianghu_name ?? '',
    real_name: item.real_name ?? '',
    wechat_id: item.wechat_id,
    age_range: item.age_range ?? '',
    gender: item.gender ?? '男',
    city: item.city ?? '',
    reason: item.reason,
    accept_rules: item.accept_rules,
    offline_interest: item.offline_interest ?? '',
    remark: item.remark ?? '',
    admin_note: item.admin_note ?? '',
    member_role: item.member_role ?? '同门',
    generation_name: item.generation_name ?? '云',
    member_code: item.member_code ?? '',
    roster_serial: item.roster_serial ? String(item.roster_serial).padStart(3, '0') : '',
    public_region: item.public_region ?? item.city ?? '',
    raw_region: item.raw_region ?? item.city ?? '',
    motto: item.motto ?? item.reason,
    public_story: item.public_story ?? '',
    raw_story: item.raw_story ?? '',
    tags: item.tags ?? '',
    companion_expectation: item.companion_expectation ?? '',
    legacy_contact: item.legacy_contact ?? item.wechat_id,
    requested_nickname: item.requested_nickname ?? '',
    requested_legacy_contact: item.requested_legacy_contact ?? '',
    joined_at: item.joined_at ?? '',
    status: item.status
  }
}

// 这个函数格式化名帖申请时间，入参是数据库时间字符串，返回值是中文日期时间。
function formatApplicationTime(value: string): string {
  try {
    // 这里转换为本地时间，方便管理员快速判断申请先后。
    return new Date(value).toLocaleString('zh-CN', {
      hour12: false,
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  } catch {
    // 这里兜底处理异常时间，避免页面因为日期解析失败报错。
    return value
  }
}

// 这个函数判断名帖是否符合当前筛选，入参是名帖和筛选值，返回值表示是否展示。
function matchesFilter(item: JoinApplication, filter: AdminApplicationFilter): boolean {
  // 这里把已经处理过的状态合并为“已审核”，便于后台快速查看。
  const reviewedStatuses: JoinApplicationStatus[] = ['approved', 'contacted', 'joined', 'rejected']

  if (filter === 'all') {
    return true
  }

  if (filter === 'reviewed') {
    return reviewedStatuses.includes(item.status)
  }

  return item.status === filter
}

// 这个函数渲染名册管理页，入参为空，返回值是可搜索、筛选和展开编辑的名帖列表。
export function AdminApplicationsPage() {
  // 这个状态保存名帖登记列表。
  const [applications, setApplications] = useState<JoinApplication[]>([])
  // 这个状态保存每条登记的可编辑草稿。
  const [drafts, setDrafts] = useState<Record<string, JoinApplicationUpdateInput>>({})
  // 这个状态保存后台搜索词。
  const [searchTerm, setSearchTerm] = useState('')
  // 这个状态保存当前筛选，默认只看未审核。
  const [filter, setFilter] = useState<AdminApplicationFilter>('pending')
  // 这个状态保存当前展开详情的名帖编号。
  const [expandedId, setExpandedId] = useState('')
  // 这个状态保存正在保存的登记编号。
  const [savingId, setSavingId] = useState('')
  // 这个状态保存正在彻底删除的登记编号。
  const [deletingId, setDeletingId] = useState('')
  // 这个状态保存提示信息。
  const [notice, setNotice] = useState<{ type: 'success' | 'error' | 'info'; title: string; message: string } | null>(null)
  // 这个状态保存每个用户最新问心考核结果，键为用户编号。
  const [quizResults, setQuizResults] = useState<Record<string, WenxinQuizResult>>({})
  // 这个状态保存归云堂二维码设置，只在后台审核页使用。
  const [guiyuntangSetting, setGuiyuntangSetting] = useState<GuiyuntangSetting | null>(null)
  // 这个状态保存已入群名帖是否展开查看二维码。
  const [joinedQrVisible, setJoinedQrVisible] = useState<Record<string, boolean>>({})

  // 这个函数读取登记列表，入参为空，返回值为空。
  async function loadApplications() {
    const [result, quizResult, guiyuntangResult] = await Promise.all([fetchAdminApplications(), fetchAdminLatestWenxinQuizResults(), fetchGuiyuntangSetting()])
    const nextDrafts: Record<string, JoinApplicationUpdateInput> = {}
    const nextQuizResults: Record<string, WenxinQuizResult> = {}

    // 这里把每条数据库记录转换成表单草稿，方便管理员展开后直接编辑。
    result.data.forEach((item) => {
      nextDrafts[item.id] = createDraft(item)
    })

    setApplications(result.data)
    setDrafts(nextDrafts)
    setGuiyuntangSetting(guiyuntangResult.data)

    quizResult.data.forEach((item) => {
      nextQuizResults[item.user_id] = item
    })
    setQuizResults(nextQuizResults)

    if (!result.ok) {
      setNotice({ type: 'error', title: '读取失败', message: result.message })
    } else if (!quizResult.ok) {
      setNotice({ type: 'error', title: '考核读取失败', message: quizResult.message })
    } else if (!guiyuntangResult.ok) {
      setNotice({ type: 'error', title: '归云堂设置读取失败', message: guiyuntangResult.message })
    } else if (result.demoMode) {
      setNotice({ type: 'info', title: '演示模式提示', message: result.message })
    }
  }

  useEffect(() => {
    void loadApplications()
  }, [])

  // 这个变量保存当前筛选后的名帖列表，返回值用于小卡片渲染。
  const filteredApplications = useMemo(() => {
    const keyword = searchTerm.trim()

    return applications.filter((item) => {
      // 这里优先使用草稿内容，让管理员修改后搜索也能即时匹配。
      const draft = drafts[item.id] ?? createDraft(item)
      const matchesKeyword =
        !keyword ||
        draft.nickname.includes(keyword) ||
        draft.real_name.includes(keyword) ||
        draft.wechat_id.includes(keyword) ||
        draft.legacy_contact.includes(keyword)
      const matchesCurrentFilter = matchesFilter(item, filter)

      return matchesKeyword && matchesCurrentFilter
    })
  }, [applications, drafts, filter, searchTerm])

  // 这个函数更新某条登记的草稿字段，入参是登记编号、字段和值，返回值为空。
  function updateDraft<K extends keyof JoinApplicationUpdateInput>(
    id: string,
    field: K,
    value: JoinApplicationUpdateInput[K]
  ) {
    setDrafts((current) => ({
      ...current,
      [id]: {
        ...current[id],
        [field]: value
      }
    }))
  }

  // 这个函数切换详情展开状态，入参是登记编号，返回值为空。
  function toggleExpanded(id: string) {
    setExpandedId((current) => (current === id ? '' : id))
  }

  // 这个函数保存某条登记资料，入参是登记编号，返回值为空。
  async function handleSave(id: string) {
    const draft = drafts[id]

    // 这里防止草稿为空时误提交。
    if (!draft) {
      setNotice({ type: 'error', title: '保存失败', message: '没有找到这条名帖草稿，请刷新页面后再试。' })
      return
    }

    try {
      setSavingId(id)
      const result = await updateApplicationDetails(id, draft)

      setNotice({
        type: result.ok ? 'success' : 'error',
        title: result.ok ? '名帖已保存' : '保存失败',
        message: result.message
      })

      // 这里保存成功后重新读取数据库，确保自动编号和触发器结果同步到页面。
      if (result.ok) {
        await loadApplications()
      }
    } finally {
      setSavingId('')
    }
  }

  // 这个函数彻底删除某条名帖，入参是登记编号和道名，返回值为空。
  async function handleDelete(id: string, nickname: string) {
    // 这里用浏览器确认框做二次确认，避免管理员误点后无法恢复。
    const confirmed = window.confirm(`确定要彻底删除“${nickname || '这条名帖'}”吗？删除后不可恢复，也会从公开名册中消失。`)

    if (!confirmed) {
      return
    }

    try {
      setDeletingId(id)
      const result = await deleteApplicationPermanently(id)

      setNotice({
        type: result.ok ? 'success' : 'error',
        title: result.ok ? '名帖已删除' : '删除失败',
        message: result.message
      })

      // 这里删除成功后清掉展开状态并重新读取列表，保证后台和公开名册状态同步。
      if (result.ok) {
        setExpandedId('')
        await loadApplications()
      }
    } finally {
      setDeletingId('')
    }
  }

  return (
    <div>
      <SectionTitle eyebrow="名帖审核" title="先看名帖，再展开校订">
        默认展示未审核名帖。点击小卡片后，可编辑旧名册字段、身份、编号、状态与备注。
      </SectionTitle>

      {notice ? <StatusNotice type={notice.type} title={notice.title} message={notice.message} /> : null}

      <div className="mt-8 grid gap-4 rounded-2xl border border-[#c9a45c]/25 bg-white/60 p-4 xl:grid-cols-[1fr_auto]">
        <label className="grid gap-2">
          <span className="text-sm font-semibold">搜索名帖</span>
          <span className="relative">
            <Search className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-[#6f8f8b]" />
            <input
              className="w-full rounded-xl border border-[#6f8f8b]/25 bg-white/85 px-10 py-3 outline-none focus:border-[#6f8f8b]"
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="输入道名、真实姓名或联系方式"
              value={searchTerm}
            />
          </span>
        </label>
        <div className="flex flex-wrap items-end gap-2">
          {filterItems.map((item) => (
            <button
              className={`min-h-11 rounded-full px-4 text-sm font-semibold transition ${
                filter === item.value ? 'bg-[#6f8f8b] text-white' : 'border border-[#6f8f8b]/25 bg-white text-[#526461]'
              }`}
              key={item.value}
              onClick={() => setFilter(item.value)}
              type="button"
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6 grid gap-4">
        {filteredApplications.length === 0 ? (
          <EmptyState title="暂无匹配名帖" message="可以切换筛选条件，或换一个道名、真实姓名、微信号再搜。" />
        ) : (
          filteredApplications.map((item) => {
            // 这个变量保存当前登记的可编辑草稿。
            const draft = drafts[item.id] ?? createDraft(item)
            // 这个变量表示当前小卡片是否展开。
            const expanded = expandedId === item.id
            // 这个变量保存申请人最新问心考核结果。
            const latestQuiz = item.user_id ? quizResults[item.user_id] : null
            // 这个变量表示名帖已审核通过但尚未确认入群，需要醒目展示归云堂二维码。
            const shouldProminentlyShowGuiyuntang = ['approved', 'contacted'].includes(draft.status)
            // 这个变量表示同门已确认进群，只保留可查看入口。
            const shouldCompactlyShowGuiyuntang = draft.status === 'joined'
            // 这个变量表示当前归云堂二维码是否可用。
            const guiyuntangQrReady = Boolean(guiyuntangSetting?.enabled && guiyuntangSetting.qr_image_data_url)
            // 这个变量表示已入群状态下是否展开查看二维码。
            const joinedQrOpen = Boolean(joinedQrVisible[item.id])

            return (
              <ScrollPanel key={item.id}>
                <button
                  className="flex w-full flex-col gap-4 text-left md:flex-row md:items-start md:justify-between"
                  onClick={() => toggleExpanded(item.id)}
                  type="button"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="ink-title text-2xl font-bold text-[#143044]">{draft.nickname || '未填写道名'}</h2>
                      <span className="rounded-full bg-[#edf3ef] px-3 py-1 text-xs text-[#6f8f8b]">
                        {applicationStatusLabels[draft.status]}
                      </span>
                      <span className={`rounded-full px-3 py-1 text-xs ${latestQuiz?.passed ? 'bg-[#f1f7e9] text-[#314434]' : 'bg-[#fff1ee] text-[#9e3d32]'}`}>
                        问心：{latestQuiz ? `${latestQuiz.score} 分` : '未考'}
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-[#7a6a48]">申请时间：{formatApplicationTime(item.created_at)}</p>
                    <p className="mt-3 line-clamp-2 leading-7 text-[#526461]">宣言：{draft.motto || draft.reason || '未填写'}</p>
                  </div>
                  <span className="inline-flex shrink-0 items-center gap-2 rounded-full border border-[#c9a45c]/40 bg-white/70 px-4 py-2 text-sm text-[#7a6a48]">
                    {expanded ? '收起详情' : '展开详情'}
                    {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </span>
                </button>

                {expanded ? (
                  <div className="mt-6 border-t border-[#c9a45c]/20 pt-6">
                    <div className="mb-5 rounded-2xl border border-[#6f8f8b]/20 bg-[#edf3ef]/65 p-4">
                      <p className="text-sm font-semibold text-[#143044]">最新问心考核</p>
                      <div className="mt-2 grid gap-2 text-sm leading-7 text-[#526461] md:grid-cols-4">
                        <p>分数：{latestQuiz ? `${latestQuiz.score}/${latestQuiz.total_score}` : '未参加'}</p>
                        <p>结果：{latestQuiz?.passed ? '合格' : '未合格'}</p>
                        <p>单选答对：{latestQuiz ? `${latestQuiz.single_correct}/25` : '未记录'}</p>
                        <p>多选答对：{latestQuiz ? `${latestQuiz.multiple_correct}/5` : '未记录'}</p>
                      </div>
                    </div>

                    {shouldProminentlyShowGuiyuntang ? (
                      <div className="mb-5 rounded-3xl border-2 border-[#9e3d32]/35 bg-[#fff1ee]/85 p-5 shadow-xl shadow-[#9e3d32]/10">
                        <div className="flex flex-wrap items-start justify-between gap-4">
                          <div className="min-w-0">
                            <p className="flex items-center gap-2 text-sm font-semibold text-[#9e3d32]">
                              <ShieldAlert className="h-4 w-4" />
                              可加入归云堂
                            </p>
                            <h3 className="ink-title mt-2 text-2xl font-bold text-[#143044]">名帖已通过，请引导入群</h3>
                            <p className="mt-2 text-sm leading-7 text-[#526461]">
                              {guiyuntangSetting?.instruction ?? '名帖审核通过后，可引导同门扫码加入归云堂；确认进群后将名帖状态改为“已入群”。'}
                            </p>
                            <p className="mt-2 text-sm font-semibold leading-7 text-[#9e3d32]">
                              {guiyuntangSetting?.warning ?? '归云堂入群二维码只供后台审核使用，严禁截图外传、公开发布或转交未审核人员。'}
                            </p>
                          </div>
                          {guiyuntangQrReady ? (
                            <img
                              alt="归云堂入群二维码"
                              className="h-44 w-44 shrink-0 rounded-2xl border border-white bg-white object-contain p-2 shadow-lg shadow-[#263238]/10"
                              src={guiyuntangSetting?.qr_image_data_url ?? ''}
                            />
                          ) : (
                            <div className="grid h-44 w-44 shrink-0 place-items-center rounded-2xl border border-[#9e3d32]/25 bg-white/70 p-4 text-center text-sm leading-7 text-[#9e3d32]">
                              <QrCode className="mb-2 h-8 w-8" />
                              尚未配置二维码
                              <CloudButton className="mt-3 w-full" to="/admin/settings" variant="ghost">
                                去设置
                              </CloudButton>
                            </div>
                          )}
                        </div>
                      </div>
                    ) : null}

                    {shouldCompactlyShowGuiyuntang ? (
                      <div className="mb-5 rounded-2xl border border-[#6f8f8b]/20 bg-[#edf3ef]/60 p-4">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div>
                            <p className="text-sm font-semibold text-[#143044]">已确认进群</p>
                            <p className="mt-1 text-sm leading-7 text-[#526461]">醒目入群提示已收起，管理员仍可按需查看归云堂二维码。</p>
                          </div>
                          <CloudButton
                            disabled={!guiyuntangQrReady}
                            onClick={() =>
                              setJoinedQrVisible((current) => ({
                                ...current,
                                [item.id]: !current[item.id]
                              }))
                            }
                            variant="ghost"
                          >
                            {joinedQrOpen ? '收起二维码' : '查看二维码'}
                            {joinedQrOpen ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </CloudButton>
                        </div>
                        {joinedQrOpen && guiyuntangQrReady ? (
                          <div className="mt-4 grid gap-4 rounded-2xl border border-[#c9a45c]/25 bg-white/65 p-4 md:grid-cols-[auto_1fr] md:items-center">
                            <img
                              alt="归云堂入群二维码"
                              className="h-40 w-40 rounded-2xl border border-white bg-white object-contain p-2 shadow-lg shadow-[#263238]/10"
                              src={guiyuntangSetting?.qr_image_data_url ?? ''}
                            />
                            <p className="text-sm font-semibold leading-7 text-[#9e3d32]">
                              {guiyuntangSetting?.warning ?? '归云堂入群二维码只供后台审核使用，严禁截图外传、公开发布或转交未审核人员。'}
                            </p>
                          </div>
                        ) : null}
                      </div>
                    ) : null}

                    {draft.requested_nickname || draft.requested_legacy_contact ? (
                      <div className="mb-5 rounded-2xl border border-[#9e3d32]/25 bg-[#fff1ee]/70 p-4">
                        <p className="text-sm font-semibold text-[#9e3d32]">用户申请修改</p>
                        <div className="mt-3 grid gap-3 text-sm leading-7 text-[#526461] md:grid-cols-2">
                          {draft.requested_nickname ? (
                            <div>
                              <p>申请道名：{draft.requested_nickname}</p>
                              <button
                                className="mt-2 rounded-full border border-[#9e3d32]/25 bg-white/70 px-3 py-1 text-xs font-semibold text-[#9e3d32]"
                                onClick={() => {
                                  updateDraft(item.id, 'nickname', draft.requested_nickname)
                                  updateDraft(item.id, 'requested_nickname', '')
                                }}
                                type="button"
                              >
                                同意并填入道名
                              </button>
                            </div>
                          ) : null}
                          {draft.requested_legacy_contact ? (
                            <div>
                              <p>申请联系方式：{draft.requested_legacy_contact}</p>
                              <button
                                className="mt-2 rounded-full border border-[#9e3d32]/25 bg-white/70 px-3 py-1 text-xs font-semibold text-[#9e3d32]"
                                onClick={() => {
                                  updateDraft(item.id, 'legacy_contact', draft.requested_legacy_contact)
                                  updateDraft(item.id, 'wechat_id', draft.requested_legacy_contact)
                                  updateDraft(item.id, 'requested_legacy_contact', '')
                                }}
                                type="button"
                              >
                                同意并填入联系方式
                              </button>
                            </div>
                          ) : null}
                        </div>
                        <p className="mt-3 text-xs leading-6 text-[#7a6a48]">同意后请点击底部“保存名帖”才会真正生效；不想同意时，把待审核内容清空后保存即可。</p>
                      </div>
                    ) : null}

                    <div className="grid gap-4 lg:grid-cols-4">
                      <label className="grid gap-2">
                        <span className="text-sm font-semibold">道名</span>
                        <input
                          className="rounded-xl border border-[#6f8f8b]/25 bg-white/80 px-4 py-3 outline-none focus:border-[#6f8f8b]"
                          onChange={(event) => updateDraft(item.id, 'nickname', event.target.value)}
                          value={draft.nickname}
                        />
                      </label>
                      <label className="grid gap-2">
                        <span className="text-sm font-semibold">江湖名</span>
                        <input
                          className="rounded-xl border border-[#6f8f8b]/25 bg-white/80 px-4 py-3 outline-none focus:border-[#6f8f8b]"
                          onChange={(event) => updateDraft(item.id, 'jianghu_name', event.target.value)}
                          value={draft.jianghu_name}
                        />
                      </label>
                      <label className="grid gap-2">
                        <span className="text-sm font-semibold">真实姓名</span>
                        <input
                          className="rounded-xl border border-[#6f8f8b]/25 bg-white/80 px-4 py-3 outline-none focus:border-[#6f8f8b]"
                          onChange={(event) => updateDraft(item.id, 'real_name', event.target.value)}
                          value={draft.real_name}
                        />
                      </label>
                      <label className="grid gap-2">
                        <span className="text-sm font-semibold">联系方式</span>
                        <input
                          className="rounded-xl border border-[#6f8f8b]/25 bg-white/80 px-4 py-3 outline-none focus:border-[#6f8f8b]"
                          onChange={(event) => {
                            updateDraft(item.id, 'legacy_contact', event.target.value)
                            updateDraft(item.id, 'wechat_id', event.target.value)
                          }}
                          value={draft.legacy_contact}
                        />
                      </label>
                    </div>

                    <div className="mt-4 grid gap-4 lg:grid-cols-3">
                      <label className="grid gap-2">
                        <span className="text-sm font-semibold">编号</span>
                        <input
                          className="rounded-xl border border-[#6f8f8b]/25 bg-white/80 px-4 py-3 outline-none focus:border-[#6f8f8b]"
                          onChange={(event) => updateDraft(item.id, 'member_code', event.target.value)}
                          placeholder="问云-云-001"
                          value={draft.member_code}
                        />
                      </label>
                      <label className="grid gap-2">
                        <span className="text-sm font-semibold">辈分字</span>
                        <input
                          className="rounded-xl border border-[#6f8f8b]/25 bg-white/80 px-4 py-3 outline-none focus:border-[#6f8f8b]"
                          maxLength={1}
                          onChange={(event) => updateDraft(item.id, 'generation_name', event.target.value)}
                          value={draft.generation_name}
                        />
                      </label>
                      <label className="grid gap-2">
                        <span className="text-sm font-semibold">身份</span>
                        <select
                          className="rounded-xl border border-[#6f8f8b]/25 bg-white/80 px-4 py-3 outline-none focus:border-[#6f8f8b]"
                          onChange={(event) => updateDraft(item.id, 'member_role', event.target.value as WenyunMemberRole)}
                          value={draft.member_role}
                        >
                          {memberRoleOptions.map((role) => (
                            <option key={role} value={role}>
                              {role}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label className="grid gap-2">
                        <span className="text-sm font-semibold">当前状态</span>
                        <select
                          className="rounded-xl border border-[#6f8f8b]/25 bg-white/80 px-4 py-3 outline-none focus:border-[#6f8f8b]"
                          onChange={(event) => updateDraft(item.id, 'status', event.target.value as JoinApplicationStatus)}
                          value={draft.status}
                        >
                          {statuses.map((status) => (
                            <option key={status} value={status}>
                              {applicationStatusLabels[status]}
                            </option>
                          ))}
                        </select>
                      </label>
                    </div>

                    <div className="mt-4 grid gap-4 lg:grid-cols-4">
                      <label className="grid gap-2">
                        <span className="text-sm font-semibold">性别</span>
                        <select
                          className="rounded-xl border border-[#6f8f8b]/25 bg-white/80 px-4 py-3 outline-none focus:border-[#6f8f8b]"
                          onChange={(event) => updateDraft(item.id, 'gender', event.target.value as MemberGender)}
                          value={draft.gender}
                        >
                          {genderOptions.map((gender) => (
                            <option key={gender} value={gender}>
                              {gender}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label className="grid gap-2">
                        <span className="text-sm font-semibold">出生年份</span>
                        <input
                          className="rounded-xl border border-[#6f8f8b]/25 bg-white/80 px-4 py-3 outline-none focus:border-[#6f8f8b]"
                          inputMode="numeric"
                          maxLength={4}
                          onChange={(event) => updateDraft(item.id, 'age_range', event.target.value.replace(/\D/g, '').slice(0, 4))}
                          placeholder="例如：2003"
                          value={draft.age_range}
                        />
                      </label>
                      <label className="grid gap-2">
                        <span className="text-sm font-semibold">所在城市</span>
                        <input
                          className="rounded-xl border border-[#6f8f8b]/25 bg-white/80 px-4 py-3 outline-none focus:border-[#6f8f8b]"
                          onChange={(event) => updateDraft(item.id, 'public_region', event.target.value)}
                          value={draft.public_region}
                        />
                      </label>
                      <label className="grid gap-2">
                        <span className="text-sm font-semibold">后台城市原文</span>
                        <input
                          className="rounded-xl border border-[#6f8f8b]/25 bg-white/80 px-4 py-3 outline-none focus:border-[#6f8f8b]"
                          onChange={(event) => updateDraft(item.id, 'raw_region', event.target.value)}
                          value={draft.raw_region}
                        />
                      </label>
                    </div>

                    <div className="mt-4 grid gap-4 lg:grid-cols-2">
                      <label className="grid gap-2">
                        <span className="text-sm font-semibold">宣言</span>
                        <textarea
                          className="min-h-28 rounded-xl border border-[#6f8f8b]/25 bg-white/80 px-4 py-3 leading-7 outline-none focus:border-[#6f8f8b]"
                          onChange={(event) => {
                            updateDraft(item.id, 'motto', event.target.value)
                            updateDraft(item.id, 'reason', event.target.value)
                          }}
                          value={draft.motto}
                        />
                      </label>
                      <label className="grid gap-2">
                        <span className="text-sm font-semibold">兴趣爱好</span>
                        <textarea
                          className="min-h-28 rounded-xl border border-[#6f8f8b]/25 bg-white/80 px-4 py-3 leading-7 outline-none focus:border-[#6f8f8b]"
                          onChange={(event) => updateDraft(item.id, 'tags', event.target.value)}
                          placeholder="例如：写文、摄影、饮茶"
                          value={draft.tags}
                        />
                      </label>
                    </div>

                    <div className="mt-4 grid gap-4 lg:grid-cols-2">
                      <label className="grid gap-2">
                        <span className="text-sm font-semibold">旧故事原文</span>
                        <textarea
                          className="min-h-24 rounded-xl border border-[#6f8f8b]/25 bg-white/80 px-4 py-3 leading-7 outline-none focus:border-[#6f8f8b]"
                          onChange={(event) => updateDraft(item.id, 'raw_story', event.target.value)}
                          value={draft.raw_story}
                        />
                      </label>
                      <label className="grid gap-2">
                        <span className="text-sm font-semibold">管理员备注</span>
                        <textarea
                          className="min-h-24 rounded-xl border border-[#6f8f8b]/25 bg-white/80 px-4 py-3 leading-7 outline-none focus:border-[#6f8f8b]"
                          onChange={(event) => updateDraft(item.id, 'admin_note', event.target.value)}
                          placeholder="填写联系记录、审核说明、暂存原因或退派说明"
                          value={draft.admin_note}
                        />
                      </label>
                    </div>

                    <div className="mt-4 grid gap-4 lg:grid-cols-2">
                      <label className="grid gap-2">
                        <span className="text-sm font-semibold">同行期待</span>
                        <input
                          className="rounded-xl border border-[#6f8f8b]/25 bg-white/80 px-4 py-3 outline-none focus:border-[#6f8f8b]"
                          onChange={(event) => updateDraft(item.id, 'companion_expectation', event.target.value)}
                          value={draft.companion_expectation}
                        />
                      </label>
                    </div>

                    <label className="mt-4 flex items-start gap-3 rounded-xl border border-[#c9a45c]/35 bg-white/60 p-4">
                      <input
                        checked={draft.accept_rules}
                        className="mt-1 h-4 w-4"
                        onChange={(event) => updateDraft(item.id, 'accept_rules', event.target.checked)}
                        type="checkbox"
                      />
                      <span className="text-sm leading-7 text-[#526461]">申请人已确认认同问云派门规</span>
                    </label>

                    <div className="mt-5 flex flex-col gap-3 border-t border-[#c9a45c]/20 pt-5 md:flex-row md:items-center md:justify-between">
                      <div className="rounded-2xl border border-[#9e3d32]/25 bg-[#fff1ee]/70 p-4 text-sm leading-7 text-[#526461]">
                        <p className="font-semibold text-[#9e3d32]">危险操作</p>
                        <p>彻底删除后不可恢复；如只是临时不展示，可把状态改为“暂存”或“已退派”。</p>
                      </div>
                      <div className="flex flex-wrap justify-end gap-3">
                        <CloudButton
                          className="border-[#9e3d32]/40 text-[#9e3d32] hover:bg-[#fff1ee]"
                          disabled={deletingId === item.id || savingId === item.id}
                          onClick={() => void handleDelete(item.id, draft.nickname)}
                          variant="ghost"
                        >
                          {deletingId === item.id ? '正在删除...' : '彻底删除'}
                          <Trash2 className="h-4 w-4" />
                        </CloudButton>
                      <CloudButton disabled={savingId === item.id} onClick={() => void handleSave(item.id)} variant="seal">
                        {savingId === item.id ? '正在保存...' : '保存名帖'}
                        <Save className="h-4 w-4" />
                      </CloudButton>
                      </div>
                    </div>
                  </div>
                ) : null}
              </ScrollPanel>
            )
          })
        )}
      </div>
    </div>
  )
}
