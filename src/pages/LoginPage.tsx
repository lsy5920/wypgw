import { FormEvent, useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { CloudButton } from '../components/CloudButton'
import { ScrollPanel } from '../components/ScrollPanel'
import { SectionTitle } from '../components/SectionTitle'
import { StatusNotice } from '../components/StatusNotice'
import { isAdminProfile, useAuth } from '../hooks/useAuth'
import { getAuthRedirectUrl, isEmailNotConfirmedError, translateSupabaseAuthError } from '../lib/authMessages'
import { supabase } from '../lib/supabaseClient'

// 这个类型描述路由传来的状态，入参来自 Navigate，返回值用于显示登录原因。
interface LocationState {
  // 跳转前传来的中文提示。
  message?: string
}

// 这个函数渲染管理员登录页，入参为空，返回值是登录和注册表单。
export function LoginPage() {
  // 这里读取当前认证状态，用于已登录时自动进入后台。
  const { profile, loading } = useAuth()
  // 这个变量用于页面跳转。
  const navigate = useNavigate()
  // 这个变量用于读取后台跳转过来的提示。
  const location = useLocation()
  // 这个状态保存邮箱。
  const [email, setEmail] = useState('')
  // 这个状态保存密码。
  const [password, setPassword] = useState('')
  // 这个状态保存当前是登录还是注册。
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  // 这个状态表示是否正在提交。
  const [submitting, setSubmitting] = useState(false)
  // 这个状态表示是否正在重发确认邮件。
  const [resending, setResending] = useState(false)
  // 这个状态表示当前错误是否允许重发邮箱确认邮件。
  const [canResendConfirmation, setCanResendConfirmation] = useState(false)
  // 这个状态保存表单提示。
  const [notice, setNotice] = useState<{ type: 'success' | 'error' | 'info'; title: string; message: string } | null>(null)
  // 这个变量保存跳转传来的提示。
  const stateMessage = (location.state as LocationState | null)?.message

  // 这里如果已经是管理员，直接进入后台。
  if (!loading && isAdminProfile(profile)) {
    return <Navigate to="/admin" replace />
  }

  // 这个函数处理登录或注册，入参是表单事件，返回值为空。
  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setCanResendConfirmation(false)

    // 这里处理未配置 Supabase 的情况，避免用户误以为可以登录。
    if (!supabase) {
      setNotice({
        type: 'error',
        title: '后台暂未启用',
        message:
          '请先配置 Supabase：本地填写 .env.local；GitHub Pages 部署请在仓库 Actions 密钥中填写 VITE_SUPABASE_URL 和 VITE_SUPABASE_ANON_KEY。'
      })
      return
    }

    // 这里做基础校验，避免空邮箱或短密码提交给 Supabase。
    if (!email.trim() || password.length < 6) {
      setNotice({ type: 'error', title: '请检查账号信息', message: '邮箱不能为空，密码至少 6 位。' })
      return
    }

    try {
      setSubmitting(true)
      // 这里生成邮箱确认后的回跳地址，方便 GitHub Pages 上确认后回到登录页。
      const emailRedirectTo = getAuthRedirectUrl()
      // 这里根据模式调用登录或注册接口。
      const result =
        mode === 'login'
          ? await supabase.auth.signInWithPassword({ email: email.trim(), password })
          : await supabase.auth.signUp({
              email: email.trim(),
              password,
              options: emailRedirectTo ? { emailRedirectTo } : undefined
            })

      if (result.error) {
        throw result.error
      }

      setNotice({
        type: 'success',
        title: mode === 'login' ? '登录成功' : '注册已提交',
        message:
          mode === 'login'
            ? '正在进入后台。若没有权限，请先用 SQL 把 profiles.role 改为 admin 或 founder。'
            : '账号已注册，请打开邮箱点击确认链接；确认完成后再登录后台，并确保 profiles.role 已设为 admin 或 founder。'
      })

      // 这里登录成功后进入后台，后台会再次校验角色。
      if (mode === 'login') {
        navigate('/admin')
      } else {
        setCanResendConfirmation(true)
      }
    } catch (error) {
      // 这里捕获认证异常，给出中文提示。
      const message = translateSupabaseAuthError(error)
      setCanResendConfirmation(isEmailNotConfirmedError(error))
      setNotice({ type: 'error', title: '操作失败', message })
    } finally {
      setSubmitting(false)
    }
  }

  // 这个函数重新发送邮箱确认邮件，入参为空，返回值为空。
  async function handleResendConfirmation() {
    // 这里处理未配置 Supabase 的情况，避免调用空客户端报错。
    if (!supabase) {
      setNotice({
        type: 'error',
        title: '后台暂未启用',
        message:
          '请先配置 Supabase：本地填写 .env.local；GitHub Pages 部署请在仓库 Actions 密钥中填写 VITE_SUPABASE_URL 和 VITE_SUPABASE_ANON_KEY。'
      })
      return
    }

    // 这里检查邮箱是否为空，避免 Supabase 无法知道要给谁发邮件。
    if (!email.trim()) {
      setNotice({ type: 'error', title: '请先填写邮箱', message: '请输入注册时使用的邮箱，再重发确认邮件。' })
      return
    }

    try {
      setResending(true)
      // 这里生成确认邮件点击后的回跳地址，确保线上哈希路由能回到登录页。
      const emailRedirectTo = getAuthRedirectUrl()
      // 这里调用 Supabase 重发注册确认邮件接口。
      const result = await supabase.auth.resend({
        type: 'signup',
        email: email.trim(),
        options: emailRedirectTo ? { emailRedirectTo } : undefined
      })

      if (result.error) {
        throw result.error
      }

      setNotice({
        type: 'success',
        title: '确认邮件已重发',
        message: '请打开注册邮箱查看 Supabase 确认邮件，点击确认链接后再回来登录。'
      })
      setCanResendConfirmation(false)
    } catch (error) {
      // 这里捕获重发邮件异常，避免按钮点击后页面没有反馈。
      setNotice({ type: 'error', title: '重发失败', message: translateSupabaseAuthError(error) })
    } finally {
      setResending(false)
    }
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-14 md:px-6">
      <SectionTitle center eyebrow="后台入口" title="执事入山门">
        后台仅供掌门和执事使用。普通同门即使登录，也无法读取后台数据。
      </SectionTitle>

      <ScrollPanel>
        {stateMessage ? <StatusNotice title="访问提示" message={stateMessage} /> : null}
        {notice ? <StatusNotice type={notice.type} title={notice.title} message={notice.message} /> : null}
        {canResendConfirmation ? (
          <div className="mt-4 flex flex-wrap gap-3">
            <CloudButton disabled={resending} onClick={handleResendConfirmation} variant="ghost">
              {resending ? '正在重发...' : '重发确认邮件'}
            </CloudButton>
          </div>
        ) : null}

        <div className="mt-6 grid grid-cols-2 rounded-full bg-[#edf3ef] p-1">
          <button
            className={`rounded-full px-4 py-2 text-sm ${mode === 'login' ? 'bg-[#6f8f8b] text-white' : 'text-[#526461]'}`}
            onClick={() => setMode('login')}
            type="button"
          >
            登录
          </button>
          <button
            className={`rounded-full px-4 py-2 text-sm ${mode === 'signup' ? 'bg-[#6f8f8b] text-white' : 'text-[#526461]'}`}
            onClick={() => setMode('signup')}
            type="button"
          >
            注册账号
          </button>
        </div>

        <form className="mt-6 grid gap-5" onSubmit={handleSubmit}>
          <label className="grid gap-2">
            <span className="text-sm font-semibold">邮箱</span>
            <input
              className="rounded-xl border border-[#6f8f8b]/25 bg-white/80 px-4 py-3 outline-none focus:border-[#6f8f8b]"
              onChange={(event) => setEmail(event.target.value)}
              placeholder="请输入管理员邮箱"
              type="email"
              value={email}
            />
          </label>
          <label className="grid gap-2">
            <span className="text-sm font-semibold">密码</span>
            <input
              className="rounded-xl border border-[#6f8f8b]/25 bg-white/80 px-4 py-3 outline-none focus:border-[#6f8f8b]"
              onChange={(event) => setPassword(event.target.value)}
              placeholder="至少 6 位"
              type="password"
              value={password}
            />
          </label>
          <CloudButton disabled={submitting} type="submit" variant="seal">
            {submitting ? '正在处理...' : mode === 'login' ? '进入后台' : '注册账号'}
          </CloudButton>
        </form>

        <div className="mt-6 rounded-xl border border-[#c9a45c]/35 bg-white/60 p-4 text-sm leading-7 text-[#526461]">
          管理员初始化方式：先注册账号并完成邮箱确认，再到 Supabase SQL 编辑器中把对应用户的 profiles.role 改为 founder 或 admin。若收不到确认邮件，可执行项目里的 supabase/admin_confirm_founder.sql 手动确认邮箱并授予掌门权限。
        </div>
      </ScrollPanel>
    </main>
  )
}
