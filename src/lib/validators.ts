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

// 这个函数判断道名是否符合问云名册规则，入参是道名，返回值表示是否为“云”字开头且 2 到 3 个字。
export function isValidDaoName(value: string): boolean {
  // 这里按汉字字符数量计算，避免中文被错误按字节长度处理。
  const letters = Array.from(cleanText(value))

  return letters.length >= 2 && letters.length <= 3 && letters[0] === '云'
}

// 这个函数生成下一个名册编号，入参是已有编号和辈分字，返回值是新的问云编号。
export function createNextMemberCode(existingCodes: Array<string | null | undefined>, generationName = '云'): string {
  // 这里清理辈分字，只取第一个字，避免编号过长或为空。
  const generation = Array.from(cleanText(generationName))[0] ?? '云'
  // 这里拼出编号前缀，后续只统计同一辈分字下的编号。
  const prefix = `问云-${generation}-`
  // 这里找出已有最大编号，非标准编号会自动跳过。
  const maxNumber = existingCodes.reduce((currentMax, code) => {
    // 这里跳过空编号和不同辈分字的编号。
    if (!code?.startsWith(prefix)) {
      return currentMax
    }

    // 这里读取编号末尾数字，读取失败时按 0 处理。
    const numberPart = Number(code.slice(prefix.length))

    return Number.isFinite(numberPart) ? Math.max(currentMax, numberPart) : currentMax
  }, 0)

  // 这里把数字补足三位，生成统一的问云编号。
  return `${prefix}${String(maxNumber + 1).padStart(3, '0')}`
}

// 这个函数校验名册登记，入参是表单数据，返回值是中文错误列表。
export function validateJoinApplication(input: JoinApplicationInput): string[] {
  // 这个数组收集所有错误，方便一次性告诉用户哪里需要修改。
  const errors: string[] = []

  // 这里检查道名，避免后台收到无法辨认的空登记。
  if (!isValidDaoName(input.nickname)) {
    errors.push('道名需以“云”字开头，长度为 2 到 3 个字。')
  }

  // 这里检查微信号，因为执事需要靠它联系申请人。
  if (!cleanText(input.wechat_id)) {
    errors.push('请填写微信号，方便执事联系。')
  }

  // 这里检查真实姓名，真实姓名只进入后台，用于管理员核对名帖。
  if (!cleanText(input.real_name)) {
    errors.push('请填写真实姓名，真实姓名不会在前台公开。')
  }

  // 这里检查性别选择，避免名册字段为空。
  if (!input.gender) {
    errors.push('请选择性别。')
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
