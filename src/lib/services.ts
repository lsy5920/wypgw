import { supabase, supabaseReady } from './supabaseClient'
import { translateSupabaseAuthError } from './authMessages'
import { createNextMemberCode, createSlug } from './validators'
import {
  mockAnnouncements,
  mockApplications,
  mockEvents,
  mockLanterns,
  mockNotifications,
  mockProfile,
  mockRegistrations,
  mockRosterEntries,
  mockSettings,
  mockSmtpSetting
} from '../data/mockData'
import type {
  AccountSecurityInfo,
  AdminRoleUser,
  AdminUserAccountUpdateInput,
  Announcement,
  ApiResult,
  CloudLantern,
  CloudLanternInput,
  EmailBindInput,
  EventRegistration,
  JoinApplication,
  JoinApplicationInput,
  JoinApplicationStatus,
  JoinApplicationUpdateInput,
  LanternStatus,
  PasswordUpdateInput,
  Profile,
  ProfileUpdateInput,
  RosterProfileUpdateInput,
  StewardManageableRole,
  RosterEntry,
  SiteSetting,
  SmtpSetting,
  SmtpSettingInput,
  UserNotification,
  UserNotificationKind,
  YardEventItem,
  YardOverview,
  EventRegistrationStatus,
  WenyunEvent
} from './types'

// 这个函数统一生成成功结果，入参是数据和提示，返回值是标准接口结果。
function okResult<T>(data: T, message = '操作成功。'): ApiResult<T> {
  return { ok: true, data, message, demoMode: !supabaseReady }
}

// 这个函数统一生成失败结果，入参是兜底数据和错误说明，返回值是标准接口结果。
function failResult<T>(data: T, message: string): ApiResult<T> {
  return { ok: false, data, message, demoMode: !supabaseReady }
}

// 这个函数生成空名帖兜底对象，入参为空，返回值用于接口失败时保持类型稳定。
function createEmptyApplication(): JoinApplication {
  return {
    id: '',
    user_id: null,
    nickname: '',
    jianghu_name: null,
    real_name: null,
    wechat_id: '',
    age_range: null,
    gender: '男',
    city: null,
    reason: '',
    accept_rules: false,
    offline_interest: null,
    remark: null,
    member_role: '同门',
    generation_name: '云',
    member_code: null,
    roster_serial: null,
    public_region: null,
    raw_region: null,
    motto: null,
    public_story: null,
    raw_story: null,
    tags: null,
    companion_expectation: null,
    legacy_contact: null,
    requested_nickname: null,
    requested_legacy_contact: null,
    requested_at: null,
    joined_at: null,
    status: 'pending',
    admin_note: null,
    reviewed_by: null,
    reviewed_at: null,
    created_at: new Date().toISOString()
  }
}

// 这个函数读取当前登录用户，入参为空，返回值是用户对象或空值。
async function getCurrentUser() {
  // 这里处理没有配置 Supabase 的情况，演示模式不需要真实用户。
  if (!supabase) {
    return null
  }

  const {
    data: { user },
    error
  } = await supabase.auth.getUser()

  if (error) {
    throw error
  }

  return user
}

// 这个函数要求用户必须登录，入参为空，返回值是当前用户。
async function requireCurrentUser() {
  const user = await getCurrentUser()

  // 这里统一给未登录场景返回中文错误，方便前台引导进入问云小院。
  if (!user) {
    throw new Error('请先登录问云小院，再继续提交。')
  }

  return user
}

// 这个函数把未知异常转换为中文说明，入参是异常对象，返回值是可展示给用户的文字。
function getErrorMessage(error: unknown, fallback: string): string {
  // 这里处理常见 Error 对象，优先展示真实错误信息。
  if (error instanceof Error && error.message) {
    return `${fallback}：${error.message}`
  }

  // 这里兼容 Supabase 返回的普通对象错误，避免页面只显示笼统失败原因。
  if (typeof error === 'object' && error !== null && 'message' in error) {
    const message = String((error as { message?: unknown }).message ?? '').trim()

    if (message) {
      return `${fallback}：${message}`
    }
  }

  return fallback
}

// 这个函数判断邮箱是否为旧编号内部邮箱，入参是邮箱，返回值表示是否仍需绑定真实邮箱。
function isLegacyInternalEmail(email: string): boolean {
  return email.trim().toLowerCase().endsWith('@wenyun.local')
}

// 这个函数把 Supabase 用户整理成账号安全信息，入参是用户对象，返回值是页面可展示的数据。
function createAccountSecurityInfo(user: Awaited<ReturnType<typeof requireCurrentUser>>): AccountSecurityInfo {
  // 这里取当前邮箱，极少数异常账号没有邮箱时给空字符串兜底。
  const email = user.email ?? ''

  return {
    email,
    is_legacy_email: isLegacyInternalEmail(email),
    pending_email: user.new_email ?? null,
    email_confirmed_at: user.email_confirmed_at ?? null
  }
}

// 这个类型描述绑定邮箱数据库函数的返回值，入参来自 Supabase RPC，返回值用于前端判断成功或失败。
interface BindEmailRpcResponse {
  // 是否绑定成功。
  ok?: boolean
  // 绑定后的真实邮箱。
  email?: string
  // 是否仍为旧编号内部邮箱。
  is_legacy_email?: boolean
  // 待确认邮箱，当前直绑方案通常为空。
  pending_email?: string | null
  // 邮箱确认时间。
  email_confirmed_at?: string | null
  // 中文提示。
  message?: string
}

// 这个函数生成账号安全信息兜底对象，入参是邮箱和旧账号标记，返回值用于失败时保持页面稳定。
function createAccountSecurityFallback(email = '', isLegacyEmail = false): AccountSecurityInfo {
  return {
    email,
    is_legacy_email: isLegacyEmail,
    pending_email: null,
    email_confirmed_at: null
  }
}

// 这个函数把审核状态转成中文，入参是状态值，返回值是提醒正文中使用的中文。
function getApplicationStatusText(status: JoinApplicationStatus): string {
  const labels: Record<JoinApplicationStatus, string> = {
    pending: '待审核',
    approved: '已审核',
    rejected: '未通过',
    contacted: '已联系',
    joined: '已入群',
    draft: '暂存',
    retired: '已退派'
  }

  return labels[status]
}

// 这个函数把云灯状态转成中文，入参是状态值，返回值是提醒正文中使用的中文。
function getLanternStatusText(status: LanternStatus): string {
  const labels: Record<LanternStatus, string> = {
    pending: '待审核',
    approved: '已公开',
    rejected: '已拒绝'
  }

  return labels[status]
}

// 这个函数把活动报名状态转成中文，入参是状态值，返回值是提醒正文中使用的中文。
function getRegistrationStatusText(status: EventRegistrationStatus): string {
  const labels: Record<EventRegistrationStatus, string> = {
    registered: '已报名',
    cancelled: '已取消',
    attended: '已参加'
  }

  return labels[status]
}

