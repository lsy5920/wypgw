import { Save } from 'lucide-react'
import { useEffect, useState } from 'react'
import { CloudButton } from '../../components/CloudButton'
import { EmptyState } from '../../components/EmptyState'
import { ScrollPanel } from '../../components/ScrollPanel'
import { SectionTitle } from '../../components/SectionTitle'
import { StatusNotice } from '../../components/StatusNotice'
import { applicationStatusLabels, genderOptions, memberRoleOptions } from '../../data/siteContent'
import { fetchAdminApplications, updateApplicationDetails } from '../../lib/services'
import type {
  JoinApplication,
  JoinApplicationStatus,
  JoinApplicationUpdateInput,
  MemberGender,
  WenyunMemberRole
} from '../../lib/types'

// 这个数组保存可选审核状态，返回值用于后台下拉框。
const statuses: JoinApplicationStatus[] = ['pending', 'approved', 'contacted', 'joined', 'rejected']

// 这个函数把数据库申请记录转成后台可编辑表单，入参是申请记录，返回值是表单草稿。
function createDraft(item: JoinApplication): JoinApplicationUpdateInput {
  return {
    nickname: item.nickname,
    wechat_id: item.wechat_id,
    age_range: item.age_range ?? '',
    gender: item.gender ?? '不公开',
    city: item.city ?? '',
    reason: item.reason,
    accept_rules: item.accept_rules,
    offline_interest: item.offline_interest ?? '',
    remark: item.remark ?? '',
    admin_note: item.admin_note ?? '',
    member_role: item.member_role ?? '同门',
    generation_name: item.generation_name ?? '云',
    member_code: item.member_code ?? '',
    status: item.status
  }
}

