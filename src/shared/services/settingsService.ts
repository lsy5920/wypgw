import { mockGuiyuntangSetting, mockSettings, mockSmtpSetting } from '../../data/mockData'
import type { GuiyuntangSetting, GuiyuntangSettingInput, MusicPlayerSettingInput, SiteSetting, SmtpSetting, SmtpSettingInput } from '../../lib/types'
import { databaseClient } from './supabase'
import { failResult, getErrorMessage, okResult } from './result'

// 这个函数读取站点设置，入参为空，返回值是设置列表。
export async function fetchSettings() {
  if (!databaseClient) {
    return okResult(mockSettings, '当前为演示设置。')
  }

  try {
    const { data, error } = await databaseClient.from('site_settings').select('*').order('key', { ascending: true })

    if (error) {
      throw error
    }

    return okResult((data ?? []) as SiteSetting[])
  } catch (error) {
    return failResult(mockSettings, getErrorMessage(error, '读取站点设置失败，已显示演示设置'))
  }
}

// 这个函数保存联系设置，入参是联系说明，返回值是保存后的设置。
export async function saveContactSetting(input: { wechatName: string; contactTip: string; qrDescription: string }) {
  const payload = {
    key: 'contact',
    value: {
      wechatName: input.wechatName.trim(),
      contactTip: input.contactTip.trim(),
      qrDescription: input.qrDescription.trim()
    }
  }

  if (!databaseClient) {
    return okResult({ ...payload, updated_by: null, updated_at: new Date().toISOString() } as SiteSetting, '演示模式下已模拟保存联系设置。')
  }

  try {
    const { data, error } = await databaseClient.from('site_settings').upsert(payload).select('*').single()

    if (error) {
      throw error
    }

    return okResult(data as SiteSetting, '联系设置已保存。')
  } catch (error) {
    return failResult(null, getErrorMessage(error, '保存联系设置失败'))
  }
}

// 这个函数保存前台音乐播放器设置，入参是后台歌单表单，返回值是保存后的站点设置。
export async function saveMusicPlayerSetting(input: MusicPlayerSettingInput) {
  const playlistId = input.playlist_id.trim()
  const playlistUrl = input.playlist_url.trim()

  // 这里在启用播放器时要求至少有歌单编号，避免前台生成空播放器。
  if (input.enabled && !playlistId) {
    return failResult(null, '请填写网易云歌单编号或能识别编号的歌单链接。')
  }

  const payload = {
    key: 'music_player',
    value: {
      enabled: input.enabled,
      playlist_id: playlistId,
      playlist_url: playlistUrl,
      title: input.title.trim() || '问云派山门歌单',
      lyric_lines: input.lyric_lines.trim(),
      autoplay: input.autoplay
    }
  }

  if (!databaseClient) {
    return okResult({ ...payload, updated_by: null, updated_at: new Date().toISOString() } as SiteSetting, '演示模式下已模拟保存音乐播放器设置。')
  }

  try {
    const { data, error } = await databaseClient.from('site_settings').upsert(payload).select('*').single()

    if (error) {
      throw error
    }

    return okResult(data as SiteSetting, '音乐播放器设置已保存。')
  } catch (error) {
    return failResult(null, getErrorMessage(error, '保存音乐播放器设置失败'))
  }
}

// 这个函数读取 SMTP 设置，入参为空，返回值是不含授权码的设置。
export async function fetchSmtpSetting() {
  if (!databaseClient) {
    return okResult(mockSmtpSetting, '当前为演示 SMTP 设置。')
  }

  try {
    const { data, error } = await databaseClient
      .from('smtp_settings')
      .select('id,enabled,host,port,secure,username,from_email,updated_at')
      .eq('id', 'default')
      .maybeSingle()

    if (error) {
      throw error
    }

    return okResult((data as SmtpSetting | null) ?? null, data ? 'SMTP 设置已读取。' : '尚未配置 SMTP。')
  } catch (error) {
    return failResult(null, getErrorMessage(error, '读取 SMTP 设置失败'))
  }
}

// 这个函数保存 SMTP 设置，入参是后台表单，返回值是不含授权码的设置。
export async function saveSmtpSetting(input: SmtpSettingInput) {
  const port = Number(input.port)

  // 这里拦截明显不完整的配置，避免写入无效邮件服务。
  if (!input.host.trim() || !input.username.trim() || !input.from_email.trim() || Number.isNaN(port) || port <= 0) {
    return failResult(null, '请填写 SMTP 主机、端口、账号和发件人。')
  }

  if (!databaseClient) {
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

    // 这里首次配置需要授权码，后续留空只更新非敏感字段。
    const query = input.password.trim()
      ? databaseClient
          .from('smtp_settings')
          .upsert({ ...basePayload, password: input.password.trim() })
          .select('id,enabled,host,port,secure,username,from_email,updated_at')
          .single()
      : databaseClient
          .from('smtp_settings')
          .update(basePayload)
          .eq('id', 'default')
          .select('id,enabled,host,port,secure,username,from_email,updated_at')
          .single()

    const { data, error } = await query

    if (error) {
      throw error
    }

    return okResult(data as SmtpSetting, 'SMTP 设置已保存。')
  } catch (error) {
    return failResult(null, getErrorMessage(error, '保存 SMTP 设置失败，首次配置必须填写授权码'))
  }
}

// 这个函数读取归云堂二维码设置，入参为空，返回值只供受保护页面使用。
export async function fetchGuiyuntangSetting() {
  if (!databaseClient) {
    return okResult(mockGuiyuntangSetting, '当前为演示归云堂设置。')
  }

  try {
    const { data, error } = await databaseClient
      .from('guiyuntang_settings')
      .select('id,enabled,qr_image_data_url,instruction,warning,updated_at')
      .eq('id', 'default')
      .maybeSingle()

    if (error) {
      throw error
    }

    return okResult((data as GuiyuntangSetting | null) ?? null, data ? '归云堂设置已读取。' : '尚未配置归云堂二维码。')
  } catch (error) {
    return failResult(null, getErrorMessage(error, '读取归云堂设置失败'))
  }
}

// 这个函数保存归云堂二维码设置，入参是后台表单，返回值是保存后的设置。
export async function saveGuiyuntangSetting(input: GuiyuntangSettingInput) {
  const payload = {
    id: 'default',
    enabled: input.enabled,
    qr_image_data_url: input.qr_image_data_url.trim() || null,
    instruction: input.instruction.trim() || mockGuiyuntangSetting.instruction,
    warning: input.warning.trim() || mockGuiyuntangSetting.warning
  }

  if (!databaseClient) {
    return okResult({ ...mockGuiyuntangSetting, ...payload, updated_at: new Date().toISOString() }, '演示模式下已模拟保存归云堂设置。')
  }

  try {
    const { data, error } = await databaseClient
      .from('guiyuntang_settings')
      .upsert(payload)
      .select('id,enabled,qr_image_data_url,instruction,warning,updated_at')
      .single()

    if (error) {
      throw error
    }

    return okResult(data as GuiyuntangSetting, '归云堂设置已保存。')
  } catch (error) {
    return failResult(null, getErrorMessage(error, '保存归云堂设置失败'))
  }
}