// 这个函数创建用户站内提醒并尝试发送邮件，入参是提醒内容，返回值为空。
async function createUserNotification(input: {
  userId: string | null
  kind: UserNotificationKind
  title: string
  content: string
  targetTable: string
  targetId: string
}) {
  // 这里跳过没有归属用户或没有配置 Supabase 的旧数据，避免审核旧游客数据时报错。
  if (!supabase || !input.userId) {
    return
  }

  try {
    // 这里先写入站内提醒，确保邮件失败时用户仍能在小院看到消息。
    const { data, error } = await supabase
      .from('user_notifications')
      .insert({
        user_id: input.userId,
        kind: input.kind,
        title: input.title,
        content: input.content,
        target_table: input.targetTable,
        target_id: input.targetId,
        email_status: 'pending'
      })
      .select('*')
      .single()

    if (error) {
      throw error
    }

    const notification = data as UserNotification
    // 这里调用 Supabase Edge Function 发送邮件，失败不影响主流程。
    const { error: functionError } = await supabase.functions.invoke('send-user-notice', {
      body: { notificationId: notification.id }
    })

    if (functionError) {
      await supabase
        .from('user_notifications')
        .update({
          email_status: 'failed',
          email_error: functionError.message
        })
        .eq('id', notification.id)
    }
  } catch {
    // 这里故意吞掉提醒异常，避免邮件或通知表故障影响审核、报名等主流程。
  }
}

// 这个函数读取公开云灯，入参为空，返回值是审核通过的云灯列表。
export async function fetchApprovedLanterns(): Promise<ApiResult<CloudLantern[]>> {
  // 这里在未配置 Supabase 时返回演示数据，保证官网可以直接打开。
  if (!supabase) {
    return okResult(mockLanterns, '当前为演示数据。')
  }

  try {
    // 这里只读取审核通过的留言，避免待审核内容出现在前台。
    const { data, error } = await supabase
      .from('cloud_lanterns')
      .select('*')
      .eq('status', 'approved')
      .order('created_at', { ascending: false })

    if (error) {
      throw error
    }

    return okResult((data ?? []) as CloudLantern[])
  } catch (error) {
    return failResult(mockLanterns, getErrorMessage(error, '读取云灯留言失败，已显示演示数据'))
  }
}

// 这个函数提交云灯留言，入参是表单内容，返回值是提交后的留言或演示留言。
export async function submitCloudLantern(input: CloudLanternInput): Promise<ApiResult<CloudLantern>> {
  // 这个对象是写入数据库的数据，默认进入待审核状态。
  const payload = {
    author_name: input.is_anonymous ? '匿名同门' : input.author_name.trim() || '匿名同门',
    content: input.content.trim(),
    mood: input.mood.trim() || null,
    is_anonymous: input.is_anonymous,
    status: 'pending'
  }

  // 这里在演示模式下模拟提交成功，但不真正写入数据库。
  if (!supabase) {
    return okResult(
      {
        id: `demo-lantern-${Date.now()}`,
        ...payload,
        status: 'pending',
        created_by: null,
        reviewed_by: null,
        reviewed_at: null,
        created_at: new Date().toISOString()
      } as CloudLantern,
      '演示模式下已模拟提交，真实保存需要配置 Supabase。'
    )
  }

  try {
    // 这里要求先登录问云小院，再把云灯归属到当前账号。
    const user = await requireCurrentUser()
    // 这里写入云灯表，RLS 会保证用户只能新增自己的云灯。
    const { data, error } = await supabase
      .from('cloud_lanterns')
      .insert({ ...payload, created_by: user.id })
      .select('*')
      .single()

    if (error) {
      throw error
    }

    const lantern = data as CloudLantern
    await createUserNotification({
      userId: user.id,
      kind: 'lantern',
      title: '云灯已送至山门',
      content: '你的云灯已进入待审核状态，执事查看后会决定是否公开。',
      targetTable: 'cloud_lanterns',
      targetId: lantern.id
    })

    return okResult(lantern, '云灯已送至山门，待执事审核后公开。')
  } catch (error) {
    return failResult(
      {
        id: '',
        ...payload,
        status: 'pending',
        created_by: null,
        reviewed_by: null,
        reviewed_at: null,
        created_at: new Date().toISOString()
      } as CloudLantern,
      getErrorMessage(error, '提交云灯失败')
    )
  }
}

// 这个函数提交名册登记，入参是登记表单，返回值是名帖记录。
export async function submitJoinApplication(input: JoinApplicationInput): Promise<ApiResult<JoinApplication>> {
  // 这个对象是写入数据库的数据，敏感微信号只进入后台表。
  const payload = {
    nickname: input.nickname.trim(),
    jianghu_name: input.jianghu_name.trim() || null,
    real_name: input.real_name.trim(),
    wechat_id: input.wechat_id.trim() || input.legacy_contact.trim(),
    age_range: input.age_range.trim() || null,
    gender: input.gender,
    city: input.city.trim() || input.public_region.trim() || null,
    reason: input.motto.trim(),
    accept_rules: input.accept_rules,
    offline_interest: null,
    remark: input.remark.trim() || null,
    member_role: '同门',
    generation_name: '云',
    public_region: input.public_region.trim() || input.city.trim() || null,
    raw_region: input.public_region.trim() || input.city.trim() || null,
    motto: input.motto.trim(),
    public_story: null,
    raw_story: null,
    tags: input.tags.trim() || null,
    companion_expectation: input.companion_expectation.trim() || null,
    legacy_contact: input.legacy_contact.trim(),
    status: 'pending'
  }

  // 这里在演示模式下模拟提交成功，方便没有数据库时体验完整流程。
  if (!supabase) {
    return okResult(
      {
        id: `demo-application-${Date.now()}`,
        user_id: null,
        ...payload,
        member_code: createNextMemberCode(mockApplications.map((item) => item.member_code), '云'),
        status: 'pending',
        admin_note: null,
        reviewed_by: null,
        reviewed_at: null,
        created_at: new Date().toISOString()
      } as JoinApplication,
      '演示模式下已模拟提交，真实保存需要配置 Supabase。'
    )
  }

  try {
    // 这里要求先登录问云小院，再把名帖归属到当前账号。
    const user = await requireCurrentUser()
    // 这里写入名册登记表，用户只能新增自己的待审核名帖。
    const { data, error } = await supabase
      .from('join_applications')
      .insert({ ...payload, user_id: user.id })
      .select('*')
      .single()

    if (error) {
      throw error
    }

    const application = data as JoinApplication
    await createUserNotification({
      userId: user.id,
      kind: 'application',
      title: '名帖已送至山门',
      content: '你的问云名帖已进入待审核状态，掌门或执事查看后会更新状态。',
      targetTable: 'join_applications',
      targetId: application.id
    })

    return okResult(application, '名册登记已送至山门，执事查看后会择时联系。')
  } catch (error) {
    return failResult(
      {
        ...createEmptyApplication(),
        ...payload,
      } as JoinApplication,
      getErrorMessage(error, '提交名册登记失败')
    )
  }
}

