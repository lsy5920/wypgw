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
  // 这个常量保存插画版山门主视觉路径，用作首页第一眼的核心图像。
  const heroIllustrationPath = getPublicAsset('visual-v2/home-illustration-v2.svg')
  // 这个常量保存插画版云纹路径，用作雾气流动层。
  const cloudTexturePath = getPublicAsset('visual-v2/cloud-ribbon-v2.svg')
  // 这个常量保存插画版朱砂印路径，用作右侧门派记忆点。
  const sealPath = getPublicAsset('visual-v2/seal-v2.svg')

  return (
    <section
      className={`relative isolate overflow-hidden border-b border-[#d6aa54]/35 bg-[#07171d] text-white shadow-2xl shadow-[#102a31]/18 ${className}`}
    >
      {/* 这里用深色插画舞台压住首屏，让文字在手机和桌面端都清楚。 */}
      <div className="absolute inset-0 -z-30 bg-[radial-gradient(circle_at_72%_34%,rgba(213,174,98,0.26),transparent_28%),linear-gradient(135deg,#06171d,#18333a_58%,#557f76)]" />
      {/* 这里叠加柔和纸纹与暗色渐变，让插画和文字自然融合。 */}
      <div className="absolute inset-0 -z-20 bg-[linear-gradient(90deg,rgba(6,23,29,0.94),rgba(18,51,58,0.68)_48%,rgba(6,23,29,0.32)),linear-gradient(180deg,rgba(6,23,29,0.18),rgba(6,23,29,0.74)_88%,rgba(6,23,29,0.96))]" />
      {/* 这里叠加云纹纹理，让首屏动起来但不遮挡正文。 */}
      <div
        className="hero-cloud-layer mist-flow absolute inset-x-[-12%] top-20 -z-10 h-40 opacity-80 md:top-28 md:h-52"
        style={{ backgroundImage: `url(${cloudTexturePath})` }}
      />
      {/* 这里加入扫光层，模拟云缝透光的高级氛围。 */}
      <div className="hero-light-beam shine-sweep absolute inset-y-0 left-[-20%] -z-10 w-[70%] opacity-70" />
      <div className="absolute inset-x-0 bottom-0 -z-10 h-28 bg-gradient-to-t from-[#07171d] to-transparent" />

      <div className="mx-auto grid max-w-7xl gap-9 px-4 pb-14 pt-32 md:px-6 md:pb-20 md:pt-36 lg:min-h-[44rem] lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
        <motion.div
          animate={{ opacity: 1, y: 0 }}
          initial={{ opacity: 0, y: 24 }}
          transition={{ duration: 0.72, ease: 'easeOut' }}
        >
          {showLogo ? (
            <img
              alt="问云派门派 Logo"
              className="seal-shadow mb-5 h-20 w-20 rounded-full border border-[#f8df9d]/70 bg-[#fff8e8]/88 object-cover p-1 shadow-2xl md:h-28 md:w-28"
              src={logoPath}
            />
          ) : null}
          <p className="mb-4 inline-flex rounded-full border border-[#f8df9d]/45 bg-[#fff8e8]/12 px-4 py-2 text-sm font-semibold text-[#f8df9d] shadow-md shadow-[#07171d]/20 backdrop-blur">
            {eyebrow}
          </p>
          <h1 className="ink-title text-balance text-6xl font-black leading-tight text-[#fff8e8] drop-shadow-2xl md:text-8xl lg:text-9xl">
            {title}
          </h1>
          <div className="mt-6 max-w-2xl text-lg leading-9 text-[#f3f7ef] drop-shadow md:text-xl">{children}</div>
          {actions ? <div className="mt-8 grid min-w-0 grid-cols-1 gap-3 sm:flex sm:flex-wrap">{actions}</div> : null}
          {/* 这里给手机端单独展示插画，避免小屏只有文字而缺少设计记忆点。 */}
          <img
            alt="问云派插画山门主视觉"
            className="mt-8 w-full rounded-[1.5rem] border border-[#f7df9e]/22 bg-[#fff8ea]/8 shadow-2xl shadow-[#06171d]/28 lg:hidden"
            src={heroIllustrationPath}
          />
          {/* 这里用三枚短标识补强首屏信息密度，手机端也保持紧凑。 */}
          <div className="mt-8 grid min-w-0 grid-cols-1 gap-2 text-center text-xs text-[#fff8e8] sm:grid-cols-3 sm:max-w-xl">
            {['清明立愿', '有界相扶', '归心成册'].map((item) => (
              <span className="rounded-full border border-[#f8df9d]/28 bg-[#fff8e8]/10 px-3 py-2 backdrop-blur" key={item}>
                {item}
              </span>
            ))}
          </div>
        </motion.div>

        <motion.div
          animate={{ opacity: 1, scale: 1, rotate: 0 }}
          className="float-y relative hidden lg:block"
          initial={{ opacity: 0, scale: 0.94, rotate: -1 }}
          transition={{ duration: 0.8, delay: 0.12, ease: 'easeOut' }}
        >
          {/* 这里展示插画主视觉，让首页第一屏具备明确的山门故事感。 */}
          <img
            alt="问云派插画山门主视觉"
            className="relative z-10 w-full drop-shadow-[0_28px_46px_rgba(6,23,29,0.42)]"
            src={heroIllustrationPath}
          />
          {/* 这里叠加朱砂印作为插画右下角的门派识别符号。 */}
          <img
            alt="问云派朱砂印"
            className="seal-rise absolute bottom-10 right-8 z-20 h-28 w-28 rotate-6 rounded-2xl shadow-2xl shadow-[#06171d]/24"
            src={sealPath}
          />
        </motion.div>
      </div>

      {/* 这里露出下一屏的提示线，让首页不是死板整屏封面。 */}
      <div className="gold-thread mx-auto mb-4 w-40 opacity-70" />
    </section>
  )
}
