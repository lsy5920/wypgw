import { CodeScene } from './CodeScene'
import { ScrollPanel } from './ScrollPanel'
import type { GuofengVisualKey } from '../data/visualAssets'

// 这个类型描述页面场景横幅的入参，入参用于控制图形主题、说明文字和明暗底色。
interface SceneBannerProps {
  // 场景主题，用于选择山门、卷轴、云灯、小院、工作台或地图。
  variant?: GuofengVisualKey
  // 场景说明，用于无障碍朗读，也方便维护者知道这一块在表达什么。
  label: string
  // 是否使用浅色场景，前台和小院多数页面用浅色，后台多数页面用深色。
  light?: boolean
  // 额外样式类名，用于个别页面调整外边距或高度。
  className?: string
}

// 这个函数渲染统一页面场景背景横幅，入参是场景配置，返回值是放在区块标题下方的生成图背景。
export function SceneBanner({ variant = 'gate', label, light = false, className = '' }: SceneBannerProps) {
  // 这个变量保存浅色或深色场景样式，避免每个页面重复拼接 className。
  const toneClassName = light ? 'code-scene-light' : ''

  return (
    <ScrollPanel className={`section-image-backdrop mt-6 overflow-hidden p-0 ${className}`}>
      {/* 这里优先使用内置生图模型生成的背景图，失败时才回退到纯代码场景。 */}
      <CodeScene className={`${toneClassName} section-background-scene min-h-[18rem] rounded-none`} label={label} variant={variant} />
    </ScrollPanel>
  )
}
