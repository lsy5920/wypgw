// 这个类型表示入派申请在后台审核时可能出现的状态。
export type JoinApplicationStatus = 'pending' | 'approved' | 'rejected' | 'contacted' | 'joined'

// 这个类型表示云灯留言在审核流程中的状态。
export type LanternStatus = 'pending' | 'approved' | 'rejected'

// 这个类型表示公告和活动的发布状态。
export type PublishStatus = 'draft' | 'published' | 'closed' | 'ended'

// 这个类型表示当前登录账号在问云派后台中的身份。
export type ProfileRole = 'visitor' | 'applicant' | 'member' | 'guardian' | 'admin' | 'founder'

// 这个接口描述成员资料，入参来自 Supabase profiles 表，返回给前端用于判断权限和展示。
export interface Profile {
  // 资料唯一编号，对应 Supabase Auth 用户编号。
  id: string
  // 用户公开昵称，用于后台和成员展示。
  nickname: string
  // 用户头像地址，没有头像时可以为空。
  avatar_url: string | null
  // 用户身份，用于判断是否能进入后台。
  role: ProfileRole
  // 所在城市，用于后续线下雅集参考。
  city: string | null
  // 个人简介，用于同门风采扩展。
  bio: string | null
  // 是否公开展示资料，默认不公开以保护隐私。
  is_public: boolean
  // 创建时间，用于后台排序。
  created_at: string
  // 更新时间，用于后台审计。
  updated_at: string
}

// 这个接口描述入派申请表单与后台列表的数据结构。
export interface JoinApplication {
  // 申请唯一编号，由数据库生成。
  id: string
  // 申请人在群内想使用的昵称。
  nickname: string
  // 微信号属于敏感联系方式，只在后台展示。
  wechat_id: string
  // 年龄段用于基本了解，不强制填写。
  age_range: string | null
  // 所在城市用于后续线下活动参考。
  city: string | null
  // 申请理由是审核时最重要的文字。
  reason: string
  // 是否认同门规，必须为真才允许提交。
  accept_rules: boolean
  // 是否愿意参加线下活动，用于未来规划。
  offline_interest: string | null
  // 备注用于补充说明。
  remark: string | null
  // 审核状态，用于后台流转。
  status: JoinApplicationStatus
  // 管理员备注，只在后台可见。
  admin_note: string | null
  // 审核人编号，未审核时为空。
  reviewed_by: string | null
  // 审核时间，未审核时为空。
  reviewed_at: string | null
  // 提交时间，用于排序。
  created_at: string
}

// 这个接口描述入派申请提交时需要传入的字段。
export interface JoinApplicationInput {
  // 申请昵称，不能为空。
  nickname: string
  // 微信号，不能为空。
  wechat_id: string
  // 年龄段，可为空。
  age_range: string
  // 所在城市，可为空。
  city: string
  // 申请理由，不能为空。
  reason: string
  // 是否认同门规，必须勾选。
  accept_rules: boolean
  // 线下活动意愿，可为空。
  offline_interest: string
  // 备注，可为空。
  remark: string
}

// 这个接口描述云灯留言的展示和审核数据。
export interface CloudLantern {
  // 留言唯一编号，由数据库生成。
  id: string
  // 作者显示名，匿名时展示“匿名同门”。
  author_name: string
  // 留言正文，是云灯最核心的内容。
  content: string
  // 心情标签，用于前台氛围展示。
  mood: string | null
  // 是否匿名展示。
  is_anonymous: boolean
  // 审核状态，只有 approved 才公开展示。
  status: LanternStatus
  // 创建人编号，游客提交时可以为空。
  created_by: string | null
  // 审核人编号，未审核时为空。
  reviewed_by: string | null
  // 审核时间，未审核时为空。
  reviewed_at: string | null
  // 创建时间，用于排序。
  created_at: string
}

// 这个接口描述云灯留言提交时需要传入的字段。
export interface CloudLanternInput {
  // 作者名称，可为空，空值会按匿名处理。
  author_name: string
  // 留言正文，不能为空。
  content: string
  // 心情标签，可为空。
  mood: string
  // 是否匿名展示。
  is_anonymous: boolean
}

// 这个接口描述公告列表和公告管理的数据。
export interface Announcement {
  // 公告唯一编号。
  id: string
  // 公告标题。
  title: string
  // 公告地址别名，用于后续详情页扩展。
  slug: string
  // 公告分类，例如山门公告、门规更新。
  category: string
  // 公告摘要，用于列表展示。
  summary: string | null
  // 公告正文。
  content: string
  // 封面图地址，可为空。
  cover_url: string | null
  // 是否置顶。
  is_pinned: boolean
  // 发布状态。
  status: PublishStatus
  // 发布时间。
  published_at: string | null
  // 创建人编号。
  created_by: string | null
  // 创建时间。
  created_at: string
  // 更新时间。
  updated_at: string
}

// 这个接口描述问云雅集活动的数据。
export interface WenyunEvent {
  // 活动唯一编号。
  id: string
  // 活动标题。
  title: string
  // 活动类型，例如清谈、茶会、读书会。
  type: string
  // 活动方式，线上或线下。
  mode: 'online' | 'offline'
  // 活动地点，线上活动可以写微信群。
  location: string | null
  // 活动时间，可为空。
  event_time: string | null
  // 活动简介。
  description: string | null
  // 报名上限，可为空。
  capacity: number | null
  // 发布状态。
  status: PublishStatus
  // 封面图地址，可为空。
  cover_url: string | null
  // 创建人编号。
  created_by: string | null
  // 创建时间。
  created_at: string
  // 更新时间。
  updated_at: string
}

// 这个接口描述站点设置项，后台可以按键值维护。
export interface SiteSetting {
  // 设置项名称，例如 contact_wechat。
  key: string
  // 设置项内容，使用 JSON 保存，方便后续扩展。
  value: Record<string, unknown>
  // 更新人编号。
  updated_by: string | null
  // 更新时间。
  updated_at: string
}

// 这个接口描述所有接口函数统一返回的结果。
export interface ApiResult<T> {
  // 是否执行成功。
  ok: boolean
  // 成功时返回的数据。
  data: T
  // 失败时返回的中文错误说明。
  message: string
  // 是否处于本地演示模式。
  demoMode: boolean
}
