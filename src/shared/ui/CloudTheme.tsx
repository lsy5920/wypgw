import type { ReactNode } from 'react'

// 这个数组保存固定星点位置，避免每次渲染随机变化导致页面闪动。
const cloudStars = [
  { left: 8, top: 14, size: 2, delay: 0.2 },
  { left: 18, top: 32, size: 1, delay: 1.4 },
  { left: 27, top: 18, size: 2, delay: 2.1 },
  { left: 36, top: 72, size: 1, delay: 0.8 },
  { left: 44, top: 42, size: 2, delay: 2.8 },
  { left: 52, top: 24, size: 1, delay: 1.1 },
  { left: 61, top: 68, size: 2, delay: 0.5 },
  { left: 69, top: 36, size: 1, delay: 2.4 },
  { left: 77, top: 16, size: 2, delay: 1.7 },
  { left: 84, top: 58, size: 1, delay: 0.1 },
  { left: 91, top: 28, size: 2, delay: 2.9 },
  { left: 94, top: 82, size: 1, delay: 1.9 }
]

// 这个类型描述云主题背景的颜色变体，入参来自不同布局，返回值用于切换氛围。
export type CloudBackgroundVariant = 'default' | 'jade' | 'deep'

// 这个组件展示全站云主题背景，入参是颜色变体和附加类名，返回值是固定在页面底层的云雾与星点。
export function CloudBackground({ variant = 'default', className = '' }: { variant?: CloudBackgroundVariant; className?: string }) {
  return (
    <div className={`cloud-background cloud-background--${variant} ${className}`} aria-hidden="true">
      <span className="cloud-background__mist cloud-background__mist--one" />
      <span className="cloud-background__mist cloud-background__mist--two" />
      <span className="cloud-background__mist cloud-background__mist--three" />
      <span className="cloud-background__mist cloud-background__mist--four" />
      {cloudStars.map((star) => (
        <span
          className="cloud-background__star"
          key={`${star.left}-${star.top}`}
          style={{
            left: `${star.left}%`,
            top: `${star.top}%`,
            width: `${star.size}px`,
            height: `${star.size}px`,
            animationDelay: `${star.delay}s`
          }}
        />
      ))}
    </div>
  )
}

// 这个组件展示云主题玻璃卡片，入参是内容和样式选项，返回值是统一的半透明容器。
export function CloudGlassCard({ children, className = '', gold = false }: { children: ReactNode; className?: string; gold?: boolean }) {
  return <div className={`cloud-glass-card ${gold ? 'cloud-glass-card--gold' : ''} ${className}`}>{children}</div>
}

// 这个组件展示金色分隔线，入参是附加类名，返回值是页面之间的轻量分界。
export function CloudGoldDivider({ className = '' }: { className?: string }) {
  return (
    <div className={`cloud-gold-divider ${className}`} aria-hidden="true">
      <span />
      <i />
      <span />
    </div>
  )
}
