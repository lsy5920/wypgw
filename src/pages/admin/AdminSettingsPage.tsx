import { FormEvent, useEffect, useMemo, useState } from 'react'
import { CloudButton } from '../../components/CloudButton'
import { ScrollPanel } from '../../components/ScrollPanel'
import { SectionTitle } from '../../components/SectionTitle'
import { StatusNotice } from '../../components/StatusNotice'
import { fetchSettings, saveContactSetting } from '../../lib/services'
import type { SiteSetting } from '../../lib/types'

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
  contactTip: '请先提交入派帖，执事查看后会择时联系。',
  qrDescription: '首版不公开永久群二维码，避免广告和陌生人直接入群。'
}

// 这个函数渲染站点设置页，入参为空，返回值是联系信息设置表单。
export function AdminSettingsPage() {
  // 这个状态保存设置列表。
  const [settings, setSettings] = useState<SiteSetting[]>([])
  // 这个状态保存联系表单。
  const [form, setForm] = useState<ContactForm>(defaultForm)
  // 这个状态保存提示。
  const [notice, setNotice] = useState<{ type: 'success' | 'error' | 'info'; title: string; message: string } | null>(null)

  // 这个变量从设置列表里取出联系设置。
  const contactSetting = useMemo(() => settings.find((item) => item.key === 'contact'), [settings])

  useEffect(() => {
    // 这个函数读取站点设置，入参为空，返回值为空。
    async function loadSettings() {
      const result = await fetchSettings()
      setSettings(result.data)

      if (result.demoMode) {
        setNotice({ type: 'info', title: '演示模式提示', message: result.message })
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

  return (
    <div>
      <SectionTitle eyebrow="站点设置" title="维护联系山门信息">
        这里用于管理联系页展示的说明文字。首版仍建议不公开永久微信群二维码。
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
    </div>
  )
}