// 这个函数读取公开问云名册，入参为空，返回值是不含微信号的公开成员列表。
export async function fetchPublicRoster(): Promise<ApiResult<RosterEntry[]>> {
  // 这里在未配置 Supabase 时返回演示名册，保证页面可直接预览。
  if (!supabase) {
    return okResult(mockRosterEntries, '当前为演示名册。')
  }

  try {
    // 这里读取数据库公开视图，视图只包含非敏感名册字段。
    const { data, error } = await supabase
      .from('roster_entries')
      .select('*')
      .order('member_code', { ascending: true })

    if (error) {
      throw error
    }

    return okResult((data ?? []) as RosterEntry[])
  } catch (error) {
    return failResult(mockRosterEntries, getErrorMessage(error, '读取问云名册失败，已显示演示名册'))
  }
}

// 这个函数读取公开公告，入参为空，返回值是已发布公告列表。
export async function fetchPublishedAnnouncements(): Promise<ApiResult<Announcement[]>> {
  if (!supabase) {
    return okResult(mockAnnouncements, '当前为演示公告。')
  }

  try {
    // 这里只读取已发布公告，并把置顶公告排在前面。
    const { data, error } = await supabase
      .from('announcements')
      .select('*')
      .eq('status', 'published')
      .order('is_pinned', { ascending: false })
      .order('published_at', { ascending: false })

    if (error) {
      throw error
    }

    return okResult((data ?? []) as Announcement[])
  } catch (error) {
    return failResult(mockAnnouncements, getErrorMessage(error, '读取公告失败，已显示演示公告'))
  }
}

// 这个函数读取公开活动，入参为空，返回值是已发布活动列表。
export async function fetchPublishedEvents(): Promise<ApiResult<WenyunEvent[]>> {
  if (!supabase) {
    return okResult(mockEvents, '当前为演示活动。')
  }

  try {
    // 这里只读取已发布活动，按活动时间从近到远排列。
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .eq('status', 'published')
      .order('event_time', { ascending: true })

    if (error) {
      throw error
    }

    return okResult((data ?? []) as WenyunEvent[])
  } catch (error) {
    return failResult(mockEvents, getErrorMessage(error, '读取活动失败，已显示演示活动'))
  }
}

// 这个函数读取后台名帖登记，入参为空，返回值是全部名帖列表。
export async function fetchAdminApplications(): Promise<ApiResult<JoinApplication[]>> {
  if (!supabase) {
    return okResult(mockApplications, '当前为后台演示数据。')
  }

  try {
    // 这里读取全部名帖，实际权限由 RLS 限制为管理员可读。
    const { data, error } = await supabase
      .from('join_applications')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      throw error
    }

    return okResult((data ?? []) as JoinApplication[])
  } catch (error) {
    return failResult([], getErrorMessage(error, '读取名帖登记失败，请确认当前账号是管理员'))
  }
}

// 这个函数更新名帖状态，入参是名帖编号、状态和备注，返回值是更新后的名帖。
export async function updateApplicationStatus(
  id: string,
  status: JoinApplicationStatus,
  adminNote: string
): Promise<ApiResult<JoinApplication | null>> {
  if (!supabase) {
    // 这里演示模式只返回本地拼装数据，不会持久保存。
    const current = mockApplications.find((item) => item.id === id) ?? null
    return okResult(current ? { ...current, status, admin_note: adminNote } : null, '演示模式下已模拟更新。')
  }

  try {
    // 这里先读取旧状态和用户归属，用于判断是否需要发送小院提醒。
    const { data: before } = await supabase
      .from('join_applications')
      .select('user_id,status')
      .eq('id', id)
      .maybeSingle()

    // 这里更新名帖状态，并记录审核时间和备注。
    const { data, error } = await supabase
      .from('join_applications')
      .update({
        status,
        admin_note: adminNote || null,
        reviewed_at: new Date().toISOString()
      })
      .eq('id', id)
      .select('*')
      .single()

    if (error) {
      throw error
    }

    const application = data as JoinApplication
    const oldStatus = (before as Pick<JoinApplication, 'status' | 'user_id'> | null)?.status
    const userId = (before as Pick<JoinApplication, 'status' | 'user_id'> | null)?.user_id ?? application.user_id

    // 这里在状态发生变化时给用户写入站内提醒并尝试发送邮件。
    if (oldStatus !== status) {
      await createUserNotification({
        userId,
        kind: 'application',
        title: '名帖状态已更新',
        content: `你的问云名帖状态已更新为“${getApplicationStatusText(status)}”。${adminNote ? `备注：${adminNote}` : ''}`,
        targetTable: 'join_applications',
        targetId: id
      })
    }

    return okResult(application, '名帖状态已更新。')
  } catch (error) {
    return failResult(null, getErrorMessage(error, '更新名帖状态失败'))
  }
}

// 这个函数保存后台名册详情，入参是申请编号和全部可编辑字段，返回值是更新后的申请。
export async function updateApplicationDetails(
  id: string,
  input: JoinApplicationUpdateInput
): Promise<ApiResult<JoinApplication | null>> {
  // 这个对象保存将写入数据库的字段，空字符串会转成空值。
  const payload = {
    nickname: input.nickname.trim(),
    jianghu_name: input.jianghu_name.trim() || null,
    real_name: input.real_name.trim() || null,
    wechat_id: input.wechat_id.trim(),
    age_range: input.age_range.trim() || null,
    gender: input.gender,
    city: input.city.trim() || null,
    public_region: input.public_region.trim() || input.city.trim() || null,
    raw_region: input.raw_region.trim() || input.public_region.trim() || input.city.trim() || null,
    reason: input.reason.trim(),
    accept_rules: input.accept_rules,
    offline_interest: input.offline_interest.trim() || null,
    remark: input.remark.trim() || null,
    admin_note: input.admin_note.trim() || null,
    member_role: input.member_role,
    generation_name: input.generation_name.trim() || '云',
    member_code: input.member_code.trim(),
    roster_serial: input.roster_serial.trim() ? Number(input.roster_serial.trim()) : null,
    motto: input.motto.trim() || input.reason.trim(),
    public_story: input.public_story.trim() || null,
    raw_story: input.raw_story.trim() || input.public_story.trim() || null,
    tags: input.tags.trim() || null,
    companion_expectation: input.companion_expectation.trim() || null,
    legacy_contact: input.legacy_contact.trim() || input.wechat_id.trim(),
    requested_nickname: input.requested_nickname.trim() || null,
    requested_legacy_contact: input.requested_legacy_contact.trim() || null,
    requested_at:
      input.requested_nickname.trim() || input.requested_legacy_contact.trim()
        ? new Date().toISOString()
        : null,
    joined_at: input.joined_at ? new Date(input.joined_at).toISOString() : null,
    status: input.status,
    reviewed_at: new Date().toISOString()
  }

  // 这里演示模式只返回本地拼装结果，不会真正保存。
  if (!supabase) {
    const current = mockApplications.find((item) => item.id === id) ?? null
    return okResult(current ? { ...current, ...payload } : null, '演示模式下已模拟保存名册。')
  }

  try {
    // 这里先读取旧状态和用户归属，用于判断是否需要发送小院提醒。
    const { data: before } = await supabase
      .from('join_applications')
      .select('user_id,status,admin_note')
      .eq('id', id)
      .maybeSingle()

    // 这里保存管理员直接编辑的名册字段，权限由 RLS 限制为管理员可写。
    const { data, error } = await supabase
      .from('join_applications')
      .update(payload)
      .eq('id', id)
      .select('*')
      .single()

    if (error) {
      throw error
    }

    const application = data as JoinApplication
    const oldApplication = before as Pick<JoinApplication, 'status' | 'user_id' | 'admin_note'> | null

    // 这里在状态或管理员备注变化时给用户写入站内提醒并尝试发送邮件。
    if (oldApplication?.status !== input.status || oldApplication?.admin_note !== payload.admin_note) {
      await createUserNotification({
        userId: oldApplication?.user_id ?? application.user_id,
        kind: 'application',
        title: '名帖审核有新消息',
        content: `你的问云名帖当前状态为“${getApplicationStatusText(input.status)}”。${
          payload.admin_note ? `备注：${payload.admin_note}` : ''
        }`,
        targetTable: 'join_applications',
        targetId: id
      })
    }

    return okResult(application, '名册资料已保存。')
  } catch (error) {
    return failResult(null, getErrorMessage(error, '保存名册资料失败'))
  }
}

