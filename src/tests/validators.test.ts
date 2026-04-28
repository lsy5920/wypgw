import { describe, expect, it } from 'vitest'
import { parseCanonSections } from '../pages/CanonPage'
import { canonText } from '../data/siteContent'
import { isEmailNotConfirmedError, translateSupabaseAuthError } from '../lib/authMessages'
import { createSlug, validateCloudLantern, validateJoinApplication } from '../lib/validators'

// 这里测试基础校验逻辑，确保关键表单不会接受明显无效的数据。
describe('问云派表单校验', () => {
  // 这个用例验证空入派申请会返回错误。
  it('会拦截不完整的入派申请', () => {
    const errors = validateJoinApplication({
      nickname: '',
      wechat_id: '',
      age_range: '',
      city: '',
      reason: '太短',
      accept_rules: false,
      offline_interest: '',
      remark: ''
    })

    expect(errors.length).toBeGreaterThan(0)
  })

  // 这个用例验证合格入派申请不会返回错误。
  it('会接受内容完整的入派申请', () => {
    const errors = validateJoinApplication({
      nickname: '云边来客',
      wechat_id: 'wenyun_test',
      age_range: '25-30',
      city: '杭州',
      reason: '我想加入一个真诚温暖、有边界、有分寸的社群。',
      accept_rules: true,
      offline_interest: '愿意参加',
      remark: ''
    })

    expect(errors).toHaveLength(0)
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

    expect(message).toContain('邮箱还没有确认')
  })
})
