import { useEffect, useState } from 'react'
import { mockApplications, mockProfile } from '../../data/mockData'
import type { Profile } from '../../lib/types'
import { databaseClient } from './supabase'
import { failResult, getErrorMessage, okResult } from './result'

// 这个类型描述登录页支持的账号模式，入参来自登录表单，返回值用于决定账号转换方式。
export type LoginAccountKind = 'email' | 'legacy'

// 这个接口描述登录提交内容，入参来自登录表单，返回值用于 Supabase 认证。
export interface AuthCredentialInput {
  // 用户输入的邮箱或旧编号。
  account: string
  // 用户输入的密码。
  password: string
  // 当前账号类型。
  kind: LoginAccountKind
}

// 这个接口描述认证状态，入参来自 Supabase 会话，返回值用于页面权限判断。
export interface AuthState {
  // 当前用户资料，未登录时为空。
  profile: Profile | null
  // 当前是否正在读取认证状态。
  loading: boolean
  // 刷新资料的方法。
  refresh: () => Promise<void>
  // 退出登录的方法。
  signOut: () => Promise<void>
}

// 这个函数判断资料是否有后台权限，入参是资料或空值，返回值表示是否可进后台。
export function isAdminProfile(profile: Profile | null): boolean {
  return profile?.role === 'admin' || profile?.role === 'founder'
}

// 这个函数判断输入是否为旧编号账号，入参是账号文本，返回值表示是否需要转换成内部邮箱。
export function isLegacyRosterAccount(account: string): boolean {
  return Boolean(account.trim()) && !account.includes('@')
}

// 这个函数把旧编号账号转换为 Supabase 登录邮箱，入参是用户输入，返回值是真正提交给认证接口的账号。
export function normalizeLoginAccount(account: string): string {
  // 这里先清理空格，避免输入法带入空白。
  const value = account.trim()

  if (value.includes('@')) {
    return value.toLowerCase()
  }

  // 这里兼容 001、1、问云-云-001 等旧编号写法。
  const fullCodeMatch = value.match(/(\d{1,6})$/)
  const numberPart = fullCodeMatch ? fullCodeMatch[1] : value
  const normalizedNumber = numberPart.replace(/\D/g, '').padStart(3, '0')

  // 这里保留创始账号的历史绑定规则。
  if (normalizedNumber === '001') {
    return '3199912548@qq.com'
  }

  return `${normalizedNumber}@wenyun.local`
}

// 这个函数把 Supabase 认证错误翻译成中文，入参是未知错误，返回值是用户能看懂的说明。
export function translateAuthError(error: unknown): string {
  const rawMessage = error instanceof Error ? error.message : typeof error === 'object' && error !== null && 'message' in error ? String((error as { message?: unknown }).message ?? '') : ''
  const lowerMessage = rawMessage.toLowerCase()

  if (lowerMessage.includes('email not confirmed')) {
    return '邮箱还没有确认。若这是本项目自用站点，请到 Supabase 后台关闭邮箱确认，或手动确认该用户。'
  }

  if (lowerMessage.includes('invalid login credentials')) {
    return '账号或密码不正确。旧编号账号请确认编号和初始密码是否正确。'
  }

  if (lowerMessage.includes('user already registered')) {
    return '这个邮箱已经注册过，请直接登录或使用找回密码。'
  }

  return rawMessage || '认证操作失败，请稍后重试。'
}

// 这个函数生成找回密码回跳地址，入参为空，返回值是当前站点登录页地址。
export function getPasswordRecoveryRedirectUrl(): string {
  try {
    // 这里兼容 HashRouter，把找回密码统一带回登录页。
    const origin = window.location.origin
    const pathname = window.location.pathname

    return `${origin}${pathname}#/login?mode=reset-password`
  } catch {
    // 这里兜底处理非浏览器环境。
    return '/#/login?mode=reset-password'
  }
}

// 这个函数用邮箱生成默认昵称，入参是邮箱，返回值是邮箱前缀或兜底昵称。
function createDefaultNickname(email: string): string {
  return email.split('@')[0] || '问云同门'
}

// 这个函数把资料和名帖合并，入参是资料，返回值是以名帖为准的资料。
function mergeProfileWithRoster(profile: Profile): Profile {
  // 这里演示模式用第一张正式名帖覆盖展示昵称和城市。
  const application = mockApplications.find((item) => ['approved', 'contacted'].includes(item.status))

  if (!application) {
    return profile
  }

  return {
    ...profile,
    nickname: application.nickname || profile.nickname,
    city: application.public_region ?? application.city ?? profile.city
  }
}

// 这个函数创建本机演示资料，入参是基础资料，返回值是按当前路径补足权限后的资料。
function createDemoProfile(profile: Profile): Profile {
  try {
    // 这里让本机无数据库预览后台时拥有执事权限，真实数据库环境不会走到这里。
    const hashText = typeof window === 'undefined' ? '' : window.location.hash
    const role = hashText.startsWith('#/admin') ? 'founder' : profile.role

    return { ...mergeProfileWithRoster(profile), role }
  } catch {
    // 这里兜底处理非浏览器环境，避免测试时读取 window 报错。
    return mergeProfileWithRoster(profile)
  }
}