// 这个函数渲染名册管理页，入参为空，返回值是可直接编辑的登记列表。
export function AdminApplicationsPage() {
  // 这个状态保存入派登记列表。
  const [applications, setApplications] = useState<JoinApplication[]>([])
  // 这个状态保存每条登记的可编辑草稿。
  const [drafts, setDrafts] = useState<Record<string, JoinApplicationUpdateInput>>({})
  // 这个状态保存正在保存的登记编号。
  const [savingId, setSavingId] = useState('')
  // 这个状态保存提示信息。
  const [notice, setNotice] = useState<{ type: 'success' | 'error' | 'info'; title: string; message: string } | null>(null)

  // 这个函数读取登记列表，入参为空，返回值为空。
  async function loadApplications() {
    const result = await fetchAdminApplications()
    const nextDrafts: Record<string, JoinApplicationUpdateInput> = {}

    // 这里把每条数据库记录转换成表单草稿，方便管理员直接编辑。
    result.data.forEach((item) => {
      nextDrafts[item.id] = createDraft(item)
    })

    setApplications(result.data)
    setDrafts(nextDrafts)

    if (!result.ok) {
      setNotice({ type: 'error', title: '读取失败', message: result.message })
    } else if (result.demoMode) {
      setNotice({ type: 'info', title: '演示模式提示', message: result.message })
    }
  }

  useEffect(() => {
    void loadApplications()
  }, [])

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

  // 这个函数保存某条登记资料，入参是登记编号，返回值为空。
  async function handleSave(id: string) {
    const draft = drafts[id]

    // 这里防止草稿为空时误提交。
    if (!draft) {
      setNotice({ type: 'error', title: '保存失败', message: '没有找到这条名册草稿，请刷新页面后再试。' })
      return
    }

    try {
      setSavingId(id)
      const result = await updateApplicationDetails(id, draft)

      setNotice({
        type: result.ok ? 'success' : 'error',
        title: result.ok ? '名册已保存' : '保存失败',
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

  return (
    <div>
      <SectionTitle eyebrow="名册管理" title="校订道名编号，温和守山门">
        管理员可直接编辑道名、出生月份、性别、身份、辈分字、编号与审核状态。微信号仍只在后台可见。
      </SectionTitle>

      {notice ? <StatusNotice type={notice.type} title={notice.title} message={notice.message} /> : null}

      <div className="mt-8 grid gap-5">
        {applications.length === 0 ? (
          <EmptyState title="暂无名册登记" message="有新登记提交后，会在这里等待校订和审核。" />
        ) : (
          applications.map((item) => {
            // 这个变量保存当前登记的可编辑草稿。
            const draft = drafts[item.id] ?? createDraft(item)

            return (
              <ScrollPanel key={item.id}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-sm text-[#9e3d32]">{draft.member_code || '待生成编号'}</p>
                    <h2 className="ink-title mt-1 text-3xl font-bold text-[#143044]">{draft.nickname || '未填写道名'}</h2>
                    <p className="mt-1 text-sm text-[#526461]">微信号：{draft.wechat_id || '未填写'}</p>
                  </div>
                  <span className="rounded-full bg-[#edf3ef] px-3 py-1 text-sm text-[#6f8f8b]">
                    {applicationStatusLabels[draft.status]}
                  </span>
                </div>

                <div className="mt-6 grid gap-4 lg:grid-cols-4">
                  <label className="grid gap-2">
                    <span className="text-sm font-semibold">道名</span>
                    <input
                      className="rounded-xl border border-[#6f8f8b]/25 bg-white/80 px-4 py-3 outline-none focus:border-[#6f8f8b]"
                      onChange={(event) => updateDraft(item.id, 'nickname', event.target.value)}
                      value={draft.nickname}
                    />
                  </label>
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
                    <span className="text-sm font-semibold">出生月份</span>
                    <input
                      className="rounded-xl border border-[#6f8f8b]/25 bg-white/80 px-4 py-3 outline-none focus:border-[#6f8f8b]"
                      onChange={(event) => updateDraft(item.id, 'age_range', event.target.value)}
                      type="month"
                      value={draft.age_range}
                    />
                  </label>
                  <label className="grid gap-2">
                    <span className="text-sm font-semibold">城市</span>
                    <input
                      className="rounded-xl border border-[#6f8f8b]/25 bg-white/80 px-4 py-3 outline-none focus:border-[#6f8f8b]"
                      onChange={(event) => updateDraft(item.id, 'city', event.target.value)}
                      value={draft.city}
                    />
                  </label>
                  <label className="grid gap-2">
                    <span className="text-sm font-semibold">审核状态</span>
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

                <div className="mt-4 grid gap-4 lg:grid-cols-2">
                  <label className="grid gap-2">
                    <span className="text-sm font-semibold">申请理由</span>
                    <textarea
                      className="min-h-28 rounded-xl border border-[#6f8f8b]/25 bg-white/80 px-4 py-3 leading-7 outline-none focus:border-[#6f8f8b]"
                      onChange={(event) => updateDraft(item.id, 'reason', event.target.value)}
                      value={draft.reason}
                    />
                  </label>
                  <label className="grid gap-2">
                    <span className="text-sm font-semibold">管理员备注</span>
                    <textarea
                      className="min-h-28 rounded-xl border border-[#6f8f8b]/25 bg-white/80 px-4 py-3 leading-7 outline-none focus:border-[#6f8f8b]"
                      onChange={(event) => updateDraft(item.id, 'admin_note', event.target.value)}
                      placeholder="填写联系记录、审核说明或入群情况"
                      value={draft.admin_note}
                    />
                  </label>
                </div>

                <div className="mt-4 grid gap-4 lg:grid-cols-2">
                  <label className="grid gap-2">
                    <span className="text-sm font-semibold">线下雅集意愿</span>
                    <select
                      className="rounded-xl border border-[#6f8f8b]/25 bg-white/80 px-4 py-3 outline-none focus:border-[#6f8f8b]"
                      onChange={(event) => updateDraft(item.id, 'offline_interest', event.target.value)}
                      value={draft.offline_interest}
                    >
                      <option value="">暂不填写</option>
                      <option value="愿意参加">愿意参加</option>
                      <option value="先线上交流">先线上交流</option>
                      <option value="暂不考虑">暂不考虑</option>
                    </select>
                  </label>
                  <label className="grid gap-2">
                    <span className="text-sm font-semibold">申请备注</span>
                    <input
                      className="rounded-xl border border-[#6f8f8b]/25 bg-white/80 px-4 py-3 outline-none focus:border-[#6f8f8b]"
                      onChange={(event) => updateDraft(item.id, 'remark', event.target.value)}
                      value={draft.remark}
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

                <div className="mt-5 flex flex-wrap justify-end gap-3">
                  <CloudButton disabled={savingId === item.id} onClick={() => void handleSave(item.id)} variant="seal">
                    {savingId === item.id ? '正在保存...' : '保存名册'}
                    <Save className="h-4 w-4" />
                  </CloudButton>
                </div>
              </ScrollPanel>
            )
          })
        )}
      </div>
    </div>
  )
}
