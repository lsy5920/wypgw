// 这个类型列出 Supabase 需要的公开配置名称，入参来自构建环境或线上运行配置，返回值用于限制配置键名。
type SupabaseEnvName = 'VITE_SUPABASE_URL' | 'VITE_SUPABASE_ANON_KEY'

// 这个接口描述线上运行时配置，入参来自 public/env.js，返回值用于浏览器启动时读取公开配置。
interface WenyunRuntimeEnv {
  // 这里保存 Supabase 项目地址。
  VITE_SUPABASE_URL?: string
  // 这里保存 Supabase 公开匿名密钥。
  VITE_SUPABASE_ANON_KEY?: string
}

declare global {
  // 这个接口扩展浏览器窗口对象，入参来自 env.js，返回值让 TypeScript 认识自定义配置字段。
  interface Window {
    // 这里保存部署时写入的公开配置，未部署或未配置时可以为空。
    __WENYUN_ENV__?: WenyunRuntimeEnv
  }
}

// 这个常量保存构建时注入的 Supabase 配置，入参来自 Vite 环境变量，返回值是可能为空的键值表。
const buildTimeEnv: Record<SupabaseEnvName, string | undefined> = {
  VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
  VITE_SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY
}

// 这个函数清洗环境变量值，入参是任意来源的配置值，返回值是去掉空格后的字符串。
function cleanEnvValue(value: unknown): string {
  // 这里排除非字符串内容，避免对象、数字或空值被当成真实配置。
  if (typeof value !== 'string') {
    return ''
  }

  return value.trim()
}

// 这个函数读取线上运行时配置，入参是配置名称，返回值是 env.js 中写入的字符串或空值。
function readRuntimeEnvValue(name: SupabaseEnvName): string {
  try {
    // 这里兼容构建阶段和测试阶段，避免没有 window 时访问浏览器对象报错。
    if (typeof window === 'undefined') {
      return ''
    }

    return cleanEnvValue(window.__WENYUN_ENV__?.[name])
  } catch {
    // 这里兜底处理浏览器安全限制或脚本异常，读取失败时继续使用构建时配置。
    return ''
  }
}

// 这个函数读取构建时配置，入参是配置名称，返回值是 Vite 编译时注入的字符串或空值。
function readBuildEnvValue(name: SupabaseEnvName): string {
  return cleanEnvValue(buildTimeEnv[name])
}

// 这个函数合并读取 Supabase 配置，入参是配置名称，返回值优先使用线上运行时配置，其次使用构建时配置。
function readSupabaseEnvValue(name: SupabaseEnvName): string {
  // 这里优先读取 GitHub Pages 部署后生成的 env.js，便于静态站线上排查和修复。
  const runtimeValue = readRuntimeEnvValue(name)

  // 这里运行时配置为空时退回 Vite 构建变量，保证本地 .env.local 仍然正常生效。
  return runtimeValue || readBuildEnvValue(name)
}

// 这个常量保存 Supabase 项目地址，入参来自运行时配置或 Vite 环境变量，返回值是字符串或空值。
export const supabaseUrl = readSupabaseEnvValue('VITE_SUPABASE_URL')

// 这个常量保存 Supabase 公开匿名密钥，入参来自运行时配置或 Vite 环境变量，返回值是字符串或空值。
export const supabaseAnonKey = readSupabaseEnvValue('VITE_SUPABASE_ANON_KEY')

// 这个函数用于判断 Supabase 是否已经配置完整，入参为空，返回值表示是否能连接真实数据库。
export function isSupabaseConfigured(): boolean {
  // 这里排除示例占位文字，避免小白复制 .env.example 后误以为已经连上数据库。
  const hasRealUrl = supabaseUrl.startsWith('https://') && supabaseUrl.includes('.supabase.co')
  // 这里检查密钥长度，避免空字符串或中文占位符被当成真实密钥。
  const hasRealKey = supabaseAnonKey.length > 40 && !supabaseAnonKey.includes('请填写')

  return hasRealUrl && hasRealKey
}
