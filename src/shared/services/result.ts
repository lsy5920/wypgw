import type { ApiResult } from '../../lib/types'
import { databaseClient, supabaseReady } from './supabase'

// 这个函数统一生成成功结果，入参是数据和提示，返回值是标准接口结果。
export function okResult<T>(data: T, message = '操作成功。'): ApiResult<T> {
  return { ok: true, data, message, demoMode: !supabaseReady }
}

// 这个函数统一生成失败结果，入参是兜底数据和错误说明，返回值是标准接口结果。
export function failResult<T>(data: T, message: string): ApiResult<T> {
  return { ok: false, data, message, demoMode: !supabaseReady }
}

// 这个函数把未知异常转换为中文说明，入参是异常对象和兜底文案，返回值是可展示给用户的文字。
export function getErrorMessage(error: unknown, fallback: string): string {
  // 这里处理标准 Error 对象，优先展示真实错误信息。
  if (error instanceof Error && error.message) {
    return `${fallback}：${error.message}`
  }

  // 这里兼容 Supabase 返回的普通对象，避免只显示笼统失败原因。
  if (typeof error === 'object' && error !== null && 'message' in error) {
    const message = String((error as { message?: unknown }).message ?? '').trim()

    if (message) {
      return `${fallback}：${message}`
    }
  }

  return fallback
}

// 这个函数读取当前登录用户，入参为空，返回值是 Supabase 用户或空值。
export async function getCurrentUser() {
  // 这里演示模式没有真实认证用户，直接返回空值。
  if (!databaseClient) {
    return null
  }

  const {
    data: { user },
    error
  } = await databaseClient.auth.getUser()

  if (error) {
    throw error
  }

  return user
}

// 这个函数要求当前用户必须登录，入参为空，返回值是当前用户。
export async function requireCurrentUser() {
  const user = await getCurrentUser()

  // 这里统一给未登录场景返回中文错误，方便页面引导进入小院。
  if (!user) {
    throw new Error('请先登录问云小院，再继续操作。')
  }

  return user
}
