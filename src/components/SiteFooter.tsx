import { Link } from 'react-router-dom'
import { getPublicAsset } from '../lib/assets'

// 这个函数渲染官网底部信息，入参为空，返回值是页脚内容。
export function SiteFooter() {
  return (
    <footer className="border-t border-[#6f8f8b]/20 bg-[#263238] pb-24 pt-12 text-[#f6f4ef] md:pb-12">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 md:grid-cols-[1.2fr_1fr_1fr] md:px-6">
        {/* 这里展示门派 Logo 和总旨。 */}
        <div>
          <img className="mb-4 h-16 w-16 rounded-full object-cover" src={getPublicAsset('wenyun-logo.png')} alt="问云派门派 Logo" />
          <p className="ink-title text-2xl font-bold">问云派</p>
          <p className="mt-3 max-w-md leading-8 text-[#d8d7ca]">
            问云问心，守真守善。同道相扶，来去自由。
          </p>
        </div>

        {/* 这里展示常用前台入口。 */}
        <div>
          <p className="mb-4 font-semibold text-[#c9a45c]">山门入口</p>
          <div className="grid gap-3 text-sm text-[#d8d7ca]">
            <Link to="/canon">立派金典</Link>
            <Link to="/join">问云名册</Link>
            <Link to="/cloud-lantern">云灯留言</Link>
            <Link to="/announcements">门派公告</Link>
          </div>
        </div>

        {/* 这里展示安全和隐私提示。 */}
        <div>
          <p className="mb-4 font-semibold text-[#c9a45c]">守门提醒</p>
          <p className="text-sm leading-7 text-[#d8d7ca]">
            首版不公开永久微信群二维码。名册登记由掌门或执事人工查看，微信号只用于联系入群。
          </p>
        </div>
      </div>
    </footer>
  )
}
