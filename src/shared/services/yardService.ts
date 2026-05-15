import { mockApplications, mockLanterns, mockNotifications, mockProfile, mockRegistrations } from '../../data/mockData'
import type {
  AccountSecurityInfo,
  EmailBindInput,
  EventRegistration,
  JoinApplication,
  PasswordUpdateInput,
  Profile,
  ProfileUpdateInput,
  RosterProfileUpdateInput,
  UserNotification,
  YardEventItem,
  YardOverview
} from '../../lib/types'
import { databaseClient } from './supabase'
import { failResult, getErrorMessage, okResult, requireCurrentUser } from './result'
import { fetchMyLatestWenxinQuizResult, fetchPublishedEvents, createUserNotification } from './publicService'
import { translateAuthError } from './authService'

// 这个函数判断邮箱是否为旧编号内部邮箱，入参是邮箱，返回值表示是否仍需绑定真实邮箱。
function isLegacyInternalEmail(email: string): boolean {
  return email.trim().toLowerCase().endsWith('@wenyun.local')
}

// 这个函数整理账号安全信息，入参是 Supabase 用户，返回值是页面可展示的数据。
function createAccountSecurityInfo(user: Awaited<ReturnType<typeof requireCurrentUser>>): AccountSecurityInfo {
  const email = user.email ?? ''

  return {
    email,
    is_legacy_email: isLegacyInternalEmail(email),
    pending_email: user.new_email ?? null,
    email_confirmed_at: user.email_confirmed_at ?? null
  }
}

// 这个函数从名帖里选择当前资料来源，入参是名帖列表，返回值是最适合展示的名帖或空值。
function pickMainApplication(applications: JoinApplication[]): JoinApplication | null {
  return [...applications].sort((left, right) => new Date(right.created_at).getTime() - new Date(left.created_at).getTime())[0] ?? null
}

// 这个函数合并资料和名帖，入参是资料和名帖，返回值是以名帖为准的资料。
function mergeProfileWithRoster(profile: Profile, applications: JoinApplication[]): Profile {
  const application = pickMainApplication(applications)

  if (!application) {
    return profile
  }

  return {
    ...profile,
    nickname: application.nickname.trim() || profile.nickname,
    city: application.public_region ?? application.city ?? profile.city
  }
}

// 这个函数读取当前用户资料，入参为空，返回值是小院资料。
export async function fetchMyProfile() {
  if (!databaseClient) {
    return okResult(mergeProfileWithRoster(mockProfile, mockApplications.filter((item) => item.user_id === mockProfile.id)), '当前为演示小院资料。')
  }

  try {
    const user = await requireCurrentUser()
    const { data, error } = await databaseClient.from('profiles').select('*').eq('id', user.id).single()

    if (error) {
      throw error
    }

    const applications = await fetchMyApplications()

    return okResult(mergeProfileWithRoster(data as Profile, applications.data))
  } catch (error) {
    return failResult(mockProfile, getErrorMessage(error, '读取小院资料失败'))
  }
}

// 这个函数保存当前用户展示资料，入参是资料表单，返回值是保存后的资料。
export async function updateMyProfile(input: ProfileUpdateInput) {
  const payload = {
    avatar_url: input.avatar_url.trim() || null,
    bio: input.bio.trim() || null,
    is_public: input.is_public
  }

  if (!databaseClient) {
    return okResult({ ...mockProfile, ...payload, updated_at: new Date().toISOString() }, '演示模式下已模拟保存资料。')
  }

  try {
    const user = await requireCurrentUser()
    const { data, error } = await databaseClient.from('profiles').update(payload).eq('id', user.id).select('*').single()

    if (error) {
      throw error
    }

    const applications = await fetchMyApplications()

    return okResult(mergeProfileWithRoster(data as Profile, applications.data), '小院资料已保存。')
  } catch (error) {
    return failResult(mockProfile, getErrorMessage(error, '保存小院资料失败'))
  }
}

// 这个函数读取当前用户名帖，入参为空，返回值是本人名帖列表。
export async function fetchMyApplications() {
  if (!databaseClient) {
    return okResult(mockApplications.filter((item) => item.user_id === mockProfile.id), '当前为演示名帖。')
  }

  try {
    const user = await requireCurrentUser()
    const { data, error } = await databaseClient.from('join_applications').select('*').eq('user_id', user.id).order('created_at', { ascending: false })

    if (error) {
      throw error
    }

    return okResult((data ?? []) as JoinApplication[])
  } catch (error) {
    return failResult([], getErrorMessage(error, '读取我的名帖失败'))
  }
}

