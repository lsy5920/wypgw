import { KeyRound, Mail, Save, ShieldCheck, UserRound } from 'lucide-react'
import { type FormEvent, useEffect, useMemo, useState } from 'react'
import { StatusNotice } from '../../components/StatusNotice'
import { YardPageBanner, YardPaperCard, YardStatusPill } from '../../components/YardGuofengFrame'
import { genderOptions } from '../../data/siteContent'
import { getFriendlyErrorMessage } from '../../lib/errorMessage'
import {
  bindMyEmail,
  fetchMyAccountSecurity,
  fetchMyApplications,
  fetchMyProfile,
  updateMyPassword,
  updateMyProfile,
  updateMyRosterProfile
} from '../../lib/services'
import type {
  AccountSecurityInfo,
  EmailBindInput,
  JoinApplication,
  MemberGender,
  PasswordUpdateInput,
  ProfileUpdateInput,
  RosterProfileUpdateInput
} from '../../lib/types'

// 这个常量保存资料表单初始值，返回值用于页面加载前兜底。
const initialForm: ProfileUpdateInput = {
  avatar_url: '',
  bio: '',
  is_public: false
}

// 这个常量保存账号安全信息初始值，返回值用于页面加载前展示兜底状态。
const initialAccountInfo: AccountSecurityInfo = {
  email: '',
  is_legacy_email: false,
  pending_email: null,
  email_confirmed_at: null
}

// 这个常量保存绑定邮箱表单初始值，返回值用于清空表单。
const initialEmailForm: EmailBindInput = {
  email: ''
}

// 这个常量保存修改密码表单初始值，返回值用于清空表单。
const initialPasswordForm: PasswordUpdateInput = {
  new_password: '',
  confirm_password: ''
}

// 这个常量保存名册资料表单初始值，返回值用于没有名帖时兜底。
const initialRosterForm: RosterProfileUpdateInput = {
  application_id: '',
  jianghu_name: '',
  gender: '男',
  city: '',
  motto: '',
  hobbies: '',
  companion_expectation: '',
  requested_nickname: '',
  requested_legacy_contact: ''
}

// 这个函数把账号邮箱转成中文展示，入参是账号安全信息，返回值是页面显示的账号文字。
function formatAccountEmail(account: AccountSecurityInfo): string {
  if (!account.email) {
    return '尚未读取到登录邮箱'
  }

  // 这里把旧编号内部邮箱隐藏起来，避免用户误以为这是自己真正邮箱。
  if (account.is_legacy_email) {
    return '旧编号账号，尚未绑定真实邮箱'
  }

  return account.email
}

// 这个函数把名帖转换成小院可编辑表单，入参是名帖，返回值是用户资料草稿。
function createRosterForm(application: JoinApplication | null): RosterProfileUpdateInput {
  if (!application) {
    return initialRosterForm
  }

  return {
    application_id: application.id,
    jianghu_name: application.jianghu_name ?? '',
    gender: application.gender ?? '男',
    city: application.public_region ?? application.city ?? '',
    motto: application.motto ?? application.reason,
    hobbies: application.tags ?? '',
    companion_expectation: application.companion_expectation ?? '',
    requested_nickname: application.requested_nickname ?? application.nickname,
    requested_legacy_contact: application.requested_legacy_contact ?? application.legacy_contact ?? application.wechat_id
  }
}

