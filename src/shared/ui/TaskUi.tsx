import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { getGuofengIconPath, type GuofengIconKey } from '../../data/visualAssets'

// 这个常量保存问云派正式 Logo 地址，入参为空，返回值用于页眉、页脚、小院和后台等品牌位置。
export const brandLogoPath = '/assets/wenyun-logo.png'

// 这个类型描述提示组件的样式等级，入参来自页面状态，返回值用于决定颜色和语气。
export type NoticeTone = 'info' | 'success' | 'warning' | 'danger'

// 这个类型描述按钮组件的样式等级，入参来自页面动作，返回值用于决定主次关系。
export type ButtonTone = 'primary' | 'secondary' | 'quiet' | 'danger'

// 这个对象保存中文状态映射，入参是数据库状态，返回值用于页面展示。
const statusMap: Record<string, string> = {
  pending: '待处理',
  approved: '已通过',
  rejected: '未通过',
  contacted: '已联系',
  draft: '暂存',
  retired: '已退派',
  published: '已发布',
  closed: '已关闭',
  ended: '已结束',
  registered: '已报名',
  cancelled: '已取消',
  attended: '已赴约'
}

// 这个函数把数据库状态转为中文，入参是状态字符串，返回值是中文状态名。
export function statusText(value: string | null | undefined): string {
  return value ? statusMap[value] ?? value : '未记录'
}

// 这个函数格式化日期，入参是日期文本，返回值是中文日期。
export function formatDate(value: string | null | undefined): string {
  if (!value) {
    return '待定'
  }

  try {
    return new Intl.DateTimeFormat('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).format(new Date(value))
  } catch {
    return '待定'
  }
}

// 这个函数格式化日期时间，入参是日期文本，返回值是中文日期和时间。
export function formatDateTime(value: string | null | undefined): string {
  if (!value) {
    return '待定'
  }

  try {
    return new Intl.DateTimeFormat('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(value))
  } catch {
    return '待定'
  }
}

// 这个接口描述品牌印章组件，入参是可选短文案，返回值是页眉和侧栏标识。
interface TaskSealProps {
  // 标识旁边的小字。
  caption?: string
}

// 这个组件展示问云派标识，入参是小字说明，返回值是可复用的站点标识。
export function TaskSeal({ caption = '门派任务书' }: TaskSealProps) {
  return (
    <Link className="task-seal" to="/" aria-label="返回问云派首页">
      <span className="task-seal__mark">
        <img alt="" className="task-seal__logo" src={brandLogoPath} />
      </span>
      <span className="task-seal__text">
        <strong>问云派</strong>
        <small>{caption}</small>
      </span>
    </Link>
  )
}

// 这个接口描述页面标题区，入参来自各页面，返回值是统一的任务书页首。
interface MissionHeroProps {
  // 顶部小标签。
  eyebrow: string
  // 页面主标题。
  title: string
  // 页面说明。
  lead: string
  // 右侧或下方附加内容。
  aside?: ReactNode
  // 附加样式类名。
  className?: string
}

// 这个组件展示任务书大标题，入参是标题文案和附加区域，返回值是带空间层次的页首。
export function MissionHero({ eyebrow, title, lead, aside, className = '' }: MissionHeroProps) {
  const overlayClassName = aside ? 'mission-hero--image-overlay' : ''

  return (
    <motion.section
      className={`mission-hero ${overlayClassName} ${className}`}
      initial={{ opacity: 0, y: 26 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.62, ease: [0.2, 0.8, 0.2, 1] }}
      viewport={{ once: true, amount: 0.25 }}
    >
      <div className="mission-hero__content">
        <p className="section-eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
        <p>{lead}</p>
      </div>
      {aside ? <div className="mission-hero__aside">{aside}</div> : null}
    </motion.section>
  )
}

// 这个接口描述任务卡组件，入参来自页面模块，返回值是单个任务块。
interface MissionCardProps {
  // 卡片标题。
  title: string
  // 卡片说明。
  children: ReactNode
  // 卡片顶部标签。
  eyebrow?: string
  // 右上角内容。
  meta?: ReactNode
  // 底部动作。
  action?: ReactNode
  // 附加样式类名。
  className?: string
}

// 这个组件展示任务卡，入参是标题、内容和动作，返回值是公开端与小院都能复用的信息块。
export function MissionCard({ title, children, eyebrow, meta, action, className = '' }: MissionCardProps) {
  return (
    <motion.article
      className={`mission-card ${className}`}
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.48, ease: [0.2, 0.8, 0.2, 1] }}
      viewport={{ once: true, amount: 0.2 }}
    >
      <div className="mission-card__head">
        <div>
          {eyebrow ? <p className="mission-card__eyebrow">{eyebrow}</p> : null}
          <h2>{title}</h2>
        </div>
        {meta ? <div className="mission-card__meta">{meta}</div> : null}
      </div>
      <div className="mission-card__body">{children}</div>
      {action ? <div className="mission-card__action">{action}</div> : null}
    </motion.article>
  )
}

// 这个接口描述指标卡组件，入参来自统计数据，返回值是简洁数值块。
interface MetricCardProps {
  // 指标名称。
  label: string
  // 指标数值。
  value: ReactNode
  // 指标说明。
  hint?: string
}

