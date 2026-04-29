import { FormEvent, useEffect, useMemo, useState } from 'react'
import { CloudButton } from '../../components/CloudButton'
import { ScrollPanel } from '../../components/ScrollPanel'
import { SectionTitle } from '../../components/SectionTitle'
import { StatusNotice } from '../../components/StatusNotice'
import { fetchGuiyuntangSetting, fetchSettings, fetchSmtpSetting, saveContactSetting, saveGuiyuntangSetting, saveSmtpSetting } from '../../lib/services'
import type { GuiyuntangSetting, GuiyuntangSettingInput, SiteSetting, SmtpSetting, SmtpSettingInput } from '../../lib/types'

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

// 这个函数渲染站点设置页，入参为空，返回值是联系信息设置表单。
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
  // 这个状态表示 SMTP 设置是否正在保存。
  const [savingSmtp, setSavingSmtp] = useState(false)
  // 这个状态表示归云堂设置是否正在保存。
  const [savingGuiyuntang, setSavingGuiyuntang] = useState(false)

  // 这个变量从设置列表里取出联系设置。
  const contactSetting = useMemo(() => settings.find((item) => item.key === 'contact'), [settings])

  useEffect(() => {
    // 这个函数读取站点设置，入参为空，返回值为空。
    async function loadSettings() {
      const result = await fetchSettings()
      const smtpResult = await fetchSmtpSetting()
      const guiyuntangResult = await fetchGuiyuntangSetting()
      setSettings(result.data)
      setSmtpSetting(smtpResult.data)
      setGuiyuntangSetting(guiyuntangResult.data)

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

      if (guiyuntangResult.data) {
        setGuiyuntangForm({
          enabled: guiyuntangResult.data.enabled,
          qr_image_data_url: guiyuntangResult.data.qr_image_data_url ?? '',
          instruction: guiyuntangResult.data.instruction,
          warning: guiyuntangResult.data.warning
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

  // 这个函数更新归云堂设置字段，入参是字段和值，返回值为空。
  function updateGuiyuntangField(field: keyof GuiyuntangSettingInput, value: string | boolean) {
    setGuiyuntangForm((current) => ({ ...current, [field]: value }))
  }

  // 这个函数读取管理员上传的二维码图片，入参是文件选择事件，返回值为空。
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

  // 这个函数保存归云堂二维码设置，入参是表单事件，返回值为空。
  async function handleGuiyuntangSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    try {
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
      setSavingGuiyuntang(false)
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
          <h2 className="ink-title text-2xl font-bold text-[#143044]">归云堂入群二维码</h2>
          <p className="mt-2 text-sm leading-7 text-[#526461]">
            这里只给后台管理员使用。二维码不会放进公开前台资源，名帖审核通过后会在后台名帖详情里醒目提示；确认进群后只保留查看入口。
          </p>
        </div>

        <form className="grid gap-5" onSubmit={handleGuiyuntangSubmit}>
          <label className="flex items-start gap-3 rounded-xl border border-[#c9a45c]/35 bg-white/60 p-4">
            <input
              checked={guiyuntangForm.enabled}
              className="mt-1 h-4 w-4"
              onChange={(event) => updateGuiyuntangField('enabled', event.target.checked)}
              type="checkbox"
            />
            <span className="text-sm leading-7 text-[#526461]">启用归云堂二维码提示。关闭后，名帖审核页不会展示入群二维码。</span>
          </label>

          <label className="grid gap-2">
            <span className="text-sm font-semibold">上传归云堂二维码图片</span>
            <input
              accept="image/*"
              className="rounded-xl border border-[#6f8f8b]/25 bg-white/80 px-4 py-3 outline-none file:mr-4 file:rounded-full file:border-0 file:bg-[#6f8f8b] file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white"
              onChange={(event) => handleGuiyuntangQrFile(event.target.files?.[0] ?? null)}
              type="file"
            />
            <span className="text-xs leading-6 text-[#7a6a48]">请上传你提供的归云堂入群二维码图片。建议小于 1.5MB；保存后仅后台管理员可读。</span>
          </label>

          {guiyuntangForm.qr_image_data_url ? (
            <div className="grid gap-4 rounded-2xl border border-[#9e3d32]/25 bg-[#fff1ee]/65 p-4 md:grid-cols-[auto_1fr] md:items-center">
              <img
                alt="归云堂入群二维码预览"
                className="h-44 w-44 rounded-2xl border border-white bg-white object-contain p-2 shadow-lg shadow-[#263238]/10"
                src={guiyuntangForm.qr_image_data_url}
              />
              <div className="text-sm leading-7 text-[#526461]">
                <p className="font-semibold text-[#9e3d32]">保密预览</p>
                <p>此二维码只应在后台审核场景中使用，严禁向外部透露。</p>
                <button
                  className="mt-3 rounded-full border border-[#9e3d32]/30 bg-white/70 px-4 py-2 text-sm font-semibold text-[#9e3d32]"
                  onClick={() => updateGuiyuntangField('qr_image_data_url', '')}
                  type="button"
                >
                  清空当前二维码
                </button>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-[#c9a45c]/25 bg-white/55 p-4 text-sm leading-7 text-[#526461]">
              当前尚未保存二维码。请先选择图片并保存，后台名帖审核页才会显示入群提示。
            </div>
          )}

          <label className="grid gap-2">
            <span className="text-sm font-semibold">审核通过提示文案</span>
            <textarea
              className="min-h-24 rounded-xl border border-[#6f8f8b]/25 bg-white/80 px-4 py-3 leading-7 outline-none focus:border-[#6f8f8b]"
              onChange={(event) => updateGuiyuntangField('instruction', event.target.value)}
              value={guiyuntangForm.instruction}
            />
          </label>

          <label className="grid gap-2">
            <span className="text-sm font-semibold">保密提醒</span>
            <textarea
              className="min-h-24 rounded-xl border border-[#9e3d32]/25 bg-white/80 px-4 py-3 leading-7 outline-none focus:border-[#9e3d32]"
              onChange={(event) => updateGuiyuntangField('warning', event.target.value)}
              value={guiyuntangForm.warning}
            />
          </label>

          <div className="rounded-xl border border-[#c9a45c]/25 bg-white/55 p-4 text-sm leading-7 text-[#526461]">
            当前状态：{guiyuntangSetting?.enabled ? '已启用归云堂二维码提示' : '未启用归云堂二维码提示'}。
            {guiyuntangSetting?.updated_at ? ` 最后保存时间：${new Date(guiyuntangSetting.updated_at).toLocaleString('zh-CN')}。` : ''}
          </div>

          <CloudButton disabled={savingGuiyuntang} type="submit" variant="seal">
            {savingGuiyuntang ? '正在保存...' : '保存归云堂二维码设置'}
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