// 这个函数读取后台云灯列表，入参为空，返回值是全部云灯留言。
export async function fetchAdminLanterns(): Promise<ApiResult<CloudLantern[]>> {
  if (!supabase) {
    return okResult(mockLanterns, '当前为后台演示数据。')
  }

  try {
    // 这里读取全部云灯，实际权限由 RLS 限制为管理员可读。
    const { data, error } = await supabase.from('cloud_lanterns').select('*').order('created_at', {
      ascending: false
    })

    if (error) {
      throw error
    }

    return okResult((data ?? []) as CloudLantern[])
  } catch (error) {
    return failResult([], getErrorMessage(error, '读取云灯审核列表失败，请确认当前账号是管理员'))
  }
}

// 这个函数更新云灯审核状态，入参是留言编号和状态，返回值是更新后的云灯。
export async function updateLanternStatus(id: string, status: LanternStatus): Promise<ApiResult<CloudLantern | null>> {
  if (!supabase) {
    const current = mockLanterns.find((item) => item.id === id) ?? null
    return okResult(current ? { ...current, status } : null, '演示模式下已模拟更新。')
  }

  try {
    // 这里先读取旧状态和创建人，用于状态变化提醒。
    const { data: before } = await supabase
      .from('cloud_lanterns')
      .select('created_by,status')
      .eq('id', id)
      .maybeSingle()

    // 这里更新留言状态，只有 approved 才会在前台公开出现。
    const { data, error } = await supabase
      .from('cloud_lanterns')
      .update({
        status,
        reviewed_at: new Date().toISOString()
      })
      .eq('id', id)
      .select('*')
      .single()

    if (error) {
      throw error
    }

    const lantern = data as CloudLantern
    const oldLantern = before as Pick<CloudLantern, 'created_by' | 'status'> | null

    // 这里在状态发生变化时给用户写入站内提醒并尝试发送邮件。
    if (oldLantern?.status !== status) {
      await createUserNotification({
        userId: oldLantern?.created_by ?? lantern.created_by,
        kind: 'lantern',
        title: '云灯审核已更新',
        content: `你的云灯状态已更新为“${getLanternStatusText(status)}”。`,
        targetTable: 'cloud_lanterns',
        targetId: id
      })
    }

    return okResult(lantern, '云灯审核状态已更新。')
  } catch (error) {
    return failResult(null, getErrorMessage(error, '更新云灯状态失败'))
  }
}

// 这个函数读取后台公告列表，入参为空，返回值是全部公告。
export async function fetchAdminAnnouncements(): Promise<ApiResult<Announcement[]>> {
  if (!supabase) {
    return okResult(mockAnnouncements, '当前为后台演示公告。')
  }

  try {
    // 这里读取全部公告，包含草稿和已发布内容。
    const { data, error } = await supabase.from('announcements').select('*').order('created_at', {
      ascending: false
    })

    if (error) {
      throw error
    }

    return okResult((data ?? []) as Announcement[])
  } catch (error) {
    return failResult([], getErrorMessage(error, '读取公告管理列表失败'))
  }
}

// 这个函数创建公告，入参是公告基础内容，返回值是新公告。
export async function createAnnouncement(input: {
  title: string
  category: string
  summary: string
  content: string
  status: 'draft' | 'published'
}): Promise<ApiResult<Announcement | null>> {
  // 这个对象是写入公告表的数据。
  const payload = {
    title: input.title.trim(),
    slug: createSlug(input.title),
    category: input.category.trim() || '山门公告',
    summary: input.summary.trim() || null,
    content: input.content.trim(),
    status: input.status,
    is_pinned: false,
    published_at: input.status === 'published' ? new Date().toISOString() : null
  }

  if (!supabase) {
    return okResult(
      {
        id: `demo-announcement-${Date.now()}`,
        ...payload,
        cover_url: null,
        created_by: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      } as Announcement,
      '演示模式下已模拟创建公告。'
    )
  }

  try {
    // 这里新增公告，后台权限由 RLS 控制。
    const { data, error } = await supabase.from('announcements').insert(payload).select('*').single()

    if (error) {
      throw error
    }

    return okResult(data as Announcement, '公告已创建。')
  } catch (error) {
    return failResult(null, getErrorMessage(error, '创建公告失败'))
  }
}

// 这个函数读取后台活动列表，入参为空，返回值是全部活动。
export async function fetchAdminEvents(): Promise<ApiResult<WenyunEvent[]>> {
  if (!supabase) {
    return okResult(mockEvents, '当前为后台演示活动。')
  }

  try {
    // 这里读取全部活动，包含草稿和已发布内容。
    const { data, error } = await supabase.from('events').select('*').order('created_at', {
      ascending: false
    })

    if (error) {
      throw error
    }

    return okResult((data ?? []) as WenyunEvent[])
  } catch (error) {
    return failResult([], getErrorMessage(error, '读取活动管理列表失败'))
  }
}

// 这个函数读取后台活动报名列表，入参为空，返回值是全部活动报名。
export async function fetchAdminRegistrations(): Promise<ApiResult<EventRegistration[]>> {
  if (!supabase) {
    return okResult(mockRegistrations, '当前为后台演示报名。')
  }

  try {
    // 这里读取全部活动报名，实际权限由 RLS 限制为管理员可读。
    const { data, error } = await supabase
      .from('event_registrations')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      throw error
    }

    return okResult((data ?? []) as EventRegistration[])
  } catch (error) {
    return failResult([], getErrorMessage(error, '读取活动报名失败，请确认当前账号是管理员'))
  }
}

