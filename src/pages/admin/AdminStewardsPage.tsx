import { Crown, KeyRound, Mail, Search, ShieldCheck, UserRound } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { CloudButton } from '../../components/CloudButton'
import { EmptyState } from '../../components/EmptyState'
import { StatusNotice } from '../../components/StatusNotice'
import { useAuth } from '../../hooks/useAuth'
import { fetchAdminRoleUsers, updateAdminUserAccount, updateAdminUserRole } from '../../lib/services'
import type { AdminRoleUser, ProfileRole, StewardManageableRole } from '../../lib/types'
import { AdminPageShell, AdminPanel, AdminStatusPill, formatAdminDate } from './AdminUi'

// 这个类型表示执事管理筛选条件，入参来自筛选按钮，返回值用于过滤用户列表。
type StewardFilter = 'all' | 'founder' | 'admin' | 'member'

// 这个接口描述成员账号设置草稿，入参来自列表内输入框，返回值用于提交账号修改。
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
  guardian: '执灯长老',
  member: '普通成员',
  applicant: '申请中',
  visitor: '访客'
}

// 这个函数判断用户是否匹配筛选条件，入参是用户行和筛选值，返回值表示是否展示。
function matchesFilter(item: AdminRoleUser, filter: StewardFilter): boolean {
  // 这里“全部”不限制身份。
  if (filter === 'all') {
    return true
  }

  // 这里把非超级管理员和非执事都归入普通成员筛选，便于后台批量查找。
  if (filter === 'member') {
    return item.role !== 'founder' && item.role !== 'admin'
  }

  return item.role === filter
}

// 这个函数判断用户是否匹配搜索词，入参是用户行和搜索词，返回值表示是否展示。
function matchesSearch(item: AdminRoleUser, keyword: string): boolean {
  // 这里统一转小写，避免邮箱大小写影响搜索。
  const normalizedKeyword = keyword.trim().toLowerCase()

  if (!normalizedKeyword) {
    return true
  }

  return [item.email, item.nickname, item.member_code, item.dao_name, item.city]
    .filter(Boolean)
    .some((value) => String(value).toLowerCase().includes(normalizedKeyword))
}

// 这个函数把用户列表转成账号设置草稿，入参是用户数组，返回值是按用户编号索引的草稿。
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

// 这个函数按角色选择状态章颜色，入参是用户角色，返回值是状态颜色。
function getRoleTone(role: ProfileRole): 'red' | 'green' | 'gold' | 'gray' {
  // 这里超级管理员用红色强调，执事用绿色，其他身份保持柔和。
  if (role === 'founder') {
    return 'red'
  }

  if (role === 'admin') {
    return 'green'
  }

  if (role === 'guardian') {
    return 'gold'
  }

  return 'gray'
}