// 这个组件展示关键指标，入参是名称、数值和说明，返回值是任务台统计块。
export function MetricCard({ label, value, hint }: MetricCardProps) {
  return (
    <motion.div
      className="metric-card"
      initial={{ opacity: 0, scale: 0.96 }}
      whileInView={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.42, ease: [0.2, 0.8, 0.2, 1] }}
      viewport={{ once: true, amount: 0.3 }}
    >
      <span>{label}</span>
      <strong>{value}</strong>
      {hint ? <small>{hint}</small> : null}
    </motion.div>
  )
}

// 这个接口描述提示条组件，入参来自异步状态，返回值是中文反馈。
interface StatusNoticeProps {
  // 提示语气。
  tone?: NoticeTone
  // 提示标题。
  title?: string
  // 提示正文。
  children: ReactNode
}

// 这个组件展示页面提示，入参是提示类型和正文，返回值是无弹窗打断的反馈条。
export function StatusNotice({ tone = 'info', title, children }: StatusNoticeProps) {
  return (
    <div className={`status-notice status-notice--${tone}`} role={tone === 'danger' ? 'alert' : 'status'}>
      {title ? <strong>{title}</strong> : null}
      <span>{children}</span>
    </div>
  )
}

// 这个接口描述空状态组件，入参来自列表页，返回值是可操作的空内容提示。
interface EmptyStateProps {
  // 空状态标题。
  title: string
  // 空状态说明。
  description: string
  // 空状态动作。
  action?: ReactNode
}

// 这个组件展示空状态，入参是标题、说明和动作，返回值是列表无数据时的稳定占位。
export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <div className="empty-state">
      <span className="empty-state__mark" aria-hidden="true" />
      <h2>{title}</h2>
      <p>{description}</p>
      {action ? <div>{action}</div> : null}
    </div>
  )
}

// 这个接口描述加载组件，入参来自页面标题，返回值是稳定高度的加载状态。
interface LoadingBlockProps {
  // 加载说明。
  label?: string
}

// 这个组件展示加载状态，入参是说明文字，返回值是不会让页面跳动的骨架。
export function LoadingBlock({ label = '正在取任务册' }: LoadingBlockProps) {
  return (
    <div className="loading-block" role="status">
      <span />
      <span />
      <span />
      <p>{label}...</p>
    </div>
  )
}

// 这个接口描述标签组件，入参来自状态，返回值是小型状态章。
interface StatusPillProps {
  // 状态值。
  value: string | null | undefined
  // 附加样式类名。
  className?: string
}

// 这个组件展示状态章，入参是状态值，返回值是带语义文本的短标签。
export function StatusPill({ value, className = '' }: StatusPillProps) {
  return <span className={`status-pill status-pill--${value ?? 'unknown'} ${className}`}>{statusText(value)}</span>
}

// 这个接口描述链接按钮，入参来自路由和视觉等级，返回值是可访问链接。
interface TaskLinkProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  // 路由地址。
  to: string
  // 按钮样式。
  tone?: ButtonTone
  // 可选按钮图标。
  icon?: GuofengIconKey
  // 链接内容。
  children: ReactNode
}

// 这个组件展示链接按钮，入参是路由、样式和内容，返回值是统一动作入口。
export function TaskLink({ to, tone = 'secondary', icon, children, className = '', ...rest }: TaskLinkProps) {
  return (
    <Link className={`task-button task-button--${tone} ${className}`} to={to} {...rest}>
      {icon ? <img alt="" className="task-button__icon" src={getGuofengIconPath(icon)} /> : null}
      {children}
    </Link>
  )
}

// 这个接口描述普通按钮，入参来自表单动作，返回值是统一按钮。
interface TaskButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  // 按钮样式。
  tone?: ButtonTone
  // 可选按钮图标。
  icon?: GuofengIconKey
  // 按钮内容。
  children: ReactNode
}

// 这个组件展示普通按钮，入参是按钮属性和样式等级，返回值是触控友好的按钮。
export function TaskButton({ tone = 'secondary', icon, children, className = '', ...rest }: TaskButtonProps) {
  return (
    <button className={`task-button task-button--${tone} ${className}`} {...rest}>
      {icon ? <img alt="" className="task-button__icon" src={getGuofengIconPath(icon)} /> : null}
      {children}
    </button>
  )
}

// 这个接口描述表单字段，入参来自表单布局，返回值是统一标签容器。
interface FieldProps {
  // 字段标签。
  label: string
  // 帮助说明。
  hint?: string
  // 错误说明。
  error?: string
  // 字段控件。
  children: ReactNode
}

// 这个组件展示表单字段，入参是标签、说明和控件，返回值是可读的表单结构。
export function Field({ label, hint, error, children }: FieldProps) {
  return (
    <label className="field">
      <span>{label}</span>
      {children}
      {hint ? <small>{hint}</small> : null}
      {error ? <small className="field__error">{error}</small> : null}
    </label>
  )
}

// 这个接口描述时间线项目，入参来自流程步骤，返回值是任务路径节点。
interface TimelineItemProps {
  // 序号。
  index: number
  // 标题。
  title: string
  // 说明。
  text: string
  // 是否完成。
  done?: boolean
}

// 这个组件展示时间线节点，入参是序号、标题和说明，返回值是可组合的任务路径。
export function TimelineItem({ index, title, text, done = false }: TimelineItemProps) {
  return (
    <li className={`timeline-item ${done ? 'timeline-item--done' : ''}`}>
      <span>{String(index).padStart(2, '0')}</span>
      <div>
        <h3>{title}</h3>
        <p>{text}</p>
      </div>
    </li>
  )
}
