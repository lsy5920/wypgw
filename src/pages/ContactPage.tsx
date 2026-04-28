import { Mail, ShieldCheck } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { CloudButton } from '../components/CloudButton'
import { ScrollPanel } from '../components/ScrollPanel'
import { SectionTitle } from '../components/SectionTitle'
import { StatusNotice } from '../components/StatusNotice'
import { getPublicAsset } from '../lib/assets'
import { fetchSettings } from '../lib/services'
import type { SiteSetting } from '../lib/types'

// 这个接口描述联系设置内容，入参来自 site_settings.value，返回值用于联系页展示。
interface ContactValue {
  // 联系人名称。
  wechatName?: string
  // 联系提示。
  contactTip?: string
  // 二维码说明。
  qrDescription?: string
}

// 这个函数渲染联系山门页，入参为空，返回值是联系方式和隐私说明。
export function ContactPage() {
  // 这个状态保存站点设置。
  const [settings, setSettings] = useState<SiteSetting[]>([])
  // 这个状态保存演示提示。
  const [notice, setNotice] = useState('')

  useEffect(() => {
    // 这个函数读取站点设置，入参为空，返回值为空。
    async function loadSettings() {
      const result = await fetchSettings()
      setSettings(result.data)

      if (result.demoMode) {
        setNotice('当前为演示联系信息，配置 Supabase 后可在后台修改。')
      }
    }

    void loadSettings()
  }, [])

  // 这个变量从设置列表中取出联系配置，返回值用于页面展示。
  const contact = useMemo(() => {
    const setting = settings.find((item) => item.key === 'contact')
    return (setting?.value ?? {}) as ContactValue
  }, [settings])

  return (
    <main className="mx-auto max-w-6xl px-4 py-14 md:px-6">
      <SectionTitle center eyebrow="联系山门" title="不公开永久二维码，只留清净入口">
        问云派首版采用名册登记与人工审核，不直接公开永久微信群二维码，避免广告和陌生人直接入群。
      </SectionTitle>

      {notice ? <StatusNotice title="演示模式提示" message={notice} /> : null}

      <div className="mt-8 grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
        <ScrollPanel>
          <img className="mx-auto h-48 w-48 rounded-full object-cover shadow-xl" src={getPublicAsset('wenyun-logo.png')} alt="问云派门派 Logo" />
          <h2 className="ink-title mt-6 text-center text-3xl font-bold">问云派山门</h2>
          <p className="mt-4 text-center leading-8 text-[#526461]">
            {contact.contactTip ?? '请先提交名册登记，执事查看后会择时联系。'}
          </p>
          <div className="mt-6 flex justify-center">
            <CloudButton to="/join" variant="seal">
              登记名册
              <Mail className="h-4 w-4" />
            </CloudButton>
          </div>
        </ScrollPanel>

        <div className="grid gap-5">
          <ScrollPanel>
            <ShieldCheck className="mb-4 h-9 w-9 text-[#6f8f8b]" />
            <h2 className="text-2xl font-bold">联系方式说明</h2>
            <p className="mt-4 leading-8 text-[#526461]">
              联系人：{contact.wechatName ?? '问云派执事'}。微信号和申请理由只用于名册审核，不会在前台公开展示。
            </p>
          </ScrollPanel>
          <ScrollPanel>
            <h2 className="text-2xl font-bold">二维码安全</h2>
            <p className="mt-4 leading-8 text-[#526461]">
              {contact.qrDescription ?? '首版不公开永久群二维码，避免广告和陌生人直接入群。'}
            </p>
          </ScrollPanel>
          <ScrollPanel>
            <h2 className="text-2xl font-bold">入册后如何相处</h2>
            <p className="mt-4 leading-8 text-[#526461]">
              守礼、守真、守善、守界、守静、守净、守和、守信。愿你此来，不添风浪，只添灯火。
            </p>
          </ScrollPanel>
        </div>
      </div>
    </main>
  )
}
