import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { isLocalDemoRequested, isSupabaseConfigured, supabaseAnonKey, supabaseUrl } from './env'

// 这个常量表示当前是否使用真实 Supabase，返回值用于服务层切换真实数据和演示数据。
export const supabaseReady = isSupabaseConfigured() && !isLocalDemoRequested()

// 这个常量保存全站唯一 Supabase 客户端，未配置时为空并进入演示模式。
export const supabase: SupabaseClient | null = supabaseReady
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        // 这里保存本地会话，避免刷新页面后反复登录。
        persistSession: true,
        // 这里自动刷新令牌，保证长时间停留后台时会话更稳定。
        autoRefreshToken: true
      }
    })
  : null

// 这个常量把 Supabase 客户端放宽为动态类型，入参来自服务层，返回值用于没有数据库类型生成文件时安全调用表名。
export const databaseClient = supabase as unknown as {
  // 这里用动态函数兼容所有表查询。
  from: (table: string) => any
  // 这里用动态函数兼容数据库安全函数。
  rpc: (name: string, args?: Record<string, unknown>) => Promise<{ data: unknown; error: { message?: string } | null }>
  // 这里保留认证能力。
  auth: NonNullable<SupabaseClient['auth']>
  // 这里保留 Edge Function 能力。
  functions: SupabaseClient['functions']
} | null