// 这个函数渲染我的资料页，入参为空，返回值是用户可编辑资料表单。
export function YardProfilePage() {
  // 这个状态保存资料表单。
  const [form, setForm] = useState<ProfileUpdateInput>(initialForm)
  // 这个状态保存当前登录账号安全信息。
  const [accountInfo, setAccountInfo] = useState<AccountSecurityInfo>(initialAccountInfo)
  // 这个状态保存绑定邮箱表单。
  const [emailForm, setEmailForm] = useState<EmailBindInput>(initialEmailForm)
  // 这个状态保存修改密码表单。
  const [passwordForm, setPasswordForm] = useState<PasswordUpdateInput>(initialPasswordForm)
  // 这个状态保存用户自己的名帖列表。
  const [applications, setApplications] = useState<JoinApplication[]>([])
  // 这个状态保存名册资料表单。
  const [rosterForm, setRosterForm] = useState<RosterProfileUpdateInput>(initialRosterForm)
  // 这个状态保存页面是否正在读取。
  const [loadingProfile, setLoadingProfile] = useState(true)
  // 这个状态保存是否正在保存小院展示资料。
  const [saving, setSaving] = useState(false)
  // 这个状态保存名册资料是否正在保存。
  const [savingRoster, setSavingRoster] = useState(false)
  // 这个状态保存是否正在绑定邮箱。
  const [bindingEmail, setBindingEmail] = useState(false)
  // 这个状态保存是否正在修改密码。
  const [changingPassword, setChangingPassword] = useState(false)
  // 这个状态保存页面提示。
  const [notice, setNotice] = useState<{ type: 'success' | 'error' | 'info'; title: string; message: string } | null>(null)

  // 这个变量保存当前优先展示的名帖，返回值用于资料表单。
  const currentApplication = useMemo(() => {
    return applications.find((item) => ['approved', 'contacted'].includes(item.status)) ?? applications[0] ?? null
  }, [applications])

  useEffect(() => {
    // 这个函数读取个人资料、账号安全和名帖资料，入参为空，返回值为空。
    async function loadProfile() {
      try {
        const [result, accountResult, applicationResult] = await Promise.all([fetchMyProfile(), fetchMyAccountSecurity(), fetchMyApplications()])

        setForm({
          avatar_url: result.data.avatar_url ?? '',
          bio: result.data.bio ?? '',
          is_public: result.data.is_public
        })
        setAccountInfo(accountResult.data)
        setApplications(applicationResult.data)
        setRosterForm(createRosterForm(applicationResult.data.find((item) => ['approved', 'contacted'].includes(item.status)) ?? applicationResult.data[0] ?? null))

        if (!result.ok) {
          setNotice({ type: 'error', title: '读取失败', message: result.message })
        } else if (!accountResult.ok) {
          setNotice({ type: 'error', title: '读取账号失败', message: accountResult.message })
        } else if (!applicationResult.ok) {
          setNotice({ type: 'error', title: '读取名册失败', message: applicationResult.message })
        } else if (result.demoMode) {
          setNotice({ type: 'info', title: '演示模式提示', message: result.message })
        }
      } catch (error) {
        // 这里捕获资料读取异常，避免网络波动导致页面白屏。
        setNotice({ type: 'error', title: '读取失败', message: getFriendlyErrorMessage(error) })
      } finally {
        // 这里结束加载状态，保证失败时也能看到表单和提示。
        setLoadingProfile(false)
      }
    }

    void loadProfile()
  }, [])

  // 这个函数更新文字字段，入参是字段名和值，返回值为空。
  function updateField(field: keyof ProfileUpdateInput, value: string | boolean) {
    setForm((current) => ({ ...current, [field]: value }))
  }

  // 这个函数更新邮箱表单字段，入参是邮箱字符串，返回值为空。
  function updateEmailField(value: string) {
    setEmailForm({ email: value })
  }

  // 这个函数更新密码表单字段，入参是字段名和值，返回值为空。
  function updatePasswordField(field: keyof PasswordUpdateInput, value: string) {
    setPasswordForm((current) => ({ ...current, [field]: value }))
  }

  // 这个函数更新名册资料字段，入参是字段名和值，返回值为空。
  function updateRosterField(field: keyof RosterProfileUpdateInput, value: string) {
    setRosterForm((current) => ({ ...current, [field]: value }))
  }

  // 这个函数保存个人资料，入参是表单事件，返回值为空。
  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    try {
      setSaving(true)
      const result = await updateMyProfile(form)
      setNotice({
        type: result.ok ? 'success' : 'error',
        title: result.ok ? '资料已保存' : '保存失败',
        message: result.message
      })
    } catch (error) {
      // 这里捕获保存异常，提示用户刷新或稍后重试。
      setNotice({ type: 'error', title: '保存失败', message: getFriendlyErrorMessage(error) })
    } finally {
      setSaving(false)
    }
  }

  // 这个函数保存名册资料，入参是表单事件，返回值为空。
  async function handleRosterSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!currentApplication) {
      setNotice({ type: 'error', title: '还没有名帖', message: '请先到问云名册递交名帖，通过后再维护资料。' })
      return
    }

    try {
      setSavingRoster(true)
      const result = await updateMyRosterProfile({ ...rosterForm, application_id: currentApplication.id })

      if (result.ok && result.data) {
        // 这里保存成功后重新读取数据库，确保页面展示的是权限函数真正落库后的结果。
        const latestApplications = await fetchMyApplications()

        if (latestApplications.ok) {
          const nextApplication = latestApplications.data.find((item) => item.id === result.data?.id) ?? latestApplications.data[0] ?? result.data
          setApplications(latestApplications.data)
          setRosterForm(createRosterForm(nextApplication))
        } else {
          setApplications((current) => current.map((item) => (item.id === result.data?.id ? result.data : item)))
          setRosterForm(createRosterForm(result.data))
        }
      }

      setNotice({
        type: result.ok ? 'success' : 'error',
        title: result.ok ? '名册资料已保存' : '保存失败',
        message: result.message
      })
    } catch (error) {
      // 这里捕获名册保存异常，避免按钮一直停在保存中。
      setNotice({ type: 'error', title: '保存失败', message: getFriendlyErrorMessage(error) })
    } finally {
      setSavingRoster(false)
    }
  }

  // 这个函数绑定或更换邮箱，入参是表单事件，返回值为空。
  async function handleEmailSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    try {
      setBindingEmail(true)
      const result = await bindMyEmail(emailForm)

      if (result.ok) {
        setAccountInfo(result.data)
        setEmailForm(initialEmailForm)
      }

      setNotice({
        type: result.ok ? 'success' : 'error',
        title: result.ok ? '邮箱已处理' : '绑定失败',
        message: result.message
      })
    } catch (error) {
      // 这里捕获邮箱绑定异常，提示用户检查邮箱或稍后重试。
      setNotice({ type: 'error', title: '绑定失败', message: getFriendlyErrorMessage(error) })
    } finally {
      setBindingEmail(false)
    }
  }

  // 这个函数修改密码，入参是表单事件，返回值为空。
  async function handlePasswordSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    try {
      setChangingPassword(true)
      const result = await updateMyPassword(passwordForm)

      if (result.ok) {
        setPasswordForm(initialPasswordForm)
      }

      setNotice({
        type: result.ok ? 'success' : 'error',
        title: result.ok ? '密码已修改' : '修改失败',
        message: result.message
      })
    } catch (error) {
      // 这里捕获密码修改异常，避免用户误以为已经保存。
      setNotice({ type: 'error', title: '修改失败', message: getFriendlyErrorMessage(error) })
    } finally {
      setChangingPassword(false)
    }
  }

  return (
    <div className="yard-page-stack">
      <YardPageBanner
        indexLabel="2 我的资料"
        subtitle="登录安全、小院名片和名册公开资料，都在这一页细细整理。"
        title="小院名片，自己掌灯"
        visual="yardProfile"
      />

      {notice ? <StatusNotice type={notice.type} title={notice.title} message={notice.message} /> : null}
      {loadingProfile ? <StatusNotice title="正在读取资料" message="请稍候，正在整理账号、安全和名册资料。" /> : null}

      <div className="yard-profile-layout">
        <YardPaperCard subtitle="旧编号账号可在这里绑定真实邮箱，绑定后可用邮箱登录。" title="账号与安全">
          <div className="yard-account-card">
            <div className="yard-account-icon">
              <Mail className="h-5 w-5" />
            </div>
            <div>
              <p>当前登录邮箱</p>
              <strong>{formatAccountEmail(accountInfo)}</strong>
              {accountInfo.pending_email ? <span>待确认邮箱：{accountInfo.pending_email}</span> : null}
            </div>
            <YardStatusPill tone={accountInfo.is_legacy_email ? 'gold' : 'jade'}>{accountInfo.is_legacy_email ? '待绑定' : '已绑定'}</YardStatusPill>
          </div>

          <form className="yard-form-grid" onSubmit={handleEmailSubmit}>
            <label>
              <span>真实邮箱</span>
              <input className="yard-input" onChange={(event) => updateEmailField(event.target.value)} placeholder="例如：name@qq.com" type="email" value={emailForm.email} />
            </label>
            <button className="yard-action-button" disabled={bindingEmail} type="submit">
              {bindingEmail ? '正在绑定...' : accountInfo.is_legacy_email ? '绑定邮箱' : '更换邮箱'}
              <Mail className="h-4 w-4" />
            </button>
          </form>

          <form className="yard-form-grid yard-form-grid-password" onSubmit={handlePasswordSubmit}>
            <label>
              <span>新密码</span>
              <input className="yard-input" onChange={(event) => updatePasswordField('new_password', event.target.value)} placeholder="输入新密码" type="password" value={passwordForm.new_password} />
            </label>
            <label>
              <span>确认新密码</span>
              <input className="yard-input" onChange={(event) => updatePasswordField('confirm_password', event.target.value)} placeholder="再输入一次新密码" type="password" value={passwordForm.confirm_password} />
            </label>
            <button className="yard-action-button-muted" disabled={changingPassword} type="submit">
              {changingPassword ? '正在修改...' : '修改密码'}
              <KeyRound className="h-4 w-4" />
            </button>
          </form>
        </YardPaperCard>

        <YardPaperCard subtitle="这张名片用于快速查看你在小院里的公开形象。" title="小院名片">
          <div className="yard-namecard-preview">
            <div className="yard-namecard-avatar">
              {form.avatar_url ? <img alt="" src={form.avatar_url} /> : <UserRound className="h-10 w-10" />}
            </div>
            <div>
              <p>清风明月</p>
              <h3>{currentApplication?.nickname ?? '尚未递帖'}</h3>
              <span>{currentApplication?.member_role ?? '同门'} · {currentApplication?.public_region ?? currentApplication?.city ?? '未填写城市'}</span>
            </div>
          </div>
          <div className="yard-quiet-callout">
            <ShieldCheck className="h-5 w-5" />
            <div>
              <strong>资料公开状态</strong>
              <p>{form.is_public ? '当前允许公开展示头像、自述和基础资料。' : '当前未公开展示小院资料，外部不会看到你的个人资料。'}</p>
            </div>
          </div>
        </YardPaperCard>
      </div>

      <YardPaperCard subtitle="真实姓名、出生年份和身份只读展示；道名与联系方式改动需管理员审核。" title="名册资料（公开信息）">
        {!currentApplication ? (
          <div className="yard-empty-box">
            <strong>你还没有名帖</strong>
            <p>请先到问云名册递交登记，通过后会在这里维护公开资料。</p>
          </div>
        ) : (
          <form className="yard-roster-form" onSubmit={handleRosterSubmit}>
            <div className="yard-form-columns-3">
              <label>
                <span>真实姓名</span>
                <input className="yard-input yard-input-readonly" disabled value={currentApplication.real_name ?? '未填写'} />
              </label>
              <label>
                <span>出生年份</span>
                <input className="yard-input yard-input-readonly" disabled value={currentApplication.age_range ?? '未填写'} />
              </label>
              <label>
                <span>身份</span>
                <input className="yard-input yard-input-readonly" disabled value={currentApplication.member_role ?? '同门'} />
              </label>
            </div>

            <div className="yard-form-columns-2">
              <label>
                <span>道名</span>
                <input className="yard-input" onChange={(event) => updateRosterField('requested_nickname', event.target.value)} value={rosterForm.requested_nickname} />
                <small>当前道名：{currentApplication.nickname}。改动后需管理员审核。</small>
              </label>
              <label>
                <span>联系方式</span>
                <input className="yard-input" onChange={(event) => updateRosterField('requested_legacy_contact', event.target.value)} value={rosterForm.requested_legacy_contact} />
                <small>当前联系方式：{currentApplication.legacy_contact ?? currentApplication.wechat_id}。改动后需管理员审核。</small>
              </label>
            </div>

            <div className="yard-form-columns-3">
              <label>
                <span>江湖名</span>
                <input className="yard-input" onChange={(event) => updateRosterField('jianghu_name', event.target.value)} value={rosterForm.jianghu_name} />
              </label>
              <label>
                <span>性别</span>
                <select className="yard-input" onChange={(event) => updateRosterField('gender', event.target.value as MemberGender)} value={rosterForm.gender}>
                  {genderOptions.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <span>所在城市</span>
                <input className="yard-input" onChange={(event) => updateRosterField('city', event.target.value)} value={rosterForm.city} />
              </label>
            </div>

            <label>
              <span>宣言</span>
              <textarea className="yard-input yard-textarea" onChange={(event) => updateRosterField('motto', event.target.value)} value={rosterForm.motto} />
            </label>

            <div className="yard-form-columns-2">
              <label>
                <span>兴趣爱好</span>
                <textarea className="yard-input yard-textarea" onChange={(event) => updateRosterField('hobbies', event.target.value)} placeholder="例如：写文、摄影、饮茶" value={rosterForm.hobbies} />
              </label>
              <label>
                <span>同行期待</span>
                <textarea className="yard-input yard-textarea" onChange={(event) => updateRosterField('companion_expectation', event.target.value)} value={rosterForm.companion_expectation} />
              </label>
            </div>

            {(currentApplication.requested_nickname || currentApplication.requested_legacy_contact) && currentApplication.requested_at ? (
              <div className="yard-warning-line">已有待审核修改，提交时间：{new Date(currentApplication.requested_at).toLocaleString('zh-CN', { hour12: false })}。</div>
            ) : null}

            <button className="yard-action-button yard-form-submit" disabled={savingRoster} type="submit">
              {savingRoster ? '正在保存...' : '保存名册资料'}
              <Save className="h-4 w-4" />
            </button>
          </form>
        )}
      </YardPaperCard>

      <YardPaperCard subtitle="这里保存头像、自述和资料公开开关；道名、城市等名册资料请在上方维护。" title="小院展示资料">
        <form className="yard-roster-form" onSubmit={handleSubmit}>
          <label>
            <span>头像地址</span>
            <input className="yard-input" onChange={(event) => updateField('avatar_url', event.target.value)} placeholder="可填写图片链接" value={form.avatar_url} />
          </label>

          <label>
            <span>小院自述</span>
            <textarea className="yard-input yard-textarea" onChange={(event) => updateField('bio', event.target.value)} placeholder="写一点你想让同门知道的话。" value={form.bio} />
          </label>

          <label className="yard-check-row">
            <input checked={form.is_public} onChange={(event) => updateField('is_public', event.target.checked)} type="checkbox" />
            <span>允许公开展示我的资料。公开资料只包含昵称、城市、简介和头像，不包含邮箱。</span>
          </label>

          <button className="yard-action-button yard-form-submit" disabled={saving} type="submit">
            {saving ? '正在保存...' : '保存资料'}
            <Save className="h-4 w-4" />
          </button>
        </form>
      </YardPaperCard>
    </div>
  )
}