// 这个函数更新活动报名状态，入参是报名编号和状态，返回值是更新后的报名。
export async function updateEventRegistrationStatus(
  id: string,
  status: EventRegistrationStatus
): Promise<ApiResult<EventRegistration | null>> {
  if (!supabase) {
    const current = mockRegistrations.find((item) => item.id === id) ?? null
    return okResult(current ? { ...current, status } : null, '演示模式下已模拟更新报名。')
  }

  try {
    // 这里先读取旧状态和用户归属，用于状态变化提醒。
    const { data: before } = await supabase
      .from('event_registrations')
      .select('user_id,status')
      .eq('id', id)
      .maybeSingle()

    const { data, error } = await supabase
      .from('event_registrations')
      .update({ status })
      .eq('id', id)
      .select('*')
      .single()

    if (error) {
      throw error
    }

    const registration = data as EventRegistration
    const oldRegistration = before as Pick<EventRegistration, 'user_id' | 'status'> | null

    // 这里在报名状态变化时给用户写入站内提醒并尝试发送邮件。
    if (oldRegistration?.status !== status) {
      await createUserNotification({
        userId: oldRegistration?.user_id ?? registration.user_id,
        kind: 'event',
        title: '雅集报名状态已更新',
        content: `你的问云雅集报名状态已更新为“${getRegistrationStatusText(status)}”。`,
        targetTable: 'event_registrations',
        targetId: id
      })
    }

    return okResult(registration, '活动报名状态已更新。')
  } catch (error) {
    return failResult(null, getErrorMessage(error, '更新活动报名失败'))
  }
}

// 这个函数创建活动，入参是活动基础内容，返回值是新活动。
export async function createEvent(input: {
  title: string
  type: string
  mode: 'online' | 'offline'
  location: string
  event_time: string
  description: string
  capacity: string
  status: 'draft' | 'published'
}): Promise<ApiResult<WenyunEvent | null>> {
  // 这个对象是写入活动表的数据。
  const payload = {
    title: input.title.trim(),
    type: input.type.trim() || '线上清谈',
    mode: input.mode,
    location: input.location.trim() || null,
    event_time: input.event_time ? new Date(input.event_time).toISOString() : null,
    description: input.description.trim() || null,
    capacity: input.capacity ? Number(input.capacity) : null,
    status: input.status
  }

  if (!supabase) {
    return okResult(
      {
        id: `demo-event-${Date.now()}`,
        ...payload,
        cover_url: null,
        created_by: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      } as WenyunEvent,
      '演示模式下已模拟创建活动。'
    )
  }

  try {
    // 这里新增活动，后续可扩展报名和签到。
    const { data, error } = await supabase.from('events').insert(payload).select('*').single()

    if (error) {
      throw error
    }

    return okResult(data as WenyunEvent, '活动已创建。')
  } catch (error) {
    return failResult(null, getErrorMessage(error, '创建活动失败'))
  }
}

// 这个函数读取当前用户资料，入参为空，返回值是问云小院资料。
export async function fetchMyProfile(): Promise<ApiResult<Profile>> {
  if (!supabase) {
    return okResult(mockProfile, '当前为演示小院资料。')
  }

  try {
    // 这里要求登录后才能读取自己的资料。
    const user = await requireCurrentUser()
    const { data, error } = await supabase.from('profiles').select('*').eq('id', user.id).single()

    if (error) {
      throw error
    }

    return okResult(data as Profile)
  } catch (error) {
    return failResult(mockProfile, getErrorMessage(error, '读取小院资料失败'))
  }
}

// 这个函数保存当前用户资料，入参是可编辑资料，返回值是保存后的资料。
export async function updateMyProfile(input: ProfileUpdateInput): Promise<ApiResult<Profile>> {
  const payload = {
    nickname: input.nickname.trim() || '问云同门',
    avatar_url: input.avatar_url.trim() || null,
    city: input.city.trim() || null,
    bio: input.bio.trim() || null,
    is_public: input.is_public
  }

  if (!supabase) {
    return okResult({ ...mockProfile, ...payload, updated_at: new Date().toISOString() }, '演示模式下已模拟保存资料。')
  }

  try {
    // 这里要求登录后只能更新自己的非角色资料，角色由数据库 RLS 保护。
    const user = await requireCurrentUser()
    const { data, error } = await supabase.from('profiles').update(payload).eq('id', user.id).select('*').single()

    if (error) {
      throw error
    }

    return okResult(data as Profile, '小院资料已保存。')
  } catch (error) {
    return failResult(mockProfile, getErrorMessage(error, '保存小院资料失败'))
  }
}

// 这个函数保存当前用户的名册公开资料，入参是小院名册资料表单，返回值是更新后的名帖。
export async function updateMyRosterProfile(input: RosterProfileUpdateInput): Promise<ApiResult<JoinApplication | null>> {
  // 这个对象保存用户可以直接修改或申请修改的名册字段。
  const payload = {
    application_id: input.application_id,
    next_jianghu_name: input.jianghu_name.trim(),
    next_gender: input.gender,
    next_city: input.city.trim(),
    next_motto: input.motto.trim(),
    next_hobbies: input.hobbies.trim(),
    next_companion_expectation: input.companion_expectation.trim(),
    requested_dao_name: input.requested_nickname.trim(),
    requested_contact: input.requested_legacy_contact.trim()
  }

  // 这里演示模式只更新本地名帖，方便无数据库时预览小院资料页。
  if (!supabase) {
    const current = mockApplications.find((item) => item.id === input.application_id) ?? mockApplications[0] ?? null

    if (!current) {
      return okResult(null, '演示模式下没有找到名帖。')
    }

    return okResult(
      {
        ...current,
        jianghu_name: payload.next_jianghu_name || null,
        gender: payload.next_gender,
        city: payload.next_city || null,
        public_region: payload.next_city || null,
        motto: payload.next_motto || current.motto,
        reason: payload.next_motto || current.reason,
        public_story: null,
        raw_story: null,
        tags: payload.next_hobbies || null,
        companion_expectation: payload.next_companion_expectation || null,
        requested_nickname: payload.requested_dao_name || null,
        requested_legacy_contact: payload.requested_contact || null,
        requested_at: payload.requested_dao_name || payload.requested_contact ? new Date().toISOString() : null
      },
      '演示模式下已模拟保存名册资料。'
    )
  }

  try {
    // 这里通过数据库安全函数保存，函数会保证只能改自己的名帖，并把道名和联系方式写成待审核。
    const { data, error } = await supabase.rpc('update_my_roster_profile', payload)

    if (error) {
      throw error
    }

    return okResult(data as JoinApplication, '名册资料已保存；如申请了道名或联系方式变更，将等待管理员审核。')
  } catch (error) {
    return failResult(null, getErrorMessage(error, '保存名册资料失败，请确认已执行最新 Supabase SQL 脚本'))
  }
}

// 这个函数读取当前账号安全信息，入参为空，返回值包含登录邮箱和待确认邮箱。
export async function fetchMyAccountSecurity(): Promise<ApiResult<AccountSecurityInfo>> {
  // 这里在演示模式下返回固定账号，避免未配置 Supabase 时页面空白。
  if (!supabase) {
    return okResult(
      {
        email: 'demo@wenyun.local',
        is_legacy_email: true,
        pending_email: null,
        email_confirmed_at: null
      },
      '当前为演示账号安全信息。'
    )
  }

  try {
    // 这里要求用户已登录，只有本人才能读取自己的认证邮箱。
    const user = await requireCurrentUser()

    return okResult(createAccountSecurityInfo(user), '账号安全信息已读取。')
  } catch (error) {
    // 这里捕获会话过期等认证异常，避免小院资料页白屏。
    return failResult(
      {
        email: '',
        is_legacy_email: false,
        pending_email: null,
        email_confirmed_at: null
      },
      translateSupabaseAuthError(error)
    )
  }
}

