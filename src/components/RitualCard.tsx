import { motion } from 'framer-motion'
import type { ReactNode } from 'react'

// 这个类型描述仪式卡片入参，入参用于控制卡片内容、色调和动效延迟。
interface RitualCardProps {
  // 卡片内部内容。
  children: ReactNode
  // 额外样式类名。
  className?: string
  // 动效延迟，用于列表依次出现。
  delay?: number
  // 是否使用深色卡片。
  dark?: boolean
}

// 这个函数渲染统一仪式卡片，入参是内容和样式，返回值是带边框、宣纸质感和微动效的容器。
export function RitualCard({ children, className = '', delay = 0, dark = false }: RitualCardProps) {
  // 这个变量保存当前卡片色调样式，深色用于后台重点或深色区块。
  const toneClass = dark
    ? 'border-white/10 bg-white/8 text-[#f6f4ef] shadow-[#0f2531]/20'
    : 'ritual-card text-[#263238]'

  return (
    <motion.section
      className={`relative overflow-hidden rounded-[1.35rem] p-5 transition duration-300 hover:-translate-y-1 hover:shadow-2xl md:p-7 ${toneClass} ${className}`}
      initial={{ opacity: 0, y: 18 }}
      transition={{ duration: 0.44, delay, ease: 'easeOut' }}
      viewport={{ once: true, margin: '-60px' }}
      whileInView={{ opacity: 1, y: 0 }}
    >
      {children}
    </motion.section>
  )
}
