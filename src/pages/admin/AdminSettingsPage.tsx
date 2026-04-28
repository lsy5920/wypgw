import { FormEvent, useEffect, useMemo, useState } from 'react'
import { CloudButton } from '../../components/CloudButton'
import { ScrollPanel } from '../../components/ScrollPanel'
import { SectionTitle } from '../../components/SectionTitle'
import { StatusNotice } from '../../components/StatusNotice'
import { fetchSettings, fetchSmtpSetting, saveContactSetting, saveSmtpSetting } from '../../lib/services'
import type { SiteSetting, SmtpSetting, SmtpSettingInput } from '../../lib/types'

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

// 这个函数渲染站点设置页，入参为空，返回值是联系信息设置表单。
export function AdminSettingsPage() {
  // 这个状态保存设置列表。
  const [settings, setSettings] = useState<SiteSetting[]>([])
  // 这个状态保存联系表单。
  const [form, setForm] = useState<ContactForm>(defaultForm)
  // 这个状态保存 SMTP 表单。
  const [smtpForm, setSmtpForm] = useState<SmtpSettingInput>(defaultSmtpForm)
  // 这个状态保存当前 SMTP 设置，不包含授权码。
  const [smtpSetting, setSmtpSetting] = useState<SmtpSetting | null>(null)
  // 这个状态保存提示。
  const [notice, setNotice] = useState<{ type: 'success' | 'error' | 'info'; title: string; message: string } | null>(null)
  // 这个状态表示 SMTP 设置是否正在保存。
  const [savingSmtp, setSavingSmtp] = useState(false)

  // 这个变量从设置列表里取出联系设置。
  const contactSetting = useMemo(() => settings.find((item) => item.key === 'contact'), [settings])

  useEffect(() => {
    // 这个函数读取站点设置，入参为空，返回值为空。
    async function loadSettings() {
      const result = await fetchSettings()
      const smtpResult = await fetchSmtpSetting()
      setSettings(result.data)
      setSmtpSetting(smtpResult.data)

      if (result.demoMode) {
        setNotice({ type: 'info', title: '演示模式提示', message: result.message })
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

  // 这个函数更新表单字段，入参是字段和值，返回值为空。
  function updateField(field: keyof ContactForm, value: string) {
    setForm((current) => ({ ...current, [field]: value }))
  }

  // 这个函数更新 SMTP 字段，入参是字段和值，返回值为空。
  function updateSmtpField(field: keyof SmtpSettingInput, value: string | boolean) {
    setSmtpForm((current) => ({ ...current, [field]: value }))
  }

  // 这个函数保存设置，入参是表单事件，返回值为空。
  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

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
  }

  // 这个函数保存 SMTP 设置，入参是表单事件，返回值为空。
  async function handleSmtpSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    try {
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
      setSavingSmtp(false)
    }
  }

  return (
    <div>
      <SectionTitle eyebrow="站点设置" title="维护联系山门信息">
        这里用于管理联系页展示说明，也可以维护问云小院邮件提醒使用的 SMTP 服务。
      </SectionTitle>

      {notice ? <StatusNotice type={notice.type} title={notice.title} message={notice.message} /> : null}

      <ScrollPanel className="mt-8">
        <form className="grid gap-5" onSubmit={handleSubmit}>
          <label className="grid gap-2">
            <span className="text-sm font-semibold">联系人名称</span>
            <input
              className="rounded-xl border border-[#6f8f8b]/25 bg-white/80 px-4 py-3 outline-none focus:border-[#6f8f8b]"
              onChange={(event) => updateField('wechatName', event.target.value)}
              value={form.wechatName}
            />
          </label>
          <label className="grid gap-2">
            <span className="text-sm font-semibold">联系说明</span>
            <textarea
              className="min-h-24 rounded-xl border border-[#6f8f8b]/25 bg-white/80 px-4 py-3 leading-7 outline-none focus:border-[#6f8f8b]"
              onChange={(event) => updateField('contactTip', event.target.value)}
              value={form.contactTip}
            />
          </label>
          <label className="grid gap-2">
            <span className="text-sm font-semibold">二维码安全说明</span>
            <textarea
              className="min-h-24 rounded-xl border border-[#6f8f8b]/25 bg-white/80 px-4 py-3 leading-7 outline-none focus:border-[#6f8f8b]"
              onChange={(event) => updateField('qrDescription', event.target.value)}
              value={form.qrDescription}
            />
          </label>
          <CloudButton type="submit" variant="seal">
            保存设置
          </CloudButton>
        </form>
      </ScrollPanel>

      <ScrollPanel className="mt-8">
        <div className="mb-6">
          <h2 className="ink-title text-2xl font-bold text-[#143044]">SMTP 邮件服务</h2>
          <p className="mt-2 text-sm leading-7 text-[#526461]">
            用于发送问云小院状态提醒邮件。授权码不会回显，留空保存会保留旧授权码；首次配置必须填写授权码。
          </p>
        </div>

        <form className="grid gap-5" onSubmit={handleSmtpSubmit}>
          <label className="flex items-start gap-3 rounded-xl border border-[#c9a45c]/35 bg-white/60 p-4">
            <input
              checked={smtpForm.enabled}
              className="mt-1 h-4 w-4"
              onChange={(event) => updateSmtpField('enabled', event.target.checked)}
              type="checkbox"
            />
            <span className="text-sm leading-7 text-[#526461]">启用后台 SMTP 配置。关闭后，Edge Function 会尝试使用 Supabase Secrets 中的 SMTP 配置。</span>
          </label>

          <div className="grid gap-5 md:grid-cols-3">
            <label className="grid gap-2">
              <span className="text-sm font-semibold">SMTP 主机</span>
              <input
                className="rounded-xl border border-[#6f8f8b]/25 bg-white/80 px-4 py-3 outline-none focus:border-[#6f8f8b]"
                onChange={(event) => updateSmtpField('host', event.target.value)}
                placeholder="smtp.qq.com"
                value={smtpForm.host}
              />
            </label>
            <label className="grid gap-2">
              <span className="text-sm font-semibold">端口</span>
              <input
                className="rounded-xl border border-[#6f8f8b]/25 bg-white/80 px-4 py-3 outline-none focus:border-[#6f8f8b]"
                min="1"
                onChange={(event) => updateSmtpField('port', event.target.value)}
                type="number"
                value={smtpForm.port}
              />
            </label>
            <label className="flex items-center gap-3 rounded-xl border border-[#6f8f8b]/25 bg-white/70 px-4 py-3">
              <input
                checked={smtpForm.secure}
                onChange={(event) => updateSmtpField('secure', event.target.checked)}
                type="checkbox"
              />
              <span className="text-sm font-semibold">使用 SSL 加密</span>
            </label>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <label className="grid gap-2">
              <span className="text-sm font-semibold">SMTP 账号</span>
              <input
                className="rounded-xl border border-[#6f8f8b]/25 bg-white/80 px-4 py-3 outline-none focus:border-[#6f8f8b]"
                onChange={(event) => updateSmtpField('username', event.target.value)}
                placeholder="例如：your@qq.com"
                value={smtpForm.username}
              />
            </label>
            <label className="grid gap-2">
              <span className="text-sm font-semibold">发件人</span>
              <input
                className="rounded-xl border border-[#6f8f8b]/25 bg-white/80 px-4 py-3 outline-none focus:border-[#6f8f8b]"
                onChange={(event) => updateSmtpField('from_email', event.target.value)}
                placeholder="例如：your@qq.com"
                value={smtpForm.from_email}
              />
            </label>
          </div>

          <label className="grid gap-2">
            <span className="text-sm font-semibold">SMTP 授权码</span>
            <input
              className="rounded-xl border border-[#6f8f8b]/25 bg-white/80 px-4 py-3 outline-none focus:border-[#6f8f8b]"
              onChange={(event) => updateSmtpField('password', event.target.value)}
              placeholder={smtpSetting ? '留空表示保留旧授权码' : '首次配置请填写授权码'}
              type="password"
              value={smtpForm.password}
            />
          </label>

          <div className="rounded-xl border border-[#c9a45c]/25 bg-white/55 p-4 text-sm leading-7 text-[#526461]">
            当前状态：{smtpSetting?.enabled ? '已启用后台 SMTP 配置' : '未启用后台 SMTP 配置'}。
            {smtpSetting?.updated_at ? ` 最后保存时间：${new Date(smtpSetting.updated_at).toLocaleString('zh-CN')}。` : ''}
          </div>

          <CloudButton disabled={savingSmtp} type="submit" variant="seal">
            {savingSmtp ? '正在保存...' : '保存 SMTP 设置'}
          </CloudButton>
        </form>
      </ScrollPanel>
    </div>
  )
}
