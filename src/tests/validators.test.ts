import { describe, expect, it } from 'vitest'
import { parseCanonSections } from '../pages/CanonPage'
import { canonText } from '../data/siteContent'
import { isEmailNotConfirmedError, translateSupabaseAuthError } from '../lib/authMessages'
import { createNextMemberCode, createSlug, isValidBirthYear, isValidDaoName, validateCloudLantern, validateJoinApplication } from '../lib/validators'

// 这里测试基础校验逻辑，确保关键表单不会接受明显无效的数据。
describe('问云派表单校验', () => {
  // 这个用例验证空名册登记会返回错误。
  it('会拦截不完整的名册登记', () => {
    const errors = validateJoinApplication({
      nickname: '',
      jianghu_name: '',
      real_name: '',
      wechat_id: '',
      age_range: '',
      gender: '男',
      city: '',
      member_role: '同门',
      public_region: '',
      motto: '',
      public_story: '',
      tags: '',
      companion_expectation: '',
      legacy_contact: '',
      accept_rules: false,
      offline_interest: '',
      remark: ''
    })

    expect(errors.length).toBeGreaterThan(0)
  })

  // 这个用例验证合格名册登记不会返回错误。
  it('会接受内容完整的名册登记', () => {
    const errors = validateJoinApplication({
      nickname: '云初',
      jianghu_name: '清风客',
      real_name: '林青',
      wechat_id: 'wenyun_test',
      age_range: '1998',
      gender: '女',
      city: '杭州',
      member_role: '同门',
      public_region: '杭州',
      motto: '愿在清净处同行',
      public_story: '喜欢写字、饮茶，也愿意与同门温和交流。',
      tags: '写字、饮茶',
      companion_expectation: '温和真诚',
      legacy_contact: 'wenyun_test',
      accept_rules: true,
      offline_interest: '愿意参加',
      remark: ''
    })

    expect(errors).toHaveLength(0)
  })

  // 这个用例验证出生年份只接受合理的四位年份。
  it('会校验出生年份格式', () => {
    expect(isValidBirthYear('2003')).toBe(true)
    expect(isValidBirthYear('')).toBe(true)
    expect(isValidBirthYear('2003-01')).toBe(false)
    expect(isValidBirthYear('1888')).toBe(false)
  })

  // 这个用例验证空云灯会被拦截。
  it('会拦截空云灯留言', () => {
    const errors = validateCloudLantern({
      author_name: '',
      content: '   ',
      mood: '',
      is_anonymous: true
    })

    expect(errors.length).toBeGreaterThan(0)
  })
})

// 这里测试问云名册规则，确保道名和编号生成稳定。
describe('问云名册规则', () => {
  // 这个用例验证道名必须以云字开头且 2 到 3 个字。
  it('会校验道名格式', () => {
    expect(isValidDaoName('云初')).toBe(true)
    expect(isValidDaoName('云灯月')).toBe(true)
    expect(isValidDaoName('山月')).toBe(false)
    expect(isValidDaoName('云')).toBe(false)
  })

  // 这个用例验证编号会按辈分字顺延。
  it('会生成下一个名册编号', () => {
    const code = createNextMemberCode(['问云-云-001', '问云-云-008', '问云-清-002'], '云')

    expect(code).toBe('问云-云-009')
  })
})

// 这里测试资料解析和工具函数，确保页面依赖的基础内容稳定。
describe('问云派内容工具', () => {
  // 这个用例验证金典资料能被拆出多个章节。
  it('可以把立派金典拆成章节', () => {
    const sections = parseCanonSections(canonText)

    expect(sections.length).toBeGreaterThan(5)
    expect(sections.some((section) => section.title.includes('立派缘起'))).toBe(true)
  })

  // 这个用例验证公告别名不会为空。
  it('可以生成公告别名', () => {
    expect(createSlug('问云派山门初开')).toContain('wenyun')
  })
})

// 这里测试登录错误翻译，确保 Supabase 常见英文错误能给用户中文处理建议。
describe('问云派登录提示', () => {
  // 这个用例验证邮箱未确认错误会被识别。
  it('可以识别邮箱未确认错误', () => {
    const error = new Error('Email not confirmed')

    expect(isEmailNotConfirmedError(error)).toBe(true)
  })

  // 这个用例验证邮箱未确认错误会翻译成中文提示。
  it('可以把邮箱未确认错误翻译成中文', () => {
    const message = translateSupabaseAuthError(new Error('Email not confirmed'))

    expect(message).toContain('关闭邮箱确认')
  })
})