// 这个函数修改当前登录账号密码，入参是新密码和确认密码，返回值表示是否成功。
export async function updateMyPassword(input: PasswordUpdateInput): Promise<ApiResult<null>> {
  // 这里检查两次密码是否一致，先在前端挡住手误。
  if (input.new_password !== input.confirm_password) {
    return failResult(null, '两次输入的新密码不一致，请重新填写。')
  }

  // 这里只拦截空密码，最少位数交给 Supabase 后台策略处理。
  if (!input.new_password) {
    return failResult(null, '新密码不能为空。')
  }

  // 这里在演示模式下只模拟成功，不写入真实认证系统。
  if (!supabase) {
    return okResult(null, '演示模式下已模拟修改密码。')
  }

  try {
    // 这里先确认当前会话存在，避免过期会话直接调用更新接口。
    await requireCurrentUser()

    // 这里调用 Supabase Auth 更新密码，成功后用户下次登录需要使用新密码。
    const { error } = await supabase.auth.updateUser({
      password: input.new_password
    })

    if (error) {
      throw error
    }

    return okResult(null, '密码已修改成功，下次登录请使用新密码。')
  } catch (error) {
    // 这里把 Supabase 认证错误转成中文，方便用户按提示处理。
    return failResult(null, translateSupabaseAuthError(error))
  }
}

// 这个函数绑定或更换当前账号邮箱，入参是真实邮箱，返回值是更新后的账号安全信息。
export async function bindMyEmail(input: EmailBindInput): Promise<ApiResult<AccountSecurityInfo>> {
  // 这里清理邮箱前后空格，避免复制时多带空白。
  const email = input.email.trim().toLowerCase()

  // 这里做基础邮箱格式校验，避免明显错误提交给 Supabase。
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return failResult(
      {
        email: '',
        is_legacy_email: false,
        pending_email: null,
        email_confirmed_at: null
      },
      '请填写正确的邮箱地址。'
    )
  }

  // 这里不允许把真实绑定邮箱设置成旧编号内部邮箱。
  if (isLegacyInternalEmail(email)) {
    return failResult(
      {
        email: '',
        is_legacy_email: true,
        pending_email: null,
        email_confirmed_at: null
      },
      '请绑定真实邮箱，不要填写旧编号内部邮箱。'
    )
  }

  // 这里在演示模式下只模拟成功，方便无 Supabase 时预览界面。
  if (!supabase) {
    return okResult(
      {
        email,
        is_legacy_email: false,
        pending_email: null,
        email_confirmed_at: new Date().toISOString()
      },
      '演示模式下已模拟绑定邮箱。'
    )
  }

  try {
    // 这里读取当前账号，确保只能更新自己的登录邮箱。
    const user = await requireCurrentUser()

    if ((user.email ?? '').toLowerCase() === email) {
      return okResult(createAccountSecurityInfo(user), '这个邮箱已经是当前登录邮箱。')
    }

    // 这里调用数据库安全函数直绑邮箱，避免旧编号内部邮箱无法收确认邮件导致失败。
    const { data, error } = await supabase.rpc('bind_current_user_email', {
      new_email: email
    })

    if (error) {
      throw error
    }

    // 这里解析数据库函数返回值，失败时直接展示函数给出的中文原因。
    const rpcResult = data as BindEmailRpcResponse | null

    if (!rpcResult?.ok) {
      return failResult(createAccountSecurityInfo(user), rpcResult?.message ?? '绑定邮箱失败，请确认已执行最新 Supabase SQL 脚本。')
    }

    // 这里刷新认证用户，尽量让页面马上显示新邮箱。
    const {
      data: { user: refreshedUser }
    } = await supabase.auth.getUser()

    const nextInfo = refreshedUser
      ? createAccountSecurityInfo(refreshedUser)
      : {
          email: rpcResult.email ?? email,
          is_legacy_email: rpcResult.is_legacy_email ?? false,
          pending_email: rpcResult.pending_email ?? null,
          email_confirmed_at: rpcResult.email_confirmed_at ?? new Date().toISOString()
        }

    return okResult(nextInfo, rpcResult.message ?? '邮箱已绑定成功，下次可用真实邮箱登录问云小院。')
  } catch (error) {
    // 这里把邮箱重复、会话过期、确认设置拦截等问题转成中文提示。
    return failResult(
      createAccountSecurityFallback(),
      translateSupabaseAuthError(error)
    )
  }
}

// 这个函数读取执事管理用户列表，入参为空，返回值是超级管理员可管理的用户行。
export async function fetchAdminRoleUsers(): Promise<ApiResult<AdminRoleUser[]>> {
  // 这里在演示模式下返回一个示例用户，方便无 Supabase 时预览后台页面。
  if (!supabase) {
    return okResult(
      [
        {
          user_id: mockProfile.id,
          email: 'demo@example.com',
          nickname: mockProfile.nickname,
          role: 'member',
          city: mockProfile.city,
          is_public: mockProfile.is_public,
          created_at: mockProfile.created_at,
          member_code: '问云-云-001',
          dao_name: mockProfile.nickname
        }
      ],
      '当前为演示执事名单。'
    )
  }

  try {
    // 这里通过数据库安全函数读取账号邮箱和资料，普通表查询不能直接读取 auth.users。
    const { data, error } = await supabase.rpc('list_wenyun_role_users')

    if (error) {
      throw error
    }

    return okResult((data ?? []) as AdminRoleUser[], '执事管理名单已读取。')
  } catch (error) {
    return failResult([], getErrorMessage(error, '读取执事管理名单失败，请确认当前账号是超级管理员，并已执行最新 Supabase SQL 脚本'))
  }
}

// 这个函数设置用户后台身份，入参是用户编号和目标身份，返回值是更新后的用户行。
export async function updateAdminUserRole(userId: string, role: StewardManageableRole): Promise<ApiResult<AdminRoleUser | null>> {
  // 这里在演示模式下模拟成功，方便本地无 Supabase 时查看交互。
  if (!supabase) {
    return okResult(
      {
        user_id: userId,
        email: 'demo@example.com',
        nickname: mockProfile.nickname,
        role,
        city: mockProfile.city,
        is_public: mockProfile.is_public,
        created_at: mockProfile.created_at,
        member_code: '问云-云-001',
        dao_name: mockProfile.nickname
      },
      role === 'admin' ? '演示模式下已模拟设为执事。' : '演示模式下已模拟撤回普通成员。'
    )
  }

  try {
    // 这里通过数据库安全函数更新角色，函数会限制只有超级管理员能操作。
    const { data, error } = await supabase.rpc('set_wenyun_user_role', {
      target_user_id: userId,
      target_role: role
    })

    if (error) {
      throw error
    }

    // 这里兼容 Supabase 对 returns table 函数返回数组的行为，取第一行作为更新结果。
    const rows = (data ?? []) as AdminRoleUser[]

    return okResult(rows[0] ?? null, role === 'admin' ? '已设为执事，可以登录管理后台。' : '已撤回为普通成员。')
  } catch (error) {
    return failResult(null, getErrorMessage(error, '设置执事身份失败'))
  }
}

