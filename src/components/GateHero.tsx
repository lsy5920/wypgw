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

// 这个函数渲染山门首屏，入参是标题、说明和操作区，返回值是有远山、云雾、灯火动效的首屏。
export function GateHero({ eyebrow, title, children, actions, showLogo = false, className = '' }: GateHeroProps) {
  return (
    <section className={`relative isolate overflow-hidden rounded-b-[2.5rem] border-b border-[#c9a45c]/30 ${className}`}>
      <img
        alt="问云派山门远景"
        className="absolute inset-0 -z-20 h-full w-full object-cover"
        src={getPublicAsset('visual/mountain-gate.svg')}
      />
      <div className="absolute inset-0 -z-10 bg-gradient-to-r from-[#0f2531]/88 via-[#143044]/50 to-[#f6f4ef]/24" />
      <div className="mist-flow absolute inset-x-0 bottom-0 -z-10 h-44 bg-[radial-gradient(circle_at_30%_70%,rgba(255,255,255,0.62),transparent_28%),radial-gradient(circle_at_72%_58%,rgba(255,255,255,0.5),transparent_24%)] blur-sm" />
      <div className="mx-auto grid min-h-[calc(100vh-6rem)] max-w-7xl items-center gap-10 px-4 py-16 md:px-6 lg:grid-cols-[1.08fr_0.92fr]">
        <motion.div
          animate={{ opacity: 1, y: 0 }}
          initial={{ opacity: 0, y: 24 }}
          transition={{ duration: 0.72, ease: 'easeOut' }}
        >
          {showLogo ? (
            <img
              alt="问云派门派 Logo"
              className="mb-6 h-24 w-24 rounded-full border border-white/70 bg-white/70 object-cover p-1 shadow-2xl shadow-[#c9a45c]/35 md:h-32 md:w-32"
              src={getPublicAsset('wenyun-logo.png')}
            />
          ) : null}
          <p className="mb-4 inline-flex rounded-full border border-[#c9a45c]/45 bg-[#fffaf0]/12 px-4 py-2 text-sm font-semibold text-[#f8e6bd] backdrop-blur">
            {eyebrow}
          </p>
          <h1 className="ink-title text-balance text-5xl font-black leading-tight text-[#fffaf0] drop-shadow-xl md:text-7xl lg:text-8xl">
            {title}
          </h1>
          <div className="mt-6 max-w-2xl text-lg leading-9 text-[#edf3ef] md:text-xl">{children}</div>
          {actions ? <div className="mt-8 flex flex-wrap gap-3">{actions}</div> : null}
        </motion.div>

        <motion.div
          animate={{ opacity: 1, scale: 1, rotate: 0 }}
          className="hidden lg:block"
          initial={{ opacity: 0, scale: 0.94, rotate: -1 }}
          transition={{ duration: 0.8, delay: 0.12, ease: 'easeOut' }}
        >
          <div className="seal-mark-bg rounded-[2rem] border border-white/18 bg-[#fffaf0]/12 p-8 text-[#fffaf0] shadow-2xl shadow-[#0f2531]/28 backdrop-blur-xl">
            <p className="ink-title text-4xl font-bold">入山先问心</p>
            <p className="mt-5 leading-9 text-[#edf3ef]">
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
