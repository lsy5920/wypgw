import type { ReactNode } from 'react'

// 这个类型描述后台状态章的颜色，入参用于选择不同业务状态的视觉提示，返回值体现在样式类名里。
export type AdminTone = 'teal' | 'gold' | 'red' | 'green' | 'gray'

// 这个接口描述后台页面外壳的参数，入参用于渲染页签、标题、说明和右侧工具区，返回值是统一的宣纸工作台页面。
interface AdminPageShellProps {
  // 页面编号，对应设计稿左上角的数字题签。
  index: string
  // 页面标题，对应设计稿题签中的页面名称。
  title: string
  // 页面说明，用一句话告诉管理员当前页面处理什么。
  description: string
  // 页面右上角工具区，可以放新增按钮或筛选入口。
  actions?: ReactNode
  // 页面主体内容。
  children: ReactNode
}

// 这个接口描述后台纸卡的参数，入参用于渲染标题、说明、右侧操作和内容，返回值是一块可复用的浅色面板。
interface AdminPanelProps {
  // 纸卡标题。
  title?: string
  // 纸卡说明。
  description?: string
  // 纸卡右侧操作区。
  actions?: ReactNode
  // 纸卡额外样式类名。
  className?: string
  // 纸卡内部内容。
  children: ReactNode
}

// 这个接口描述统计卡片的参数，入参用于展示一个数字和说明，返回值是后台总览中的小数据卡。
interface AdminMetricCardProps {
  // 统计标题。
  label: string
  // 统计数值。
  value: string | number
  // 统计说明。
  hint: string
  // 卡片右侧图标。
  icon: ReactNode
  // 卡片颜色。
  tone?: AdminTone
}

// 这个接口描述状态章的参数，入参用于展示短状态文字，返回值是圆角色块。
interface AdminStatusPillProps {
  // 状态颜色。
  tone?: AdminTone
  // 状态文字。
  children: ReactNode
}

// 这个函数拼接样式类名，入参是可能为空的类名数组，返回值是去掉空值后的字符串。
export function joinAdminClasses(...classes: Array<string | false | null | undefined>): string {
  // 这里过滤空值，避免 className 里出现 false 或 undefined。
  return classes.filter(Boolean).join(' ')
}

// 这个函数渲染后台页面外壳，入参是页面配置和内容，返回值是接近设计稿的题签加宣纸画布。
export function AdminPageShell({ index, title, description, actions, children }: AdminPageShellProps) {
  return (
    <section className="admin-page-shell">
      {/* 这里渲染设计稿中的左上角编号题签。 */}
      <div className="admin-page-ribbon">
        <span>{index}</span>
        <strong>{title}</strong>
      </div>

      {/* 这里渲染页面顶栏，让每个后台页都有明确的当前任务和快捷操作。 */}
      <header className="admin-page-heading">
        <div className="min-w-0">
          <p className="admin-page-kicker">问云后台管理端</p>
          <h1>{title}</h1>
          <p>{description}</p>
        </div>
        {actions ? <div className="admin-page-actions">{actions}</div> : null}
      </header>

      {/* 这里渲染页面主体，所有真实表格、表单和卡片都放在同一张宣纸工作区里。 */}
      <div className="admin-page-body">{children}</div>
    </section>
  )
}

// 这个函数渲染后台浅色纸卡，入参是标题、说明和内容，返回值是一块统一面板。
export function AdminPanel({ title, description, actions, className = '', children }: AdminPanelProps) {
  return (
    <section className={joinAdminClasses('admin-panel', className)}>
      {title || description || actions ? (
        <div className="admin-panel-head">
          <div className="min-w-0">
            {title ? <h2>{title}</h2> : null}
            {description ? <p>{description}</p> : null}
          </div>
          {actions ? <div className="admin-panel-actions">{actions}</div> : null}
        </div>
      ) : null}
      {children}
    </section>
  )
}

// 这个函数渲染统计卡片，入参是标题、数值、说明和图标，返回值是总览页的一块数据摘要。
export function AdminMetricCard({ label, value, hint, icon, tone = 'teal' }: AdminMetricCardProps) {
  return (
    <article className={joinAdminClasses('admin-metric-card', `admin-tone-${tone}`)}>
      <div>
        <p>{label}</p>
        <strong>{value}</strong>
        <span>{hint}</span>
      </div>
      <span aria-hidden="true" className="admin-metric-icon">
        {icon}
      </span>
    </article>
  )
}

// 这个函数渲染状态章，入参是颜色和文字，返回值是用于表格或卡片的小标签。
export function AdminStatusPill({ tone = 'gray', children }: AdminStatusPillProps) {
  return <span className={joinAdminClasses('admin-status-pill', `admin-tone-${tone}`)}>{children}</span>
}

// 这个函数格式化后台日期时间，入参是数据库时间字符串，返回值是月日和时分，异常时返回原文字。
export function formatAdminDate(value: string | null | undefined): string {
  // 这里没有时间时给出可读兜底，避免页面显示空白。
  if (!value) {
    return '未记录'
  }

  try {
    // 这里统一使用中文本地时间，方便管理员按先后处理。
    return new Date(value).toLocaleString('zh-CN', {
      hour12: false,
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  } catch {
    // 这里兜底处理异常日期，避免单条坏数据导致整页报错。
    return value
  }
}
