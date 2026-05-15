import type { CloudLanternInput, JoinApplicationInput } from '../../lib/types'

// 这个函数判断出生年份是否可用，入参是用户填写的年份，返回值表示是否通过基础校验。
export function isValidBirthYear(value: string): boolean {
  // 这里允许不填写出生年份，避免强制收集不必要隐私。
  if (!value.trim()) {
    return true
  }

  // 这里只接受四位年份，避免月日或其他内容进入字段。
  if (!/^\d{4}$/.test(value.trim())) {
    return false
  }

  // 这里限制合理年份范围，避免明显误填。
  const year = Number(value.trim())

  return year >= 1900 && year <= new Date().getFullYear()
}

// 这个函数判断道名是否符合问云派规则，入参是道名，返回值表示是否有效。
export function isValidDaoName(value: string): boolean {
  // 这里要求以“云”字开头，长度为 2 到 3 个汉字。
  return /^云[\u4e00-\u9fa5]{1,2}$/.test(value.trim())
}

// 这个函数生成下一个名册编号，入参是已有编号和辈分字，返回值是新的编号。
export function createNextMemberCode(existingCodes: Array<string | null>, generationName: string): string {
  // 这里从已有编号里提取同辈分的数字，避免不同辈分互相占号。
  const numbers = existingCodes
    .map((code) => code?.match(new RegExp(`问云-${generationName}-(\\d{3,})`))?.[1])
    .filter(Boolean)
    .map((value) => Number(value))

  // 这里没有旧编号时从 001 开始。
  const nextNumber = numbers.length > 0 ? Math.max(...numbers) + 1 : 1

  return `问云-${generationName}-${String(nextNumber).padStart(3, '0')}`
}

// 这个函数生成公告地址别名，入参是标题，返回值是可用于数据库 slug 的短文本。
export function createSlug(title: string): string {
  // 这里先把标题转成小写并提取可读字符，中文标题统一加 wenyun 前缀保证不为空。
  const basicSlug = title
    .trim()
    .toLowerCase()
    .replace(/[^\w\u4e00-\u9fa5]+/g, '-')
    .replace(/^-+|-+$/g, '')

  return basicSlug ? `wenyun-${basicSlug}` : `wenyun-${Date.now()}`
}

// 这个函数校验云灯留言表单，入参是表单内容，返回值是中文错误列表。
export function validateCloudLantern(input: CloudLanternInput): string[] {
  // 这个数组收集所有错误，方便一次性提示用户。
  const errors: string[] = []

  // 这里要求留言正文不能太短，避免空灯进入审核。
  if (input.content.trim().length < 2) {
    errors.push('云灯留言至少写两个字。')
  }

  // 这里限制内容长度，避免过长文本影响审核和展示。
  if (input.content.trim().length > 260) {
    errors.push('云灯留言请控制在 260 字以内。')
  }

  // 这里非匿名时要求有署名，避免页面显示空作者。
  if (!input.is_anonymous && !input.author_name.trim()) {
    errors.push('非匿名展示时请填写署名。')
  }

  return errors
}

// 这个函数校验名帖登记表单，入参是表单内容，返回值是中文错误列表。
export function validateJoinApplication(input: JoinApplicationInput): string[] {
  // 这个数组收集名帖表单错误。
  const errors: string[] = []

  // 这里校验道名规则，确保公开名册整齐。
  if (!isValidDaoName(input.nickname)) {
    errors.push('道名需以“云”开头，长度为 2 到 3 个汉字。')
  }

  // 这里真实姓名只进后台核对，但仍需要填写。
  if (!input.real_name.trim()) {
    errors.push('请填写真实姓名，真实姓名不会公开。')
  }

  // 这里联系方式用于后台联系和账号排查。
  if (!input.wechat_id.trim() && !input.legacy_contact.trim()) {
    errors.push('请填写微信号或其他联系方式。')
  }

  // 这里校验出生年份格式。
  if (!isValidBirthYear(input.age_range)) {
    errors.push('出生年份请填写四位年份，例如 2003。')
  }

  // 这里宣言是公开名册的重要内容，不能留空。
  if (!input.motto.trim()) {
    errors.push('请填写一句入派宣言。')
  }

  // 这里必须确认金典和规则。
  if (!input.accept_rules) {
    errors.push('请先确认已经阅读并认同立派金典。')
  }

  return errors
}
