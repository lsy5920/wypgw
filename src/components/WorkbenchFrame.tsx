import type { ReactNode } from 'react'

// 这个类型描述工作台外壳入参，入参用于统一小院和后台的内容区域。
interface WorkbenchFrameProps {
  // 工作台内部内容。
  children: ReactNode
  // 额外样式类名。
  className?: string
}

// 这个函数渲染工作台外壳，入参是页面内容，返回值是统一的玉石宣纸背景容器。
export function WorkbenchFrame({ children, className = '' }: WorkbenchFrameProps) {
  return (
    <section className={`workbench-surface mx-auto min-h-[48vh] max-w-6xl rounded-[1.75rem] p-4 md:min-h-[58vh] md:p-6 lg:min-h-[calc(100vh-6rem)] ${className}`}>
      {/* 这里给工作台顶部加一条金线，强化后台和小院的高级仪表盘感。 */}
      <div className="gold-thread mb-5 opacity-80" />
      {children}
    </section>
  )
}
