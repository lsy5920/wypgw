import { mockAnnouncements, mockApplications, mockEvents, mockLanterns, mockProfile, mockQuizResults, mockRegistrations } from '../../data/mockData'
import type {
  AdminRoleUser,
  AdminUserAccountUpdateInput,
  Announcement,
  CloudLantern,
  EventRegistration,
  EventRegistrationStatus,
  JoinApplication,
  JoinApplicationStatus,
  JoinApplicationUpdateInput,
  LanternStatus,
  ProfileRole,
  PublishStatus,
  WenxinQuizResult,
  WenyunEvent
} from '../../lib/types'
import { createSlug } from './validators'
import { databaseClient } from './supabase'
import { createUserNotification } from './publicService'
import { failResult, getErrorMessage, okResult, requireCurrentUser } from './result'

// 这个类型描述后台公告表单，入参来自执事任务台，返回值用于写入公告表。
export interface AnnouncementFormInput {
  // 公告标题。
  title: string
  // 公告分类。
  category: string
  // 公告摘要。
  summary: string
  // 公告正文。
  content: string
  // 是否置顶。
  isPinned: boolean
  // 发布状态。
  status: PublishStatus
}

// 这个类型描述后台活动表单，入参来自执事任务台，返回值用于写入活动表。
export interface EventFormInput {
  // 活动标题。
  title: string
  // 活动类型。
  type: string
  // 活动方式。
  mode: 'online' | 'offline'
  // 活动地点。
  location: string
  // 活动时间。
  eventTime: string
  // 活动说明。
  description: string
  // 报名人数上限。
  capacity: string
  // 发布状态。
  status: PublishStatus
}

// 这个类型描述后台总览所需整包数据，入参为空，返回值用于总览聚合待办。
export interface AdminOverview {
  // 所有名帖。
  applications: JoinApplication[]
  // 所有云灯。
  lanterns: CloudLantern[]
  // 所有公告。
  announcements: Announcement[]
  // 所有活动。
  events: WenyunEvent[]
  // 所有报名。
  registrations: EventRegistration[]
  // 最新考核记录。
  quizResults: WenxinQuizResult[]
}

// 这个函数创建演示执事列表，入参为空，返回值用于无数据库时展示权限台账。
function createMockRoleUsers(): AdminRoleUser[] {
  return mockApplications.slice(0, 4).map((item, index) => ({
    user_id: item.user_id ?? `demo-steward-${index}`,
    email: index === 0 ? 'admin@wenyun.local' : `member${index + 1}@wenyun.local`,
    nickname: item.nickname,
    role: index === 0 ? 'founder' : index === 1 ? 'admin' : 'member',
    city: item.city,
    is_public: true,
    created_at: item.created_at,
    member_code: item.member_code,
    dao_name: item.nickname
  }))
}

// 这个函数读取后台名帖，入参为空，返回值是全部名帖。
export async function fetchAdminApplications() {
  if (!databaseClient) {
    return okResult(mockApplications, '当前为演示名帖台账。')
  }

  try {
    const { data, error } = await databaseClient.from('join_applications').select('*').order('created_at', { ascending: false })

    if (error) {
      throw error
    }

    return okResult((data ?? []) as JoinApplication[])
  } catch (error) {
    return failResult(mockApplications, getErrorMessage(error, '读取名帖台账失败，已显示演示数据'))
  }
}

// 这个函数读取后台云灯，入参为空，返回值是全部云灯。
export async function fetchAdminLanterns() {
  if (!databaseClient) {
    return okResult(mockLanterns, '当前为演示云灯台账。')
  }

  try {
    const { data, error } = await databaseClient.from('cloud_lanterns').select('*').order('created_at', { ascending: false })

    if (error) {
      throw error
    }

    return okResult((data ?? []) as CloudLantern[])
  } catch (error) {
    return failResult(mockLanterns, getErrorMessage(error, '读取云灯台账失败，已显示演示数据'))
  }
}

// 这个函数读取后台公告，入参为空，返回值是全部公告。
export async function fetchAdminAnnouncements() {
  if (!databaseClient) {
    return okResult(mockAnnouncements, '当前为演示公告台账。')
  }

  try {
    const { data, error } = await databaseClient
      .from('announcements')
      .select('*')
      .order('is_pinned', { ascending: false })
      .order('created_at', { ascending: false })

    if (error) {
      throw error
    }

    return okResult((data ?? []) as Announcement[])
  } catch (error) {
    return failResult(mockAnnouncements, getErrorMessage(error, '读取公告台账失败，已显示演示数据'))
  }
}

