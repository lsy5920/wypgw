// 这个类型列出 Supabase 公开配置名称，入参来自构建环境或线上 env.js，返回值用于限制读取键名。
type SupabaseEnvName = 'VITE_SUPABASE_URL' | 'VITE_SUPABASE_ANON_KEY'

// 这个接口描述线上运行时配置，入参来自 public/env.js，返回值用于浏览器启动时读取配置。
interface WenyunRuntimeEnv {
  // Supabase 项目地址。
  VITE_SUPABASE_URL?: string
  // Supabase 公开匿名密钥。
  VITE_SUPABASE_ANON_KEY?: string
}

declare global {
  // 这个接口扩展浏览器窗口对象，入参来自 env.js，返回值让 TypeScript 认识运行时配置。
  interface Window {
    // 部署时写入的公开配置。
    __WENYUN_ENV__?: WenyunRuntimeEnv
  }
}

// 这个常量保存构建时注入的 Supabase 配置，返回值是可能为空的配置表。
const buildTimeEnv: Record<SupabaseEnvName, string | undefined> = {
  VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
  VITE_SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY
}

// 这个函数清理配置值，入参是未知来源的值，返回值是去掉空白后的字符串。
function cleanEnvValue(value: unknown): string {
  // 这里排除非字符串内容，避免对象或空值被当成真实配置。
  if (typeof value !== 'string') {
    return ''
  }

  return value.trim()
}

// 这个函数读取运行时配置，入参是配置名称，返回值是 env.js 中的字符串或空值。
function readRuntimeEnvValue(name: SupabaseEnvName): string {
  try {
    // 这里兼容测试环境和构建环境，避免没有 window 时报错。
    if (typeof window === 'undefined') {
      return ''
    }

    return cleanEnvValue(window.__WENYUN_ENV__?.[name])
  } catch {
    // 这里兜底处理浏览器安全限制或脚本异常，失败时继续使用构建配置。
    return ''
  }
}

// 这个函数读取构建时配置，入参是配置名称，返回值是 Vite 编译时注入的字符串或空值。
function readBuildEnvValue(name: SupabaseEnvName): string {
  return cleanEnvValue(buildTimeEnv[name])
}

// 这个函数合并读取 Supabase 配置，入参是配置名称，返回值优先使用运行时配置。
function readSupabaseEnvValue(name: SupabaseEnvName): string {
  // 这里优先读取线上 env.js，方便静态部署后不用重新打包就能改配置。
  const runtimeValue = readRuntimeEnvValue(name)

  return runtimeValue || readBuildEnvValue(name)
}

// 这个常量保存 Supabase 项目地址，返回值为空时进入本地演示模式。
export const supabaseUrl = readSupabaseEnvValue('VITE_SUPABASE_URL')

// 这个常量保存 Supabase 公开匿名密钥，返回值为空时进入本地演示模式。
export const supabaseAnonKey = readSupabaseEnvValue('VITE_SUPABASE_ANON_KEY')

// 这个函数判断 Supabase 是否配置完整，入参为空，返回值表示是否能连接真实数据库。
export function isSupabaseConfigured(): boolean {
  // 这里排除示例占位文字，避免小白复制占位配置后误判为已连接。
  const hasRealUrl = supabaseUrl.startsWith('https://') && supabaseUrl.includes('.supabase.co')
  // 这里检查密钥长度，避免空字符串或中文占位符被当成真实密钥。
  const hasRealKey = supabaseAnonKey.length > 40 && !supabaseAnonKey.includes('请填写')

  return hasRealUrl && hasRealKey
}

// 这个函数判断是否临时启用演示数据，入参为空，返回值表示是否跳过真实 Supabase。
export function isLocalDemoRequested(): boolean {
  try {
    // 这里只允许本机地址启用演示模式，避免线上被参数影响真实登录。
    if (typeof window === 'undefined' || !['localhost', '127.0.0.1'].includes(window.location.hostname)) {
      return false
    }

    // 这里同时检查普通查询参数和哈希路由，兼容当前 HashRouter。
    const searchText = window.location.search.toLowerCase()
    const hashText = window.location.hash.toLowerCase()

    return searchText.includes('demo-yard=1') || hashText.includes('demo-yard=1')
  } catch {
    // 这里兜底处理地址读取异常，异常时不启用演示模式。
    return false
  }
}
