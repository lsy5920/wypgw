import { useState } from 'react'
import { getGuofengVisualPath, type GuofengLegacyVisualKey, type GuofengVisualKey } from '../data/visualAssets'

// 这个类型描述场景主题名称，返回值用于让页面和素材映射保持同一套枚举。
export type CodeSceneVariant = GuofengLegacyVisualKey

// 这个类型描述纯代码场景入参，入参用于切换不同页面需要的图形主题。
interface CodeSceneProps {
  // 场景主题，用于决定山门、灯火、卷轴、小院或后台的视觉重点。
  variant?: GuofengVisualKey
  // 场景标题，用于无障碍说明当前装饰图的含义。
  label: string
  // 额外样式类名。
  className?: string
}

// 这个对象保存内置生图模型生成的场景素材，返回值用于让不同页面自动套用对应插图。
// 这个函数渲染生成图加纯代码线框的抽象场景，入参是主题、说明和样式，返回值是可容错的视觉区域。
export function CodeScene({ variant = 'gate', label, className = '' }: CodeSceneProps) {
  // 这个状态记录生成图是否加载失败，失败时保留原有纯代码场景，避免页面空白。
  const [generatedImageFailed, setGeneratedImageFailed] = useState(false)
  // 这个变量保存当前主题对应的生成图地址，返回值用于图片标签读取素材。
  const generatedScenePath = getGuofengVisualPath(variant)

  // 这个函数处理生成图加载失败的情况，入参为空，返回值为空。
  function handleGeneratedImageError() {
    // 这里兜底隐藏失败图片，让下方纯代码山形、灯火和台账线框继续显示。
    setGeneratedImageFailed(true)
  }

  // 这个变量保存当前场景是否正在使用生成图，返回值用于控制旧线框装饰是否隐藏。
  const generatedStateClassName = generatedImageFailed ? 'code-scene-fallback-only' : 'code-scene-has-generated'

  return (
    <div aria-label={label} className={`code-scene code-scene-${variant} ${generatedStateClassName} relative overflow-hidden rounded-lg ${className}`} role="img">
      {!generatedImageFailed ? (
        <img
          alt=""
          aria-hidden="true"
          className="code-scene-generated-image"
          onError={handleGeneratedImageError}
          src={generatedScenePath}
        />
      ) : null}
      {/* 这里绘制远山和雾气，作为所有场景的统一底图。 */}
      <span className="code-scene-mountain code-scene-mountain-a" />
      <span className="code-scene-mountain code-scene-mountain-b" />
      <span className="code-scene-mist code-scene-mist-a" />
      <span className="code-scene-mist code-scene-mist-b" />
      {/* 这里绘制主题主体，不同 variant 会通过 CSS 呈现山门、卷轴、灯火或工作台。 */}
      <span className="code-scene-core" />
      <span className="code-scene-line code-scene-line-a" />
      <span className="code-scene-line code-scene-line-b" />
      <span className="code-scene-dot code-scene-dot-a" />
      <span className="code-scene-dot code-scene-dot-b" />
      {/* 这里叠加轻量界面线框，让场景既有山门意象，也能回应生图稿里的页面缩略卡。 */}
      <span className="code-scene-ui code-scene-ui-a" />
      <span className="code-scene-ui code-scene-ui-b" />
      <span className="code-scene-ui code-scene-ui-c" />
      <span className="code-scene-chip code-scene-chip-a" />
      <span className="code-scene-chip code-scene-chip-b" />
    </div>
  )
}
