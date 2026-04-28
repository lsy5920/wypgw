// 这个函数判断错误是否为邮箱未确认，入参是任意异常，返回值表示是否需要引导用户确认邮箱。
export function isEmailNotConfirmedError(error: unknown): boolean {
  // 这里把不同来源的错误统一转成小写文字，方便兼容 Supabase 返回的英文提示。
  const message = error instanceof Error ? error.message.toLowerCase() : String(error ?? '').toLowerCase()

  return message.includes('email not confirmed') || message.includes('email_not_confirmed')
}

// 这个函数把 Supabase 英文登录错误翻译成中文，入参是任意异常，返回值是给用户看的中文说明。
export function translateSupabaseAuthError(error: unknown): string {
  // 这里先取出原始错误，后面按常见场景翻译。
  const rawMessage = error instanceof Error ? error.message : String(error ?? '未知错误')
  // 这里统一小写，避免大小写不同导致匹配失败。
  const normalizedMessage = rawMessage.toLowerCase()

  // 这里处理邮箱未确认的场景，本项目要求关闭邮箱确认后直接登录。
  if (isEmailNotConfirmedError(error)) {
    return 'Supabase 仍然开启了邮箱确认，所以暂时不允许直接登录。请到 Supabase 后台关闭邮箱确认：Authentication → Sign In / Providers → 关闭邮箱确认，然后重新注册或登录。'
  }

  // 这里处理账号或密码错误，避免直接显示英文。
  if (normalizedMessage.includes('invalid login credentials')) {
    return '邮箱或密码不正确，请检查后再试。'
  }

  // 这里处理邮箱重复注册，提示用户切回登录。
  if (normalizedMessage.includes('user already registered') || normalizedMessage.includes('already registered')) {
    return '这个邮箱已经注册过，请切换到登录。'
  }

  // 这里处理密码过短或不合规，提示用户改成更稳妥的密码。
  if (normalizedMessage.includes('password')) {
    return `密码不符合 Supabase 要求：${rawMessage}`
  }

  return rawMessage || '操作失败，请稍后再试。'
}

// 这个函数生成 Supabase 邮箱确认后的回跳地址，入参为空，返回值是当前网站根地址。
export function getAuthRedirectUrl(): string {
  try {
    // 这里兼容构建和测试环境，避免没有浏览器窗口对象时报错。
    if (typeof window === 'undefined') {
      return ''
    }

    // 这里保留 GitHub Pages 仓库子路径，并回到站点根地址，避免 Supabase 确认参数和哈希路由互相冲突。
    return `${window.location.origin}${window.location.pathname}`
  } catch {
    // 这里兜底处理极少数浏览器环境异常，返回空值表示使用 Supabase 默认回跳。
    return ''
  }
}
