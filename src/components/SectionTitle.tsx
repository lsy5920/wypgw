import type { ReactNode } from 'react'
import { getGuofengVisualPath, type GuofengVisualKey } from '../data/visualAssets'

// 这个类型描述区块标题的入参，返回值用于统一各页面标题样式。
interface SectionTitleProps {
  // 小标签文字，用于说明当前区块气质。
  eyebrow?: string
  // 主标题文字。
  title: string
  // 说明文字，可以是纯文字或简单节点。
  children?: ReactNode
  // 是否居中显示。
  center?: boolean
  // 标题所处背景的明暗类型，用来保证文字在不同底色上都清晰。
  tone?: 'light' | 'dark'
  // 背景图主题，有值时会把生成图铺在标题区底层。
  visual?: GuofengVisualKey
  // 背景图说明，用于无障碍朗读，也方便后续维护。
  visualLabel?: string
}

// 这个对象保存标题背景图地址，返回值用于把生成图直接铺进标题卡底层。
// 这个函数渲染统一的区块标题，入参是标题内容，返回值是标题区域。
export function SectionTitle({ eyebrow, title, children, center = false, tone = 'light', visual, visualLabel }: SectionTitleProps) {
  // 这里判断当前标题是否放在深色背景上，后面会据此切换高对比颜色。
  const isDarkTone = tone === 'dark'
  // 这里统一保存小标签颜色，避免深色背景上朱砂色太暗看不清。
  const eyebrowClassName = isDarkTone ? 'border-[#f8df9d]/35 bg-white/8 text-[#f8df9d]' : 'border-[#2f6f68]/20 bg-white/72 text-[#b8473f]'
  // 这里统一保存主标题颜色，让深色背景里的大标题保持清楚醒目。
  const titleClassName = isDarkTone ? 'text-[#fff8e8]' : 'text-[#173332]'
  // 这里统一保存说明文字颜色，保证正文和背景之间有足够对比。
  const contentClassName = isDarkTone ? 'text-[#f4efe0]' : 'text-[#526461]'
  // 这个变量控制标题区域左右对齐，桌面端用于做成视觉稿里的书院页头。
  const alignClassName = center ? 'items-center text-center' : 'items-start text-left'
  // 这个变量判断是否展示标题背景图，返回值用于切换标题区高度和遮罩。
  const hasVisual = Boolean(visual)
  // 这个变量保存背景图说明，避免维护者每次都手写重复文字。
  const safeVisualLabel = visualLabel ?? `${title}背景图`
  // 这个变量保存当前标题背景图地址，返回值用于真实图片层，避免手机浏览器漏掉 CSS 背景变量。
  const visualImagePath = visual ? getGuofengVisualPath(visual) : ''

  return (
    <div
      className={`section-title-block relative mb-10 flex flex-col ${hasVisual ? 'section-title-with-visual' : ''} ${alignClassName}`}
      data-visual={visual}
    >
      {visual ? (
        <>
          {/* 这里使用真实图片层当标题背景，避免手机端 CSS 背景变量失效导致图片不显示。 */}
          <img alt="" aria-hidden="true" className="section-title-visual-image absolute inset-0 z-0" data-visual-label={safeVisualLabel} src={visualImagePath} />
          {/* 这里叠加柔和遮罩，保证文字浮在图上也能清楚阅读。 */}
          <span aria-hidden="true" className="section-title-visual-shade absolute inset-0 z-[1]" />
        </>
      ) : null}
      {/* 这里绘制页头右上角的金线折角，模拟视觉稿里的书册索引。 */}
      <span aria-hidden="true" className="section-title-corner z-[2]" />
      {/* 这里展示短小的金色说明，用来建立东方秘境的视觉层级。 */}
      {eyebrow ? (
        <p className={`relative z-10 mb-3 inline-flex items-center gap-2 rounded-lg border px-3 py-1 text-sm font-semibold shadow-md shadow-[#102a31]/6 backdrop-blur ${eyebrowClassName}`}>
          <span className="h-1.5 w-1.5 rounded-full bg-current" />
          {eyebrow}
        </p>
      ) : null}
      {/* 这里展示主标题，使用偏宋体的标题风格增加山门题匾感。 */}
      <h2 className={`ink-title relative z-10 max-w-4xl text-balance text-3xl font-bold leading-tight ${titleClassName} md:text-5xl`}>{title}</h2>
      {/* 这里展示说明文字，没有内容时不占位。 */}
      {children ? <div className={`relative z-10 mt-4 max-w-3xl text-base leading-8 ${contentClassName} md:text-lg`}>{children}</div> : null}
      {/* 这里用细金线收住标题区域，避免大段内容显得松散。 */}
      <div className={center ? 'gold-thread relative z-10 mx-auto mt-6 w-44' : 'gold-thread relative z-10 mt-6 w-44'} />
      {/* 这里加入三个极轻的纸面定位点，让不同页面标题在视觉上保持同一套网格。 */}
      <div aria-hidden="true" className="section-title-dots relative z-10 mt-5 flex gap-2">
        <span />
        <span />
        <span />
      </div>
      {/* 这里是纯代码小印记，不依赖任何旧素材，让每个页面标题都和新视觉稿统一。 */}
      <span aria-hidden="true" className="section-title-seal ink-title">云</span>
    </div>
  )
}
