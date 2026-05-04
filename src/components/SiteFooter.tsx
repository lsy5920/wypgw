import { Link } from 'react-router-dom'
import { BrandMark } from './BrandMark'

// 这个函数渲染官网底部信息，入参为空，返回值是页脚内容。
export function SiteFooter() {
  return (
    <footer className="relative overflow-hidden border-t border-[#c8a45d]/24 bg-[#07181a] pb-12 pt-14 text-[#f6f4ef]">
      {/* 这里用纯代码雾层连接页面末尾和山门气质。 */}
      <div className="hero-cloud-layer mist-flow pointer-events-none absolute inset-x-[-20%] top-8 h-28 opacity-40" />
      <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(15,61,62,0.82),rgba(7,24,24,0.94)),linear-gradient(90deg,rgba(200,164,93,0.12),transparent_48%,rgba(47,111,104,0.14))]" />
      <div className="relative mx-auto grid max-w-7xl gap-8 px-4 md:grid-cols-[1.2fr_1fr_1fr] md:px-6">
        {/* 这里展示纯代码门派印记和总旨。 */}
        <div>
          <div className="mb-4 flex items-center gap-4">
            <BrandMark size="large" />
            <div className="seal-code-mark grid h-14 w-14 place-items-center rounded-lg border border-[#f8df9d]/30 text-[#f8df9d] shadow-xl shadow-[#07171d]/20">
              问
            </div>
          </div>
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