// 这个函数读取后台活动，入参为空，返回值是全部活动。
export async function fetchAdminEvents() {
  if (!databaseClient) {
    return okResult(mockEvents, '当前为演示活动台账。')
  }

  try {
    const { data, error } = await databaseClient.from('events').select('*').order('created_at', { ascending: false })

    if (error) {
      throw error
    }

    return okResult((data ?? []) as WenyunEvent[])
  } catch (error) {
    return failResult(mockEvents, getErrorMessage(error, '读取活动台账失败，已显示演示数据'))
  }
}

// 这个函数读取后台报名，入参为空，返回值是全部报名记录。
export async function fetchAdminRegistrations() {
  if (!databaseClient) {
    return okResult(mockRegistrations, '当前为演示报名台账。')
  }

  try {
    const { data, error } = await databaseClient.from('event_registrations').select('*').order('created_at', { ascending: false })

    if (error) {
      throw error
    }

    return okResult((data ?? []) as EventRegistration[])
  } catch (error) {
    return failResult(mockRegistrations, getErrorMessage(error, '读取报名台账失败，已显示演示数据'))
  }
}

// 这个函数读取后台考核记录，入参为空，返回值是最新考核列表。
export async function fetchAdminLatestWenxinQuizResults() {
  if (!databaseClient) {
    return okResult(mockQuizResults, '当前为演示考核记录。')
  }

  try {
    const { data, error } = await databaseClient.from('wenxin_quiz_results').select('*').order('created_at', { ascending: false }).limit(80)

    if (error) {
      throw error
    }

    return okResult((data ?? []) as WenxinQuizResult[])
  } catch (error) {
    return failResult(mockQuizResults, getErrorMessage(error, '读取问云考核记录失败，已显示演示数据'))
  }
}

// 这个函数读取后台总览，入参为空，返回值是聚合后的执事任务数据。
export async function fetchAdminOverview() {
  const [applicationResult, lanternResult, announcementResult, eventResult, registrationResult, quizResult] = await Promise.all([
    fetchAdminApplications(),
    fetchAdminLanterns(),
    fetchAdminAnnouncements(),
    fetchAdminEvents(),
    fetchAdminRegistrations(),
    fetchAdminLatestWenxinQuizResults()
  ])

  return {
    ok: applicationResult.ok && lanternResult.ok && announcementResult.ok && eventResult.ok && registrationResult.ok && quizResult.ok,
    data: {
      applications: applicationResult.data,
      lanterns: lanternResult.data,
      announcements: announcementResult.data,
      events: eventResult.data,
      registrations: registrationResult.data,
      quizResults: quizResult.data
    } as AdminOverview,
    message: applicationResult.message,
    demoMode: applicationResult.demoMode
  }
}

// 这个函数更新名帖细节，入参是名帖编号和表单，返回值是更新后的名帖。
export async function updateApplicationDetails(id: string, input: JoinApplicationUpdateInput) {
  const payload = {
    nickname: input.nickname.trim(),
    jianghu_name: input.jianghu_name.trim() || null,
    real_name: input.real_name.trim() || null,
    wechat_id: input.wechat_id.trim(),
    age_range: input.age_range.trim() || null,
    gender: input.gender,
    city: input.city.trim() || null,
    public_region: input.public_region.trim() || null,
    raw_region: input.raw_region.trim() || null,
    reason: input.reason.trim(),
    accept_rules: input.accept_rules,
    admin_note: input.admin_note.trim() || null,
    member_role: input.member_role,
    generation_name: input.generation_name.trim() || '云',
    member_code: input.member_code.trim() || null,
    roster_serial: input.roster_serial ? Number(input.roster_serial) : null,
    motto: input.motto.trim() || null,
    tags: input.tags.trim() || null,
    companion_expectation: input.companion_expectation.trim() || null,
    legacy_contact: input.legacy_contact.trim() || null,
    requested_nickname: input.requested_nickname.trim() || null,
    requested_legacy_contact: input.requested_legacy_contact.trim() || null,
    joined_at: input.joined_at.trim() || null,
    guiyuntang_joined: input.guiyuntang_joined,
    guiyuntang_joined_at: input.guiyuntang_joined_at.trim() || null,
    status: input.status
  }

  if (!databaseClient) {
    const current = mockApplications.find((item) => item.id === id) ?? mockApplications[0]
    return okResult({ ...current, ...payload } as JoinApplication, '演示模式下已模拟保存名帖。')
  }

  try {
    const { data, error } = await databaseClient.from('join_applications').update(payload).eq('id', id).select('*').single()

    if (error) {
      throw error
    }

    return okResult(data as JoinApplication, '名帖资料已保存。')
  } catch (error) {
    return failResult(null, getErrorMessage(error, '保存名帖资料失败'))
  }
}