// 这个函数确保登录用户有资料行，入参是用户编号和邮箱，返回值是资料或空值。
async function ensureProfile(userId: string, email: string): Promise<Profile | null> {
  if (!databaseClient) {
    return createDemoProfile(mockProfile)
  }

  // 这里先读取现有资料，避免重复插入。
  const { data: existing, error: readError } = await databaseClient.from('profiles').select('*').eq('id', userId).maybeSingle()

  if (readError) {
    throw readError
  }

  if (existing) {
    return existing as Profile
  }

  // 这里补建资料，防止数据库触发器没有及时创建资料。
  const { data, error } = await databaseClient
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

// 这个函数读取当前登录资料，入参为空，返回值是资料或空值。
export async function readCurrentProfile(): Promise<Profile | null> {
  // 这里演示模式直接提供一份可用资料，方便本机预览小院和后台。
  if (!databaseClient) {
    return createDemoProfile(mockProfile)
  }

  const {
    data: { user },
    error: userError
  } = await databaseClient.auth.getUser()

  if (userError) {
    throw userError
  }

  if (!user) {
    return null
  }

  const { data, error } = await databaseClient.from('profiles').select('*').eq('id', user.id).maybeSingle()

  if (error) {
    throw error
  }

  return (data as Profile | null) ?? (await ensureProfile(user.id, user.email ?? ''))
}

// 这个函数登录账号，入参是账号、密码和账号类型，返回值是登录后的资料。
export async function signInWithAccount(input: AuthCredentialInput) {
  if (!databaseClient) {
    return okResult(createDemoProfile(mockProfile), '演示模式下已进入问云小院。')
  }

  try {
    // 这里统一把旧编号转成内部邮箱后再交给 Supabase。
    const account = input.kind === 'legacy' ? normalizeLoginAccount(input.account) : input.account.trim().toLowerCase()
    const { data, error } = await databaseClient.auth.signInWithPassword({
      email: account,
      password: input.password
    })

    if (error) {
      throw error
    }

    const user = data.user

    if (!user) {
      throw new Error('没有读取到登录用户，请刷新页面后重试。')
    }

    const profile = await ensureProfile(user.id, account)

    return okResult(profile, '登录成功，正在进入问云小院。')
  } catch (error) {
    return failResult(null, translateAuthError(error))
  }
}

// 这个函数注册新账号，入参是邮箱和密码，返回值是注册后的资料。
export async function signUpWithEmail(input: AuthCredentialInput) {
  if (!databaseClient) {
    return okResult(createDemoProfile(mockProfile), '演示模式下已模拟注册。')
  }

  try {
    if (isLegacyRosterAccount(input.account)) {
      throw new Error('旧编号不能直接注册，请用邮箱注册新账号。')
    }

    const email = input.account.trim().toLowerCase()
    const { data, error } = await databaseClient.auth.signUp({
      email,
      password: input.password,
      options: {
        data: { nickname: createDefaultNickname(email) }
      }
    })

    if (error) {
      throw error
    }

    if (!data.session) {
      throw new Error('注册被邮箱确认拦住了，请到 Supabase 后台关闭邮箱确认后再注册。')
    }

    const user = data.user

    if (!user) {
      throw new Error('没有读取到注册用户，请刷新页面后重试。')
    }

    const profile = await ensureProfile(user.id, email)

    return okResult(profile, '注册成功，正在进入问云小院。')
  } catch (error) {
    return failResult(null, translateAuthError(error))
  }
}

// 这个函数发送找回密码邮件，入参是邮箱，返回值表示是否发送成功。
export async function sendPasswordRecovery(email: string) {
  if (!databaseClient) {
    return okResult(null, '演示模式下已模拟发送重置邮件。')
  }

  try {
    const cleanEmail = email.trim().toLowerCase()

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail) || cleanEmail.endsWith('@wenyun.local')) {
      throw new Error('请填写已经绑定到账号上的真实邮箱。')
    }

    const { error } = await databaseClient.auth.resetPasswordForEmail(cleanEmail, {
      redirectTo: getPasswordRecoveryRedirectUrl()
    })

    if (error) {
      throw error
    }

    return okResult(null, '如果邮箱已经绑定账号，稍后会收到重置密码邮件。')
  } catch (error) {
    return failResult(null, translateAuthError(error))
  }
}

// 这个函数保存新密码，入参是新密码和确认密码，返回值表示是否成功。
export async function updateRecoveredPassword(newPassword: string, confirmPassword: string) {
  if (!databaseClient) {
    return okResult(null, '演示模式下已模拟重置密码。')
  }

  try {
    if (!newPassword || newPassword !== confirmPassword) {
      throw new Error('新密码不能为空，且两次输入必须一致。')
    }

    const { error } = await databaseClient.auth.updateUser({ password: newPassword })

    if (error) {
      throw error
    }

    return okResult(null, '密码已重置，请使用新密码登录。')
  } catch (error) {
    return failResult(null, translateAuthError(error))
  }
}

// 这个函数订阅认证状态，入参为空，返回值是当前资料、加载状态和操作方法。
export function useAuthState(): AuthState {
  // 这个状态保存当前用户资料。
  const [profile, setProfile] = useState<Profile | null>(null)
  // 这个状态保存读取中标记。
  const [loading, setLoading] = useState(true)

  // 这个函数刷新当前资料，入参为空，返回值为空。
  async function refresh() {
    try {
      const nextProfile = await readCurrentProfile()
      setProfile(nextProfile)
    } catch {
      // 这里读取失败时清空资料，避免错误权限残留。
      setProfile(null)
    } finally {
      setLoading(false)
    }
  }

  // 这个函数退出登录，入参为空，返回值为空。
  async function signOut() {
    if (databaseClient) {
      await databaseClient.auth.signOut()
    }

    setProfile(databaseClient ? null : createDemoProfile(mockProfile))
  }

  useEffect(() => {
    // 这里首次进入页面时读取一次当前资料。
    void refresh()

    if (!databaseClient) {
      return undefined
    }

    // 这里监听 Supabase 认证变化，登录、退出、刷新令牌后自动同步资料。
    const {
      data: { subscription }
    } = databaseClient.auth.onAuthStateChange(() => {
      void refresh()
    })

    return () => subscription.unsubscribe()
  }, [])

  return { profile, loading, refresh, signOut }
}
