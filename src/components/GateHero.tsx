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
  // 这个常量保存首页山门主视觉路径，用作沉浸式首屏背景。
  const heroPath = getPublicAsset('wenyun-hero.png')
  // 这个常量保存山门线稿路径，用作右侧视觉层次。
  const mountainPath = getPublicAsset('visual/mountain-gate.svg')
  // 这个常量保存云纹纹理路径，用作雾气流动层。
  const cloudTexturePath = getPublicAsset('visual/cloud-texture.svg')

  return (
    <section
      className={`relative isolate overflow-hidden border-b border-[#d6aa54]/35 bg-[#07171d] text-white shadow-2xl shadow-[#102a31]/18 ${className}`}
    >
      {/* 这里铺满真实山门图，保证首页第一屏直接有门派对象和视觉记忆点。 */}
      <div
        className="absolute inset-0 -z-30 bg-cover bg-center opacity-72"
        style={{ backgroundImage: `url(${heroPath})` }}
      />
      {/* 这里用暗色渐变压住背景，让文字在手机和桌面端都清楚。 */}
      <div className="absolute inset-0 -z-20 bg-[linear-gradient(90deg,rgba(7,23,29,0.94),rgba(16,42,49,0.68)_46%,rgba(7,23,29,0.42)),linear-gradient(180deg,rgba(7,23,29,0.38),rgba(7,23,29,0.7)_86%,rgba(7,23,29,0.94))]" />
      {/* 这里叠加云纹纹理，让首屏动起来但不遮挡正文。 */}
      <div
        className="hero-cloud-layer mist-flow absolute inset-x-[-12%] top-20 -z-10 h-40 opacity-80 md:top-28 md:h-52"
        style={{ backgroundImage: `url(${cloudTexturePath})` }}
      />
      {/* 这里加入扫光层，模拟云缝透光的高级氛围。 */}
      <div className="hero-light-beam shine-sweep absolute inset-y-0 left-[-20%] -z-10 w-[70%] opacity-70" />
      <div className="absolute inset-x-0 bottom-0 -z-10 h-28 bg-gradient-to-t from-[#07171d] to-transparent" />

      <div className="mx-auto grid max-w-7xl gap-9 px-4 pb-14 pt-32 md:px-6 md:pb-20 md:pt-36 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
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
          {actions ? <div className="mt-8 grid grid-cols-2 gap-3 sm:flex sm:flex-wrap">{actions}</div> : null}
          {/* 这里用三枚短标识补强首屏信息密度，手机端也保持紧凑。 */}
          <div className="mt-8 grid grid-cols-3 gap-2 text-center text-xs text-[#fff8e8] sm:max-w-xl">
            {['清明立愿', '有界相扶', '归心成册'].map((item) => (
              <span className="rounded-full border border-[#f8df9d]/28 bg-[#fff8e8]/10 px-3 py-2 backdrop-blur" key={item}>
                {item}
              </span>
            ))}
          </div>
        </motion.div>

        <motion.div
          animate={{ opacity: 1, scale: 1, rotate: 0 }}
          className="float-y hidden lg:block"
          initial={{ opacity: 0, scale: 0.94, rotate: -1 }}
          transition={{ duration: 0.8, delay: 0.12, ease: 'easeOut' }}
        >
          <div className="liquid-glass relative overflow-hidden rounded-[2rem] p-8 text-white">
            {/* 这里放山门线稿，使右侧视觉像一枚半透明门牌。 */}
            <img
              alt="问云派山门线稿"
              className="absolute right-4 top-4 h-44 w-44 opacity-[0.18]"
              src={mountainPath}
            />
            <p className="ink-title relative text-4xl font-bold text-[#fff8e8]">入山先问心</p>
            <p className="relative mt-5 leading-9 text-[#f4f8f5]">
              守清明、知边界、重真诚。名门正派不靠声势立门，只靠门风长久。
            </p>
            <div className="relative mt-8 grid grid-cols-4 gap-3">
              {['清', '正', '礼', '界'].map((word) => (
                <span
                  className="grid aspect-square place-items-center rounded-2xl border border-[#f8df9d]/42 bg-[#fff8e8]/12 ink-title text-3xl font-bold text-[#f8df9d] shadow-lg shadow-[#07171d]/16"
                  key={word}
                >
                  {word}
                </span>
              ))}
            </div>
            <div className="gold-thread relative mt-8" />
            <p className="relative mt-4 text-sm leading-7 text-[#dce9e3]">愿来者不添风浪，只添灯火。</p>
          </div>
        </motion.div>
      </div>

      {/* 这里露出下一屏的提示线，让首页不是死板整屏封面。 */}
      <div className="gold-thread mx-auto mb-4 w-40 opacity-70" />
    </section>
  )
}
