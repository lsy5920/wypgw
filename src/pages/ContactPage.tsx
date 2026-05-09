import { Clock3, Mail, MapPin, MessageCircle } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { getGuofengVisualPath } from '../data/visualAssets'
import { fetchSettings } from '../lib/services'
import type { SiteSetting } from '../lib/types'

// 这个接口描述联系设置内容，字段来自后台站点设置中的 contact 配置。
interface ContactValue {
  // 后台填写的联系对象名称。
  wechatName?: string
  // 后台填写的联系说明。
  contactTip?: string
  // 后台填写的二维码或入群安全说明。
  qrDescription?: string
  // 预留邮箱字段，后续后台扩展后可直接展示。
  email?: string
  // 预留地点字段，后续后台扩展后可直接展示。
  address?: string
  // 预留工作时间字段，后续后台扩展后可直接展示。
  workingHours?: string
}

// 这个接口描述联系方式条目，icon 是图标组件名，label 是说明文字，value 是展示内容。
interface ContactInfoItem {
  // 条目图标类型。
  icon: 'mail' | 'message' | 'map' | 'time'
  // 条目说明。
  label: string
  // 条目内容。
  value: string
}

// 这个对象保存图标映射，返回值用于让联系方式列表保持同一套线性图标。
const contactIconByType = {
  mail: Mail,
  message: MessageCircle,
  map: MapPin,
  time: Clock3
}

// 这个函数读取字符串设置，入参是未知配置值和兜底文案，返回值是可展示的中文字符串。
function readSettingText(value: unknown, fallback: string): string {
  return typeof value === 'string' && value.trim() ? value.trim() : fallback
}

// 这个函数渲染联系山门页面，入参为空，返回值是真实站点设置的联系信息布局。
export function ContactPage() {
  // 这个状态保存后台站点设置列表。
  const [settings, setSettings] = useState<SiteSetting[]>([])
  // 这个状态保存设置是否已读取完成。
  const [loaded, setLoaded] = useState(false)
  // 这个常量保存联系页底部装饰插图地址。
  const contactImage = getGuofengVisualPath('contactNote')

  useEffect(() => {
    // 这个变量记录页面是否仍然存在，避免慢请求返回后更新已离开的页面。
    let alive = true
    // 这里设置读取超时，避免联系设置请求卡住时页面一直显示读取中。
    const timeoutId = window.setTimeout(() => {
      if (alive) {
        setLoaded(true)
      }
    }, 3200)

    // 这个函数读取真实站点设置，入参为空，返回值为空。
    async function loadSettings() {
      try {
        const result = await fetchSettings()
        if (alive) {
          setSettings(result.data)
        }
      } finally {
        // 这里无论读取成功或失败都结束加载态，避免页面长期停留在读取中。
        if (alive) {
          window.clearTimeout(timeoutId)
          setLoaded(true)
        }
      }
    }

    void loadSettings()

    return () => {
      alive = false
      window.clearTimeout(timeoutId)
    }
  }, [])

  // 这个常量保存 contact 设置对象，后台未配置时为空对象。
  const contact = useMemo(() => {
    const setting = settings.find((item) => item.key === 'contact')
    return (setting?.value ?? {}) as ContactValue
  }, [settings])

  // 这个常量保存页面中部真实联系条目，优先展示后台配置，没有配置时明确说明暂未填写。
  const contactInfoItems: ContactInfoItem[] = [
    { icon: 'message', label: '联系对象', value: readSettingText(contact.wechatName, loaded ? '后台暂未填写' : '正在读取设置') },
    { icon: 'mail', label: '云书信箱', value: readSettingText(contact.email, '后台暂未填写邮箱') },
    { icon: 'map', label: '集结方式', value: readSettingText(contact.address, '以后台联系说明为准') },
    { icon: 'time', label: '工作时间', value: readSettingText(contact.workingHours, '后台暂未填写时间') }
  ]

  // 这个常量保存右侧安全提示，内容来自后台二维码说明。
  const safeTips = [
    readSettingText(contact.contactTip, loaded ? '后台暂未填写联系说明。' : '正在读取联系说明……'),
    readSettingText(contact.qrDescription, loaded ? '后台暂未填写二维码安全说明。' : '正在读取安全说明……'),
    '山门不会主动索要密码或银行卡信息，请谨防诈骗。'
  ]

  return (
    <section className="public-art-page contact-art-page" aria-label="联系山门">
      <div className="contact-reference-layout">
        {/* 这里还原左侧大红印信。 */}
        <div className="contact-seal-panel" aria-label="问云派山门印信">
          <span>山门</span>
          <strong>问云派</strong>
          <span>印信</span>
        </div>

        {/* 这里还原中间联系说明卡，内容来自后台站点设置。 */}
        <article className="contact-info-card">
          <h1>山门常开，静候有缘</h1>
          <p>{readSettingText(contact.contactTip, loaded ? '后台暂未填写联系说明。' : '正在读取联系说明……')}</p>
          <dl>
            {contactInfoItems.map((item) => {
              const Icon = contactIconByType[item.icon]

              return (
                <div key={item.label}>
                  <Icon aria-hidden="true" />
                  <dt>{item.label}</dt>
                  <dd>{item.value}</dd>
                </div>
              )
            })}
          </dl>
        </article>

        {/* 这里还原右侧安全提示卡，说明来自后台设置和固定安全底线。 */}
        <aside className="contact-safe-card">
          <h2>安全提示</h2>
          <ul>
            {safeTips.map((tip) => (
              <li key={tip}>{tip}</li>
            ))}
          </ul>
          <img alt="联系山门水墨装饰" className="contact-safe-image" src={contactImage} />
        </aside>
      </div>
    </section>
  )
}
