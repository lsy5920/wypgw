import {
  mockAnnouncements,
  mockApplications,
  mockEvents,
  mockLanterns,
  mockProfile,
  mockQuizResults,
  mockRosterEntries
} from '../../data/mockData'
import type {
  Announcement,
  CloudLantern,
  CloudLanternInput,
  JoinApplication,
  JoinApplicationInput,
  RosterEntry,
  WenxinQuizResult,
  WenxinQuizSubmitInput,
  WenyunEvent
} from '../../lib/types'
import { createNextMemberCode, createSlug } from './validators'
import { databaseClient } from './supabase'
import { failResult, getErrorMessage, okResult, requireCurrentUser } from './result'

// 这个函数创建空名帖兜底对象，入参为空，返回值用于提交失败时保持类型稳定。
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
    member_role: '同门',
    generation_name: '云',
    member_code: null,
    roster_serial: null,
    public_region: null,
    raw_region: null,
    motto: null,
    tags: null,
    companion_expectation: null,
    legacy_contact: null,
    requested_nickname: null,
    requested_legacy_contact: null,
    requested_at: null,
    joined_at: null,
    guiyuntang_joined: false,
    guiyuntang_joined_at: null,
    guiyuntang_joined_by: null,
    status: 'pending',
    admin_note: null,
    reviewed_by: null,
    reviewed_at: null,
    created_at: new Date().toISOString()
  }
}

// 这个函数创建空云灯兜底对象，入参为空，返回值用于提交失败时保持类型稳定。
function createEmptyLantern(): CloudLantern {
  return {
    id: '',
    author_name: '匿名同门',
    content: '',
    mood: null,
    is_anonymous: true,
    status: 'pending',
    created_by: null,
    reviewed_by: null,
    reviewed_at: null,
    created_at: new Date().toISOString()
  }
}

// 这个函数给用户写入站内提醒，入参是提醒内容，返回值为空。
export async function createUserNotification(input: {
  // 接收提醒的用户编号。
  userId: string | null | undefined
  // 提醒所属模块。
  kind: 'application' | 'lantern' | 'event'
  // 提醒标题。
  title: string
  // 提醒正文。
  content: string
  // 关联表名。
  targetTable: string
  // 关联数据编号。
  targetId: string
}) {
  // 这里没有真实数据库或没有用户编号时直接跳过，避免主流程被提醒系统拖垮。
  if (!databaseClient || !input.userId) {
    return
  }

  try {
    const { data, error } = await databaseClient
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

    // 这里尝试发送邮件，失败只记录，不影响主流程。
    const { error: functionError } = await databaseClient.functions.invoke('send-user-notice', {
      body: { notificationId: data.id }
    })

    if (functionError) {
      await databaseClient
        .from('user_notifications')
        .update({
          email_status: 'failed',
          email_error: functionError.message
        })
        .eq('id', data.id)
    }
  } catch {
    // 这里故意吞掉提醒异常，避免提醒失败影响审核、报名和提交。
  }
}

// 这个函数读取公开云灯，入参为空，返回值是已审核公开的云灯。
export async function fetchApprovedLanterns() {
  if (!databaseClient) {
    return okResult(mockLanterns, '当前为演示云灯。')
  }

  try {
    const { data, error } = await databaseClient.from('cloud_lanterns').select('*').eq('status', 'approved').order('created_at', { ascending: false })

    if (error) {
      throw error
    }

    return okResult((data ?? []) as CloudLantern[])
  } catch (error) {
    return failResult(mockLanterns, getErrorMessage(error, '读取云灯失败，已显示演示数据'))
  }
}

// 这个函数提交云灯，入参是云灯表单，返回值是写入后的云灯。
export async function submitCloudLantern(input: CloudLanternInput) {
  // 这个对象保存写入云灯表的数据，默认进入待审核。
  const payload = {
    author_name: input.is_anonymous ? '匿名同门' : input.author_name.trim() || '匿名同门',
    content: input.content.trim(),
    mood: input.mood.trim() || null,
    is_anonymous: input.is_anonymous,
    status: 'pending'
  }

  if (!databaseClient) {
    return okResult(
      {
        id: `demo-lantern-${Date.now()}`,
        ...payload,
        status: 'pending',
        created_by: mockProfile.id,
        reviewed_by: null,
        reviewed_at: null,
        created_at: new Date().toISOString()
      } as CloudLantern,
      '演示模式下已模拟点灯。'
    )
  }

  try {
    const user = await requireCurrentUser()
    const { data, error } = await databaseClient.from('cloud_lanterns').insert({ ...payload, created_by: user.id }).select('*').single()

    if (error) {
      throw error
    }

    const lantern = data as CloudLantern
    await createUserNotification({
      userId: user.id,
      kind: 'lantern',
      title: '云灯已送至山门',
      content: '你的云灯已进入待审核状态，云纪执事查看后会决定是否公开。',
      targetTable: 'cloud_lanterns',
      targetId: lantern.id
    })

    return okResult(lantern, '云灯已送至山门，待审核后公开。')
  } catch (error) {
    return failResult({ ...createEmptyLantern(), ...payload } as CloudLantern, getErrorMessage(error, '提交云灯失败'))
  }
}

