// 这个类型表示名帖在后台审核时可能出现的状态。
export type JoinApplicationStatus = 'pending' | 'approved' | 'rejected' | 'contacted' | 'joined' | 'draft' | 'retired'

// 这个类型表示名册公开展示的性别选项。
export type MemberGender = '男' | '女'

// 这个类型表示问云名册中的公开身份，普通用户默认是同门，只能由管理员调整。
export type WenyunMemberRole = '掌门' | '执事' | '护灯人' | '同门'

// 这个类型表示云灯留言在审核流程中的状态。
export type LanternStatus = 'pending' | 'approved' | 'rejected'

// 这个类型表示公告和活动的发布状态。
export type PublishStatus = 'draft' | 'published' | 'closed' | 'ended'

// 这个类型表示活动报名状态。
export type EventRegistrationStatus = 'registered' | 'cancelled' | 'attended'

// 这个类型表示用户站内提醒所属的业务模块。
export type UserNotificationKind = 'application' | 'lantern' | 'event'

// 这个类型表示提醒邮件的发送状态。
export type NotificationEmailStatus = 'pending' | 'sent' | 'failed' | 'skipped'

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

// 这个类型表示执事管理页面可以授予或撤回的后台身份。
export type StewardManageableRole = 'member' | 'admin'

// 这个接口描述执事管理页面展示的用户行，入参来自 Supabase 安全函数，返回值用于后台列表。
export interface AdminRoleUser {
  // 用户唯一编号，对应 Supabase Auth 用户编号。
  user_id: string
  // 用户登录邮箱，用于超级管理员搜索和识别账号。
  email: string
  // 小院昵称，用于后台展示。
  nickname: string
  // 当前后台角色。
  role: ProfileRole
  // 所在城市，可为空。
  city: string | null
  // 是否公开资料。
  is_public: boolean
  // 资料创建时间。
  created_at: string
  // 名册编号，可为空。
  member_code: string | null
  // 道名，可为空。
  dao_name: string | null
}

// 这个接口描述超级管理员在执事管理里修改登录账号时提交的字段。
export interface AdminUserAccountUpdateInput {
  // 目标用户编号，对应 Supabase Auth 用户编号。
  user_id: string
  // 新绑定邮箱，必须是真实邮箱，不能是旧编号内部邮箱。
  email: string
  // 新密码，可为空；为空表示只修改邮箱，不重置密码。
  password: string
}

// 这个类型描述问心考核答案，键是题号，值是用户选择的选项编号。
export type WenxinQuizAnswerMap = Record<string, string[]>

// 这个接口描述问心考核结果，入参来自 Supabase wenxin_quiz_results 表，返回值用于小院、后台和登记门槛判断。
export interface WenxinQuizResult {
  // 结果唯一编号，由数据库生成。
  id: string
  // 提交考核的用户编号。
  user_id: string
  // 本次得分。
  score: number
  // 试卷总分，当前固定为 100。
  total_score: number
  // 是否达到自动登记门槛。
  passed: boolean
  // 单选题答对数量。
  single_correct: number
  // 多选题答对数量。
  multiple_correct: number
  // 用户每题选择记录，用于后台复核。
  answers: WenxinQuizAnswerMap
  // 提交时间。
  created_at: string
}

// 这个接口描述提交问心考核时需要传入的数据，入参来自前台考核页，返回值用于服务层保存。
export interface WenxinQuizSubmitInput {
  // 本次得分。
  score: number
  // 试卷总分。
  total_score: number
  // 是否达到通过线。
  passed: boolean
  // 单选题答对数量。
  single_correct: number
  // 多选题答对数量。
  multiple_correct: number
  // 每题选择记录。
  answers: WenxinQuizAnswerMap
}

// 这个接口描述用户在问云小院里可以自己编辑的资料字段。
export interface ProfileUpdateInput {
  // 用户头像地址，可为空。
  avatar_url: string
  // 个人简介，可为空。
  bio: string
  // 是否公开资料。
  is_public: boolean
}