// 这个函数渲染执事管理页面，入参为空，返回值是设计稿第六屏样式的角色和账号管理台账。
export function AdminStewardsPage() {
  // 这里读取当前登录资料，用于判断是否为超级管理员。
  const { profile } = useAuth()
  // 这个状态保存后台用户列表。
  const [users, setUsers] = useState<AdminRoleUser[]>([])
  // 这个状态保存搜索词。
  const [keyword, setKeyword] = useState('')
  // 这个状态保存筛选条件。
  const [filter, setFilter] = useState<StewardFilter>('all')
  // 这个状态保存正在提交角色变更的用户编号。
  const [submittingId, setSubmittingId] = useState<string | null>(null)
  // 这个状态保存正在修改账号邮箱或密码的用户编号。
  const [accountSubmittingId, setAccountSubmittingId] = useState<string | null>(null)
  // 这个状态保存每个成员的账号设置草稿。
  const [accountDrafts, setAccountDrafts] = useState<Record<string, AccountDraft>>({})
  // 这个状态保存页面提示。
  const [notice, setNotice] = useState<{ type: 'success' | 'error' | 'info'; title: string; message: string } | null>(null)

  useEffect(() => {
    // 这个函数读取可管理用户列表，入参为空，返回值为空。
    async function loadUsers() {
      try {
        const result = await fetchAdminRoleUsers()
        setUsers(result.data)
        setAccountDrafts(createAccountDrafts(result.data))

        if (!result.ok) {
          setNotice({ type: 'error', title: '读取失败', message: result.message })
        } else if (result.demoMode) {
          setNotice({ type: 'info', title: '演示模式提示', message: result.message })
        }
      } catch (error) {
        // 这里兜底捕获意外异常，避免执事管理页白屏。
        setNotice({ type: 'error', title: '读取异常', message: error instanceof Error ? error.message : '成员列表暂时无法读取。' })
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
        // 这里把服务端返回的新用户行写回列表，保证界面和数据库一致。
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
    // 这里只更新当前用户的草稿，避免影响其他成员行。
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
    <AdminPageShell
      actions={<CloudButton to="/admin/applications">查看名帖</CloudButton>}
      index="6"
      title="执事管理"
      description="授予执事、撤回权限，并为成员修正登录邮箱或重置密码。"
    >
      {profile?.role !== 'founder' ? (
        <StatusNotice
          type="error"
          title="权限不足"
          message={`当前账号身份是“${profile ? roleLabels[profile.role] : '未读取到身份'}”。只有超级管理员可以修改执事身份和成员账号。`}
        />
      ) : null}
      {notice ? <StatusNotice type={notice.type} title={notice.title} message={notice.message} /> : null}

      <AdminPanel>
        <div className="admin-filter-bar">
          <label className="admin-search-field">
            <Search className="h-4 w-4" />
            <input onChange={(event) => setKeyword(event.target.value)} placeholder="搜索邮箱、昵称、道名或编号" value={keyword} />
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

      <AdminPanel title="成员与权限" description={`共 ${filteredUsers.length} 个账号符合当前条件。`}>
        {filteredUsers.length === 0 ? (
          <EmptyState title="没有找到成员" message="换一个搜索词，或切换筛选条件再看。" />
        ) : (
          <div className="admin-steward-list">
            {filteredUsers.map((item) => {
              // 这里判断当前成员是否为超级管理员，超级管理员不能在本页被修改。
              const isFounder = item.role === 'founder'
              // 这里判断当前成员是否已经是执事。
              const isAdmin = item.role === 'admin'
              // 这里读取账号设置草稿，没有草稿时用当前邮箱兜底。
              const accountDraft = accountDrafts[item.user_id] ?? { email: item.email, password: '' }
              // 这里判断账号设置是否禁用，超级管理员账号不在本页直接修改。
              const accountDisabled = isFounder || profile?.role !== 'founder' || accountSubmittingId === item.user_id

              return (
                <article className="admin-steward-card" key={item.user_id}>
                  <div className="admin-steward-main">
                    <span className="admin-steward-avatar" aria-hidden="true">
                      {isFounder ? <Crown className="h-5 w-5" /> : isAdmin ? <ShieldCheck className="h-5 w-5" /> : <UserRound className="h-5 w-5" />}
                    </span>
                    <div className="min-w-0">
                      <h3>{item.nickname}</h3>
                      <p>{item.email}</p>
                      <div className="admin-steward-tags">
                        <AdminStatusPill tone={getRoleTone(item.role)}>{roleLabels[item.role]}</AdminStatusPill>
                        <span>编号：{item.member_code ?? '未入册'}</span>
                        <span>道名：{item.dao_name ?? '未填写'}</span>
                        <span>创建：{formatAdminDate(item.created_at)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="admin-steward-actions">
                    <CloudButton disabled={isFounder || isAdmin || submittingId === item.user_id || profile?.role !== 'founder'} onClick={() => void handleRoleChange(item.user_id, 'admin')}>
                      {submittingId === item.user_id ? '正在设置...' : '设为执事'}
                    </CloudButton>
                    <CloudButton
                      disabled={isFounder || !isAdmin || submittingId === item.user_id || profile?.role !== 'founder'}
                      onClick={() => void handleRoleChange(item.user_id, 'member')}
                      variant="ghost"
                    >
                      {submittingId === item.user_id ? '正在撤回...' : '撤回成员'}
                    </CloudButton>
                  </div>

                  <details className="admin-account-drawer">
                    <summary>
                      <KeyRound className="h-4 w-4" />
                      账号设置
                      <span>{isFounder ? '超级管理员账号请到小院修改' : '可修改邮箱或重置密码'}</span>
                    </summary>
                    <div className="admin-account-grid">
                      <label>
                        <span>绑定邮箱</span>
                        <div className="admin-input-with-icon">
                          <Mail className="h-4 w-4" />
                          <input
                            disabled={accountDisabled}
                            onChange={(event) => handleAccountDraftChange(item.user_id, 'email', event.target.value)}
                            placeholder="填写真实邮箱"
                            type="email"
                            value={accountDraft.email}
                          />
                        </div>
                      </label>
                      <label>
                        <span>重置密码</span>
                        <div className="admin-input-with-icon">
                          <KeyRound className="h-4 w-4" />
                          <input
                            autoComplete="new-password"
                            disabled={accountDisabled}
                            onChange={(event) => handleAccountDraftChange(item.user_id, 'password', event.target.value)}
                            placeholder="不修改请留空"
                            type="password"
                            value={accountDraft.password}
                          />
                        </div>
                      </label>
                      <CloudButton disabled={accountDisabled} onClick={() => void handleAccountUpdate(item.user_id)}>
                        {accountSubmittingId === item.user_id ? '正在保存...' : '保存账号'}
                      </CloudButton>
                    </div>
                  </details>
                </article>
              )
            })}
          </div>
        )}
      </AdminPanel>
    </AdminPageShell>
  )
}
