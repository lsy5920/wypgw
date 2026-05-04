import { useState } from 'react'

// 这个类型描述内置生图图标板里的图标名称，入参用于选择要裁出的图标。
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

// 这个常量保存图标素材板地址，返回值会跟随部署路径自动变化。
const iconBoardPath = `${import.meta.env.BASE_URL}visual-generated/wenyun-icon-board-20260504.png`

// 这个函数渲染从生成图标板裁出的单个图标，入参是图标名称和样式，返回值是带兜底的图标节点。
export function GeneratedIcon({ name, className = '' }: GeneratedIconProps) {
  // 这个状态记录图标素材板是否加载失败，失败时显示纯色兜底点，避免卡片出现破图。
  const [imageFailed, setImageFailed] = useState(false)

  // 这个函数处理素材板加载失败的情况，入参为空，返回值为空。
  function handleImageError() {
    // 这里兜底切换为纯代码图标底座，保证页面仍能正常阅读和点击。
    setImageFailed(true)
  }

  return (
    <span aria-label={iconLabelByName[name]} className={`generated-icon generated-icon-crop-${name} ${className}`} role="img">
      {!imageFailed ? <img alt="" aria-hidden="true" className="generated-icon-sheet" onError={handleImageError} src={iconBoardPath} /> : null}
      {imageFailed ? <span aria-hidden="true" className="generated-icon-fallback" /> : null}
    </span>
  )
}
