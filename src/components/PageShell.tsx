import { motion } from 'framer-motion'
import type { ReactNode } from 'react'

// 这个类型描述页面外壳的入参，入参用于决定页面宽度、留白和内部内容。
interface PageShellProps {
  // 页面内部内容。
  children: ReactNode
  // 页面最大宽度，默认适合前台内容页。
  size?: 'normal' | 'wide' | 'narrow'
  // 额外样式类名。
  className?: string
}

// 这个对象保存不同页面宽度的样式，返回值用于控制内容在电脑端的阅读宽度。
const shellSizeClass = {
  normal: 'max-w-7xl',
  wide: 'max-w-[1440px]',
  narrow: 'max-w-5xl'
}

// 这个函数渲染统一页面外壳，入参是页面内容和宽度，返回值是带入场动效的页面容器。
export function PageShell({ children, size = 'normal', className = '' }: PageShellProps) {
  return (
    <motion.div
      animate={{ opacity: 1, y: 0 }}
      className={`mx-auto w-full ${shellSizeClass[size]} px-4 py-12 md:px-6 md:py-16 ${className}`}
      initial={{ opacity: 0, y: 18 }}
      transition={{ duration: 0.46, ease: 'easeOut' }}
    >
      {children}
    </motion.div>
  )
}