// 这个接口描述当前登录账号的安全信息，入参来自 Supabase Auth，返回值用于小院资料页展示。
export interface AccountSecurityInfo {
  // 当前登录邮箱，旧编号账号会显示内部邮箱。
  email: string
  // 是否仍是旧编号内部邮箱。
  is_legacy_email: boolean
  // 等待确认的新邮箱，没有等待确认时为空。
  pending_email: string | null
  // 邮箱确认时间，没有确认时为空。
  email_confirmed_at: string | null
}

// 这个接口描述修改密码表单，入参来自小院资料页，返回值用于服务函数校验。
export interface PasswordUpdateInput {
  // 新密码，可由用户自行设置，前端不再限制最少位数。
  new_password: string
  // 确认新密码，用来防止用户输错。
  confirm_password: string
}

// 这个接口描述绑定邮箱表单，入参来自小院资料页，返回值用于 Supabase Auth 更新邮箱。
export interface EmailBindInput {
  // 用户想绑定或更换的真实邮箱。
  email: string
}

// 这个接口描述名册登记表单与后台列表的数据结构。
export interface JoinApplication {
  // 申请唯一编号，由数据库生成。
  id: string
  // 提交名帖的登录用户编号，旧游客数据可能为空。
  user_id: string | null
  // 申请人在名册中想使用的道名。
  nickname: string
  // 江湖名用于前台名册展示和搜索，可为空。
  jianghu_name: string | null
  // 真实姓名用于后台核对身份，不在前台公开展示。
  real_name: string | null
  // 微信号属于敏感联系方式，只在后台展示。
  wechat_id: string
  // 出生年份用于后台核对和旧编号资料兼容，不进入公开名册。
  age_range: string | null
  // 性别用于名册公开展示。
  gender: MemberGender | null
  // 所在城市用于后续线下活动参考。
  city: string | null
  // 申请理由是审核时最重要的文字。
  reason: string
  // 是否认同门规，必须为真才允许提交。
  accept_rules: boolean
  // 门派身份，只能由管理员在后台编辑。
  member_role: WenyunMemberRole | null
  // 辈分字，只能由管理员在后台编辑，默认是“云”。
  generation_name: string | null
  // 名册编号，由系统默认按已有最大编号往后生成。
  member_code: string | null
  // 入册序号，用于兼容旧名册编号账号，例如 001。
  roster_serial: number | null
  // 所在城市，用于前台名册展示。
  public_region: string | null
  // 后台地域原文，只给管理员校对使用。
  raw_region: string | null
  // 宣言，用于公开名册展示。
  motto: string | null
  // 兴趣爱好，用中文顿号或逗号分隔。
  tags: string | null
  // 同行期待，用于公开名册展示。
  companion_expectation: string | null
  // 联系方式，只在后台和本人小院展示，不进入公开名册。
  legacy_contact: string | null
  // 待审核道名，用户在小院申请修改道名时写入，管理员同意后才会生效。
  requested_nickname: string | null
  // 待审核联系方式，用户在小院申请修改联系方式时写入，管理员同意后才会生效。
  requested_legacy_contact: string | null
  // 用户提交待审核修改的时间，没有待审核修改时为空。
  requested_at: string | null
  // 正式入册时间，旧数据导入时使用旧入册时间。
  joined_at: string | null
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

// 这个接口描述名册登记提交时需要传入的字段。
export interface JoinApplicationInput {
  // 申请道名，不能为空。
  nickname: string
  // 江湖名，可为空，前台名册会公开展示。
  jianghu_name: string
  // 真实姓名，不能为空，只供后台管理员查看。
  real_name: string
  // 微信号，不能为空。
  wechat_id: string
  // 出生年份，可为空，只给后台和本人查看。
  age_range: string
  // 性别，不能为空。
  gender: MemberGender
  // 所在城市，可为空。
  city: string
  // 公开身份，前台提交时固定为同门，用户不能自行调整。
  member_role: WenyunMemberRole
  // 所在城市，可为空，进入公开名册展示。
  public_region: string
  // 宣言，不能为空，进入公开名册展示。
  motto: string
  // 兴趣爱好，可为空，多个内容可用顿号或逗号分隔。
  tags: string
  // 同行期待，可为空。
  companion_expectation: string
  // 联系方式，不能为空，只供后台联系和账号绑定排查。
  legacy_contact: string
  // 是否认同门规，必须勾选。
  accept_rules: boolean
}

// 这个接口描述公开名册条目，入参来自 Supabase 公开视图，返回给前台展示。
export interface RosterEntry {
  // 公开条目唯一编号，对应名册登记编号。
  id: string
  // 道名，用于名册展示。
  dao_name: string
  // 江湖名，用于名册展示和搜索。
  jianghu_name: string | null
  // 名册编号，例如“问云-云-001”。
  member_code: string
  // 性别，用于名册展示。
  gender: MemberGender
  // 出生年份旧表用于账号初始密码来源，只给后台和本人查看。
  birth_month: string | null
  // 所在城市，用于名册展示。
  city: string | null
  // 公开身份，例如掌门、执事、护灯人、同门。
  member_role: WenyunMemberRole
  // 辈分字，例如“云”。
  generation_name: string
  // 所在城市，用于名册展示。
  public_region: string | null
  // 宣言，用于名册展示。
  motto: string | null
  // 兴趣爱好，用中文顿号或逗号分隔。
  tags: string | null
  // 同行期待，用于名册展示。
  companion_expectation: string | null
  // 正式入册时间。
  joined_at: string | null
  // 当前入册状态。
  status: JoinApplicationStatus
  // 入册时间或申请时间。
  created_at: string
}

// 这个接口描述后台编辑名册时可修改的字段。
export interface JoinApplicationUpdateInput {
  // 道名，后台可修正错别字。
  nickname: string
  // 江湖名，后台可修正展示名。
  jianghu_name: string
  // 真实姓名，后台可修正核对信息。
  real_name: string
  // 微信号，后台可修正联系信息。
  wechat_id: string
  // 出生年份，格式通常为 YYYY。
  age_range: string
  // 性别，后台可修正登记信息。
  gender: MemberGender
  // 所在城市。
  city: string
  // 所在城市。
  public_region: string
  // 后台地域原文。
  raw_region: string
  // 申请理由。
  reason: string
  // 是否认同门规。
  accept_rules: boolean
  // 管理员备注。
  admin_note: string
  // 门派身份。
  member_role: WenyunMemberRole
  // 辈分字。
  generation_name: string
  // 名册编号。
  member_code: string
  // 入册序号。
  roster_serial: string
  // 宣言。
  motto: string
  // 兴趣爱好。
  tags: string
  // 同行期待。
  companion_expectation: string
  // 联系方式。
  legacy_contact: string
  // 待审核道名。
  requested_nickname: string
  // 待审核联系方式。
  requested_legacy_contact: string
  // 正式入册时间。
  joined_at: string
  // 审核状态。
  status: JoinApplicationStatus
}

// 这个接口描述用户在问云小院里直接维护自己的名册公开资料。
export interface RosterProfileUpdateInput {
  // 名帖编号，用于确认要修改哪一张名帖。
  application_id: string
  // 江湖名，可由用户直接修改。
  jianghu_name: string
  // 性别，可由用户直接修改。
  gender: MemberGender
  // 所在城市，可由用户直接修改。
  city: string
  // 宣言，可由用户直接修改。
  motto: string
  // 兴趣爱好，可由用户直接修改。
  hobbies: string
  // 同行期待，可由用户直接修改。
  companion_expectation: string
  // 想申请修改的新道名，管理员审核后生效。
  requested_nickname: string
  // 想申请修改的新联系方式，管理员审核后生效。
  requested_legacy_contact: string
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

// 这个接口描述用户报名问云雅集的数据。
export interface EventRegistration {
  // 报名唯一编号。
  id: string
  // 活动编号。
  event_id: string
  // 报名用户编号。
  user_id: string | null
  // 报名昵称，默认取用户资料昵称。
  nickname: string | null
  // 联系方式，默认取登录邮箱。
  contact: string | null
  // 报名备注。
  note: string | null
  // 报名状态。
  status: EventRegistrationStatus
  // 创建时间。
  created_at: string
}

// 这个接口描述小院活动列表的一项，包含活动和当前用户报名状态。
export interface YardEventItem {
  // 活动资料。
  event: WenyunEvent
  // 当前用户报名记录，未报名时为空。
  registration: EventRegistration | null
}

// 这个接口描述用户站内提醒。
export interface UserNotification {
  // 提醒唯一编号。
  id: string
  // 接收提醒的用户编号。
  user_id: string
  // 提醒所属业务模块。
  kind: UserNotificationKind
  // 提醒标题。
  title: string
  // 提醒正文。
  content: string
  // 关联数据表，可为空。
  target_table: string | null
  // 关联数据编号，可为空。
  target_id: string | null
  // 邮件发送状态。
  email_status: NotificationEmailStatus
  // 邮件失败原因，可为空。
  email_error: string | null
  // 邮件发送时间，可为空。
  sent_at: string | null
  // 站内提醒阅读时间，可为空。
  read_at: string | null
  // 创建时间。
  created_at: string
}

// 这个接口描述问云小院总览所需的整包数据。
export interface YardOverview {
  // 当前用户资料。
  profile: Profile
  // 当前用户提交的名帖。
  applications: JoinApplication[]
  // 当前用户提交的云灯。
  lanterns: CloudLantern[]
  // 当前用户的活动报名。
  registrations: EventRegistration[]
  // 当前用户最近提醒。
  notifications: UserNotification[]
  // 当前用户最新一次问心考核结果，没有考过时为空。
  quizResult: WenxinQuizResult | null
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

// 这个接口描述后台可查看的 SMTP 设置，不返回授权码明文。
export interface SmtpSetting {
  // 设置编号，固定使用 default。
  id: string
  // 是否启用后台 SMTP 配置。
  enabled: boolean
  // SMTP 主机，例如 smtp.qq.com。
  host: string
  // SMTP 端口，常用 465。
  port: number
  // 是否使用 SSL 加密连接。
  secure: boolean
  // SMTP 登录账号，通常是邮箱地址。
  username: string
  // 发件人地址或名称。
  from_email: string
  // 更新时间。
  updated_at: string
}

// 这个接口描述管理员保存 SMTP 设置时提交的表单。
export interface SmtpSettingInput {
  // 是否启用后台 SMTP 配置。
  enabled: boolean
  // SMTP 主机。
  host: string
  // SMTP 端口。
  port: string
  // 是否使用 SSL 加密连接。
  secure: boolean
  // SMTP 登录账号。
  username: string
  // SMTP 授权码，留空表示保留旧值。
  password: string
  // 发件人地址或名称。
  from_email: string
}

// 这个接口描述归云堂入群二维码设置，只允许后台管理员读取和维护。
export interface GuiyuntangSetting {
  // 设置编号，固定使用 default。
  id: string
  // 是否启用归云堂二维码提示。
  enabled: boolean
  // 二维码图片的数据地址，保存在受 RLS 保护的后台设置表中。
  qr_image_data_url: string | null
  // 审核通过后给管理员看的操作说明。
  instruction: string
  // 保密提醒，防止二维码外传。
  warning: string
  // 更新时间。
  updated_at: string
}

// 这个接口描述管理员保存归云堂二维码设置时提交的表单。
export interface GuiyuntangSettingInput {
  // 是否启用归云堂二维码提示。
  enabled: boolean
  // 二维码图片的数据地址，来自后台上传的图片。
  qr_image_data_url: string
  // 审核通过后给管理员看的操作说明。
  instruction: string
  // 保密提醒。
  warning: string
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