// 这个函数更新名帖审核状态，入参是名帖编号、状态和备注，返回值是更新后的名帖。
export async function updateApplicationStatus(id: string, status: JoinApplicationStatus, adminNote = '') {
  if (!databaseClient) {
    const current = mockApplications.find((item) => item.id === id) ?? mockApplications[0]
    return okResult({ ...current, status, admin_note: adminNote || current.admin_note, reviewed_at: new Date().toISOString() } as JoinApplication, '演示模式下已模拟名帖流转。')
  }

  try {
    const user = await requireCurrentUser()
    const payload = {
      status,
      admin_note: adminNote.trim() || null,
      reviewed_by: user.id,
      reviewed_at: new Date().toISOString()
    }
    const { data, error } = await databaseClient.from('join_applications').update(payload).eq('id', id).select('*').single()

    if (error) {
      throw error
    }

    const application = data as JoinApplication
    await createUserNotification({
      userId: application.user_id,
      kind: 'application',
      title: status === 'approved' ? '名帖已通过' : '名帖状态已更新',
      content: status === 'approved' ? '你的问云名帖已经通过审核，可在小院查看名册资料。' : '你的问云名帖状态已有更新，请到小院查看。',
      targetTable: 'join_applications',
      targetId: application.id
    })

    return okResult(application, '名帖状态已更新。')
  } catch (error) {
    return failResult(null, getErrorMessage(error, '更新名帖状态失败'))
  }
}

// 这个函数永久删除名帖，入参是名帖编号，返回值为空。
export async function deleteApplicationPermanently(id: string) {
  if (!databaseClient) {
    return okResult(null, '演示模式下已模拟删除名帖。')
  }

  try {
    const { error } = await databaseClient.from('join_applications').delete().eq('id', id)

    if (error) {
      throw error
    }

    return okResult(null, '名帖已永久删除。')
  } catch (error) {
    return failResult(null, getErrorMessage(error, '删除名帖失败'))
  }
}

// 这个函数更新云灯审核状态，入参是云灯编号和状态，返回值是更新后的云灯。
export async function updateLanternStatus(id: string, status: LanternStatus) {
  if (!databaseClient) {
    const current = mockLanterns.find((item) => item.id === id) ?? mockLanterns[0]
    return okResult({ ...current, status, reviewed_at: new Date().toISOString() } as CloudLantern, '演示模式下已模拟云灯审核。')
  }

  try {
    const user = await requireCurrentUser()
    const { data, error } = await databaseClient
      .from('cloud_lanterns')
      .update({ status, reviewed_by: user.id, reviewed_at: new Date().toISOString() })
      .eq('id', id)
      .select('*')
      .single()

    if (error) {
      throw error
    }

    const lantern = data as CloudLantern
    await createUserNotification({
      userId: lantern.created_by,
      kind: 'lantern',
      title: status === 'approved' ? '云灯已点亮' : '云灯状态已更新',
      content: status === 'approved' ? '你的云灯已经公开点亮。' : '你的云灯审核状态已有更新，请到小院查看。',
      targetTable: 'cloud_lanterns',
      targetId: lantern.id
    })

    return okResult(lantern, '云灯状态已更新。')
  } catch (error) {
    return failResult(null, getErrorMessage(error, '更新云灯状态失败'))
  }
}

// 这个函数创建公告，入参是公告表单，返回值是新公告。
export async function createAnnouncement(input: AnnouncementFormInput) {
  const payload = {
    title: input.title.trim(),
    slug: createSlug(input.title),
    category: input.category.trim() || '山门告示',
    summary: input.summary.trim() || null,
    content: input.content.trim(),
    cover_url: null,
    is_pinned: input.isPinned,
    status: input.status,
    published_at: input.status === 'published' ? new Date().toISOString() : null
  }

  if (!payload.title || !payload.content) {
    return failResult(null, '请填写公告标题和正文。')
  }

  if (!databaseClient) {
    return okResult({ id: `demo-announcement-${Date.now()}`, ...payload, created_by: mockProfile.id, created_at: new Date().toISOString(), updated_at: new Date().toISOString() } as Announcement, '演示模式下已模拟创建公告。')
  }

  try {
    const user = await requireCurrentUser()
    const { data, error } = await databaseClient.from('announcements').insert({ ...payload, created_by: user.id }).select('*').single()

    if (error) {
      throw error
    }

    return okResult(data as Announcement, '公告已创建。')
  } catch (error) {
    return failResult(null, getErrorMessage(error, '创建公告失败'))
  }
}

