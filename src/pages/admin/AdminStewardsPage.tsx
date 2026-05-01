import { Crown, KeyRound, Mail, Search, ShieldCheck, UserRound } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { CloudButton } from '../../components/CloudButton'
import { EmptyState } from '../../components/EmptyState'
import { ScrollPanel } from '../../components/ScrollPanel'
import { SectionTitle } from '../../components/SectionTitle'
import { StatusNotice } from '../../components/StatusNotice'
import { useAuth } from '../../hooks/useAuth'
import { fetchAdminRoleUsers, updateAdminUserAccount, updateAdminUserRole } from '../../lib/services'
import type { AdminRoleUser, ProfileRole, StewardManageableRole } from '../../lib/types'

// 这个类型表示执事管理筛选条件，入参来自页面按钮，返回值用于过滤列表。
type StewardFilter = 'all' | 'founder' | 'admin' | 'member'

// 这个接口描述每个成员账号设置的小表单，入参来自页面输入框，返回值用于提交给服务层。
interface AccountDraft {
  // 目标绑定邮箱。
  email: string
  // 目标新密码，空值表示不修改密码。
  password: string
}

// 这个数组保存筛选按钮配置，返回值用于页面顶部快速切换名单。
const filterItems: Array<{ label: string; value: StewardFilter }> = [
  { label: '全部', value: 'all' },
  { label: '超级管理员', value: 'founder' },
  { label: '执事', value: 'admin' },
  { label: '普通成员', value: 'member' }
]

// 这个对象保存后台角色中文文案，入参是数据库角色，返回值是用户能看懂的身份。
const roleLabels: Record<ProfileRole, string> = {
  founder: '超级管理员',
  admin: '执事',
  guardian: '护灯人',
  member: '普通成员',
  applicant: '申请中',
  visitor: '访客'
}

// 这个函数判断用户是否匹配筛选条件，入参是用户行和筛选值，返回值表示是否展示。
function matchesFilter(item: AdminRoleUser, filter: StewardFilter): boolean {
  if (filter === 'all') {
    return true
  }

  if (filter === 'member') {
    return item.role !== 'founder' && item.role !== 'admin'
  }

  return item.role === filter
}

// 这个函数判断用户是否匹配搜索文字，入参是用户行和搜索词，返回值表示是否展示。
function matchesSearch(item: AdminRoleUser, keyword: string): boolean {
  // 这里统一转小写，方便邮箱搜索不受大小写影响。
  const normalizedKeyword = keyword.trim().toLowerCase()

  if (!normalizedKeyword) {
    return true
  }

  return [item.email, item.nickname, item.member_code, item.dao_name, item.city]
    .filter(Boolean)
    .some((value) => String(value).toLowerCase().includes(normalizedKeyword))
}

// 这个函数把用户列表转成账号设置表单草稿，入参是用户列表，返回值是按用户编号索引的表单值。
function createAccountDrafts(items: AdminRoleUser[]): Record<string, AccountDraft> {
  // 这里逐个建立草稿，密码永远为空，避免把密码显示回页面。
  return items.reduce<Record<string, AccountDraft>>((drafts, item) => {
    drafts[item.user_id] = {
      email: item.email,
      password: ''
    }
    return drafts
  }, {})
}

