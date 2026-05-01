import { Link } from 'react-router-dom'
import type { ReactNode } from 'react'

// 这个类型描述云纹按钮可接收的参数，入参用于决定按钮文字、跳转地址和点击行为。
interface CloudButtonProps {
  // 按钮内部内容，可以是文字或图标加文字。
  children: ReactNode
  // 跳转地址，有值时按钮会渲染成链接。
  to?: string
  // 按钮类型，用于表单提交或普通点击。
  type?: 'button' | 'submit'
  // 点击事件，普通按钮使用。
  onClick?: () => void
  // 是否使用主按钮样式。
  variant?: 'primary' | 'ghost' | 'seal'
  // 是否禁用按钮。
  disabled?: boolean
  // 额外样式类名。
  className?: string
}

// 这个函数渲染统一的问云按钮，入参是按钮配置，返回值是可点击的链接或按钮。
export function CloudButton({
  children,
  to,
  type = 'button',
  onClick,
  variant = 'primary',
  disabled = false,
  className = ''
}: CloudButtonProps) {
  // 这个常量保存不同按钮风格的颜色，返回值用于 className 拼接。
  const variantClass = {
    primary: 'bg-[#143044] !text-white shadow-lg shadow-[#143044]/20 hover:bg-[#0f2531]',
    ghost: 'border border-[#c9a45c]/55 bg-[#fffaf0]/75 text-[#143044] hover:bg-white',
    seal: 'bg-[#9e3d32] text-white shadow-lg shadow-[#9e3d32]/25 hover:bg-[#873228]'
  }[variant]

  // 这个常量保存通用按钮样式，保证所有按钮高度、圆角和动效统一。
  const baseClass = `focus-ring inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition duration-300 hover:-translate-y-0.5 hover:shadow-xl active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60 ${variantClass} ${className}`

  // 这里如果提供跳转地址，就渲染成站内链接，方便前台页面跳转。
  if (to) {
    return (
      <Link className={baseClass} to={to}>
        {children}
      </Link>
    )
  }

  // 这里渲染普通按钮，主要用于表单提交和后台操作。
  return (
    <button className={baseClass} disabled={disabled} onClick={onClick} type={type}>
      {children}
    </button>
  )
}
