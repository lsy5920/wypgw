import { useState } from 'react'
import { getGuofengIconPath, type GuofengIconKey } from '../data/visualAssets'

// 这个类型描述 draw-ui 线描图标名称，入参用于选择要展示的图标。
export type GeneratedIconName = 'scroll' | 'shield' | 'lantern' | 'gate' | 'notice' | 'calendar' | 'roster' | 'user' | 'settings'

// 这个类型描述生成图标组件入参，入参用于控制图标种类和额外样式。
interface GeneratedIconProps {
  // 图标名称，用于从九宫格素材板里裁出对应图标。
  name: GeneratedIconName
  // 额外样式类名，用于在卡片、按钮或标题中调整尺寸。
  className?: string
}

// 这个对象保存图标中文说明，返回值用于无障碍朗读。
const iconLabelByName: Record<GeneratedIconName, string> = {
  scroll: '书卷图标',
  shield: '守护图标',
  lantern: '云灯图标',
  gate: '山门图标',
  notice: '公告图标',
  calendar: '日历图标',
  roster: '名册图标',
  user: '用户图标',
  settings: '设置图标'
}

// 这个对象把旧组件图标名映射到新素材包的白底图标名，返回值用于读取真实 PNG 图标。
const guofengIconKeyByName: Record<GeneratedIconName, GuofengIconKey> = {
  scroll: 'scroll',
  shield: 'shieldCheck',
  lantern: 'lantern',
  gate: 'gate',
  notice: 'noticePaper',
  calendar: 'calendar',
  roster: 'roster',
  user: 'user',
  settings: 'settings'
}

// 这个函数按名称返回线描路径，入参是图标名称，返回值是可放入 SVG 的路径节点。
function renderIconPath(name: GeneratedIconName) {
  // 这里用分支返回不同图标，保证所有图标同线宽、同圆角、同金色描边。
  switch (name) {
    case 'scroll':
      return (
        <>
          <path d="M16 9h24a7 7 0 0 1 7 7v31H20a8 8 0 0 1-8-8V13a4 4 0 0 1 4-4Z" />
          <path d="M20 47a8 8 0 0 1 0-16h27" />
          <path d="M23 19h15M23 27h11" />
        </>
      )
    case 'shield':
      return (
        <>
          <path d="M32 8 49 15v13c0 13-7 22-17 28-10-6-17-15-17-28V15l17-7Z" />
          <path d="m24 31 6 6 11-14" />
        </>
      )
    case 'lantern':
      return (
        <>
          <path d="M22 14h20M27 8h10M32 14v42" />
          <path d="M20 31c0-10 5-17 12-17s12 7 12 17-5 17-12 17-12-7-12-17Z" />
          <path d="M20 31h24M24 48h16" />
        </>
      )
    case 'gate':
      return (
        <>
          <path d="M11 26h42M16 19h32L43 13H21l-5 6Z" />
          <path d="M20 26v24M44 26v24M27 50V34h10v16" />
          <path d="M15 50h34" />
        </>
      )
    case 'notice':
      return (
        <>
          <path d="M16 13h32v38H16z" />
          <path d="M23 23h18M23 31h18M23 39h12" />
          <path d="M14 19h-3v26h3M50 19h3v26h-3" />
        </>
      )
    case 'calendar':
      return (
        <>
          <path d="M16 16h32v34H16z" />
          <path d="M22 10v10M42 10v10M16 26h32" />
          <path d="M24 34h4M36 34h4M24 42h4M36 42h4" />
        </>
      )
    case 'roster':
      return (
        <>
          <path d="M17 12h30v40H17z" />
          <path d="M24 22h16M24 31h16M24 40h11" />
          <path d="M13 20h4M13 32h4M13 44h4" />
        </>
      )
    case 'user':
      return (
        <>
          <path d="M32 31a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z" />
          <path d="M16 52c3-11 10-17 16-17s13 6 16 17" />
        </>
      )
    case 'settings':
      return (
        <>
          <path d="M32 40a8 8 0 1 0 0-16 8 8 0 0 0 0 16Z" />
          <path d="M32 8v8M32 48v8M15 17l6 6M43 41l6 6M8 32h8M48 32h8M15 47l6-6M43 23l6-6" />
        </>
      )
    default:
      return null
  }
}

// 这个函数渲染参考设计图风格的线描图标，入参是图标名称和样式，返回值是统一图标节点。
export function GeneratedIcon({ name, className = '' }: GeneratedIconProps) {
  // 这个状态记录白底图标是否读取失败，失败时展示纯代码 SVG 兜底。
  const [imageFailed, setImageFailed] = useState(false)
  // 这个变量保存当前图标的真实 PNG 路径，返回值用于图片标签展示。
  const iconImagePath = getGuofengIconPath(guofengIconKeyByName[name])

  // 这个函数处理图标图片读取失败，入参为空，返回值为空。
  function handleImageError() {
    // 这里切换到 SVG 兜底，避免某张素材丢失时页面出现破图。
    setImageFailed(true)
  }

  return (
    <span aria-label={iconLabelByName[name]} className={`generated-icon ${className}`} role="img">
      {!imageFailed ? (
        <img alt="" aria-hidden="true" className="generated-icon-image" onError={handleImageError} src={iconImagePath} />
      ) : (
        <svg aria-hidden="true" className="generated-icon-line" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 64 64">
          {renderIconPath(name)}
        </svg>
      )}
    </span>
  )
}
