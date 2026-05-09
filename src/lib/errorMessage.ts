// 这个函数把未知异常转换成中文提示，入参是任何错误对象，返回值是可直接展示给用户的说明文字。
export function getFriendlyErrorMessage(error: unknown): string {
  // 这里优先读取标准错误里的 message，方便定位真实失败原因。
  if (error instanceof Error && error.message.trim()) {
    return error.message
  }

  // 这里处理服务层偶尔抛出的字符串错误，避免页面显示空白。
  if (typeof error === 'string' && error.trim()) {
    return error
  }

  // 这里兜底给出通用说明，保证长期运行时即使遇到未知异常也有可理解提示。
  return '页面遇到未知问题，请稍后刷新重试。'
}