// 这个函数让超级管理员修改成员登录邮箱或重置密码，入参是目标用户、邮箱和密码，返回值是更新后的用户行。
export async function updateAdminUserAccount(input: AdminUserAccountUpdateInput): Promise<ApiResult<AdminRoleUser | null>> {
  // 这里清理邮箱前后空格并统一小写，避免同一个邮箱因为大小写不同被重复保存。
  const email = input.email.trim().toLowerCase()
  // 这里保留用户输入的密码内容，只去掉前后空格；空值表示不改密码。
  const password = input.password.trim()

  // 这里做基础邮箱格式校验，提前挡住明显填错的内容。
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return failResult(null, '请填写正确的真实邮箱。')
  }

  // 这里禁止把旧编号内部邮箱继续写回账号，避免再次出现无法收信、无法绑定的问题。
  if (email.endsWith('@wenyun.local')) {
    return failResult(null, '请填写真实邮箱，不要使用旧编号内部邮箱。')
  }

  // 这里在演示模式下模拟成功，方便本地无 Supabase 时预览账号设置流程。
  if (!supabase) {
    return okResult(
      {
        user_id: input.user_id,
        email,
        nickname: mockProfile.nickname,
        role: 'member',
        city: mockProfile.city,
        is_public: mockProfile.is_public,
        created_at: mockProfile.created_at,
        member_code: '问云-云-001',
        dao_name: mockProfile.nickname
      },
      password ? '演示模式下已模拟修改邮箱并重置密码。' : '演示模式下已模拟修改邮箱。'
    )
  }

  try {
    // 这里通过数据库安全函数修改认证表，函数内部会再次检查当前账号是不是超级管理员。
    const { data, error } = await supabase.rpc('update_wenyun_user_account', {
      target_user_id: input.user_id,
      new_email: email,
      new_password: password || null
    })

    if (error) {
      throw error
    }

    // 这里兼容 Supabase 对 returns table 函数返回数组的行为，取第一行作为更新结果。
    const rows = (data ?? []) as AdminRoleUser[]

    return okResult(rows[0] ?? null, password ? '账号邮箱已更新，密码也已重置。' : '账号邮箱已更新。')
  } catch (error) {
    return failResult(null, getErrorMessage(error, '修改用户邮箱或密码失败，请确认当前账号是超级管理员，并已执行最新 Supabase SQL 脚本'))
  }
}

// 这个函数读取当前用户名帖，入参为空，返回值是自己的名帖列表。
export async function fetchMyApplications(): Promise<ApiResult<JoinApplication[]>> {
  if (!supabase) {
    return okResult(mockApplications.filter((item) => item.user_id), '当前为演示名帖。')
  }

  try {
    // 这里只读取当前用户自己的名帖，RLS 会再次保护数据边界。
    const user = await requireCurrentUser()
    const { data, error } = await supabase
      .from('join_applications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      throw error
    }

    return okResult((data ?? []) as JoinApplication[])
  } catch (error) {
    return failResult([], getErrorMessage(error, '读取我的名帖失败'))
  }
}

// 这个函数读取当前用户云灯，入参为空，返回值是自己的云灯列表。
export async function fetchMyLanterns(): Promise<ApiResult<CloudLantern[]>> {
  if (!supabase) {
    return okResult(mockLanterns.filter((item) => item.created_by), '当前为演示云灯。')
  }

  try {
    // 这里只读取当前用户自己的云灯，包含待审核和拒绝状态。
    const user = await requireCurrentUser()
    const { data, error } = await supabase
      .from('cloud_lanterns')
      .select('*')
      .eq('created_by', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      throw error
    }

    return okResult((data ?? []) as CloudLantern[])
  } catch (error) {
    return failResult([], getErrorMessage(error, '读取我的云灯失败'))
  }
}

// 这个函数读取当前用户报名，入参为空，返回值是自己的报名列表。
export async function fetchMyRegistrations(): Promise<ApiResult<EventRegistration[]>> {
  if (!supabase) {
    return okResult(mockRegistrations, '当前为演示雅集报名。')
  }

  try {
    // 这里只读取当前用户自己的活动报名。
    const user = await requireCurrentUser()
    const { data, error } = await supabase
      .from('event_registrations')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      throw error
    }

    return okResult((data ?? []) as EventRegistration[])
  } catch (error) {
    return failResult([], getErrorMessage(error, '读取我的雅集报名失败'))
  }
}

// 这个函数读取当前用户提醒，入参为空，返回值是自己的站内提醒。
export async function fetchMyNotifications(): Promise<ApiResult<UserNotification[]>> {
  if (!supabase) {
    return okResult(mockNotifications, '当前为演示提醒。')
  }

  try {
    // 这里只读取当前用户自己的站内提醒。
    const user = await requireCurrentUser()
    const { data, error } = await supabase
      .from('user_notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      throw error
    }

    return okResult((data ?? []) as UserNotification[])
  } catch (error) {
    return failResult([], getErrorMessage(error, '读取小院提醒失败'))
  }
}

// 这个函数读取问云小院总览数据，入参为空，返回值是资料、名帖、云灯、报名和提醒。
export async function fetchYardOverview(): Promise<ApiResult<YardOverview>> {
  const [profileResult, applicationResult, lanternResult, registrationResult, notificationResult] = await Promise.all([
    fetchMyProfile(),
    fetchMyApplications(),
    fetchMyLanterns(),
    fetchMyRegistrations(),
    fetchMyNotifications()
  ])

  return {
    ok:
      profileResult.ok &&
      applicationResult.ok &&
      lanternResult.ok &&
      registrationResult.ok &&
      notificationResult.ok,
    data: {
      profile: profileResult.data,
      applications: applicationResult.data,
      lanterns: lanternResult.data,
      registrations: registrationResult.data,
      notifications: notificationResult.data
    },
    message: profileResult.message,
    demoMode: profileResult.demoMode
  }
}

// 这个函数读取小院活动列表，入参为空，返回值包含活动和用户报名状态。
export async function fetchYardEvents(): Promise<ApiResult<YardEventItem[]>> {
  const [eventResult, registrationResult] = await Promise.all([fetchPublishedEvents(), fetchMyRegistrations()])
  const items = eventResult.data.map((event) => ({
    event,
    registration: registrationResult.data.find((item) => item.event_id === event.id) ?? null
  }))

  return {
    ok: eventResult.ok && registrationResult.ok,
    data: items,
    message: eventResult.message,
    demoMode: eventResult.demoMode
  }
}

// 这个函数报名问云雅集，入参是活动编号和备注，返回值是报名记录。
export async function registerForEvent(eventId: string, note: string): Promise<ApiResult<EventRegistration | null>> {
  if (!supabase) {
    const current = mockRegistrations.find((item) => item.event_id === eventId)
    return okResult(current ?? mockRegistrations[0] ?? null, '演示模式下已模拟报名。')
  }

  try {
    // 这里要求先登录，再把报名归属到当前账号。
    const user = await requireCurrentUser()
    const profileResult = await fetchMyProfile()
    const payload = {
      event_id: eventId,
      user_id: user.id,
      nickname: profileResult.data.nickname,
      contact: user.email ?? null,
      note: note.trim() || null,
      status: 'registered'
    }

    const { data, error } = await supabase
      .from('event_registrations')
      .upsert(payload, { onConflict: 'event_id,user_id' })
      .select('*')
      .single()

    if (error) {
      throw error
    }

    const registration = data as EventRegistration
    await createUserNotification({
      userId: user.id,
      kind: 'event',
      title: '雅集报名成功',
      content: '你的问云雅集报名已记录在小院里，后续变动会继续提醒你。',
      targetTable: 'event_registrations',
      targetId: registration.id
    })

    return okResult(registration, '雅集报名已记录。')
  } catch (error) {
    return failResult(null, getErrorMessage(error, '雅集报名失败'))
  }
}