// 这个函数保存当前用户的名册公开资料，入参是小院表单，返回值是更新后的名帖。
export async function updateMyRosterProfile(input: RosterProfileUpdateInput) {
  if (!databaseClient) {
    const current = mockApplications.find((item) => item.id === input.application_id) ?? null

    if (!current) {
      return failResult(null, '没有找到可维护的名帖。')
    }

    return okResult(
      {
        ...current,
        jianghu_name: input.jianghu_name.trim() || null,
        gender: input.gender,
        city: input.city.trim() || null,
        public_region: input.city.trim() || null,
        motto: input.motto.trim() || current.motto,
        tags: input.hobbies.trim() || null,
        companion_expectation: input.companion_expectation.trim() || null,
        requested_nickname: input.requested_nickname.trim() || null,
        requested_legacy_contact: input.requested_legacy_contact.trim() || null,
        requested_at: input.requested_nickname.trim() || input.requested_legacy_contact.trim() ? new Date().toISOString() : null
      },
      '演示模式下已模拟保存名册资料。'
    )
  }

  try {
    const { data, error } = await databaseClient.rpc('update_my_roster_profile', {
      target_application_id: input.application_id,
      next_jianghu_name: input.jianghu_name.trim(),
      next_gender: input.gender,
      next_city: input.city.trim(),
      next_motto: input.motto.trim(),
      next_hobbies: input.hobbies.trim(),
      next_companion_expectation: input.companion_expectation.trim(),
      requested_dao_name: input.requested_nickname.trim(),
      requested_contact: input.requested_legacy_contact.trim()
    })

    if (error) {
      throw error
    }

    return okResult(data as JoinApplication, '名册资料已保存；如申请了道名或联系方式变更，将等待管理员审核。')
  } catch (error) {
    return failResult(null, getErrorMessage(error, '保存名册资料失败'))
  }
}

// 这个函数读取当前用户云灯，入参为空，返回值是本人云灯列表。
export async function fetchMyLanterns() {
  if (!databaseClient) {
    return okResult(mockLanterns.filter((item) => item.created_by), '当前为演示云灯。')
  }

  try {
    const user = await requireCurrentUser()
    const { data, error } = await databaseClient.from('cloud_lanterns').select('*').eq('created_by', user.id).order('created_at', { ascending: false })

    if (error) {
      throw error
    }

    return okResult(data ?? [])
  } catch (error) {
    return failResult([], getErrorMessage(error, '读取我的云灯失败'))
  }
}

// 这个函数读取当前用户报名，入参为空，返回值是本人报名列表。
export async function fetchMyRegistrations() {
  if (!databaseClient) {
    return okResult(mockRegistrations, '当前为演示雅集报名。')
  }

  try {
    const user = await requireCurrentUser()
    const { data, error } = await databaseClient.from('event_registrations').select('*').eq('user_id', user.id).order('created_at', { ascending: false })

    if (error) {
      throw error
    }

    return okResult((data ?? []) as EventRegistration[])
  } catch (error) {
    return failResult([], getErrorMessage(error, '读取我的雅集报名失败'))
  }
}

// 这个函数读取当前用户提醒，入参为空，返回值是本人站内提醒。
export async function fetchMyNotifications() {
  if (!databaseClient) {
    return okResult(mockNotifications, '当前为演示提醒。')
  }

  try {
    const user = await requireCurrentUser()
    const { data, error } = await databaseClient.from('user_notifications').select('*').eq('user_id', user.id).order('created_at', { ascending: false })

    if (error) {
      throw error
    }

    return okResult((data ?? []) as UserNotification[])
  } catch (error) {
    return failResult([], getErrorMessage(error, '读取小院提醒失败'))
  }
}

// 这个函数读取小院总览，入参为空，返回值是任务册首页需要的整包数据。
export async function fetchYardOverview() {
  const [profileResult, applicationResult, lanternResult, registrationResult, notificationResult, quizResult] = await Promise.all([
    fetchMyProfile(),
    fetchMyApplications(),
    fetchMyLanterns(),
    fetchMyRegistrations(),
    fetchMyNotifications(),
    fetchMyLatestWenxinQuizResult()
  ])

  return {
    ok: profileResult.ok && applicationResult.ok && lanternResult.ok && registrationResult.ok && notificationResult.ok && quizResult.ok,
    data: {
      profile: mergeProfileWithRoster(profileResult.data, applicationResult.data),
      applications: applicationResult.data,
      lanterns: lanternResult.data,
      registrations: registrationResult.data,
      notifications: notificationResult.data,
      quizResult: quizResult.data
    } as YardOverview,
    message: profileResult.message,
    demoMode: profileResult.demoMode
  }
}

// 这个函数读取小院可报名活动，入参为空，返回值包含活动和本人报名状态。
export async function fetchYardEvents() {
  const [eventResult, registrationResult] = await Promise.all([fetchPublishedEvents(), fetchMyRegistrations()])
  const items = eventResult.data.map((event) => ({
    event,
    registration: registrationResult.data.find((item) => item.event_id === event.id) ?? null
  }))

  return {
    ok: eventResult.ok && registrationResult.ok,
    data: items as YardEventItem[],
    message: eventResult.message,
    demoMode: eventResult.demoMode
  }
}