// 这个函数创建活动，入参是活动表单，返回值是新活动。
export async function createEvent(input: EventFormInput) {
  const capacity = input.capacity.trim() ? Number(input.capacity) : null
  const payload = {
    title: input.title.trim(),
    type: input.type.trim() || '清谈',
    mode: input.mode,
    location: input.location.trim() || null,
    event_time: input.eventTime.trim() || null,
    description: input.description.trim() || null,
    capacity,
    status: input.status,
    cover_url: null
  }

  if (!payload.title) {
    return failResult(null, '请填写雅集标题。')
  }

  if (capacity !== null && (Number.isNaN(capacity) || capacity <= 0)) {
    return failResult(null, '报名上限请填写大于 0 的数字，或留空表示不限。')
  }

  if (!databaseClient) {
    return okResult({ id: `demo-event-${Date.now()}`, ...payload, created_by: mockProfile.id, created_at: new Date().toISOString(), updated_at: new Date().toISOString() } as WenyunEvent, '演示模式下已模拟创建雅集。')
  }

  try {
    const user = await requireCurrentUser()
    const { data, error } = await databaseClient.from('events').insert({ ...payload, created_by: user.id }).select('*').single()

    if (error) {
      throw error
    }

    return okResult(data as WenyunEvent, '雅集已创建。')
  } catch (error) {
    return failResult(null, getErrorMessage(error, '创建雅集失败'))
  }
}

// 这个函数更新报名状态，入参是报名编号和状态，返回值是更新后的报名。
export async function updateEventRegistrationStatus(id: string, status: EventRegistrationStatus) {
  if (!databaseClient) {
    const current = mockRegistrations.find((item) => item.id === id) ?? mockRegistrations[0]
    return okResult({ ...current, status } as EventRegistration, '演示模式下已模拟报名流转。')
  }

  try {
    const { data, error } = await databaseClient.from('event_registrations').update({ status }).eq('id', id).select('*').single()

    if (error) {
      throw error
    }

    const registration = data as EventRegistration
    await createUserNotification({
      userId: registration.user_id,
      kind: 'event',
      title: '雅集报名状态已更新',
      content: '你的雅集报名状态已有更新，请到小院查看。',
      targetTable: 'event_registrations',
      targetId: registration.id
    })

    return okResult(registration, '报名状态已更新。')
  } catch (error) {
    return failResult(null, getErrorMessage(error, '更新报名状态失败'))
  }
}

// 这个函数读取执事权限用户，入参为空，返回值是可管理用户列表。
export async function fetchAdminRoleUsers() {
  if (!databaseClient) {
    return okResult(createMockRoleUsers(), '当前为演示执事名册。')
  }

  try {
    const { data, error } = await databaseClient.rpc('list_wenyun_role_users')

    if (error) {
      throw error
    }

    return okResult((data ?? []) as AdminRoleUser[])
  } catch (error) {
    return failResult(createMockRoleUsers(), getErrorMessage(error, '读取执事权限失败，已显示演示数据'))
  }
}

// 这个函数修改执事权限，入参是用户编号和角色，返回值是更新后的权限行。
export async function updateAdminUserRole(userId: string, role: ProfileRole) {
  if (!databaseClient) {
    const current = createMockRoleUsers().find((item) => item.user_id === userId) ?? createMockRoleUsers()[0]
    return okResult({ ...current, role }, '演示模式下已模拟权限修改。')
  }

  try {
    const { data, error } = await databaseClient.rpc('set_wenyun_user_role', {
      target_user_id: userId,
      next_role: role
    })

    if (error) {
      throw error
    }

    return okResult(data as AdminRoleUser, '执事权限已更新。')
  } catch (error) {
    return failResult(null, getErrorMessage(error, '更新执事权限失败'))
  }
}

// 这个函数修改用户登录账号，入参是账号表单，返回值是更新后的权限行。
export async function updateAdminUserAccount(input: AdminUserAccountUpdateInput) {
  if (!input.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email.trim())) {
    return failResult(null, '请填写正确的真实邮箱。')
  }

  if (!databaseClient) {
    const current = createMockRoleUsers().find((item) => item.user_id === input.user_id) ?? createMockRoleUsers()[0]
    return okResult({ ...current, email: input.email.trim().toLowerCase() }, '演示模式下已模拟账号修改。')
  }

  try {
    const { data, error } = await databaseClient.rpc('update_wenyun_user_account', {
      target_user_id: input.user_id,
      next_email: input.email.trim().toLowerCase(),
      next_password: input.password
    })

    if (error) {
      throw error
    }

    return okResult(data as AdminRoleUser, '登录账号已更新。')
  } catch (error) {
    return failResult(null, getErrorMessage(error, '更新登录账号失败'))
  }
}
