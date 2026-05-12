import { QrCode, Save, Search, ShieldAlert, Trash2 } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { CloudButton } from '../../components/CloudButton'
import { EmptyState } from '../../components/EmptyState'
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
import { AdminPageShell, AdminPanel, AdminStatusPill, formatAdminDate } from './AdminUi'

// 这个类型表示后台名帖筛选按钮，入参来自按钮点击，返回值用于筛选列表。
type AdminApplicationFilter = 'pending' | 'profile_change' | 'reviewed' | 'all' | 'draft' | 'retired'

// 这个数组保存可选审核状态，返回值用于后台下拉框。
const statuses: JoinApplicationStatus[] = ['pending', 'approved', 'contacted', 'rejected', 'draft', 'retired']

// 这个数组保存后台筛选项，返回值用于顶部筛选按钮。
const filterItems: Array<{ label: string; value: AdminApplicationFilter }> = [
  { label: '未审核', value: 'pending' },
  { label: '资料修改', value: 'profile_change' },
  { label: '已审核', value: 'reviewed' },
  { label: '全部', value: 'all' },
  { label: '暂存', value: 'draft' },
  { label: '已退派', value: 'retired' }
]

// 这个对象保存名帖状态颜色，入参是状态值，返回值用于状态章。
const statusToneMap: Record<JoinApplicationStatus, 'red' | 'green' | 'gray' | 'gold'> = {
  pending: 'red',
  approved: 'green',
  contacted: 'green',
  rejected: 'gray',
  draft: 'gold',
  retired: 'gray'
}

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
    admin_note: item.admin_note ?? '',
    member_role: item.member_role ?? '同门',
    generation_name: item.generation_name ?? '云',
    member_code: item.member_code ?? '',
    roster_serial: item.roster_serial ? String(item.roster_serial).padStart(3, '0') : '',
    public_region: item.public_region ?? item.city ?? '',
    raw_region: item.raw_region ?? item.city ?? '',
    motto: item.motto ?? item.reason,
    tags: item.tags ?? '',
    companion_expectation: item.companion_expectation ?? '',
    legacy_contact: item.legacy_contact ?? item.wechat_id,
    requested_nickname: item.requested_nickname ?? '',
    requested_legacy_contact: item.requested_legacy_contact ?? '',
    joined_at: item.joined_at ?? '',
    guiyuntang_joined: item.guiyuntang_joined,
    guiyuntang_joined_at: item.guiyuntang_joined_at ?? '',
    status: item.status
  }
}

// 这个函数判断名帖是否符合当前筛选，入参是名帖和筛选值，返回值表示是否展示。
function matchesFilter(item: JoinApplication, filter: AdminApplicationFilter): boolean {
  // 这里把已经处理过的状态合并为“已审核”，便于后台快速查看。
  const reviewedStatuses: JoinApplicationStatus[] = ['approved', 'contacted', 'rejected']

  if (filter === 'all') {
    return true
  }

  if (filter === 'reviewed') {
    return reviewedStatuses.includes(item.status)
  }

  if (filter === 'profile_change') {
    return Boolean(item.requested_nickname || item.requested_legacy_contact)
  }

  return item.status === filter
}

// 这个函数判断名帖是否匹配搜索词，入参是名帖、草稿和搜索词，返回值表示是否展示。
function matchesKeyword(item: JoinApplication, draft: JoinApplicationUpdateInput, keyword: string): boolean {
  // 这里清理搜索词，空搜索直接展示。
  const normalizedKeyword = keyword.trim()

  if (!normalizedKeyword) {
    return true
  }

  return [
    draft.nickname,
    draft.real_name,
    draft.wechat_id,
    draft.legacy_contact,
    draft.member_code,
    draft.requested_nickname,
    draft.requested_legacy_contact,
    item.user_id
  ]
    .filter(Boolean)
    .some((value) => String(value).includes(normalizedKeyword))
}

