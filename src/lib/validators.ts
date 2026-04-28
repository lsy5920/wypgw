import type { CloudLanternInput, JoinApplicationInput } from './types'

// 这个函数用于清理普通文本输入，入参是用户填写内容，返回值是去掉前后空格的文字。
export function cleanText(value: string): string {
  return value.trim()
}

// 这个函数用于生成公告地址别名，入参是标题，返回值是适合放入数据库的短字符串。
export function createSlug(title: string): string {
  // 这里把中文标题转换成时间戳兜底，避免中文路由别名在不同环境下编码不一致。
  const timePart = Date.now().toString(36)
  // 这里取标题长度作为补充信息，方便后台粗略识别来源。
  const lengthPart = cleanText(title).length || 1

  return `wenyun-${lengthPart}-${timePart}`
}

// 这个函数校验入派申请，入参是表单数据，返回值是中文错误列表。
export function validateJoinApplication(input: JoinApplicationInput): string[] {
  // 这个数组收集所有错误，方便一次性告诉用户哪里需要修改。
  const errors: string[] = []

  // 这里检查昵称，避免后台收到无法辨认的空申请。
  if (!cleanText(input.nickname)) {
    errors.push('请填写你的昵称。')
  }

  // 这里检查微信号，因为执事需要靠它联系申请人。
  if (!cleanText(input.wechat_id)) {
    errors.push('请填写微信号，方便执事联系。')
  }

  // 这里检查申请理由，避免申请内容过短难以审核。
  if (cleanText(input.reason).length < 10) {
    errors.push('请至少用 10 个字说说为什么想加入问云派。')
  }

  // 这里检查门规确认，确保申请人明确知道问云派的边界。
  if (!input.accept_rules) {
    errors.push('请先确认你认同问云派门规。')
  }

  return errors
}

// 这个函数校验云灯留言，入参是留言数据，返回值是中文错误列表。
export function validateCloudLantern(input: CloudLanternInput): string[] {
  // 这个数组收集所有错误，方便表单统一展示。
  const errors: string[] = []
  // 这里清理留言内容，避免纯空格被当成有效留言。
  const content = cleanText(input.content)

  // 这里检查留言是否为空。
  if (!content) {
    errors.push('请写下你想点亮的云灯内容。')
  }

  // 这里限制留言长度，避免过长内容影响页面阅读和审核。
  if (content.length > 260) {
    errors.push('云灯留言请控制在 260 个字以内。')
  }

  return errors
}
