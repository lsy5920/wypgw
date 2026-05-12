// 这个函数渲染官网底部信息，入参为空，返回值是页脚内容。
export function SiteFooter() {
  return (
    <footer className="site-footer relative overflow-hidden border-t border-[#c8a45d]/24 py-7 text-[#526461]">
      {/* 这里保留设计图底部的金色地形线，不再使用旧版深色页脚。 */}
      <div aria-hidden="true" className="site-footer-lines absolute inset-x-0 bottom-0 h-20" />
      <div className="relative mx-auto grid max-w-[1500px] gap-3 px-4 text-xs md:grid-cols-3 md:px-6">
        <p>© 2024 问云派 All Rights Reserved.</p>
        <p className="text-center text-[#173332]">问心 · 问路 · 问云深处</p>
        <p className="text-right">设计规范 v1.0</p>
      </div>
    </footer>
  )
}
