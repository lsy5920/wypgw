import { FormEvent, useEffect, useMemo, useState } from 'react'
import { CloudButton } from '../../components/CloudButton'
import { StatusNotice } from '../../components/StatusNotice'
import { fetchGuiyuntangSetting, fetchSettings, fetchSmtpSetting, saveContactSetting, saveGuiyuntangSetting, saveSmtpSetting } from '../../lib/services'
import type { GuiyuntangSetting, GuiyuntangSettingInput, SiteSetting, SmtpSetting, SmtpSettingInput } from '../../lib/types'
import { AdminPageShell, AdminPanel, AdminStatusPill, formatAdminDate } from './AdminUi'

// 这个接口描述联系设置表单，入参来自后台输入，返回值用于保存站点设置。
interface ContactForm {
  // 联系人名称。
  wechatName: string
  // 联系说明。
  contactTip: string
  // 二维码安全说明。
  qrDescription: string
}

// 这个常量保存默认联系设置，返回值用于首次加载。
const defaultForm: ContactForm = {
  wechatName: '问云派执事',
  contactTip: '请先提交名册登记，执事查看后会择时联系。',
  qrDescription: '首版不公开永久群二维码，避免广告和陌生人直接入群。'
}

// 这个常量保存默认 SMTP 设置表单，返回值用于首次加载。
const defaultSmtpForm: SmtpSettingInput = {
  enabled: false,
  host: 'smtp.qq.com',
  port: '465',
  secure: true,
  username: '',
  password: '',
  from_email: ''
}

// 这个常量保存归云堂二维码设置默认值，返回值用于首次加载和兜底说明。
const defaultGuiyuntangForm: GuiyuntangSettingInput = {
  enabled: true,
  qr_image_data_url: '',
  instruction: '名帖审核通过后，可引导同门扫码加入归云堂；确认进群后将名帖状态改为“已入群”。',
  warning: '归云堂入群二维码只供后台审核使用，严禁截图外传、公开发布或转交未审核人员。'
}

