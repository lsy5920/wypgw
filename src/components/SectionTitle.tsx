import type { ReactNode } from 'react'

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
}

// 这个函数渲染统一的区块标题，入参是标题内容，返回值是标题区域。
export function SectionTitle({ eyebrow, title, children, center = false, tone = 'light' }: SectionTitleProps) {
  // 这里判断当前标题是否放在深色背景上，后面会据此切换高对比颜色。
  const isDarkTone = tone === 'dark'
  // 这里统一保存小标签颜色，避免深色背景上朱砂色太暗看不清。
  const eyebrowClassName = isDarkTone ? 'text-[#e6b968]' : 'text-[#9e3d32]'
  // 这里统一保存主标题颜色，让深色背景里的大标题保持清楚醒目。
  const titleClassName = isDarkTone ? 'text-[#fff8e8]' : 'text-[#263238]'
  // 这里统一保存说明文字颜色，保证正文和背景之间有足够对比。
  const contentClassName = isDarkTone ? 'text-[#f4efe0]' : 'text-[#526461]'

  return (
    <div className={center ? 'mx-auto mb-10 max-w-3xl text-center' : 'mb-10 max-w-3xl'}>
      {/* 这里展示短小的金色说明，用来建立国风层级。 */}
      {eyebrow ? (
        <p className={`mb-3 inline-flex items-center gap-2 rounded-full border border-current/20 px-3 py-1 text-sm font-semibold ${eyebrowClassName}`}>
          <span className="h-1.5 w-1.5 rounded-full bg-current" />
          {eyebrow}
        </p>
      ) : null}
      {/* 这里展示主标题，使用偏宋体的标题风格增加江湖卷轴感。 */}
      <h2 className={`ink-title text-balance text-3xl font-bold leading-tight ${titleClassName} md:text-5xl`}>{title}</h2>
      {/* 这里展示说明文字，没有内容时不占位。 */}
      {children ? <div className={`mt-4 text-base leading-8 ${contentClassName} md:text-lg`}>{children}</div> : null}
    </div>
  )
}
