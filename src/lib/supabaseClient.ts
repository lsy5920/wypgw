import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { isSupabaseConfigured, supabaseAnonKey, supabaseUrl } from './env'

// 这个常量表示当前是否启用真实 Supabase，返回值用于页面展示演示模式提示。
export const supabaseReady = isSupabaseConfigured()

// 这个常量是全站共用的 Supabase 客户端，未配置环境变量时返回空值以进入演示模式。
export const supabase: SupabaseClient | null = supabaseReady
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        // 这里开启本地会话保存，刷新页面后管理员不需要反复登录。
        persistSession: true,
        // 这里开启自动刷新令牌，避免长时间管理后台时登录过期。
        autoRefreshToken: true
      }
    })
  : null