// 这个函数报名雅集，入参是活动编号和备注，返回值是报名记录。
export async function registerForEvent(eventId: string, note: string) {
  if (!databaseClient) {
    return okResult(mockRegistrations.find((item) => item.event_id === eventId) ?? mockRegistrations[0] ?? null, '演示模式下已模拟报名。')
  }

  try {
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

    const { data, error } = await databaseClient.from('event_registrations').upsert(payload, { onConflict: 'event_id,user_id' }).select('*').single()

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

// 这个函数取消雅集报名，入参是报名编号，返回值是更新后的报名。
export async function cancelEventRegistration(id: string) {
  if (!databaseClient) {
    const current = mockRegistrations.find((item) => item.id === id) ?? null
    return okResult(current ? { ...current, status: 'cancelled' } : null, '演示模式下已模拟取消报名。')
  }

  try {
    const { data, error } = await databaseClient.from('event_registrations').update({ status: 'cancelled' }).eq('id', id).select('*').single()

    if (error) {
      throw error
    }

    return okResult(data as EventRegistration, '雅集报名已取消。')
  } catch (error) {
    return failResult(null, getErrorMessage(error, '取消雅集报名失败'))
  }
}

// 这个函数标记提醒已读，入参是提醒编号，返回值是更新后的提醒。
export async function markNotificationRead(id: string) {
  if (!databaseClient) {
    const current = mockNotifications.find((item) => item.id === id) ?? null
    return okResult(current ? { ...current, read_at: new Date().toISOString() } : null, '演示模式下已模拟已读。')
  }

  try {
    const { data, error } = await databaseClient.from('user_notifications').update({ read_at: new Date().toISOString() }).eq('id', id).select('*').single()

    if (error) {
      throw error
    }

    return okResult(data as UserNotification, '提醒已标记为已读。')
  } catch (error) {
    return failResult(null, getErrorMessage(error, '标记提醒失败'))
  }
}

// 这个函数读取账号安全信息，入参为空，返回值是登录邮箱和确认状态。
export async function fetchMyAccountSecurity() {
  if (!databaseClient) {
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
    const user = await requireCurrentUser()

    return okResult(createAccountSecurityInfo(user), '账号安全信息已读取。')
  } catch (error) {
    return failResult({ email: '', is_legacy_email: false, pending_email: null, email_confirmed_at: null }, translateAuthError(error))
  }
}

// 这个函数修改当前账号密码，入参是新密码和确认密码，返回值表示是否成功。
export async function updateMyPassword(input: PasswordUpdateInput) {
  if (input.new_password !== input.confirm_password) {
    return failResult(null, '两次输入的新密码不一致，请重新填写。')
  }

  if (!input.new_password) {
    return failResult(null, '新密码不能为空。')
  }

  if (!databaseClient) {
    return okResult(null, '演示模式下已模拟修改密码。')
  }

  try {
    await requireCurrentUser()
    const { error } = await databaseClient.auth.updateUser({ password: input.new_password })

    if (error) {
      throw error
    }

    return okResult(null, '密码已修改成功。')
  } catch (error) {
    return failResult(null, translateAuthError(error))
  }
}

// 这个函数绑定或更换当前账号邮箱，入参是真实邮箱，返回值是更新后的账号安全信息。
export async function bindMyEmail(input: EmailBindInput) {
  const email = input.email.trim().toLowerCase()

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return failResult({ email: '', is_legacy_email: false, pending_email: null, email_confirmed_at: null }, '请填写正确的邮箱地址。')
  }

  if (isLegacyInternalEmail(email)) {
    return failResult({ email: '', is_legacy_email: true, pending_email: null, email_confirmed_at: null }, '请绑定真实邮箱，不要填写旧编号内部邮箱。')
  }

  if (!databaseClient) {
    return okResult({ email, is_legacy_email: false, pending_email: null, email_confirmed_at: new Date().toISOString() }, '演示模式下已模拟绑定邮箱。')
  }

  try {
    const { data, error } = await databaseClient.rpc('bind_current_user_email', { new_email: email })

    if (error) {
      throw error
    }

    const result = data as { ok?: boolean; message?: string; email?: string } | null

    if (!result?.ok) {
      throw new Error(result?.message ?? '绑定邮箱失败，请确认数据库函数已部署。')
    }

    return okResult({ email: result.email ?? email, is_legacy_email: false, pending_email: null, email_confirmed_at: new Date().toISOString() }, result.message ?? '邮箱已绑定成功。')
  } catch (error) {
    return failResult({ email: '', is_legacy_email: false, pending_email: null, email_confirmed_at: null }, translateAuthError(error))
  }
}

// 这个函数确认本人已进入归云堂，入参是名帖编号，返回值是更新后的名帖。
export async function confirmMyGuiyuntangJoined(id: string) {
  if (!databaseClient) {
    const current = mockApplications.find((item) => item.id === id) ?? null
    return okResult(current ? { ...current, guiyuntang_joined: true, guiyuntang_joined_at: new Date().toISOString() } : null, '演示模式下已模拟确认入群。')
  }

  try {
    const { data, error } = await databaseClient.rpc('confirm_my_guiyuntang_joined', {
      target_application_id: id
    })

    if (error) {
      throw error
    }

    return okResult(data as JoinApplication, '已记录你进入归云堂。')
  } catch (error) {
    return failResult(null, getErrorMessage(error, '确认入群失败'))
  }
}
