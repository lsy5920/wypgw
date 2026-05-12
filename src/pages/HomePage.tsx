import { Link } from 'react-router-dom'
import { BrandMark } from '../components/BrandMark'
import { GeneratedIcon, type GeneratedIconName } from '../components/GeneratedIcon'
import { getGuofengVisualPath } from '../data/visualAssets'

// 这个接口描述首页底部入口卡片，label 是主标题，summary 是副标题，icon 是图标，path 是点击后的站内地址。
interface HomeEntryCard {
  // 入口主标题。
  label: string
  // 入口副标题。
  summary: string
  // 入口图标名称。
  icon: GeneratedIconName
  // 点击跳转地址。
  path: string
}

// 这个数组保存首页五个入口，返回值用于复刻设计稿底部居中的入口卡片。
const homeEntryCards: HomeEntryCard[] = [
  { label: '立派金典', summary: '清醒温柔 同行自渡', icon: 'scroll', path: '/canon' },
  { label: '问云考核', summary: '明愿知界 方可入云', icon: 'shield', path: '/wenxin-quiz' },
  { label: '云灯留言', summary: '以灯为证 温柔相伴', icon: 'lantern', path: '/cloud-lantern' },
  { label: '问云小院', summary: '我的名帖 云灯雅集', icon: 'gate', path: '/yard' },
  { label: '公告活动', summary: '公告良言 活动雅集', icon: 'notice', path: '/announcements' }
]

// 这个函数渲染官网首页，入参为空，返回值是完全重写后的设计稿复刻首页。
export function HomePage() {
  // 这个常量保存首页山门背景图，来自设计稿素材包。
  const heroImage = getGuofengVisualPath('homeHero')

  return (
    <section className="home-reference-page">
      {/* 这里使用单张水墨山门图承载首页主视觉，避免旧首页组件产生额外背景层。 */}
      <img alt="问云派山门水墨背景" className="home-reference-image" src={heroImage} />
      <div className="home-reference-soft-mask" aria-hidden="true" />

      {/* 这里复刻设计稿中央的印章、门派口号和大标题。 */}
      <div className="home-reference-center">
        <BrandMark className="home-reference-seal" size="large" />
        <p className="home-reference-eyebrow">问云山门 · 清醒温柔 · 同行自渡</p>
        <h1>问云派</h1>
        <p className="home-reference-subtitle">问心 · 问路 · 问云深处</p>
      </div>

      {/* 这里复刻底部五个居中入口卡片，每张卡片都可以点击跳转。 */}
      <nav className="home-reference-entry-row" aria-label="首页快捷入口">
        {homeEntryCards.map((item) => (
          <Link className="home-reference-entry-card" key={item.path} to={item.path}>
            <GeneratedIcon className="home-reference-entry-icon" name={item.icon} />
            <strong>{item.label}</strong>
            <span>{item.summary}</span>
          </Link>
        ))}
      </nav>
    </section>
  )
}
