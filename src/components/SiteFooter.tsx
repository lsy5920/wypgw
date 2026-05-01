import { Link } from 'react-router-dom'
import { getPublicAsset } from '../lib/assets'

// 这个函数渲染官网底部信息，入参为空，返回值是页脚内容。
export function SiteFooter() {
  return (
    <footer className="relative overflow-hidden border-t border-[#d6aa54]/24 bg-[#07171d] pb-12 pt-14 text-[#f6f4ef]">
      {/* 这里用流动雾层连接页面末尾和山门气质。 */}
      <div className="hero-cloud-layer mist-flow pointer-events-none absolute inset-x-[-20%] top-8 h-28 opacity-40" />
      <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(16,42,49,0.82),rgba(7,23,29,0.94)),linear-gradient(90deg,rgba(214,170,84,0.12),transparent_48%,rgba(95,143,131,0.14))]" />
      <div className="relative mx-auto grid max-w-7xl gap-8 px-4 md:grid-cols-[1.2fr_1fr_1fr] md:px-6">
        {/* 这里展示门派 Logo 和总旨。 */}
        <div>
          <img className="mb-4 h-16 w-16 rounded-full border border-[#f8df9d]/48 bg-[#fff8e8]/86 object-cover p-0.5 shadow-xl shadow-[#07171d]/20" src={getPublicAsset('wenyun-logo.png')} alt="问云派门派 Logo" />
          <p className="ink-title text-2xl font-bold text-[#fff8e8]">问云派</p>
          <p className="mt-3 max-w-md leading-8 text-[#f4efe0]">
            问云问心，守真守善。同道相扶，来去自由。名门正派，不在声势，而在门风。
          </p>
        </div>

        {/* 这里展示常用前台入口。 */}
        <div>
          <p className="mb-4 font-semibold text-[#f8df9d]">山门入口</p>
          <div className="grid gap-3 text-sm text-[#f4efe0]">
            <Link to="/canon">立派金典</Link>
            <Link to="/join">问云名册</Link>
            <Link to="/cloud-lantern">云灯留言</Link>
            <Link to="/announcements">门派公告</Link>
          </div>
        </div>

        {/* 这里展示安全和隐私提示。 */}
        <div>
          <p className="mb-4 font-semibold text-[#f8df9d]">守门提醒</p>
          <p className="text-sm leading-7 text-[#f4efe0]">
            首版不公开永久微信群二维码。名册登记由掌门或执事人工查看，微信号只用于联系入群。
          </p>
        </div>
      </div>
    </footer>
  )
}
