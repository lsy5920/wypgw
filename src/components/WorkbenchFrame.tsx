import type { ReactNode } from 'react'
import { Bell, Menu, UserRound } from 'lucide-react'

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
    <section className={`workbench-surface relative mx-auto min-h-[48vh] w-full max-w-[1500px] overflow-hidden rounded-lg p-4 md:min-h-[58vh] md:p-6 lg:min-h-[calc(100vh-6rem)] ${className}`}>
      {/* 这里绘制工作台内部的浅色经纬线，统一小院和后台每个页面的操作底盘。 */}
      <div aria-hidden="true" className="workbench-frame-map pointer-events-none absolute inset-0" />
      {/* 这里给工作台顶部加一条金线，强化后台和小院的高级仪表盘感。 */}
      <div className="gold-thread mb-5 opacity-80" />
      {/* 这里补上设计稿里的工作台顶部栏，桌面端和移动端都能看到当前工作区状态。 */}
      <div className="workbench-inner-topbar">
        <div className="flex min-w-0 items-center gap-3">
          <span aria-hidden="true" className="workbench-inner-topbar-button">
            <Menu className="h-4 w-4" />
          </span>
          <div className="min-w-0">
            <p className="workbench-inner-topbar-title truncate">问云工作台</p>
            <p className="workbench-inner-topbar-subtitle">清明守序，灯火有回音</p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <span aria-hidden="true" className="workbench-inner-topbar-button">
            <Bell className="h-4 w-4" />
          </span>
          <span aria-hidden="true" className="workbench-inner-topbar-avatar">
            <UserRound className="h-4 w-4" />
          </span>
        </div>
      </div>
      {children}
    </section>
  )
}
