import { motion } from 'framer-motion'
import type { ReactNode } from 'react'

// 这个类型描述卷轴面板的入参，返回值用于复用宣纸质感卡片。
interface ScrollPanelProps {
  // 面板内容。
  children: ReactNode
  // 额外样式类名。
  className?: string
}

// 这个函数渲染宣纸卷轴面板，入参是内容和样式，返回值是统一视觉容器。
export function ScrollPanel({ children, className = '' }: ScrollPanelProps) {
  return (
    <motion.section
      className={`scroll-panel rounded-[1.35rem] p-5 transition duration-300 hover:-translate-y-1 md:p-7 ${className}`}
      initial={{ opacity: 0, y: 16, scale: 0.985 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      viewport={{ once: true, margin: '-48px' }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
    >
      {children}
    </motion.section>
  )
}
