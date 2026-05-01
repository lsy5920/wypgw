import { motion } from 'framer-motion'
import type { ReactNode } from 'react'
import { getPublicAsset } from '../lib/assets'

// 这个类型描述山门首屏入参，入参用于生成每个页面的强视觉开场。
interface GateHeroProps {
  // 眉题文字。
  eyebrow: string
  // 主标题文字。
  title: string
  // 副标题或说明文字。
  children: ReactNode
  // 页面操作按钮或提示。
  actions?: ReactNode
  // 是否展示门派 Logo。
  showLogo?: boolean
  // 额外样式类名。
  className?: string
}

// 这个函数渲染山门首屏，入参是标题、说明和操作区，返回值是紧凑、清晰、不遮挡内容的首屏。
export function GateHero({ eyebrow, title, children, actions, showLogo = false, className = '' }: GateHeroProps) {
  // 这个常量保存门派 Logo 路径，避免在 JSX 中重复调用资源函数。
  const logoPath = getPublicAsset('wenyun-logo.png')

  return (
    <section
      className={`relative isolate overflow-hidden border-b border-[#c9a45c]/35 bg-[#0f2531] text-white shadow-2xl shadow-[#143044]/18 ${className}`}
    >
      {/* 这里用深色渐变代替整屏大背景图，避免手机端导航下方出现空白。 */}
      <div className="absolute inset-0 -z-20 bg-[radial-gradient(circle_at_18%_16%,rgba(201,164,92,0.22),transparent_28%),radial-gradient(circle_at_82%_18%,rgba(111,143,139,0.3),transparent_24%),linear-gradient(135deg,#0f2531_0%,#143044_48%,#263238_100%)]" />
      {/* 这里保留缓慢云雾动效，但只做细腻氛围，不再占据大块版面。 */}
      <div className="mist-flow absolute inset-x-0 top-8 -z-10 h-28 bg-[radial-gradient(circle_at_24%_45%,rgba(255,255,255,0.16),transparent_28%),radial-gradient(circle_at_68%_42%,rgba(255,255,255,0.12),transparent_24%)] blur-sm" />
      <div className="absolute inset-x-0 bottom-0 -z-10 h-24 bg-gradient-to-t from-[#07151d]/60 to-transparent" />
      <div className="mx-auto grid max-w-7xl gap-8 px-4 pb-12 pt-32 md:px-6 md:pb-16 md:pt-36 lg:grid-cols-[1.08fr_0.92fr] lg:items-center">
        <motion.div
          animate={{ opacity: 1, y: 0 }}
          initial={{ opacity: 0, y: 24 }}
          transition={{ duration: 0.72, ease: 'easeOut' }}
        >
          {showLogo ? (
            <img
              alt="问云派门派 Logo"
              className="mb-5 hidden h-20 w-20 rounded-full border border-white/75 bg-white/80 object-cover p-1 shadow-2xl shadow-[#c9a45c]/35 md:block md:h-28 md:w-28"
              src={logoPath}
            />
          ) : null}
          <p className="mb-4 inline-flex rounded-full border border-[#c9a45c]/55 bg-[#fffaf0]/14 px-4 py-2 text-sm font-semibold text-[#ffe7b3] shadow-md shadow-[#07151d]/20 backdrop-blur">
            {eyebrow}
          </p>
          <h1 className="ink-title text-balance text-5xl font-black leading-tight text-white drop-shadow-xl md:text-7xl lg:text-8xl">
            {title}
          </h1>
          <div className="mt-6 max-w-2xl text-lg leading-9 text-[#f4f8f5] md:text-xl">{children}</div>
          {actions ? <div className="mt-8 grid grid-cols-2 gap-3 sm:flex sm:flex-wrap">{actions}</div> : null}
        </motion.div>

        <motion.div
          animate={{ opacity: 1, scale: 1, rotate: 0 }}
          className="hidden lg:block"
          initial={{ opacity: 0, scale: 0.94, rotate: -1 }}
          transition={{ duration: 0.8, delay: 0.12, ease: 'easeOut' }}
        >
          <div className="seal-mark-bg rounded-[2rem] border border-white/20 bg-[#fffaf0]/12 p-8 text-white shadow-2xl shadow-[#07151d]/30 backdrop-blur-xl">
            <p className="ink-title text-4xl font-bold">入山先问心</p>
            <p className="mt-5 leading-9 text-[#f4f8f5]">
              守清明、知边界、重真诚。名门正派不靠声势立门，只靠门风长久。
            </p>
            <div className="mt-8 grid grid-cols-4 gap-3">
              {['清', '正', '礼', '界'].map((word) => (
                <span
                  className="grid aspect-square place-items-center rounded-2xl border border-[#c9a45c]/45 bg-[#fffaf0]/14 ink-title text-3xl font-bold text-[#f8e6bd]"
                  key={word}
                >
                  {word}
                </span>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
