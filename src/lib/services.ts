import { supabase, supabaseReady } from './supabaseClient'
import { createNextMemberCode, createSlug } from './validators'
import {
  mockAnnouncements,
  mockApplications,
  mockEvents,
  mockLanterns,
  mockRosterEntries,
  mockSettings
} from '../data/mockData'
import type {
  Announcement,
  ApiResult,
  CloudLantern,
  CloudLanternInput,
  JoinApplication,
  JoinApplicationInput,
  JoinApplicationStatus,
  JoinApplicationUpdateInput,
  LanternStatus,
  RosterEntry,
  SiteSetting,
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

// 这个函数把未知异常转换为中文说明，入参是异常对象，返回值是可展示给用户的文字。
function getErrorMessage(error: unknown, fallback: string): string {
  // 这里处理常见 Error 对象，优先展示真实错误信息。
  if (error instanceof Error && error.message) {
    return `${fallback}：${error.message}`
  }

  return fallback
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
    // 这里写入云灯表，RLS 会保证游客只能新增不能乱读后台数据。
    const { data, error } = await supabase.from('cloud_lanterns').insert(payload).select('*').single()

    if (error) {
      throw error
    }

    return okResult(data as CloudLantern, '云灯已送至山门，待执事审核后公开。')
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

// 这个函数提交入派申请，入参是申请表单，返回值是申请记录。
export async function submitJoinApplication(input: JoinApplicationInput): Promise<ApiResult<JoinApplication>> {
  // 这个对象是写入数据库的数据，敏感微信号只进入后台表。
  const payload = {
    nickname: input.nickname.trim(),
    wechat_id: input.wechat_id.trim(),
    age_range: input.age_range.trim() || null,
    gender: input.gender,
    city: input.city.trim() || null,
    reason: input.reason.trim(),
    accept_rules: input.accept_rules,
    offline_interest: input.offline_interest.trim() || null,
    remark: input.remark.trim() || null,
    member_role: '同门',
    generation_name: '云',
    status: 'pending'
  }

  // 这里在演示模式下模拟提交成功，方便没有数据库时体验完整流程。
  if (!supabase) {
    return okResult(
      {
        id: `demo-application-${Date.now()}`,
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
    // 这里写入入派申请表，游客只能新增，不能读取别人的申请。
    const { data, error } = await supabase.from('join_applications').insert(payload).select('*').single()

    if (error) {
      throw error
    }

    return okResult(data as JoinApplication, '入派帖已送至山门，执事查看后会择时联系。')
  } catch (error) {
    return failResult(
      {
        id: '',
        ...payload,
        status: 'pending',
        admin_note: null,
        reviewed_by: null,
        reviewed_at: null,
        created_at: new Date().toISOString()
      } as JoinApplication,
      getErrorMessage(error, '提交入派申请失败')
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

// 这个函数读取后台入派申请，入参为空，返回值是全部申请列表。
export async function fetchAdminApplications(): Promise<ApiResult<JoinApplication[]>> {
  if (!supabase) {
    return okResult(mockApplications, '当前为后台演示数据。')
  }

  try {
    // 这里读取全部申请，实际权限由 RLS 限制为管理员可读。
    const { data, error } = await supabase
      .from('join_applications')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      throw error
    }

    return okResult((data ?? []) as JoinApplication[])
  } catch (error) {
    return failResult([], getErrorMessage(error, '读取入派申请失败，请确认当前账号是管理员'))
  }
}

// 这个函数更新入派申请状态，入参是申请编号、状态和备注，返回值是更新后的申请。
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
    // 这里更新审核状态，并记录审核时间和备注。
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

    return okResult(data as JoinApplication, '入派申请状态已更新。')
  } catch (error) {
    return failResult(null, getErrorMessage(error, '更新入派申请失败'))
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
    wechat_id: input.wechat_id.trim(),
    age_range: input.age_range.trim() || null,
    gender: input.gender,
    city: input.city.trim() || null,
    reason: input.reason.trim(),
    accept_rules: input.accept_rules,
    offline_interest: input.offline_interest.trim() || null,
    remark: input.remark.trim() || null,
    admin_note: input.admin_note.trim() || null,
    member_role: input.member_role,
    generation_name: input.generation_name.trim() || '云',
    member_code: input.member_code.trim(),
    status: input.status,
    reviewed_at: new Date().toISOString()
  }

  // 这里演示模式只返回本地拼装结果，不会真正保存。
  if (!supabase) {
    const current = mockApplications.find((item) => item.id === id) ?? null
    return okResult(current ? { ...current, ...payload } : null, '演示模式下已模拟保存名册。')
  }

  try {
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

    return okResult(data as JoinApplication, '名册资料已保存。')
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

    return okResult(data as CloudLantern, '云灯审核状态已更新。')
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
