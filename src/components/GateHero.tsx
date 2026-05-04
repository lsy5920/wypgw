import { motion } from 'framer-motion'
import type { ReactNode } from 'react'
import { BrandMark } from './BrandMark'
import { CodeScene } from './CodeScene'

// 这个类型描述山门首屏入参，入参用于生成首页第一屏内容。
interface GateHeroProps {
  // 眉题文字，用于说明页面气质。
  eyebrow: string
  // 主标题文字，用于展示品牌名称。
  title: string
  // 副标题或说明文字，用于补充品牌主张。
  children: ReactNode
  // 页面操作按钮或提示，用于承接用户下一步动作。
  actions?: ReactNode
  // 是否展示门派纯代码印记。
  showLogo?: boolean
  // 额外样式类名。
  className?: string
}

// 这个数组保存首屏下方的三条可信信息，返回值用于让用户快速理解网站能做什么。
const heroProofItems = [
  { value: '先读', label: '立派金典' },
  { value: '再问', label: '问心考核' },
  { value: '归册', label: '问云小院' }
]

// 这个常量保存按参考设计图重新生成的首页首屏背景图地址，返回值会跟随 Vite 的部署路径自动变化，避免部署到子目录后图片丢失。
const heroImagePath = `${import.meta.env.BASE_URL}visual-generated/wenyun-gate-reference-20260504.png`

// 这个函数渲染山门首屏，入参是标题、说明和操作区，返回值是按视觉稿还原的纯代码首页首屏。
export function GateHero({ eyebrow, title, children, actions, showLogo = false, className = '' }: GateHeroProps) {
  return (
    <section className={`site-hero relative isolate overflow-hidden border-b border-[#c8a45d]/28 text-[#173332] ${className}`}>
      {/* 这里使用内置生图模型生成的真实背景图，让首页第一屏具有明确的山门记忆点。 */}
      <img
        alt=""
        aria-hidden="true"
        className="site-hero-image absolute inset-0 -z-40 h-full w-full object-cover"
        src={heroImagePath}
      />
      {/* 这里叠加纸纹和雾气遮罩，保证文字在桌面端和手机端都清楚可读。 */}
      <div className="site-hero-art absolute inset-0 -z-30" />
      <div className="site-hero-overlay absolute inset-0 -z-20" />
      <div className="hero-cloud-layer mist-flow absolute inset-x-[-10%] top-[18%] -z-10 h-28 opacity-35 md:h-40" />
      <div className="absolute inset-x-0 bottom-0 -z-10 h-36 bg-gradient-to-t from-[#edf4ef] via-[#edf4ef]/78 to-transparent" />

      <div className="site-hero-content mx-auto grid min-h-[88vh] max-w-7xl gap-9 px-4 pb-20 pt-28 md:min-h-[46rem] md:px-6 md:pb-14 md:pt-36 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,0.56fr)] lg:items-end">
        <motion.div
          animate={{ opacity: 1, y: 0 }}
          className="site-hero-copy max-w-3xl rounded-lg border border-white/42 bg-[#fffaf0]/70 p-5 shadow-2xl shadow-[#173332]/12 backdrop-blur-sm md:bg-transparent md:p-0 md:shadow-none"
          initial={{ opacity: 0, y: 24 }}
          transition={{ duration: 0.72, ease: 'easeOut' }}
        >
          {/* 这里展示纯代码门派印记，避免依赖现有图片 Logo。 */}
          {showLogo ? <BrandMark className="mb-5 border-[#b8473f]/28 shadow-[#b8473f]/18" size="large" /> : null}
          <p className="mb-4 inline-flex rounded-lg border border-[#c8a45d]/38 bg-white/62 px-4 py-2 text-sm font-semibold text-[#8f4a36] shadow-md shadow-[#173332]/8 backdrop-blur">
            {eyebrow}
          </p>
          <h1 className="ink-title text-balance text-6xl font-black leading-tight text-[#06484b] drop-shadow-[0_10px_24px_rgba(23,51,50,0.12)] md:text-8xl lg:text-9xl">
            {title}
          </h1>
          <div className="mt-6 max-w-2xl text-lg leading-9 text-[#526461] md:text-xl">{children}</div>
          {actions ? <div className="hero-safe-width mt-8 grid min-w-0 grid-cols-1 gap-3 overflow-hidden sm:flex sm:flex-wrap sm:overflow-visible">{actions}</div> : null}

          {/* 这里用三条短信息承接首屏，手机端也不会撑宽。 */}
          <motion.div
            animate={{ opacity: 1, y: 0 }}
            className="hero-proof-grid hero-safe-width mt-9 grid max-w-3xl grid-cols-3 overflow-hidden rounded-lg border border-[#c8a45d]/22 bg-white/72 shadow-xl shadow-[#173332]/10 backdrop-blur"
            initial={{ opacity: 0, y: 18 }}
            transition={{ duration: 0.62, delay: 0.16, ease: 'easeOut' }}
          >
            {heroProofItems.map((item) => (
              <div className="min-w-0 border-r border-[#c8a45d]/18 px-3 py-4 last:border-r-0 md:px-5" key={item.label}>
                <p className="ink-title text-2xl font-bold text-[#0f5f59] md:text-3xl">{item.value}</p>
                <p className="mt-1 truncate text-xs font-semibold text-[#526461] md:text-sm">{item.label}</p>
              </div>
            ))}
          </motion.div>
        </motion.div>

        <motion.div
          animate={{ opacity: 1, y: 0, scale: 1 }}
          className="hidden lg:block"
          initial={{ opacity: 0, y: 18, scale: 0.98 }}
          transition={{ duration: 0.68, delay: 0.12, ease: 'easeOut' }}
        >
          {/* 这里还原视觉稿右侧抽象山门舞台，全部由 CSS 绘制。 */}
          <CodeScene className="code-scene-light min-h-[22rem] shadow-2xl shadow-[#173332]/12 lg:min-h-[27rem]" label="问云派抽象山门视觉" variant="gate" />
        </motion.div>
      </div>
    </section>
  )
}
