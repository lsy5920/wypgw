// 这个文件是 Supabase Edge Function，用于把问云小院站内提醒发送到用户邮箱。
// 运行环境需要在 Supabase Secrets 中配置 SMTP_HOST、SMTP_PORT、SMTP_USER、SMTP_PASS、SMTP_FROM。

import { createClient } from 'npm:@supabase/supabase-js@2.105.0'
import nodemailer from 'npm:nodemailer@7.0.10'

// 这个接口描述前端调用函数时传入的数据。
interface NoticeRequest {
  // 站内提醒编号。
  notificationId?: string
}

// 这个接口描述函数实际使用的 SMTP 配置。
interface SmtpConfig {
  // SMTP 主机。
  host: string
  // SMTP 端口。
  port: number
  // 是否使用 SSL。
  secure: boolean
  // SMTP 账号。
  username: string
  // SMTP 授权码。
  password: string
  // 发件人。
  fromEmail: string
}

// 这个函数把对象转成 JSON 响应，入参是内容和状态码，返回值是 HTTP 响应。
function jsonResponse(body: Record<string, unknown>, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8'
    }
  })
}

// 这个函数读取必须存在的环境变量，入参是变量名，返回值是变量内容。
function requireEnv(name: string): string {
  const value = Deno.env.get(name)

  // 这里在缺少密钥时直接抛错，方便在函数日志里定位配置问题。
  if (!value) {
    throw new Error(`缺少 Supabase Edge Function 密钥：${name}`)
  }

  return value
}

// 这个函数读取可选环境变量，入参是变量名，返回值是变量内容或空值。
function optionalEnv(name: string): string {
  return Deno.env.get(name) ?? ''
}

// 这个函数读取 SMTP 配置，优先使用后台设置，后台未启用时回退到 Supabase Secrets。
async function loadSmtpConfig(client: ReturnType<typeof createClient>): Promise<SmtpConfig> {
  // 这里先读取管理员后台保存的 SMTP 设置。
  const { data } = await client
    .from('smtp_settings')
    .select('enabled,host,port,secure,username,password,from_email')
    .eq('id', 'default')
    .maybeSingle()

  // 这里后台设置启用且字段完整时优先使用数据库配置。
  if (data?.enabled && data.host && data.port && data.username && data.password && data.from_email) {
    return {
      host: data.host,
      port: Number(data.port),
      secure: Boolean(data.secure),
      username: data.username,
      password: data.password,
      fromEmail: data.from_email
    }
  }

  const host = optionalEnv('SMTP_HOST')
  const username = optionalEnv('SMTP_USER')
  const password = optionalEnv('SMTP_PASS')
  const fromEmail = optionalEnv('SMTP_FROM') || username

  // 这里在后台和 Secrets 都未配置完整时给出明确报错。
  if (!host || !username || !password || !fromEmail) {
    throw new Error('SMTP 服务尚未配置，请到管理员后台设置 SMTP，或配置 Supabase Secrets。')
  }

  return {
    host,
    port: Number(optionalEnv('SMTP_PORT') || '465'),
    secure: (optionalEnv('SMTP_SECURE') || 'true') !== 'false',
    username,
    password,
    fromEmail
  }
}

// 这个函数安全更新提醒邮件状态，入参是客户端、提醒编号和更新字段，返回值为空。
async function updateNotice(
  client: ReturnType<typeof createClient>,
  id: string,
  payload: Record<string, string | null>
) {
  // 这里更新失败也不再抛出，避免覆盖真正的邮件错误。
  await client.from('user_notifications').update(payload).eq('id', id)
}

// 这个函数处理问云小院提醒邮件发送，入参是请求对象，返回值是 HTTP 响应。
Deno.serve(async (request) => {
  // 这个变量保存提醒编号，异常时也能用于回写失败原因。
  let notificationId = ''

  try {
    // 这里只接受 POST，避免误打开函数地址触发发送。
    if (request.method !== 'POST') {
      return jsonResponse({ ok: false, message: '只允许 POST 请求。' }, 405)
    }

    const body = (await request.json()) as NoticeRequest
    notificationId = body.notificationId ?? ''

    // 这里检查提醒编号，避免空请求继续查询数据库。
    if (!notificationId) {
      return jsonResponse({ ok: false, message: '缺少提醒编号。' }, 400)
    }

    const supabaseUrl = requireEnv('SUPABASE_URL')
    const serviceRoleKey = requireEnv('SUPABASE_SERVICE_ROLE_KEY')
    // 这里用服务端密钥创建客户端，函数只在服务端运行，不会暴露给浏览器。
    const client = createClient(supabaseUrl, serviceRoleKey)
    // 这里优先读取后台 SMTP 设置，后台未启用时再使用 Supabase Secrets。
    const smtpConfig = await loadSmtpConfig(client)

    // 这里读取站内提醒和用户资料，用于拼出邮件标题与正文。
    const { data: notice, error: noticeError } = await client
      .from('user_notifications')
      .select('id,user_id,title,content')
      .eq('id', notificationId)
      .single()

    if (noticeError || !notice) {
      throw new Error(noticeError?.message ?? '没有找到这条站内提醒。')
    }

    // 这里通过 auth 管理接口读取用户邮箱，避免把邮箱重复存进业务表。
    const { data: userData, error: userError } = await client.auth.admin.getUserById(notice.user_id)

    if (userError || !userData.user?.email) {
      throw new Error(userError?.message ?? '没有找到提醒接收人的邮箱。')
    }

    // 这里创建 SMTP 发送器，默认使用 465 加密端口。
    const transporter = nodemailer.createTransport({
      host: smtpConfig.host,
      port: smtpConfig.port,
      secure: smtpConfig.secure,
      auth: {
        user: smtpConfig.username,
        pass: smtpConfig.password
      }
    })

    // 这里发送纯文本邮件，保证各种邮箱客户端都能正常阅读。
    await transporter.sendMail({
      from: smtpConfig.fromEmail,
      to: userData.user.email,
      subject: `问云小院提醒：${notice.title}`,
      text: `${notice.content}\n\n愿你在问云小院有一盏灯可归。`
    })

    // 这里记录邮件发送成功，方便小院消息页展示状态。
    await updateNotice(client, notificationId, {
      email_status: 'sent',
      email_error: null,
      sent_at: new Date().toISOString()
    })

    return jsonResponse({ ok: true, message: '提醒邮件已发送。' })
  } catch (error) {
    const message = error instanceof Error ? error.message : '未知错误'

    try {
      // 这里在异常时尽量写入失败原因，方便后台和小院排查。
      if (notificationId) {
        const client = createClient(requireEnv('SUPABASE_URL'), requireEnv('SUPABASE_SERVICE_ROLE_KEY'))
        await updateNotice(client, notificationId, {
          email_status: 'failed',
          email_error: message,
          sent_at: null
        })
      }
    } catch {
      // 这里兜底吞掉二次记录失败，最终仍把错误返回给调用方。
    }

    return jsonResponse({ ok: false, message }, 500)
  }
})
