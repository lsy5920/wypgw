import { useCallback, useEffect, useState } from 'react'
import type { User } from '@supabase/supabase-js'
import { supabase } from '../lib/supabaseClient'
import type { Profile } from '../lib/types'

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
    // 这里处理未配置 Supabase 的情况，避免调用空客户端报错。
    if (!supabase) {
      setUser(null)
      setProfile(null)
      setLoading(false)
      setMessage('当前未配置 Supabase，后台登录需要先填写环境变量。')
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

      // 这里读取 profiles 表中的角色，用于后台权限判断。
      const { data, error } = await supabase.from('profiles').select('*').eq('id', currentUser.id).maybeSingle()

      if (error) {
        throw error
      }

      setProfile((data as Profile | null) ?? null)
      setMessage(data ? '登录状态已读取。' : '已登录，但尚未找到资料，请检查 profiles 表触发器。')
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