// 这个函数读取公开名册，入参为空，返回值是不含敏感字段的名册条目。
export async function fetchPublicRoster() {
  if (!databaseClient) {
    return okResult(mockRosterEntries, '当前为演示名册。')
  }

  try {
    const { data, error } = await databaseClient.from('roster_entries').select('*').order('member_code', { ascending: true })

    if (error) {
      throw error
    }

    return okResult((data ?? []) as RosterEntry[])
  } catch (error) {
    return failResult(mockRosterEntries, getErrorMessage(error, '读取问云名册失败，已显示演示名册'))
  }
}

// 这个函数读取当前用户最新问云考核结果，入参为空，返回值是最新成绩或空值。
export async function fetchMyLatestWenxinQuizResult() {
  if (!databaseClient) {
    return okResult(mockQuizResults[0] ?? null, '当前为演示问云考核结果。')
  }

  try {
    const user = await requireCurrentUser()
    const { data, error } = await databaseClient
      .from('wenxin_quiz_results')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (error) {
      throw error
    }

    return okResult((data as WenxinQuizResult | null) ?? null, data ? '最新问云考核结果已读取。' : '尚未参加问云考核。')
  } catch (error) {
    return failResult(null, getErrorMessage(error, '读取问云考核结果失败'))
  }
}

// 这个函数提交问云考核结果，入参是计分结果，返回值是保存后的成绩。
export async function submitWenxinQuizResult(input: WenxinQuizSubmitInput) {
  const payload = {
    score: input.score,
    total_score: input.total_score,
    passed: input.passed,
    single_correct: input.single_correct,
    multiple_correct: input.multiple_correct,
    answers: input.answers
  }

  if (!databaseClient) {
    return okResult(
      {
        id: `demo-quiz-${Date.now()}`,
        user_id: mockProfile.id,
        ...payload,
        created_at: new Date().toISOString()
      },
      input.passed ? '演示模式下已记录合格成绩。' : '演示模式下已记录本次考核。'
    )
  }

  try {
    const user = await requireCurrentUser()
    const { data, error } = await databaseClient.from('wenxin_quiz_results').insert({ ...payload, user_id: user.id }).select('*').single()

    if (error) {
      throw error
    }

    return okResult(data as WenxinQuizResult, input.passed ? '问云考核已合格，可以递交名帖。' : '问云考核已记录，建议重读金典后再试。')
  } catch (error) {
    return failResult(null, getErrorMessage(error, '提交问云考核失败'))
  }
}

// 这个函数提交名帖，入参是名帖表单，返回值是写入后的名帖。
export async function submitJoinApplication(input: JoinApplicationInput) {
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
    member_role: '同门',
    generation_name: '云',
    public_region: input.public_region.trim() || input.city.trim() || null,
    raw_region: input.public_region.trim() || input.city.trim() || null,
    motto: input.motto.trim(),
    tags: input.tags.trim() || null,
    companion_expectation: input.companion_expectation.trim() || null,
    legacy_contact: input.legacy_contact.trim(),
    status: 'pending'
  }

  if (!databaseClient) {
    return okResult(
      {
        ...createEmptyApplication(),
        id: `demo-application-${Date.now()}`,
        user_id: mockProfile.id,
        ...payload,
        member_code: createNextMemberCode(mockApplications.map((item) => item.member_code), '云'),
        created_at: new Date().toISOString()
      } as JoinApplication,
      '演示模式下已模拟递交名帖。'
    )
  }

  try {
    const user = await requireCurrentUser()
    const { data: existingApplication, error: existingError } = await databaseClient
      .from('join_applications')
      .select('id,status')
      .eq('user_id', user.id)
      .limit(1)
      .maybeSingle()

    if (existingError) {
      throw existingError
    }

    if (existingApplication) {
      throw new Error('每个账号只能提交一份名帖，请到问云小院查看或维护。')
    }

    const quizResult = await fetchMyLatestWenxinQuizResult()

    if (!quizResult.data?.passed) {
      throw new Error('请先完成问云考核并达到 80 分以上，再递交名帖。')
    }

    const { data, error } = await databaseClient.from('join_applications').insert({ ...payload, user_id: user.id }).select('*').single()

    if (error) {
      throw error
    }

    const application = data as JoinApplication
    await createUserNotification({
      userId: user.id,
      kind: 'application',
      title: '名帖已送至山门',
      content: '你的问云名帖已进入待审核状态，掌门或云纪执事查看后会更新状态。',
      targetTable: 'join_applications',
      targetId: application.id
    })

    return okResult(application, '名帖已送至山门，等待执事审核。')
  } catch (error) {
    return failResult({ ...createEmptyApplication(), ...payload } as JoinApplication, getErrorMessage(error, '提交名帖失败'))
  }
}

// 这个函数读取公开公告，入参为空，返回值是已发布公告。
export async function fetchPublishedAnnouncements() {
  if (!databaseClient) {
    return okResult(mockAnnouncements, '当前为演示公告。')
  }

  try {
    const { data, error } = await databaseClient
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

// 这个函数读取公开活动，入参为空，返回值是已发布雅集。
export async function fetchPublishedEvents() {
  if (!databaseClient) {
    return okResult(mockEvents, '当前为演示活动。')
  }

  try {
    const { data, error } = await databaseClient.from('events').select('*').eq('status', 'published').order('event_time', { ascending: true })

    if (error) {
      throw error
    }

    return okResult((data ?? []) as WenyunEvent[])
  } catch (error) {
    return failResult(mockEvents, getErrorMessage(error, '读取雅集失败，已显示演示活动'))
  }
}

// 这个函数创建公告地址别名，入参是标题，返回值是稳定别名。
export { createSlug }
