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
}

// 这个函数渲染统一的区块标题，入参是标题内容，返回值是标题区域。
export function SectionTitle({ eyebrow, title, children, center = false }: SectionTitleProps) {
  return (
    <div className={center ? 'mx-auto mb-10 max-w-3xl text-center' : 'mb-10 max-w-3xl'}>
      {/* 这里展示短小的金色说明，用来建立国风层级。 */}
      {eyebrow ? <p className="mb-3 text-sm font-semibold text-[#9e3d32]">{eyebrow}</p> : null}
      {/* 这里展示主标题，使用偏宋体的标题风格增加江湖卷轴感。 */}
      <h2 className="ink-title text-3xl font-bold text-[#263238] md:text-5xl">{title}</h2>
      {/* 这里展示说明文字，没有内容时不占位。 */}
      {children ? <div className="mt-4 text-base leading-8 text-[#526461] md:text-lg">{children}</div> : null}
    </div>
  )
}