// 这个函数渲染名册管理页，入参为空，返回值是设计稿第二屏样式的名帖审核台账。
export function AdminApplicationsPage() {
  // 这个状态保存名帖登记列表。
  const [applications, setApplications] = useState<JoinApplication[]>([])
  // 这个状态保存每条登记的可编辑草稿。
  const [drafts, setDrafts] = useState<Record<string, JoinApplicationUpdateInput>>({})
  // 这个状态保存后台搜索词。
  const [searchTerm, setSearchTerm] = useState('')
  // 这个状态保存当前筛选，默认只看未审核。
  const [filter, setFilter] = useState<AdminApplicationFilter>('pending')
  // 这个状态保存当前选中的名帖编号。
  const [selectedId, setSelectedId] = useState('')
  // 这个状态保存正在保存的登记编号。
  const [savingId, setSavingId] = useState('')
  // 这个状态保存正在彻底删除的登记编号。
  const [deletingId, setDeletingId] = useState('')
  // 这个状态保存提示信息。
  const [notice, setNotice] = useState<{ type: 'success' | 'error' | 'info'; title: string; message: string } | null>(null)
  // 这个状态保存每个用户最新问云考核结果，键为用户编号。
  const [quizResults, setQuizResults] = useState<Record<string, WenxinQuizResult>>({})
  // 这个状态保存归云堂二维码设置，只在后台审核页使用。
  const [guiyuntangSetting, setGuiyuntangSetting] = useState<GuiyuntangSetting | null>(null)

  // 这个函数读取登记列表，入参为空，返回值为空。
  async function loadApplications() {
    try {
      // 这里同时读取名帖、问云考核结果和归云堂设置，让详情区一次拿到完整审核上下文。
      const [result, quizResult, guiyuntangResult] = await Promise.all([
        fetchAdminApplications(),
        fetchAdminLatestWenxinQuizResults(),
        fetchGuiyuntangSetting()
      ])
      const nextDrafts: Record<string, JoinApplicationUpdateInput> = {}
      const nextQuizResults: Record<string, WenxinQuizResult> = {}

      result.data.forEach((item) => {
        // 这里把每条数据库记录转换成表单草稿，方便右侧详情直接编辑。
        nextDrafts[item.id] = createDraft(item)
      })

      quizResult.data.forEach((item) => {
        // 这里按用户编号保存最新问云考核结果，方便名帖详情快速读取。
        nextQuizResults[item.user_id] = item
      })

      setApplications(result.data)
      setDrafts(nextDrafts)
      setQuizResults(nextQuizResults)
      setGuiyuntangSetting(guiyuntangResult.data)
      setSelectedId((current) => current || result.data[0]?.id || '')

      if (!result.ok) {
        setNotice({ type: 'error', title: '读取失败', message: result.message })
      } else if (!quizResult.ok) {
        setNotice({ type: 'error', title: '考核读取失败', message: quizResult.message })
      } else if (!guiyuntangResult.ok) {
        setNotice({ type: 'error', title: '归云堂设置读取失败', message: guiyuntangResult.message })
      } else if (result.demoMode) {
        setNotice({ type: 'info', title: '演示模式提示', message: result.message })
      }
    } catch (error) {
      // 这里兜底捕获意外异常，避免名册管理页白屏。
      setNotice({ type: 'error', title: '读取异常', message: error instanceof Error ? error.message : '名帖列表暂时无法读取。' })
    }
  }

  useEffect(() => {
    void loadApplications()
  }, [])

  // 这个变量保存当前筛选后的名帖列表，返回值用于左侧台账渲染。
  const filteredApplications = useMemo(
    () =>
      applications.filter((item) => {
        // 这里优先使用草稿内容，让管理员修改后搜索也能即时匹配。
        const draft = drafts[item.id] ?? createDraft(item)
        return matchesFilter(item, filter) && matchesKeyword(item, draft, searchTerm)
      }),
    [applications, drafts, filter, searchTerm]
  )

  // 这个变量保存当前选中的名帖，如果筛选后选中项不存在，就自动使用第一条。
  const selectedApplication = filteredApplications.find((item) => item.id === selectedId) ?? filteredApplications[0] ?? null
  // 这个变量保存当前选中名帖的草稿，返回值用于右侧详情表单。
  const selectedDraft = selectedApplication ? drafts[selectedApplication.id] ?? createDraft(selectedApplication) : null
  // 这个变量保存当前选中用户的问云考核结果，返回值用于详情顶部展示。
  const selectedQuiz = selectedApplication?.user_id ? quizResults[selectedApplication.user_id] : null
  // 这个变量表示当前归云堂二维码是否可用。
  const guiyuntangQrReady = Boolean(guiyuntangSetting?.enabled && guiyuntangSetting.qr_image_data_url)

  // 这个函数更新某条登记的草稿字段，入参是登记编号、字段和值，返回值为空。
  function updateDraft<K extends keyof JoinApplicationUpdateInput>(id: string, field: K, value: JoinApplicationUpdateInput[K]) {
    // 这里只更新目标名帖的一个字段，避免改动其他名帖草稿。
    setDrafts((current) => ({
      ...current,
      [id]: {
        ...current[id],
        [field]: value
      }
    }))
  }

  // 这个函数保存某条登记资料，入参是登记编号，返回值为空。
  async function handleSave(id: string) {
    // 这个变量保存即将提交的草稿，没有草稿则中止。
    const draft = drafts[id]

    if (!draft) {
      setNotice({ type: 'error', title: '保存失败', message: '没有找到这条名帖草稿，请刷新页面后再试。' })
      return
    }

    try {
      // 这里进入保存状态，避免重复提交。
      setSavingId(id)
      const result = await updateApplicationDetails(id, draft)
      setNotice({
        type: result.ok ? 'success' : 'error',
        title: result.ok ? '名帖已保存' : '保存失败',
        message: result.message
      })

      if (result.ok) {
        await loadApplications()
      }
    } finally {
      // 这里恢复保存按钮状态。
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
      // 这里进入删除状态，避免重复点击。
      setDeletingId(id)
      const result = await deleteApplicationPermanently(id)
      setNotice({
        type: result.ok ? 'success' : 'error',
        title: result.ok ? '名帖已删除' : '删除失败',
        message: result.message
      })

      if (result.ok) {
        setSelectedId('')
        await loadApplications()
      }
    } finally {
      // 这里恢复删除按钮状态。
      setDeletingId('')
    }
  }

  return (
    <AdminPageShell index="2" title="名册管理" description="左侧查找名帖，右侧审核、校订资料与处理归云堂入群。">
      {notice ? <StatusNotice type={notice.type} title={notice.title} message={notice.message} /> : null}

      <AdminPanel>
        <div className="admin-filter-bar">
          <label className="admin-search-field">
            <Search className="h-4 w-4" />
            <input onChange={(event) => setSearchTerm(event.target.value)} placeholder="搜索道名、真实姓名、编号或联系方式" value={searchTerm} />
          </label>
          <div className="admin-segmented">
            {filterItems.map((item) => (
              <button className={filter === item.value ? 'active' : ''} key={item.value} onClick={() => setFilter(item.value)} type="button">
                {item.label}
              </button>
            ))}
          </div>
        </div>
      </AdminPanel>

      <div className="admin-master-detail">
        <AdminPanel title="名帖台账" description={`当前筛选共 ${filteredApplications.length} 条。`} className="admin-master-list-panel">
          {filteredApplications.length === 0 ? (
            <EmptyState title="暂无匹配名帖" message="可以切换筛选条件，或换一个道名、真实姓名、微信号再搜。" />
          ) : (
            <div className="admin-application-list">
              {filteredApplications.map((item) => {
                // 这个变量保存当前行草稿，便于展示管理员已编辑但尚未保存的内容。
                const draft = drafts[item.id] ?? createDraft(item)
                // 这个变量表示是否存在用户申请资料修改。
                const hasProfileChange = Boolean(draft.requested_nickname || draft.requested_legacy_contact)
                // 这个变量表示当前行是否被选中。
                const selected = selectedApplication?.id === item.id

                return (
                  <button className={selected ? 'admin-application-row active' : 'admin-application-row'} key={item.id} onClick={() => setSelectedId(item.id)} type="button">
                    <div>
                      <strong>{draft.nickname || '未填写道名'}</strong>
                      <span>{draft.member_code || '待编号'} · {formatAdminDate(item.created_at)}</span>
                    </div>
                    <div className="admin-application-row-tags">
                      <AdminStatusPill tone={statusToneMap[draft.status]}>{applicationStatusLabels[draft.status]}</AdminStatusPill>
                      {hasProfileChange ? <AdminStatusPill tone="red">资料待审</AdminStatusPill> : null}
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </AdminPanel>

        <AdminPanel
          actions={
            selectedApplication && selectedDraft ? (
              <div className="admin-detail-actions">
                <CloudButton disabled={savingId === selectedApplication.id} onClick={() => void handleSave(selectedApplication.id)}>
                  {savingId === selectedApplication.id ? '正在保存...' : '保存'}
                  <Save className="h-4 w-4" />
                </CloudButton>
                <CloudButton
                  disabled={deletingId === selectedApplication.id || savingId === selectedApplication.id}
                  onClick={() => void handleDelete(selectedApplication.id, selectedDraft.nickname)}
                  variant="seal"
                >
                  删除
                  <Trash2 className="h-4 w-4" />
                </CloudButton>
              </div>
            ) : null
          }
          className="admin-detail-panel"
          description="展开单条名帖后，可直接保存状态、身份、资料和备注。"
          title={selectedDraft?.nickname ? `${selectedDraft.nickname} 的名帖` : '名帖详情'}
        >
          {!selectedApplication || !selectedDraft ? (
            <EmptyState title="请选择一条名帖" message="左侧选中名帖后，这里会展示审核详情。" />
          ) : (
            <div className="admin-application-detail">
              <div className="admin-detail-summary">
                <div>
                  <span>问云成绩</span>
                  <strong>{selectedQuiz ? `${selectedQuiz.score} 分` : '未参加'}</strong>
                  <p>{selectedQuiz?.passed ? '已达登记门槛' : '尚未确认合格'}</p>
                </div>
                <div>
                  <span>归云堂</span>
                  <strong>{selectedDraft.guiyuntang_joined ? '已入群' : '待确认'}</strong>
                  <p>{guiyuntangQrReady ? '二维码已配置' : '二维码未配置'}</p>
                </div>
                <div>
                  <span>当前状态</span>
                  <strong>{applicationStatusLabels[selectedDraft.status]}</strong>
                  <p>{formatAdminDate(selectedApplication.created_at)}</p>
                </div>
              </div>

              {['approved', 'contacted'].includes(selectedDraft.status) && !selectedDraft.guiyuntang_joined ? (
                <div className="admin-qr-alert">
                  <div>
                    <p>
                      <ShieldAlert className="h-4 w-4" />
                      可引导进入归云堂
                    </p>
                    <span>{guiyuntangSetting?.instruction ?? '名帖审核通过后，可引导同门扫码加入归云堂。'}</span>
                    <strong>{guiyuntangSetting?.warning ?? '归云堂二维码只供后台审核使用，严禁公开外传。'}</strong>
                  </div>
                  {guiyuntangQrReady ? (
                    <img alt="归云堂入群二维码" src={guiyuntangSetting?.qr_image_data_url ?? ''} />
                  ) : (
                    <div className="admin-qr-empty">
                      <QrCode className="h-8 w-8" />
                      请先到站点设置上传二维码
                    </div>
                  )}
                </div>
              ) : null}

              {selectedDraft.requested_nickname || selectedDraft.requested_legacy_contact ? (
                <div className="admin-change-request">
                  <h3>用户申请修改</h3>
                  {selectedDraft.requested_nickname ? (
                    <p>
                      新道名：{selectedDraft.requested_nickname}
                      <button
                        onClick={() => {
                          updateDraft(selectedApplication.id, 'nickname', selectedDraft.requested_nickname)
                          updateDraft(selectedApplication.id, 'requested_nickname', '')
                        }}
                        type="button"
                      >
                        同意填入
                      </button>
                    </p>
                  ) : null}
                  {selectedDraft.requested_legacy_contact ? (
                    <p>
                      新联系方式：{selectedDraft.requested_legacy_contact}
                      <button
                        onClick={() => {
                          updateDraft(selectedApplication.id, 'legacy_contact', selectedDraft.requested_legacy_contact)
                          updateDraft(selectedApplication.id, 'wechat_id', selectedDraft.requested_legacy_contact)
                          updateDraft(selectedApplication.id, 'requested_legacy_contact', '')
                        }}
                        type="button"
                      >
                        同意填入
                      </button>
                    </p>
                  ) : null}
                  <span>同意后仍需点击“保存”，才会真正写入后台。</span>
                </div>
              ) : null}

              <div className="admin-form-grid admin-form-grid-compact">
                <label>
                  <span>道名</span>
                  <input onChange={(event) => updateDraft(selectedApplication.id, 'nickname', event.target.value)} value={selectedDraft.nickname} />
                </label>
                <label>
                  <span>江湖名</span>
                  <input onChange={(event) => updateDraft(selectedApplication.id, 'jianghu_name', event.target.value)} value={selectedDraft.jianghu_name} />
                </label>
                <label>
                  <span>真实姓名</span>
                  <input onChange={(event) => updateDraft(selectedApplication.id, 'real_name', event.target.value)} value={selectedDraft.real_name} />
                </label>
                <label>
                  <span>联系方式</span>
                  <input
                    onChange={(event) => {
                      updateDraft(selectedApplication.id, 'legacy_contact', event.target.value)
                      updateDraft(selectedApplication.id, 'wechat_id', event.target.value)
                    }}
                    value={selectedDraft.legacy_contact}
                  />
                </label>
                <label>
                  <span>名册编号</span>
                  <input onChange={(event) => updateDraft(selectedApplication.id, 'member_code', event.target.value)} placeholder="问云-云-001" value={selectedDraft.member_code} />
                </label>
                <label>
                  <span>辈分字</span>
                  <input maxLength={1} onChange={(event) => updateDraft(selectedApplication.id, 'generation_name', event.target.value)} value={selectedDraft.generation_name} />
                </label>
                <label>
                  <span>身份</span>
                  <select onChange={(event) => updateDraft(selectedApplication.id, 'member_role', event.target.value as WenyunMemberRole)} value={selectedDraft.member_role}>
                    {memberRoleOptions.map((role) => (
                      <option key={role} value={role}>
                        {role}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  <span>状态</span>
                  <select onChange={(event) => updateDraft(selectedApplication.id, 'status', event.target.value as JoinApplicationStatus)} value={selectedDraft.status}>
                    {statuses.map((status) => (
                      <option key={status} value={status}>
                        {applicationStatusLabels[status]}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  <span>性别</span>
                  <select onChange={(event) => updateDraft(selectedApplication.id, 'gender', event.target.value as MemberGender)} value={selectedDraft.gender}>
                    {genderOptions.map((gender) => (
                      <option key={gender} value={gender}>
                        {gender}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  <span>出生年份</span>
                  <input
                    inputMode="numeric"
                    maxLength={4}
                    onChange={(event) => updateDraft(selectedApplication.id, 'age_range', event.target.value.replace(/\D/g, '').slice(0, 4))}
                    value={selectedDraft.age_range}
                  />
                </label>
                <label>
                  <span>所在城市</span>
                  <input onChange={(event) => updateDraft(selectedApplication.id, 'public_region', event.target.value)} value={selectedDraft.public_region} />
                </label>
                <label>
                  <span>后台城市原文</span>
                  <input onChange={(event) => updateDraft(selectedApplication.id, 'raw_region', event.target.value)} value={selectedDraft.raw_region} />
                </label>
                <label className="admin-checkbox-row">
                  <input
                    checked={selectedDraft.guiyuntang_joined}
                    onChange={(event) => {
                      updateDraft(selectedApplication.id, 'guiyuntang_joined', event.target.checked)
                      updateDraft(selectedApplication.id, 'guiyuntang_joined_at', event.target.checked ? new Date().toISOString() : '')
                    }}
                    type="checkbox"
                  />
                  <span>已入归云堂</span>
                </label>
                <label className="admin-checkbox-row">
                  <input checked={selectedDraft.accept_rules} onChange={(event) => updateDraft(selectedApplication.id, 'accept_rules', event.target.checked)} type="checkbox" />
                  <span>已认同金典</span>
                </label>
                <label className="admin-form-span-2">
                  <span>宣言</span>
                  <textarea
                    onChange={(event) => {
                      updateDraft(selectedApplication.id, 'motto', event.target.value)
                      updateDraft(selectedApplication.id, 'reason', event.target.value)
                    }}
                    rows={4}
                    value={selectedDraft.motto}
                  />
                </label>
                <label>
                  <span>兴趣爱好</span>
                  <textarea onChange={(event) => updateDraft(selectedApplication.id, 'tags', event.target.value)} rows={4} value={selectedDraft.tags} />
                </label>
                <label>
                  <span>管理员备注</span>
                  <textarea onChange={(event) => updateDraft(selectedApplication.id, 'admin_note', event.target.value)} rows={4} value={selectedDraft.admin_note} />
                </label>
              </div>
            </div>
          )}
        </AdminPanel>
      </div>
    </AdminPageShell>
  )
}
