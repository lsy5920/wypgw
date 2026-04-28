import { KeyRound, Mail, Save, ShieldCheck } from 'lucide-react'
import { FormEvent, useEffect, useState } from 'react'
import { CloudButton } from '../../components/CloudButton'
import { ScrollPanel } from '../../components/ScrollPanel'
import { SectionTitle } from '../../components/SectionTitle'
import { StatusNotice } from '../../components/StatusNotice'
import { bindMyEmail, fetchMyAccountSecurity, fetchMyProfile, updateMyPassword, updateMyProfile } from '../../lib/services'
import type { AccountSecurityInfo, EmailBindInput, PasswordUpdateInput, ProfileUpdateInput } from '../../lib/types'

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
  // 这个状态保存是否正在保存。
  const [saving, setSaving] = useState(false)
  // 这个状态保存是否正在绑定邮箱。
  const [bindingEmail, setBindingEmail] = useState(false)
  // 这个状态保存是否正在修改密码。
  const [changingPassword, setChangingPassword] = useState(false)
  // 这个状态保存页面提示。
  const [notice, setNotice] = useState<{ type: 'success' | 'error' | 'info'; title: string; message: string } | null>(null)

  useEffect(() => {
    // 这个函数读取个人资料，入参为空，返回值为空。
    async function loadProfile() {
      const [result, accountResult] = await Promise.all([fetchMyProfile(), fetchMyAccountSecurity()])

      setForm({
        nickname: result.data.nickname,
        avatar_url: result.data.avatar_url ?? '',
        city: result.data.city ?? '',
        bio: result.data.bio ?? '',
        is_public: result.data.is_public
      })

      setAccountInfo(accountResult.data)

      if (!result.ok) {
        setNotice({ type: 'error', title: '读取失败', message: result.message })
      } else if (!accountResult.ok) {
        setNotice({ type: 'error', title: '读取账号失败', message: accountResult.message })
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
        这里可编辑昵称、城市、简介和头像地址。身份与权限由山门后台管理，普通同门不能自行修改。
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
            <p>请设置至少 6 位的新密码。旧编号账号修改后，原来的生日或编号密码将不再作为主要登录密码。</p>
          </div>

          <form className="mt-5 grid gap-4" onSubmit={handlePasswordSubmit}>
            <label className="grid gap-2">
              <span className="text-sm font-semibold">新密码</span>
              <input
                className="rounded-xl border border-[#6f8f8b]/25 bg-white/80 px-4 py-3 outline-none focus:border-[#6f8f8b]"
                onChange={(event) => updatePasswordField('new_password', event.target.value)}
                placeholder="至少 6 位"
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
        <form className="grid gap-5" onSubmit={handleSubmit}>
          <div className="grid gap-5 md:grid-cols-2">
            <label className="grid gap-2">
              <span className="text-sm font-semibold">昵称 *</span>
              <input
                className="rounded-xl border border-[#6f8f8b]/25 bg-white/80 px-4 py-3 outline-none focus:border-[#6f8f8b]"
                onChange={(event) => updateField('nickname', event.target.value)}
                value={form.nickname}
              />
            </label>
            <label className="grid gap-2">
              <span className="text-sm font-semibold">所在城市</span>
              <input
                className="rounded-xl border border-[#6f8f8b]/25 bg-white/80 px-4 py-3 outline-none focus:border-[#6f8f8b]"
                onChange={(event) => updateField('city', event.target.value)}
                placeholder="例如：杭州"
                value={form.city}
              />
            </label>
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
