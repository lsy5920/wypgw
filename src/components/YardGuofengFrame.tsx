import type { ReactNode } from 'react'
import type { GuofengIconKey, GuofengPageVisualKey } from '../data/visualAssets'
import { getGuofengIconPath, getGuofengVisualPath } from '../data/visualAssets'

// 这个类型描述小院页面横幅入参，入参用于复刻设计稿顶部的水墨横图。
interface YardPageBannerProps {
  // 页面序号和页面名称，例如“1 小院总览”。
  indexLabel: string
  // 页面主标题，用于告诉用户当前页面在做什么。
  title: string
  // 页面说明文字，用于补充当前页面的核心用途。
  subtitle: string
  // 页面背景插图名称，用于从统一素材包取图。
  visual: GuofengPageVisualKey
  // 横幅右侧操作区，可放按钮或链接。
  action?: ReactNode
  // 是否让标题居中，部分页面设计稿需要中轴排版。
  center?: boolean
}

// 这个类型描述宣纸卡片入参，入参用于统一小院所有信息块。
interface YardPaperCardProps {
  // 卡片内部内容。
  children: ReactNode
  // 卡片标题，可为空。
  title?: string
  // 卡片副标题，可为空。
  subtitle?: string
  // 卡片右上角操作区，可放按钮。
  action?: ReactNode
  // 额外样式类名，用于个别页面调整网格宽度。
  className?: string
}

// 这个类型描述数据小卡片入参，入参用于小院总览的五个统计入口。
interface YardMetricCardProps {
  // 图标名称，用于读取白底国风小图标。
  icon: GuofengIconKey
  // 指标名称。
  label: string
  // 指标数值或主要状态。
  value: string | number
  // 指标说明文字。
  note: string
  // 色调名称，用于区分不同指标。
  tone?: 'gold' | 'jade' | 'seal' | 'purple' | 'paper'
}

// 这个类型描述状态标签入参，入参用于审核、报名、邮件等状态展示。
interface YardStatusPillProps {
  // 标签内部文字。
  children: ReactNode
  // 标签色调。
  tone?: 'gold' | 'jade' | 'seal' | 'muted' | 'danger'
}

// 这个类型描述空状态入参，入参用于无名帖、无云灯、无消息等场景。
interface YardEmptyBoxProps {
  // 空状态标题。
  title: string
  // 空状态说明。
  message: string
}

// 这个函数渲染小院页面横幅，入参是标题、说明和插图，返回值是顶部视觉区。
export function YardPageBanner({ indexLabel, title, subtitle, visual, action, center = false }: YardPageBannerProps) {
  return (
    <section className={`yard-page-banner ${center ? 'yard-page-banner-center' : ''}`}>
      {/* 这里铺入页面级水墨插图，让每个小院页面都对应设计稿里的横向远山背景。 */}
      <img alt="" className="yard-page-banner-image" src={getGuofengVisualPath(visual)} />
      {/* 这里加浅色遮罩，保证标题在复杂山水背景上仍然清楚。 */}
      <div aria-hidden="true" className="yard-page-banner-mask" />
      <span className="yard-page-index-label">{indexLabel}</span>
      <div className="yard-page-banner-content">
        <h1>{title}</h1>
        <p>{subtitle}</p>
      </div>
      {action ? <div className="yard-page-banner-action">{action}</div> : null}
    </section>
  )
}

// 这个函数渲染小院宣纸卡片，入参是卡片内容和标题，返回值是带金线边框的内容块。
export function YardPaperCard({ children, title, subtitle, action, className = '' }: YardPaperCardProps) {
  return (
    <section className={`yard-paper-card ${className}`}>
      {(title || subtitle || action) ? (
        <div className="yard-paper-card-head">
          <div>
            {title ? <h2>{title}</h2> : null}
            {subtitle ? <p>{subtitle}</p> : null}
          </div>
          {action ? <div className="yard-paper-card-action">{action}</div> : null}
        </div>
      ) : null}
      {children}
    </section>
  )
}

// 这个函数渲染小院总览指标卡，入参是图标、数值和说明，返回值是单个统计卡片。
export function YardMetricCard({ icon, label, value, note, tone = 'paper' }: YardMetricCardProps) {
  return (
    <div className={`yard-metric-card yard-metric-card-${tone}`}>
      <img alt="" className="yard-metric-icon" src={getGuofengIconPath(icon)} />
      <p>{label}</p>
      <strong>{value}</strong>
      <span>{note}</span>
    </div>
  )
}

// 这个函数渲染状态标签，入参是状态文字和色调，返回值是圆角小标签。
export function YardStatusPill({ children, tone = 'muted' }: YardStatusPillProps) {
  return <span className={`yard-status-pill yard-status-pill-${tone}`}>{children}</span>
}

// 这个函数渲染空状态提示，入参是标题和说明，返回值是温和的空数据卡片。
export function YardEmptyBox({ title, message }: YardEmptyBoxProps) {
  return (
    <div className="yard-empty-box">
      <strong>{title}</strong>
      <p>{message}</p>
    </div>
  )
}
