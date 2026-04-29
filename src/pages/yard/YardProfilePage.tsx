import { KeyRound, Mail, Save, ShieldCheck, UserRound } from 'lucide-react'
import { FormEvent, useEffect, useMemo, useState } from 'react'
import { CloudButton } from '../../components/CloudButton'
import { ScrollPanel } from '../../components/ScrollPanel'
import { SectionTitle } from '../../components/SectionTitle'
import { StatusNotice } from '../../components/StatusNotice'
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
import { genderOptions } from '../../data/siteContent'

// 这个常量保存资料表单初始值，返回值用于页面加载前兜底。
const initialForm: ProfileUpdateInput = {
  nickname: '',
  avatar_url: '',
  city: '',
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
  // 这里把旧编号内部邮箱隐藏起来，避免用户误以为这是自己真正邮箱。
  if (!account.email) {
    return '尚未读取到登录邮箱'
  }

  if (account.is_legacy_email) {
    return '旧编号账号，尚未绑定真实邮箱'
  }

  return account.email
}

// 这个函数把名帖转换成小院可编辑表单，入参是名帖，返回值是用户资料草稿。
function createRosterForm(application: JoinApplication | null): RosterProfileUpdateInput {
  // 这里没有名帖时返回空表单，避免页面初次加载时报错。
  if (!application) {
    return initialRosterForm
  }

  return {
    application_id: application.id,
    jianghu_name: application.jianghu_name ?? '',
    gender: application.gender ?? '男',
    city: application.public_region ?? application.city ?? '',
    motto: application.motto ?? application.reason,
    hobbies: [application.public_story, application.tags].map((value) => value?.trim()).filter(Boolean).join('、'),
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
  // 这个状态保存是否正在保存。
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
    return applications.find((item) => ['approved', 'contacted', 'joined'].includes(item.status)) ?? applications[0] ?? null
  }, [applications])

  useEffect(() => {
    // 这个函数读取个人资料，入参为空，返回值为空。
    async function loadProfile() {
      const [result, accountResult, applicationResult] = await Promise.all([fetchMyProfile(), fetchMyAccountSecurity(), fetchMyApplications()])

      setForm({
        nickname: result.data.nickname,
        avatar_url: result.data.avatar_url ?? '',
        city: result.data.city ?? '',
        bio: result.data.bio ?? '',
        is_public: result.data.is_public
      })

      setAccountInfo(accountResult.data)
      setApplications(applicationResult.data)
      setRosterForm(createRosterForm(applicationResult.data.find((item) => ['approved', 'contacted', 'joined'].includes(item.status)) ?? applicationResult.data[0] ?? null))

      if (!result.ok) {
        setNotice({ type: 'error', title: '读取失败', message: result.message })
      } else if (!accountResult.ok) {
        setNotice({ type: 'error', title: '读取账号失败', message: accountResult.message })
      } else if (!applicationResult.ok) {
        setNotice({ type: 'error', title: '读取名册失败', message: applicationResult.message })
      } else if (result.demoMode) {
        setNotice({ type: 'info', title: '演示模式提示', message: result.message })
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

    if (!form.nickname.trim()) {
      setNotice({ type: 'error', title: '资料还不能保存', message: '请填写昵称。' })
      return
    }

    try {
      setSaving(true)
      const result = await updateMyProfile(form)
      setNotice({
        type: result.ok ? 'success' : 'error',
        title: result.ok ? '资料已保存' : '保存失败',
        message: result.message
      })
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
      // 这里进入保存状态，避免重复提交。
      setSavingRoster(true)
      const result = await updateMyRosterProfile({ ...rosterForm, application_id: currentApplication.id })

      if (result.ok && result.data) {
        setApplications((current) => current.map((item) => (item.id === result.data?.id ? result.data : item)))
        setRosterForm(createRosterForm(result.data))
      }

      setNotice({
        type: result.ok ? 'success' : 'error',
        title: result.ok ? '名册资料已保存' : '保存失败',
        message: result.message
      })
    } finally {
      // 这里无论成功失败都恢复按钮可用。
      setSavingRoster(false)
    }
  }

  // 这个函数绑定或更换邮箱，入参是表单事件，返回值为空。
  async function handleEmailSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    try {
      // 这里进入提交状态，避免用户重复点击绑定按钮。
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
    } finally {
      // 这里无论成功失败都结束提交状态，保证按钮恢复可用。
      setBindingEmail(false)
    }
  }

  // 这个函数修改密码，入参是表单事件，返回值为空。
  async function handlePasswordSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    try {
      // 这里进入提交状态，避免用户连续提交多个密码修改请求。
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
    } finally {
      // 这里无论成功失败都结束提交状态，保证按钮恢复可用。
      setChangingPassword(false)
    }
  }

  return (
    <div>
      <SectionTitle eyebrow="我的资料" title="小院名片，自己掌灯">
        这里可维护登录安全、小院展示资料和名册资料。名册中的道名与联系方式改动需管理员审核。
      </SectionTitle>

      {notice ? <StatusNotice type={notice.type} title={notice.title} message={notice.message} /> : null}

      <div className="mt-8 grid gap-5 lg:grid-cols-2">
        <ScrollPanel>
          <div className="flex items-start gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#6f8f8b]/12 text-[#6f8f8b]">
              <Mail className="h-5 w-5" />
            </span>
            <div>
              <h2 className="ink-title text-2xl font-bold text-[#143044]">绑定登录邮箱</h2>
              <p className="mt-2 text-sm leading-7 text-[#526461]">旧编号账号可在这里绑定真实邮箱，绑定后可用邮箱和当前密码登录。</p>
            </div>
          </div>

          <div className="mt-5 rounded-2xl border border-[#c9a45c]/30 bg-white/65 p-4 text-sm leading-7 text-[#526461]">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="font-semibold text-[#263238]">当前登录邮箱</span>
              <span className="rounded-full bg-[#edf3ef] px-3 py-1 text-xs text-[#526461]">
                {accountInfo.is_legacy_email ? '待绑定' : '已绑定'}
              </span>
            </div>
            <p className="mt-2 break-all text-[#143044]">{formatAccountEmail(accountInfo)}</p>
            {accountInfo.pending_email ? <p className="mt-2 break-all text-[#9e3d32]">待确认邮箱：{accountInfo.pending_email}</p> : null}
          </div>

          <form className="mt-5 grid gap-4" onSubmit={handleEmailSubmit}>
            <label className="grid gap-2">
              <span className="text-sm font-semibold">真实邮箱</span>
              <input
                className="rounded-xl border border-[#6f8f8b]/25 bg-white/80 px-4 py-3 outline-none focus:border-[#6f8f8b]"
                onChange={(event) => updateEmailField(event.target.value)}
                placeholder="例如：name@qq.com"
                type="email"
                value={emailForm.email}
              />
            </label>
            <p className="text-xs leading-6 text-[#7a6a48]">
              如 Supabase 后台仍开启邮箱确认或安全邮箱变更，绑定可能需要到新邮箱确认；旧编号邮箱无法收信时，请关闭安全邮箱变更。
            </p>
            <CloudButton disabled={bindingEmail} type="submit">
              {bindingEmail ? '正在绑定...' : accountInfo.is_legacy_email ? '绑定邮箱' : '更换邮箱'}
              <Mail className="h-4 w-4" />
            </CloudButton>
          </form>
        </ScrollPanel>

        <ScrollPanel>
          <div className="flex items-start gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#9e3d32]/10 text-[#9e3d32]">
              <KeyRound className="h-5 w-5" />
            </span>
            <div>
              <h2 className="ink-title text-2xl font-bold text-[#143044]">修改登录密码</h2>
              <p className="mt-2 text-sm leading-7 text-[#526461]">密码修改后会立即生效，下次进入小院请使用新密码。</p>
            </div>
          </div>

          <div className="mt-5 flex items-start gap-3 rounded-2xl border border-[#6f8f8b]/20 bg-[#edf3ef]/70 p-4 text-sm leading-7 text-[#526461]">
            <ShieldCheck className="mt-1 h-4 w-4 shrink-0 text-[#6f8f8b]" />
            <p>请设置新的登录密码。旧编号账号修改后，原来的生日或编号密码将不再作为主要登录密码。</p>
          </div>

          <form className="mt-5 grid gap-4" onSubmit={handlePasswordSubmit}>
            <label className="grid gap-2">
              <span className="text-sm font-semibold">新密码</span>
              <input
                className="rounded-xl border border-[#6f8f8b]/25 bg-white/80 px-4 py-3 outline-none focus:border-[#6f8f8b]"
                onChange={(event) => updatePasswordField('new_password', event.target.value)}
                placeholder="输入新密码"
                type="password"
                value={passwordForm.new_password}
              />
            </label>
            <label className="grid gap-2">
              <span className="text-sm font-semibold">确认新密码</span>
              <input
                className="rounded-xl border border-[#6f8f8b]/25 bg-white/80 px-4 py-3 outline-none focus:border-[#6f8f8b]"
                onChange={(event) => updatePasswordField('confirm_password', event.target.value)}
                placeholder="再输入一次新密码"
                type="password"
                value={passwordForm.confirm_password}
              />
            </label>
            <CloudButton disabled={changingPassword} type="submit" variant="seal">
              {changingPassword ? '正在修改...' : '修改密码'}
              <KeyRound className="h-4 w-4" />
            </CloudButton>
          </form>
        </ScrollPanel>
      </div>

      <ScrollPanel className="mt-8">
        <div className="flex items-start gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#6f8f8b]/12 text-[#6f8f8b]">
            <UserRound className="h-5 w-5" />
          </span>
          <div>
            <h2 className="ink-title text-2xl font-bold text-[#143044]">名册资料</h2>
            <p className="mt-2 text-sm leading-7 text-[#526461]">真实姓名、出生年份和身份只读展示；道名与联系方式改动会先送管理员审核，其他资料会直接保存。</p>
          </div>
        </div>

        {!currentApplication ? (
          <div className="mt-5 rounded-2xl border border-[#c9a45c]/30 bg-white/65 p-4 text-sm leading-7 text-[#526461]">
            你还没有名帖。请先到问云名册递交登记，通过后会在这里维护公开资料。
          </div>
        ) : (
          <form className="mt-5 grid gap-5" onSubmit={handleRosterSubmit}>
            <div className="grid gap-5 md:grid-cols-3">
              <label className="grid gap-2">
                <span className="text-sm font-semibold">真实姓名</span>
                <input
                  className="rounded-xl border border-[#6f8f8b]/20 bg-[#edf3ef]/75 px-4 py-3 text-[#7a6a48] outline-none"
                  disabled
                  value={currentApplication.real_name ?? '未填写'}
                />
              </label>
              <label className="grid gap-2">
                <span className="text-sm font-semibold">出生年份</span>
                <input
                  className="rounded-xl border border-[#6f8f8b]/20 bg-[#edf3ef]/75 px-4 py-3 text-[#7a6a48] outline-none"
                  disabled
                  value={currentApplication.age_range ?? '未填写'}
                />
              </label>
              <label className="grid gap-2">
                <span className="text-sm font-semibold">身份</span>
                <input
                  className="rounded-xl border border-[#6f8f8b]/20 bg-[#edf3ef]/75 px-4 py-3 text-[#7a6a48] outline-none"
                  disabled
                  value={currentApplication.member_role ?? '同门'}
                />
              </label>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <label className="grid gap-2">
                <span className="text-sm font-semibold">道名</span>
                <input
                  className="rounded-xl border border-[#c9a45c]/35 bg-white/80 px-4 py-3 outline-none focus:border-[#c9a45c]"
                  onChange={(event) => updateRosterField('requested_nickname', event.target.value)}
                  value={rosterForm.requested_nickname}
                />
                <span className="text-xs leading-6 text-[#7a6a48]">
                  当前道名：{currentApplication.nickname}。改动后需管理员审核。
                </span>
              </label>
              <label className="grid gap-2">
                <span className="text-sm font-semibold">联系方式</span>
                <input
                  className="rounded-xl border border-[#c9a45c]/35 bg-white/80 px-4 py-3 outline-none focus:border-[#c9a45c]"
                  onChange={(event) => updateRosterField('requested_legacy_contact', event.target.value)}
                  value={rosterForm.requested_legacy_contact}
                />
                <span className="text-xs leading-6 text-[#7a6a48]">
                  当前联系方式：{currentApplication.legacy_contact ?? currentApplication.wechat_id}。改动后需管理员审核。
                </span>
              </label>
            </div>

            <div className="grid gap-5 md:grid-cols-3">
              <label className="grid gap-2">
                <span className="text-sm font-semibold">江湖名</span>
                <input
                  className="rounded-xl border border-[#6f8f8b]/25 bg-white/80 px-4 py-3 outline-none focus:border-[#6f8f8b]"
                  onChange={(event) => updateRosterField('jianghu_name', event.target.value)}
                  value={rosterForm.jianghu_name}
                />
              </label>
              <label className="grid gap-2">
                <span className="text-sm font-semibold">性别</span>
                <select
                  className="rounded-xl border border-[#6f8f8b]/25 bg-white/80 px-4 py-3 outline-none focus:border-[#6f8f8b]"
                  onChange={(event) => updateRosterField('gender', event.target.value as MemberGender)}
                  value={rosterForm.gender}
                >
                  {genderOptions.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </label>
              <label className="grid gap-2">
                <span className="text-sm font-semibold">所在城市</span>
                <input
                  className="rounded-xl border border-[#6f8f8b]/25 bg-white/80 px-4 py-3 outline-none focus:border-[#6f8f8b]"
                  onChange={(event) => updateRosterField('city', event.target.value)}
                  value={rosterForm.city}
                />
              </label>
            </div>

            <label className="grid gap-2">
              <span className="text-sm font-semibold">宣言</span>
              <textarea
                className="min-h-24 rounded-xl border border-[#6f8f8b]/25 bg-white/80 px-4 py-3 leading-7 outline-none focus:border-[#6f8f8b]"
                onChange={(event) => updateRosterField('motto', event.target.value)}
                value={rosterForm.motto}
              />
            </label>

            <div className="grid gap-5 md:grid-cols-2">
              <label className="grid gap-2">
                <span className="text-sm font-semibold">兴趣爱好</span>
                <textarea
                  className="min-h-24 rounded-xl border border-[#6f8f8b]/25 bg-white/80 px-4 py-3 leading-7 outline-none focus:border-[#6f8f8b]"
                  onChange={(event) => updateRosterField('hobbies', event.target.value)}
                  placeholder="例如：写文、摄影、饮茶"
                  value={rosterForm.hobbies}
                />
              </label>
              <label className="grid gap-2">
                <span className="text-sm font-semibold">同行期待</span>
                <textarea
                  className="min-h-24 rounded-xl border border-[#6f8f8b]/25 bg-white/80 px-4 py-3 leading-7 outline-none focus:border-[#6f8f8b]"
                  onChange={(event) => updateRosterField('companion_expectation', event.target.value)}
                  value={rosterForm.companion_expectation}
                />
              </label>
            </div>

            {(currentApplication.requested_nickname || currentApplication.requested_legacy_contact) && currentApplication.requested_at ? (
              <div className="rounded-2xl border border-[#9e3d32]/20 bg-[#fff1ee]/70 p-4 text-sm leading-7 text-[#526461]">
                已有待审核修改，提交时间：{new Date(currentApplication.requested_at).toLocaleString('zh-CN', { hour12: false })}。
              </div>
            ) : null}

            <CloudButton disabled={savingRoster} type="submit" variant="seal">
              {savingRoster ? '正在保存...' : '保存名册资料'}
              <Save className="h-4 w-4" />
            </CloudButton>
          </form>
        )}
      </ScrollPanel>

      <ScrollPanel className="mt-8">
        <form className="grid gap-5" onSubmit={handleSubmit}>
          <div>
            <p className="text-sm font-semibold text-[#9e3d32]">小院展示资料</p>
            <p className="mt-2 text-sm leading-7 text-[#526461]">这里保存头像、自述和资料公开开关；道名、城市等名册资料请在上方名册资料区维护。</p>
          </div>

          <label className="grid gap-2">
            <span className="text-sm font-semibold">头像地址</span>
            <input
              className="rounded-xl border border-[#6f8f8b]/25 bg-white/80 px-4 py-3 outline-none focus:border-[#6f8f8b]"
              onChange={(event) => updateField('avatar_url', event.target.value)}
              placeholder="可填写图片链接"
              value={form.avatar_url}
            />
          </label>

          <label className="grid gap-2">
            <span className="text-sm font-semibold">小院自述</span>
            <textarea
              className="min-h-32 rounded-xl border border-[#6f8f8b]/25 bg-white/80 px-4 py-3 leading-7 outline-none focus:border-[#6f8f8b]"
              onChange={(event) => updateField('bio', event.target.value)}
              placeholder="写一点你想让同门知道的话。"
              value={form.bio}
            />
          </label>

          <label className="flex items-start gap-3 rounded-xl border border-[#c9a45c]/35 bg-white/60 p-4">
            <input
              checked={form.is_public}
              className="mt-1 h-4 w-4"
              onChange={(event) => updateField('is_public', event.target.checked)}
              type="checkbox"
            />
            <span className="text-sm leading-7 text-[#526461]">允许公开展示我的资料。公开资料只包含昵称、城市、简介和头像，不包含邮箱。</span>
          </label>

          <CloudButton disabled={saving} type="submit" variant="seal">
            {saving ? '正在保存...' : '保存资料'}
            <Save className="h-4 w-4" />
          </CloudButton>
        </form>
      </ScrollPanel>
    </div>
  )
}