// 这个函数取消问云雅集报名，入参是报名编号，返回值是更新后的报名记录。
export async function cancelEventRegistration(id: string): Promise<ApiResult<EventRegistration | null>> {
  if (!supabase) {
    const current = mockRegistrations.find((item) => item.id === id) ?? null
    return okResult(current ? { ...current, status: 'cancelled' } : null, '演示模式下已模拟取消报名。')
  }

  try {
    // 这里要求先登录，RLS 会保证只能取消自己的报名。
    const user = await requireCurrentUser()
    const { data, error } = await supabase
      .from('event_registrations')
      .update({ status: 'cancelled' })
      .eq('id', id)
      .select('*')
      .single()

    if (error) {
      throw error
    }

    const registration = data as EventRegistration
    await createUserNotification({
      userId: user.id,
      kind: 'event',
      title: '雅集报名已取消',
      content: '你的问云雅集报名已取消，如需参加可重新报名。',
      targetTable: 'event_registrations',
      targetId: registration.id
    })

    return okResult(registration, '雅集报名已取消。')
  } catch (error) {
    return failResult(null, getErrorMessage(error, '取消雅集报名失败'))
  }
}

// 这个函数标记提醒已读，入参是提醒编号，返回值是更新后的提醒。
export async function markNotificationRead(id: string): Promise<ApiResult<UserNotification | null>> {
  if (!supabase) {
    const current = mockNotifications.find((item) => item.id === id) ?? null
    return okResult(current ? { ...current, read_at: new Date().toISOString() } : null, '演示模式下已模拟已读。')
  }

  try {
    // 这里只更新自己的提醒，RLS 会保护用户边界。
    const { data, error } = await supabase
      .from('user_notifications')
      .update({ read_at: new Date().toISOString() })
      .eq('id', id)
      .select('*')
      .single()

    if (error) {
      throw error
    }

    return okResult(data as UserNotification, '提醒已标记为已读。')
  } catch (error) {
    return failResult(null, getErrorMessage(error, '标记提醒失败'))
  }
}

// 这个函数读取站点设置，入参为空，返回值是设置列表。
export async function fetchSettings(): Promise<ApiResult<SiteSetting[]>> {
  if (!supabase) {
    return okResult(mockSettings, '当前为演示设置。')
  }

  try {
    // 这里读取所有站点设置，公开信息和后台信息统一从此处扩展。
    const { data, error } = await supabase.from('site_settings').select('*').order('key', { ascending: true })

    if (error) {
      throw error
    }

    return okResult((data ?? []) as SiteSetting[])
  } catch (error) {
    return failResult(mockSettings, getErrorMessage(error, '读取站点设置失败，已显示演示设置'))
  }
}

// 这个函数保存联系设置，入参是联系人和说明文字，返回值是保存后的设置。
export async function saveContactSetting(input: {
  wechatName: string
  contactTip: string
  qrDescription: string
}): Promise<ApiResult<SiteSetting | null>> {
  // 这个对象以 JSON 保存，方便后续增加二维码、邮箱等字段。
  const payload = {
    key: 'contact',
    value: {
      wechatName: input.wechatName.trim(),
      contactTip: input.contactTip.trim(),
      qrDescription: input.qrDescription.trim()
    }
  }

  if (!supabase) {
    return okResult(
      {
        ...payload,
        updated_by: null,
        updated_at: new Date().toISOString()
      },
      '演示模式下已模拟保存设置。'
    )
  }

  try {
    // 这里使用 upsert，第一次保存会新增，之后保存会覆盖同名设置。
    const { data, error } = await supabase.from('site_settings').upsert(payload).select('*').single()

    if (error) {
      throw error
    }

    return okResult(data as SiteSetting, '站点联系设置已保存。')
  } catch (error) {
    return failResult(null, getErrorMessage(error, '保存站点设置失败'))
  }
}

// 这个函数读取后台 SMTP 设置，入参为空，返回值不包含授权码明文。
export async function fetchSmtpSetting(): Promise<ApiResult<SmtpSetting | null>> {
  if (!supabase) {
    return okResult(mockSmtpSetting, '当前为演示 SMTP 设置。')
  }

  try {
    // 这里只读取非授权码字段，避免把敏感授权码带回前端表单。
    const { data, error } = await supabase
      .from('smtp_settings')
      .select('id,enabled,host,port,secure,username,from_email,updated_at')
      .eq('id', 'default')
      .maybeSingle()

    if (error) {
      throw error
    }

    return okResult((data as SmtpSetting | null) ?? null, data ? 'SMTP 设置已读取。' : '尚未配置 SMTP 服务。')
  } catch (error) {
    return failResult(null, getErrorMessage(error, '读取 SMTP 设置失败'))
  }
}

// 这个函数保存后台 SMTP 设置，入参是 SMTP 表单，返回值是不含授权码明文的设置。
export async function saveSmtpSetting(input: SmtpSettingInput): Promise<ApiResult<SmtpSetting | null>> {
  const port = Number(input.port)

  // 这里做基础校验，避免空主机、空账号或非法端口写入数据库。
  if (!input.host.trim() || !input.username.trim() || !input.from_email.trim() || Number.isNaN(port) || port <= 0) {
    return failResult(null, '请填写 SMTP 主机、端口、账号和发件人。')
  }

  if (!supabase) {
    return okResult(
      {
        ...mockSmtpSetting,
        enabled: input.enabled,
        host: input.host.trim(),
        port,
        secure: input.secure,
        username: input.username.trim(),
        from_email: input.from_email.trim(),
        updated_at: new Date().toISOString()
      },
      '演示模式下已模拟保存 SMTP 设置。'
    )
  }

  try {
    const basePayload = {
      id: 'default',
      enabled: input.enabled,
      host: input.host.trim(),
      port,
      secure: input.secure,
      username: input.username.trim(),
      from_email: input.from_email.trim()
    }

    // 这里首次配置必须填写授权码；后续留空时只更新非授权码字段。
    const query = input.password.trim()
      ? supabase
          .from('smtp_settings')
          .upsert({
            ...basePayload,
            password: input.password.trim()
          })
          .select('id,enabled,host,port,secure,username,from_email,updated_at')
          .single()
      : supabase
          .from('smtp_settings')
          .update(basePayload)
          .eq('id', 'default')
          .select('id,enabled,host,port,secure,username,from_email,updated_at')
          .single()

    const { data, error } = await query

    if (error) {
      throw error
    }

    return okResult(data as SmtpSetting, 'SMTP 服务设置已保存。')
  } catch (error) {
    return failResult(null, getErrorMessage(error, '保存 SMTP 设置失败。首次配置必须填写授权码'))
  }
}
