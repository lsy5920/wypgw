import { FormEvent, useEffect, useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { CloudButton } from '../components/CloudButton'
import { PageShell } from '../components/PageShell'
import { ScrollPanel } from '../components/ScrollPanel'
import { SectionTitle } from '../components/SectionTitle'
import { StatusNotice } from '../components/StatusNotice'
import { useAuth } from '../hooks/useAuth'
import { getPasswordRecoveryRedirectUrl, translateSupabaseAuthError } from '../lib/authMessages'
import { getPublicAsset } from '../lib/assets'
import { supabase } from '../lib/supabaseClient'
import type { Profile } from '../lib/types'

// 这个类型描述路由传来的状态，入参来自 Navigate，返回值用于显示登录原因。
interface LocationState {
  // 跳转前传来的中文提示。
  message?: string
}

// 这个类型描述登录页当前表单模式，返回值用于决定展示登录、注册、找回或重置密码。
type LoginMode = 'login' | 'signup' | 'forgot' | 'reset'

// 这个函数用邮箱生成默认昵称，入参是邮箱，返回值是邮箱前缀或兜底昵称。
function createDefaultNickname(email: string): string {
  return email.split('@')[0] || '问云同门'
}

// 这个函数把旧名册编号账号转换成 Supabase 可登录邮箱，入参是用户输入，返回值是实际登录账号。
function normalizeLoginAccount(account: string): string {
  // 这里先清理前后空格，避免手机输入法带入空白。
  const value = account.trim()

  // 这里保留邮箱登录方式，兼容新注册用户。
  if (value.includes('@')) {
    return value
  }

  // 这里兼容完整编号，例如“问云-云-001”。
  const fullCodeMatch = value.match(/(\d{1,6})$/)
  const numberPart = fullCodeMatch ? fullCodeMatch[1] : value
  // 这里把 1、01、001 都统一成 001，方便旧名册账号登录。
  const normalizedNumber = numberPart.replace(/\D/g, '').padStart(3, '0')

  // 这里把 001 编号绑定到超级管理员邮箱，登录时仍然需要输入该邮箱账号当前密码。
  if (normalizedNumber === '001') {
    return '3199912548@qq.com'
  }

  return `${normalizedNumber}@wenyun.local`
}

// 这个函数判断当前输入是否为旧名册编号账号，入参是用户输入，返回值表示是否需要走编号登录。
function isLegacyRosterAccount(account: string): boolean {
  const value = account.trim()

  return Boolean(value) && !value.includes('@')
}

// 这个函数判断当前地址是否为找回密码邮件回跳，入参为空，返回值表示是否显示重置密码表单。
function isPasswordRecoveryUrl(): boolean {
  try {
    // 这里兼容构建和测试环境，避免没有浏览器窗口对象时报错。
    if (typeof window === 'undefined') {
      return false
    }

    // 这里同时检查普通查询参数和 Supabase 放进哈希里的恢复标记。
    const searchText = window.location.search.toLowerCase()
    const hashText = window.location.hash.toLowerCase()

    return searchText.includes('mode=reset-password') || hashText.includes('type=recovery')
  } catch {
    // 这里兜底处理地址解析异常，异常时按普通登录页展示。
    return false
  }
}

// 这个函数确保登录用户拥有 profiles 资料，入参是用户编号和邮箱，返回值是资料或空值。
async function ensureProfile(userId: string, email: string): Promise<Profile | null> {
  if (!supabase) {
    return null
  }

  // 这里先读取现有资料，避免重复插入。
  const { data: existing, error: readError } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle()

  if (readError) {
    throw readError
  }

  if (existing) {
    return existing as Profile
  }

  // 这里补建资料，防止数据库触发器没有及时执行时小院无法进入。
  const { data, error } = await supabase
    .from('profiles')
    .insert({
      id: userId,
      nickname: createDefaultNickname(email),
      role: 'member'
    })
    .select('*')
    .single()

  if (error) {
    throw error
  }

  return data as Profile
}

// 这个函数渲染问云小院登录页，入参为空，返回值是登录和注册表单。
export function LoginPage() {
  // 这个常量保存问云小院插画路径，用于登录页展示入院场景。
  const courtyardIllustrationPath = getPublicAsset('visual-v2/courtyard-illustration-v2.svg')
  // 这里读取当前认证状态，用于已登录时自动进入问云小院。
  const { profile, loading, refresh } = useAuth()
  // 这个变量用于页面跳转。
  const navigate = useNavigate()
  // 这个变量用于读取后台跳转过来的提示。
  const location = useLocation()
  // 这个状态保存邮箱或旧名册编号。
  const [email, setEmail] = useState('')
  // 这个状态保存密码。
  const [password, setPassword] = useState('')
  // 这个状态保存当前是登录、注册、找回密码还是重置密码。
  const [mode, setMode] = useState<LoginMode>(() => (isPasswordRecoveryUrl() ? 'reset' : 'login'))
  // 这个状态保存找回密码邮箱。
  const [recoveryEmail, setRecoveryEmail] = useState('')
  // 这个状态保存重置密码时输入的新密码。
  const [newPassword, setNewPassword] = useState('')
  // 这个状态保存重置密码时再次确认的新密码。
  const [confirmPassword, setConfirmPassword] = useState('')
  // 这个状态表示是否正在提交。
  const [submitting, setSubmitting] = useState(false)
  // 这个状态保存表单提示。
  const [notice, setNotice] = useState<{ type: 'success' | 'error' | 'info'; title: string; message: string } | null>(null)
  // 这个变量保存跳转传来的提示。
  const stateMessage = (location.state as LocationState | null)?.message
  // 这个变量表示当前是否处于找回邮件回来的重置流程。
  const inResetMode = mode === 'reset'

  useEffect(() => {
    // 这里监听 Supabase 发出的找回密码事件，用户从邮件回来时切到新密码表单。
    if (!supabase) {
      return undefined
    }

    // 这里如果页面初始化时已经带恢复标记，也直接切换到重置密码模式。
    if (isPasswordRecoveryUrl()) {
      setMode('reset')
      setNotice({ type: 'info', title: '请设置新密码', message: '找回密码链接已打开，请输入新密码完成重置。' })
    }

    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((event) => {
      // 这里处理 Supabase 成功识别恢复链接的场景。
      if (event === 'PASSWORD_RECOVERY') {
        setMode('reset')
        setNotice({ type: 'info', title: '请设置新密码', message: '找回密码链接已验证，请输入新密码完成重置。' })
      }
    })

    // 这里卸载监听，避免页面切换后重复触发。
    return () => subscription.unsubscribe()
  }, [])

  // 这里如果已经登录，统一进入问云小院；管理员可在小院里再进入管理后台。
  if (!loading && profile && !inResetMode) {
    return <Navigate to="/yard" replace />
  }

  // 这个函数处理登录或注册，入参是表单事件，返回值为空。
  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    // 这里处理未配置 Supabase 的情况，避免用户误以为可以登录。
    if (!supabase) {
      setNotice({
        type: 'error',
        title: '问云小院暂未启用',
        message:
          '请先配置 Supabase：本地填写 .env.local；GitHub Pages 部署请在仓库 Actions 密钥中填写 VITE_SUPABASE_URL 和 VITE_SUPABASE_ANON_KEY。'
      })
      return
    }

    // 这里做基础校验，避免空账号或短密码提交给 Supabase。
    if (!email.trim()) {
      setNotice({ type: 'error', title: '请检查账号信息', message: '邮箱或编号不能为空。' })
      return
    }

    // 这里普通注册仍要求邮箱格式，旧编号账号由导入脚本创建，不能在前台自行注册。
    if (mode === 'signup' && isLegacyRosterAccount(email)) {
      setNotice({ type: 'error', title: '旧编号不能直接注册', message: '001 这类编号账号由旧名册导入生成，请直接登录；新用户请用邮箱注册。' })
      return
    }

    // 这里只检查密码是否为空，最少位数不再由前端限制。
    if (!password) {
      setNotice({ type: 'error', title: '请检查账号信息', message: '密码不能为空。' })
      return
    }

    try {
      setSubmitting(true)
      // 这里把 001 这类旧编号转换为 Supabase Auth 能识别的内部邮箱。
      const loginEmail = normalizeLoginAccount(email)
      // 这里根据模式调用登录或注册接口。
      const result =
        mode === 'login'
          ? await supabase.auth.signInWithPassword({ email: loginEmail, password })
          : await supabase.auth.signUp({
              email: loginEmail,
              password,
              options: {
                data: {
                  nickname: createDefaultNickname(loginEmail)
                }
              }
            })

      if (result.error) {
        throw result.error
      }

      // 这里提示用户关闭邮箱确认，因为本项目要求注册后无需邮箱校验。
      if (mode === 'signup' && !result.data.session) {
        setNotice({
          type: 'error',
          title: '注册被邮箱确认拦住了',
          message: '请到 Supabase 后台关闭邮箱确认后再注册：Authentication → Sign In / Providers → 关闭邮箱确认。'
        })
        return
      }

      const user = result.data.user

      if (!user) {
        throw new Error('没有读取到登录用户，请刷新页面后重试。')
      }

      const nextProfile = await ensureProfile(user.id, loginEmail)
      await refresh()

      setNotice({
        type: 'success',
        title: mode === 'login' ? '登录成功' : '注册成功',
        message: nextProfile?.role === 'admin' || nextProfile?.role === 'founder' ? '正在进入问云小院，后台入口也会为你打开。' : '正在进入问云小院。'
      })

      // 这里登录成功后统一进入小院，管理员仍可从小院或直接地址进入管理后台。
      navigate('/yard')
    } catch (error) {
      // 这里捕获认证异常，给出中文提示。
      const message = translateSupabaseAuthError(error)
      setNotice({ type: 'error', title: '操作失败', message })
    } finally {
      setSubmitting(false)
    }
  }

  // 这个函数发送找回密码邮件，入参是表单事件，返回值为空。
  async function handleRecoverySubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    // 这里处理未配置 Supabase 的情况，避免用户误以为可以发送邮件。
    if (!supabase) {
      setNotice({
        type: 'error',
        title: '问云小院暂未启用',
        message: '请先配置 Supabase 后再使用找回密码功能。'
      })
      return
    }

    // 这里清理邮箱并做基础格式校验。
    const emailValue = recoveryEmail.trim().toLowerCase()

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailValue)) {
      setNotice({ type: 'error', title: '邮箱格式不对', message: '请填写已经绑定到账号上的真实邮箱。' })
      return
    }

    // 这里禁止填写旧编号内部邮箱，找回密码只能发到真实绑定邮箱。
    if (emailValue.endsWith('@wenyun.local')) {
      setNotice({ type: 'error', title: '不能使用内部邮箱', message: '请填写你在问云小院绑定过的真实邮箱。' })
      return
    }

    try {
      setSubmitting(true)
      // 这里调用 Supabase 找回密码邮件，回跳地址使用根路径参数以兼容 GitHub Pages 哈希路由。
      const { error } = await supabase.auth.resetPasswordForEmail(emailValue, {
        redirectTo: getPasswordRecoveryRedirectUrl()
      })

      if (error) {
        throw error
      }

      setNotice({
        type: 'success',
        title: '重置邮件已发送',
        message: '如果这个邮箱已经绑定到问云账号，稍后会收到重置密码邮件。请从邮件链接回到网站设置新密码。'
      })
    } catch (error) {
      // 这里捕获邮件发送异常，常见原因是 Supabase 邮件设置或频率限制。
      setNotice({ type: 'error', title: '发送失败', message: translateSupabaseAuthError(error) })
    } finally {
      setSubmitting(false)
    }
  }

  // 这个函数保存找回密码后的新密码，入参是表单事件，返回值为空。
  async function handleResetSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    // 这里处理未配置 Supabase 的情况，避免空客户端报错。
    if (!supabase) {
      setNotice({ type: 'error', title: '问云小院暂未启用', message: '请先配置 Supabase 后再重置密码。' })
      return
    }

    // 这里只要求密码不为空，不再限制最少位数。
    if (!newPassword) {
      setNotice({ type: 'error', title: '请填写新密码', message: '新密码不能为空。' })
      return
    }

    // 这里检查两次输入是否一致，避免手误。
    if (newPassword !== confirmPassword) {
      setNotice({ type: 'error', title: '两次密码不一致', message: '请重新输入并确认新密码。' })
      return
    }

    try {
      setSubmitting(true)
      // 这里确认恢复链接已经让浏览器拿到临时会话，没有会话就不能重置密码。
      const {
        data: { user },
        error: userError
      } = await supabase.auth.getUser()

      if (userError) {
        throw userError
      }

      if (!user) {
        throw new Error('找回密码链接已失效，请重新发送重置邮件。')
      }

      // 这里调用 Supabase 更新当前恢复会话的密码，成功后即可用新密码登录。
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      })

      if (error) {
        throw error
      }

      await refresh()
      setNotice({ type: 'success', title: '密码已重置', message: '新密码已生效，正在进入问云小院。' })
      navigate('/yard')
    } catch (error) {
      // 这里捕获恢复链接过期、密码不合规等异常并转成中文提示。
      setNotice({ type: 'error', title: '重置失败', message: translateSupabaseAuthError(error) })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <PageShell size="narrow">
      <SectionTitle center eyebrow="问云小院" title="一封邮箱，入一方小院">
        同门可在小院查看自己的名帖、云灯、雅集与提醒。掌门和执事也有自己的小院，并可从小院进入管理后台。
      </SectionTitle>

      <ScrollPanel className="relative overflow-hidden seal-mark-bg">
        {/* 这里展示小院插画，让登录入口更像进入自己的院门。 */}
        <img className="mb-6 max-h-64 w-full rounded-[1.25rem] object-cover" src={courtyardIllustrationPath} alt="问云派问云小院插画" />
        <div className="pointer-events-none absolute right-6 top-6 h-28 w-28 rounded-full border border-[#c9a45c]/30 bg-[#edf3ef]/70" />
        {stateMessage ? <StatusNotice title="访问提示" message={stateMessage} /> : null}
        {notice ? <StatusNotice type={notice.type} title={notice.title} message={notice.message} /> : null}

        <div className="mt-6 grid grid-cols-2 rounded-full bg-[#edf3ef] p-1">
          <button
            className={`rounded-full px-4 py-2 text-sm ${mode === 'login' ? 'bg-[#143044] !text-white shadow-md shadow-[#143044]/12' : 'text-[#263238]'}`}
            onClick={() => setMode('login')}
            type="button"
          >
            登录
          </button>
          <button
            className={`rounded-full px-4 py-2 text-sm ${mode === 'signup' ? 'bg-[#143044] !text-white shadow-md shadow-[#143044]/12' : 'text-[#263238]'}`}
            onClick={() => setMode('signup')}
            type="button"
          >
            注册账号
          </button>
        </div>

        {mode === 'forgot' ? (
          <form className="mt-6 grid gap-5" onSubmit={handleRecoverySubmit}>
            <label className="grid gap-2">
              <span className="text-sm font-semibold">已绑定邮箱</span>
              <input
                className="rounded-xl border border-[#6f8f8b]/25 bg-white/80 px-4 py-3 outline-none focus:border-[#6f8f8b]"
                onChange={(event) => setRecoveryEmail(event.target.value)}
                placeholder="填写你绑定到账号上的真实邮箱"
                type="email"
                value={recoveryEmail}
              />
            </label>
            <CloudButton disabled={submitting} type="submit" variant="seal">
              {submitting ? '正在发送...' : '发送重置密码邮件'}
            </CloudButton>
            <button className="text-sm font-semibold text-[#6f8f8b]" onClick={() => setMode('login')} type="button">
              想起来了，返回登录
            </button>
          </form>
        ) : null}

        {mode === 'reset' ? (
          <form className="mt-6 grid gap-5" onSubmit={handleResetSubmit}>
            <label className="grid gap-2">
              <span className="text-sm font-semibold">新密码</span>
              <input
                autoComplete="new-password"
                className="rounded-xl border border-[#6f8f8b]/25 bg-white/80 px-4 py-3 outline-none focus:border-[#6f8f8b]"
                onChange={(event) => setNewPassword(event.target.value)}
                placeholder="输入新的登录密码"
                type="password"
                value={newPassword}
              />
            </label>
            <label className="grid gap-2">
              <span className="text-sm font-semibold">确认新密码</span>
              <input
                autoComplete="new-password"
                className="rounded-xl border border-[#6f8f8b]/25 bg-white/80 px-4 py-3 outline-none focus:border-[#6f8f8b]"
                onChange={(event) => setConfirmPassword(event.target.value)}
                placeholder="再输入一次新密码"
                type="password"
                value={confirmPassword}
              />
            </label>
            <CloudButton disabled={submitting} type="submit" variant="seal">
              {submitting ? '正在重置...' : '确认重置密码'}
            </CloudButton>
            <button className="text-sm font-semibold text-[#6f8f8b]" onClick={() => setMode('forgot')} type="button">
              链接失效，重新发送邮件
            </button>
          </form>
        ) : null}

        {mode === 'login' || mode === 'signup' ? (
          <form className="mt-6 grid gap-5" onSubmit={handleSubmit}>
            <label className="grid gap-2">
              <span className="text-sm font-semibold">邮箱或编号</span>
              <input
                className="rounded-xl border border-[#6f8f8b]/25 bg-white/80 px-4 py-3 outline-none focus:border-[#6f8f8b]"
                onChange={(event) => setEmail(event.target.value)}
                placeholder="新用户填邮箱，旧名册可填 001"
                type="text"
                value={email}
              />
            </label>
            <label className="grid gap-2">
              <span className="text-sm font-semibold">密码</span>
              <input
                className="rounded-xl border border-[#6f8f8b]/25 bg-white/80 px-4 py-3 outline-none focus:border-[#6f8f8b]"
                onChange={(event) => setPassword(event.target.value)}
                placeholder="邮箱密码或旧名册生日密码"
                type="password"
                value={password}
              />
            </label>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <CloudButton disabled={submitting} type="submit" variant="seal">
                {submitting ? '正在处理...' : mode === 'login' ? '进入问云小院' : '注册并进入小院'}
              </CloudButton>
              {mode === 'login' ? (
                <button className="text-sm font-semibold text-[#6f8f8b]" onClick={() => setMode('forgot')} type="button">
                  忘记密码，用绑定邮箱找回
                </button>
              ) : null}
            </div>
          </form>
        ) : null}

        <div className="mt-6 rounded-xl border border-[#c9a45c]/35 bg-white/60 p-4 text-sm leading-7 text-[#526461]">
          新用户按“邮箱 + 密码”直接注册登录；旧名册同门可用 001 这类短编号登录，密码优先使用出生年份，没有年份时使用短编号本身。001 已绑定超级管理员邮箱，需使用该邮箱账号当前密码。请在 Supabase 后台关闭邮箱确认，否则注册后会被 Supabase 拦住。
        </div>
      </ScrollPanel>
    </PageShell>
  )
}
