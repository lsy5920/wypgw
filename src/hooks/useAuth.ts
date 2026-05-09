import { useCallback, useEffect, useState } from 'react'
import type { User } from '@supabase/supabase-js'
import { supabase } from '../lib/supabaseClient'
import { fetchMyProfile } from '../lib/services'
import type { Profile } from '../lib/types'
import { mockProfile } from '../data/mockData'

// 这个接口描述认证钩子的返回值，页面通过它判断登录、角色和加载状态。
interface UseAuthResult {
  // 当前 Supabase 用户，未登录时为空。
  user: User | null
  // 当前用户资料，未登录或未建资料时为空。
  profile: Profile | null
  // 是否正在读取登录状态。
  loading: boolean
  // 中文状态提示。
  message: string
  // 重新读取登录与资料信息。
  refresh: () => Promise<void>
  // 退出登录。
  signOut: () => Promise<void>
}

// 这个函数判断资料是否拥有后台权限，入参是资料，返回值表示能否管理后台。
export function isAdminProfile(profile: Profile | null): boolean {
  return profile?.role === 'admin' || profile?.role === 'founder'
}

// 这个函数判断当前是否请求本地小院演示模式，入参为空，返回值表示是否临时使用演示资料。
function shouldUseLocalYardDemo(): boolean {
  try {
    // 这里只允许本机地址使用演示资料，避免线上真实站点被参数绕过登录。
    if (typeof window === 'undefined' || !['localhost', '127.0.0.1'].includes(window.location.hostname)) {
      return false
    }

    // 这里同时支持普通查询参数和哈希里的参数，方便哈希路由页面截图调试。
    const searchText = window.location.search.toLowerCase()
    const hashText = window.location.hash.toLowerCase()

    return searchText.includes('demo-yard=1') || hashText.includes('demo-yard=1')
  } catch {
    // 这里兜底处理浏览器地址读取异常，异常时不启用演示资料。
    return false
  }
}

// 这个函数读取当前登录用户和资料，入参为空，返回值是认证状态对象。
export function useAuth(): UseAuthResult {
  // 这个状态保存 Supabase 用户。
  const [user, setUser] = useState<User | null>(null)
  // 这个状态保存用户资料。
  const [profile, setProfile] = useState<Profile | null>(null)
  // 这个状态表示是否正在加载。
  const [loading, setLoading] = useState(true)
  // 这个状态保存中文提示。
  const [message, setMessage] = useState('')

  // 这个函数负责从 Supabase 读取用户和资料，入参为空，返回值为空。
  const refresh = useCallback(async () => {
    // 这里给本地 UI 复刻和截图验收提供演示资料，不影响真实环境登录。
    if (shouldUseLocalYardDemo()) {
      setUser(null)
      setProfile(mockProfile)
      setLoading(false)
      setMessage('当前为本地问云小院演示资料。')
      return
    }

    // 这里处理未配置 Supabase 的情况，避免调用空客户端报错。
    if (!supabase) {
      setUser(null)
      setProfile(mockProfile)
      setLoading(false)
      setMessage('当前未配置 Supabase，正在使用问云小院演示资料。')
      return
    }

    try {
      setLoading(true)
      // 这里读取当前会话用户，刷新页面后也能恢复登录状态。
      const {
        data: { user: currentUser },
        error: userError
      } = await supabase.auth.getUser()

      if (userError) {
        throw userError
      }

      setUser(currentUser)

      // 这里未登录时直接清空资料。
      if (!currentUser) {
        setProfile(null)
        setMessage('尚未登录。')
        return
      }

      // 这里读取合并后的用户资料，资料中的道名会优先采用名帖里的正式道名。
      const profileResult = await fetchMyProfile()

      if (!profileResult.ok) {
        throw new Error(profileResult.message)
      }

      setProfile(profileResult.data)
      setMessage('登录状态已读取。')
    } catch (error) {
      // 这里捕获认证异常，避免后台页面白屏。
      const errorMessage = error instanceof Error ? error.message : '未知错误'
      setUser(null)
      setProfile(null)
      setMessage(`读取登录状态失败：${errorMessage}`)
    } finally {
      setLoading(false)
    }
  }, [])

  // 这个函数负责退出登录，入参为空，返回值为空。
  const signOut = useCallback(async () => {
    // 这里未配置 Supabase 时只清空本地状态。
    if (!supabase) {
      setUser(null)
      setProfile(null)
      return
    }

    try {
      // 这里调用 Supabase 退出登录接口。
      await supabase.auth.signOut()
    } finally {
      setUser(null)
      setProfile(null)
    }
  }, [])

  useEffect(() => {
    // 这里首次进入页面时读取登录状态。
    void refresh()

    // 这里未配置 Supabase 时无需监听登录变化。
    if (!supabase) {
      return undefined
    }

    // 这里监听登录状态变化，登录或退出后自动刷新资料。
    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange(() => {
      void refresh()
    })

    // 这里卸载监听，避免页面切换后重复触发。
    return () => subscription.unsubscribe()
  }, [refresh])

  return { user, profile, loading, message, refresh, signOut }
}