// 这个函数渲染执事管理页面，入参为空，返回值是超级管理员设置执事身份的后台页面。
export function AdminStewardsPage() {
  // 这里读取当前登录资料，用于判断是否为超级管理员。
  const { profile } = useAuth()
  // 这个状态保存后台用户列表。
  const [users, setUsers] = useState<AdminRoleUser[]>([])
  // 这个状态保存搜索词。
  const [keyword, setKeyword] = useState('')
  // 这个状态保存筛选条件。
  const [filter, setFilter] = useState<StewardFilter>('all')
  // 这个状态保存正在提交的用户编号。
  const [submittingId, setSubmittingId] = useState<string | null>(null)
  // 这个状态保存正在修改账号邮箱或密码的用户编号。
  const [accountSubmittingId, setAccountSubmittingId] = useState<string | null>(null)
  // 这个状态保存每个成员的账号设置草稿，方便在列表里直接编辑。
  const [accountDrafts, setAccountDrafts] = useState<Record<string, AccountDraft>>({})
  // 这个状态保存页面提示。
  const [notice, setNotice] = useState<{ type: 'success' | 'error' | 'info'; title: string; message: string } | null>(null)

  useEffect(() => {
    // 这个函数读取可管理用户列表，入参为空，返回值为空。
    async function loadUsers() {
      const result = await fetchAdminRoleUsers()
      setUsers(result.data)
      setAccountDrafts(createAccountDrafts(result.data))

      if (!result.ok) {
        setNotice({ type: 'error', title: '读取失败', message: result.message })
      } else if (result.demoMode) {
        setNotice({ type: 'info', title: '演示模式提示', message: result.message })
      }
    }

    void loadUsers()
  }, [])

  // 这个变量保存过滤后的用户列表，返回值用于页面渲染。
  const filteredUsers = useMemo(
    () => users.filter((item) => matchesFilter(item, filter) && matchesSearch(item, keyword)),
    [filter, keyword, users]
  )

  // 这个函数设置用户角色，入参是用户编号和目标角色，返回值为空。
  async function handleRoleChange(userId: string, role: StewardManageableRole) {
    try {
      // 这里进入提交状态，避免同一用户重复点击。
      setSubmittingId(userId)
      const result = await updateAdminUserRole(userId, role)

      if (result.ok && result.data) {
        setUsers((current) => current.map((item) => (item.user_id === userId ? result.data ?? item : item)))
      }

      setNotice({
        type: result.ok ? 'success' : 'error',
        title: result.ok ? '设置成功' : '设置失败',
        message: result.message
      })
    } finally {
      // 这里恢复提交状态，保证按钮可继续使用。
      setSubmittingId(null)
    }
  }

  // 这个函数更新某个用户的账号设置草稿，入参是用户编号、字段名和值，返回值为空。
  function handleAccountDraftChange(userId: string, field: keyof AccountDraft, value: string) {
    // 这里只更新当前用户的草稿，避免影响其他成员卡片。
    setAccountDrafts((current) => ({
      ...current,
      [userId]: {
        email: current[userId]?.email ?? '',
        password: current[userId]?.password ?? '',
        [field]: value
      }
    }))
  }

  // 这个函数保存某个成员的绑定邮箱和密码，入参是用户编号，返回值为空。
  async function handleAccountUpdate(userId: string) {
    // 这里读取当前卡片的草稿值，没有草稿时给一个空兜底。
    const draft = accountDrafts[userId] ?? { email: '', password: '' }

    try {
      // 这里进入提交状态，避免重复点击造成多次重置密码。
      setAccountSubmittingId(userId)
      const result = await updateAdminUserAccount({
        user_id: userId,
        email: draft.email,
        password: draft.password
      })

      if (result.ok && result.data) {
        // 这里刷新列表中的邮箱，同时不把密码回显给页面。
        setUsers((current) => current.map((item) => (item.user_id === userId ? result.data ?? item : item)))
        setAccountDrafts((current) => ({
          ...current,
          [userId]: {
            email: result.data?.email ?? draft.email,
            password: ''
          }
        }))
      }

      setNotice({
        type: result.ok ? 'success' : 'error',
        title: result.ok ? '账号已更新' : '账号更新失败',
        message: result.message
      })
    } finally {
      // 这里恢复提交状态，保证后续还能继续管理其他账号。
      setAccountSubmittingId(null)
    }
  }

  return (
    <div>
      <SectionTitle eyebrow="执事管理" title="授予执事，分灯守山">
        只有超级管理员可以设置执事身份。成员被设为执事后，可使用自己的账号进入管理后台。
      </SectionTitle>

      {profile?.role !== 'founder' ? (
        <StatusNotice
          type="error"
          title="权限不足"
          message={`当前账号身份是“${profile ? roleLabels[profile.role] : '未读取到身份'}”。请确认已执行超级管理员修复 SQL，并退出后用 3199912548@qq.com 或 001 重新登录。`}
        />
      ) : null}
      {notice ? <StatusNotice type={notice.type} title={notice.title} message={notice.message} /> : null}

      <ScrollPanel className="mt-8">
        <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-end">
          <label className="grid gap-2">
            <span className="text-sm font-semibold">搜索成员</span>
            <span className="flex items-center gap-2 rounded-xl border border-[#6f8f8b]/25 bg-white/80 px-4 py-3">
              <Search className="h-4 w-4 text-[#6f8f8b]" />
              <input
                className="min-w-0 flex-1 bg-transparent outline-none"
                onChange={(event) => setKeyword(event.target.value)}
                placeholder="可搜邮箱、昵称、道名或编号"
                value={keyword}
              />
            </span>
          </label>

          <div className="flex flex-wrap gap-2">
            {filterItems.map((item) => (
              <button
                className={`rounded-full px-4 py-2 text-sm transition ${
                  filter === item.value ? 'bg-[#143044] !text-white shadow-md shadow-[#143044]/12' : 'border border-[#6f8f8b]/25 bg-white/80 text-[#263238]'
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
      </ScrollPanel>

      <div className="mt-6 grid gap-4">
        {filteredUsers.length === 0 ? (
          <EmptyState title="没有找到成员" message="换一个搜索词，或切换筛选条件再看。" />
        ) : (
          filteredUsers.map((item) => {
            // 这里判断当前成员是否为超级管理员，超级管理员不能在本页被修改。
            const isFounder = item.role === 'founder'
            // 这里判断当前成员是否已经是执事。
            const isAdmin = item.role === 'admin'
            // 这里读取账号设置草稿，没有草稿时用当前邮箱兜底。
            const accountDraft = accountDrafts[item.user_id] ?? { email: item.email, password: '' }
            // 这里判断账号设置是否禁用，超级管理员账号不在本页直接修改。
            const accountDisabled = isFounder || profile?.role !== 'founder' || accountSubmittingId === item.user_id

            return (
              <ScrollPanel className="border-[#c9a45c]/30" key={item.user_id}>
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#edf3ef] text-[#6f8f8b]">
                        {isFounder ? <Crown className="h-5 w-5" /> : isAdmin ? <ShieldCheck className="h-5 w-5" /> : <UserRound className="h-5 w-5" />}
                      </span>
                      <div>
                        <h2 className="text-xl font-bold text-[#143044]">{item.nickname}</h2>
                        <p className="break-all text-sm text-[#526461]">{item.email}</p>
                      </div>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2 text-xs">
                      <span className="rounded-full bg-[#9e3d32]/10 px-3 py-1 text-[#9e3d32]">{roleLabels[item.role]}</span>
                      <span className="rounded-full bg-[#edf3ef] px-3 py-1 text-[#526461]">编号：{item.member_code ?? '未入册'}</span>
                      <span className="rounded-full bg-[#fff7df] px-3 py-1 text-[#7a6a48]">道名：{item.dao_name ?? '未填写'}</span>
                      <span className="rounded-full bg-white px-3 py-1 text-[#526461]">城市：{item.city ?? '未填写'}</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <CloudButton disabled={isFounder || isAdmin || submittingId === item.user_id} onClick={() => void handleRoleChange(item.user_id, 'admin')}>
                      {submittingId === item.user_id ? '正在设置...' : '设为执事'}
                      <ShieldCheck className="h-4 w-4" />
                    </CloudButton>
                    <CloudButton
                      disabled={isFounder || !isAdmin || submittingId === item.user_id}
                      onClick={() => void handleRoleChange(item.user_id, 'member')}
                      variant="ghost"
                    >
                      {submittingId === item.user_id ? '正在撤回...' : '撤回成员'}
                    </CloudButton>
                  </div>
                </div>

                <details className="mt-5 rounded-2xl border border-[#6f8f8b]/15 bg-[#f7f2e8]/55 p-4">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-sm font-semibold text-[#143044]">
                    <span className="flex items-center gap-2">
                      <KeyRound className="h-4 w-4 text-[#6f8f8b]" />
                      账号设置
                    </span>
                    <span className="text-xs font-normal text-[#526461]">{isFounder ? '超级管理员账号请在问云小院修改' : '可修改绑定邮箱，也可重置密码'}</span>
                  </summary>

                  <div className="mt-4 grid gap-3 lg:grid-cols-[1fr_1fr_auto] lg:items-end">
                    <label className="grid gap-2">
                      <span className="text-xs font-semibold text-[#526461]">绑定邮箱</span>
                      <span className="flex items-center gap-2 rounded-xl border border-[#6f8f8b]/20 bg-white/85 px-3 py-2">
                        <Mail className="h-4 w-4 shrink-0 text-[#6f8f8b]" />
                        <input
                          className="min-w-0 flex-1 bg-transparent text-sm outline-none disabled:text-[#526461]/55"
                          disabled={accountDisabled}
                          onChange={(event) => handleAccountDraftChange(item.user_id, 'email', event.target.value)}
                          placeholder="填写真实邮箱"
                          type="email"
                          value={accountDraft.email}
                        />
                      </span>
                    </label>

                    <label className="grid gap-2">
                      <span className="text-xs font-semibold text-[#526461]">重置密码</span>
                      <span className="flex items-center gap-2 rounded-xl border border-[#6f8f8b]/20 bg-white/85 px-3 py-2">
                        <KeyRound className="h-4 w-4 shrink-0 text-[#6f8f8b]" />
                        <input
                          autoComplete="new-password"
                          className="min-w-0 flex-1 bg-transparent text-sm outline-none disabled:text-[#526461]/55"
                          disabled={accountDisabled}
                          onChange={(event) => handleAccountDraftChange(item.user_id, 'password', event.target.value)}
                          placeholder="不修改请留空"
                          type="password"
                          value={accountDraft.password}
                        />
                      </span>
                    </label>

                    <CloudButton disabled={accountDisabled} onClick={() => void handleAccountUpdate(item.user_id)}>
                      {accountSubmittingId === item.user_id ? '正在保存...' : '保存账号'}
                    </CloudButton>
                  </div>
                </details>
              </ScrollPanel>
            )
          })
        )}
      </div>
    </div>
  )
}