// 这个函数渲染站点设置页，入参为空，返回值是设计稿第七屏样式的三组后台设置。
export function AdminSettingsPage() {
  // 这个状态保存设置列表。
  const [settings, setSettings] = useState<SiteSetting[]>([])
  // 这个状态保存联系表单。
  const [form, setForm] = useState<ContactForm>(defaultForm)
  // 这个状态保存 SMTP 表单。
  const [smtpForm, setSmtpForm] = useState<SmtpSettingInput>(defaultSmtpForm)
  // 这个状态保存归云堂二维码表单。
  const [guiyuntangForm, setGuiyuntangForm] = useState<GuiyuntangSettingInput>(defaultGuiyuntangForm)
  // 这个状态保存当前归云堂设置。
  const [guiyuntangSetting, setGuiyuntangSetting] = useState<GuiyuntangSetting | null>(null)
  // 这个状态保存当前 SMTP 设置，不包含授权码。
  const [smtpSetting, setSmtpSetting] = useState<SmtpSetting | null>(null)
  // 这个状态保存提示。
  const [notice, setNotice] = useState<{ type: 'success' | 'error' | 'info'; title: string; message: string } | null>(null)
  // 这个状态表示联系设置是否正在保存。
  const [savingContact, setSavingContact] = useState(false)
  // 这个状态表示 SMTP 设置是否正在保存。
  const [savingSmtp, setSavingSmtp] = useState(false)
  // 这个状态表示归云堂设置是否正在保存。
  const [savingGuiyuntang, setSavingGuiyuntang] = useState(false)

  // 这个变量从设置列表里取出联系设置，返回值用于同步联系表单。
  const contactSetting = useMemo(() => settings.find((item) => item.key === 'contact'), [settings])

  useEffect(() => {
    // 这个函数读取站点设置，入参为空，返回值为空。
    async function loadSettings() {
      try {
        // 这里同时读取公开联系设置、SMTP 设置和归云堂二维码设置。
        const [settingResult, smtpResult, guiyuntangResult] = await Promise.all([
          fetchSettings(),
          fetchSmtpSetting(),
          fetchGuiyuntangSetting()
        ])

        setSettings(settingResult.data)
        setSmtpSetting(smtpResult.data)
        setGuiyuntangSetting(guiyuntangResult.data)

        if (settingResult.demoMode) {
          setNotice({ type: 'info', title: '演示模式提示', message: settingResult.message })
        }

        if (smtpResult.data) {
          setSmtpForm({
            enabled: smtpResult.data.enabled,
            host: smtpResult.data.host,
            port: String(smtpResult.data.port),
            secure: smtpResult.data.secure,
            username: smtpResult.data.username,
            password: '',
            from_email: smtpResult.data.from_email
          })
        }

        if (guiyuntangResult.data) {
          setGuiyuntangForm({
            enabled: guiyuntangResult.data.enabled,
            qr_image_data_url: guiyuntangResult.data.qr_image_data_url ?? '',
            instruction: guiyuntangResult.data.instruction,
            warning: guiyuntangResult.data.warning
          })
        }
      } catch (error) {
        // 这里兜底捕获意外异常，避免站点设置页白屏。
        setNotice({ type: 'error', title: '读取异常', message: error instanceof Error ? error.message : '站点设置暂时无法读取。' })
      }
    }

    void loadSettings()
  }, [])

  useEffect(() => {
    // 这里当后台读到已有联系设置时，把表单同步成数据库内容。
    if (contactSetting) {
      const value = contactSetting.value as Partial<ContactForm>
      setForm({
        wechatName: value.wechatName ?? defaultForm.wechatName,
        contactTip: value.contactTip ?? defaultForm.contactTip,
        qrDescription: value.qrDescription ?? defaultForm.qrDescription
      })
    }
  }, [contactSetting])

  // 这个函数更新联系表单字段，入参是字段和值，返回值为空。
  function updateField(field: keyof ContactForm, value: string) {
    setForm((current) => ({ ...current, [field]: value }))
  }

  // 这个函数更新 SMTP 字段，入参是字段和值，返回值为空。
  function updateSmtpField(field: keyof SmtpSettingInput, value: string | boolean) {
    setSmtpForm((current) => ({ ...current, [field]: value }))
  }

  // 这个函数更新归云堂设置字段，入参是字段和值，返回值为空。
  function updateGuiyuntangField(field: keyof GuiyuntangSettingInput, value: string | boolean) {
    setGuiyuntangForm((current) => ({ ...current, [field]: value }))
  }

  // 这个函数读取管理员上传的二维码图片，入参是文件对象，返回值为空。
  function handleGuiyuntangQrFile(file: File | null) {
    // 这里允许管理员清空选择，但不自动删除已保存二维码。
    if (!file) {
      return
    }

    // 这里限制上传内容必须是图片，避免误把其他文件写入数据库。
    if (!file.type.startsWith('image/')) {
      setNotice({ type: 'error', title: '图片格式不正确', message: '请上传归云堂入群二维码图片。' })
      return
    }

    // 这里限制图片体积，避免把过大的图片写入数据库影响后台加载。
    if (file.size > 1.5 * 1024 * 1024) {
      setNotice({ type: 'error', title: '图片过大', message: '二维码图片建议小于 1.5MB，请压缩后再上传。' })
      return
    }

    const reader = new FileReader()

    // 这里把本地图片转成数据地址，仅保存到后台受保护设置表，不放进公开资源目录。
    reader.onload = () => {
      updateGuiyuntangField('qr_image_data_url', typeof reader.result === 'string' ? reader.result : '')
    }

    // 这里处理读取失败，避免后台页面无反馈。
    reader.onerror = () => {
      setNotice({ type: 'error', title: '读取图片失败', message: '请重新选择二维码图片。' })
    }

    reader.readAsDataURL(file)
  }

  // 这个函数保存联系设置，入参是表单事件，返回值为空。
  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    try {
      // 这里进入保存状态，避免重复提交联系设置。
      setSavingContact(true)
      const result = await saveContactSetting(form)
      setNotice({
        type: result.ok ? 'success' : 'error',
        title: result.ok ? '设置已保存' : '保存失败',
        message: result.message
      })

      if (result.ok) {
        const refresh = await fetchSettings()
        setSettings(refresh.data)
      }
    } finally {
      // 这里恢复保存状态。
      setSavingContact(false)
    }
  }

  // 这个函数保存 SMTP 设置，入参是表单事件，返回值为空。
  async function handleSmtpSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    try {
      // 这里进入保存状态，避免重复写入授权配置。
      setSavingSmtp(true)
      const result = await saveSmtpSetting(smtpForm)
      setNotice({
        type: result.ok ? 'success' : 'error',
        title: result.ok ? 'SMTP 已保存' : 'SMTP 保存失败',
        message: result.message
      })

      if (result.ok) {
        const refresh = await fetchSmtpSetting()
        setSmtpSetting(refresh.data)
        setSmtpForm((current) => ({ ...current, password: '' }))
      }
    } finally {
      // 这里恢复保存状态。
      setSavingSmtp(false)
    }
  }

  // 这个函数保存归云堂二维码设置，入参是表单事件，返回值为空。
  async function handleGuiyuntangSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    try {
      // 这里进入保存状态，避免重复写入大图数据。
      setSavingGuiyuntang(true)
      const result = await saveGuiyuntangSetting(guiyuntangForm)
      setNotice({
        type: result.ok ? 'success' : 'error',
        title: result.ok ? '归云堂设置已保存' : '归云堂设置保存失败',
        message: result.message
      })

      if (result.ok) {
        const refresh = await fetchGuiyuntangSetting()
        setGuiyuntangSetting(refresh.data)
      }
    } finally {
      // 这里恢复保存状态。
      setSavingGuiyuntang(false)
    }
  }

  return (
    <AdminPageShell index="7" title="站点设置" description="联系山门、归云堂二维码和 SMTP 邮件提醒都在这里维护。">
      {notice ? <StatusNotice type={notice.type} title={notice.title} message={notice.message} /> : null}

      <div className="admin-settings-grid">
        <AdminPanel title="联系山门设置" description="这些内容会影响前台联系页的说明。">
          <form className="admin-form-grid" onSubmit={handleSubmit}>
            <label>
              <span>联系人名称</span>
              <input onChange={(event) => updateField('wechatName', event.target.value)} value={form.wechatName} />
            </label>
            <label>
              <span>联系说明</span>
              <textarea onChange={(event) => updateField('contactTip', event.target.value)} rows={5} value={form.contactTip} />
            </label>
            <label>
              <span>二维码安全说明</span>
              <textarea onChange={(event) => updateField('qrDescription', event.target.value)} rows={5} value={form.qrDescription} />
            </label>
            <CloudButton disabled={savingContact} type="submit" variant="primary">
              {savingContact ? '正在保存...' : '保存设置'}
            </CloudButton>
          </form>
        </AdminPanel>

        <AdminPanel
          actions={<AdminStatusPill tone={guiyuntangSetting?.enabled ? 'green' : 'gray'}>{guiyuntangSetting?.enabled ? '已启用' : '未启用'}</AdminStatusPill>}
          title="归云堂入群二维码"
          description="二维码只在后台审核场景使用，不进入公开资源。"
        >
          <form className="admin-form-grid" onSubmit={handleGuiyuntangSubmit}>
            <label className="admin-checkbox-row">
              <input checked={guiyuntangForm.enabled} onChange={(event) => updateGuiyuntangField('enabled', event.target.checked)} type="checkbox" />
              <span>启用归云堂二维码提示</span>
            </label>

            <label>
              <span>上传二维码图片</span>
              <input accept="image/*" onChange={(event) => handleGuiyuntangQrFile(event.target.files?.[0] ?? null)} type="file" />
            </label>

            {guiyuntangForm.qr_image_data_url ? (
              <div className="admin-qr-preview">
                <img alt="归云堂入群二维码预览" src={guiyuntangForm.qr_image_data_url} />
                <button onClick={() => updateGuiyuntangField('qr_image_data_url', '')} type="button">
                  清空当前二维码
                </button>
              </div>
            ) : (
              <p className="admin-muted-box">当前尚未保存二维码。请先选择图片并保存，后台名帖审核页才会显示入群提示。</p>
            )}

            <label>
              <span>审核通过提示文案</span>
              <textarea onChange={(event) => updateGuiyuntangField('instruction', event.target.value)} rows={4} value={guiyuntangForm.instruction} />
            </label>

            <label>
              <span>保密提醒</span>
              <textarea onChange={(event) => updateGuiyuntangField('warning', event.target.value)} rows={4} value={guiyuntangForm.warning} />
            </label>

            <p className="admin-muted-box">最后保存：{formatAdminDate(guiyuntangSetting?.updated_at)}</p>

            <CloudButton disabled={savingGuiyuntang} type="submit" variant="primary">
              {savingGuiyuntang ? '正在保存...' : '保存二维码设置'}
            </CloudButton>
          </form>
        </AdminPanel>

        <AdminPanel
          actions={<AdminStatusPill tone={smtpSetting?.enabled ? 'green' : 'gray'}>{smtpSetting?.enabled ? '已启用' : '未启用'}</AdminStatusPill>}
          title="SMTP 邮件设置"
          description="用于发送问云小院状态提醒邮件。授权码不会回显。"
        >
          <form className="admin-form-grid" onSubmit={handleSmtpSubmit}>
            <label className="admin-checkbox-row">
              <input checked={smtpForm.enabled} onChange={(event) => updateSmtpField('enabled', event.target.checked)} type="checkbox" />
              <span>启用后台 SMTP 配置</span>
            </label>

            <label>
              <span>SMTP 主机</span>
              <input onChange={(event) => updateSmtpField('host', event.target.value)} placeholder="smtp.qq.com" value={smtpForm.host} />
            </label>
            <label>
              <span>端口</span>
              <input min="1" onChange={(event) => updateSmtpField('port', event.target.value)} type="number" value={smtpForm.port} />
            </label>
            <label className="admin-checkbox-row">
              <input checked={smtpForm.secure} onChange={(event) => updateSmtpField('secure', event.target.checked)} type="checkbox" />
              <span>使用 SSL 加密</span>
            </label>
            <label>
              <span>SMTP 账号</span>
              <input onChange={(event) => updateSmtpField('username', event.target.value)} placeholder="例如：your@qq.com" value={smtpForm.username} />
            </label>
            <label>
              <span>发件人</span>
              <input onChange={(event) => updateSmtpField('from_email', event.target.value)} placeholder="例如：your@qq.com" value={smtpForm.from_email} />
            </label>
            <label>
              <span>SMTP 授权码</span>
              <input
                onChange={(event) => updateSmtpField('password', event.target.value)}
                placeholder={smtpSetting ? '留空表示保留旧授权码' : '首次配置请填写授权码'}
                type="password"
                value={smtpForm.password}
              />
            </label>

            <p className="admin-muted-box">最后保存：{formatAdminDate(smtpSetting?.updated_at)}</p>

            <CloudButton disabled={savingSmtp} type="submit" variant="primary">
              {savingSmtp ? '正在保存...' : '保存 SMTP 设置'}
            </CloudButton>
          </form>
        </AdminPanel>
      </div>
    </AdminPageShell>
  )
}
