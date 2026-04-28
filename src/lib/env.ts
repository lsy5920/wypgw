// 这个常量保存 Supabase 项目地址，入参来自 Vite 环境变量，返回值是字符串或空值。
export const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim() ?? ''

// 这个常量保存 Supabase 公开匿名密钥，入参来自 Vite 环境变量，返回值是字符串或空值。
export const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim() ?? ''

// 这个函数用于判断 Supabase 是否已经配置完整，入参为空，返回值表示是否能连接真实数据库。
export function isSupabaseConfigured(): boolean {
  // 这里排除示例占位文字，避免小白复制 .env.example 后误以为已经连上数据库。
  const hasRealUrl = supabaseUrl.startsWith('https://') && supabaseUrl.includes('.supabase.co')
  // 这里检查密钥长度，避免空字符串或中文占位符被当成真实密钥。
  const hasRealKey = supabaseAnonKey.length > 40 && !supabaseAnonKey.includes('请填写')

  return hasRealUrl && hasRealKey
}
