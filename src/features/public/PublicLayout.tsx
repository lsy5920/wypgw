import { useEffect, useState, type CSSProperties, type PointerEvent } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import { CloudBackground } from '../../shared/ui/CloudTheme'
import { TaskLink, TaskSeal } from '../../shared/ui/TaskUi'
import { PublicMusicPlayer } from './PublicMusicPlayer'

// 这个数组保存桌面端页眉导航，顺序和 Figma 设计稿保持一致。
const desktopNavItems = [
  { label: '首页', path: '/' },
  { label: '立派金典', path: '/canon' },
  { label: '问云公告', path: '/announcements' },
  { label: '问云雅集', path: '/events' },
  { label: '问心考核', path: '/wenxin-quiz' },
  { label: '问云名册', path: '/join' },
  { label: '问云小院', path: '/yard' }
]

// 这个数组保存移动端弹层导航，覆盖手机设计稿里的全部公开入口。
const mobileNavItems = [
  { label: '首页', path: '/' },
  { label: '立派金典', path: '/canon' },
  { label: '问云公告', path: '/announcements' },
  { label: '问云雅集', path: '/events' },
  { label: '问心考核', path: '/wenxin-quiz' },
  { label: '问云名册', path: '/join' },
  { label: '云灯留言', path: '/cloud-lantern' },
  { label: '联系山门', path: '/contact' }
]

// 这个数组保存页脚四列入口，匹配桌面端设计稿的落款信息结构。
const footerLinkGroups = [
  {
    title: '关于问云派',
    links: [
      { label: '立派金典', path: '/canon' },
      { label: '入派指引', path: '/join' },
      { label: '问云公告', path: '/announcements' }
    ]
  },
  {
    title: '学习成长',
    links: [
      { label: '立派金典', path: '/canon' },
      { label: '入派指引', path: '/wenxin-quiz' },
      { label: '问云公告', path: '/announcements' }
    ]
  },
  {
    title: '同行与支持',
    links: [
      { label: '立派金典', path: '/canon' },
      { label: '入派指引', path: '/join' },
      { label: '问云公告', path: '/announcements' }
    ]
  },
  {
    title: '关注我们',
    links: [
      { label: '立派金典', path: '/canon' },
      { label: '入派指引', path: '/join' },
      { label: '问云公告', path: '/announcements' }
    ]
  }
]

// 这个数组保存移动端页脚入口，和 Figma 移动端底部五个短入口一致。
const footerMobileLinks = [
  { label: '关于', path: '/about' },
  { label: '金典', path: '/canon' },
  { label: '雅集', path: '/events' },
  { label: '名册', path: '/join' },
  { label: '联系', path: '/contact' }
]

// 这个函数把滚动距离转换成百分比，入参为空，返回值是页面滚动进度。
function getScrollPercent(): number {
  try {
    // 这里读取文档可滚动高度，避免短页面除以零。
    const scrollHeight = document.documentElement.scrollHeight - window.innerHeight

    if (scrollHeight <= 0) {
      return 0
    }

    return Math.min(100, Math.max(0, (window.scrollY / scrollHeight) * 100))
  } catch {
    // 这里兜底处理非浏览器环境，避免布局渲染时报错。
    return 0
  }
}

// 这个组件展示公开官网布局，入参为空，返回值是带沉浸导航、滚动进度和页脚的公开页面壳。
export function PublicLayout() {
  // 这个状态保存手机菜单是否展开。
  const [menuOpen, setMenuOpen] = useState(false)
  // 这个状态保存页面滚动进度，用于页眉细线反馈。
  const [scrollPercent, setScrollPercent] = useState(0)
  // 这个状态保存鼠标位置，用于桌面端轻微跟随光晕。
  const [pointer, setPointer] = useState({ x: 50, y: 18 })

  useEffect(() => {
    // 这个函数刷新滚动进度，滚动时让用户知道自己位于长页面的哪里。
    function updateScrollPercent() {
      setScrollPercent(getScrollPercent())
    }

    updateScrollPercent()
    window.addEventListener('scroll', updateScrollPercent, { passive: true })
    window.addEventListener('resize', updateScrollPercent)

    return () => {
      window.removeEventListener('scroll', updateScrollPercent)
      window.removeEventListener('resize', updateScrollPercent)
    }
  }, [])

  // 这个函数记录鼠标位置，入参是鼠标事件，返回值为空。
  function handlePointerMove(event: PointerEvent<HTMLDivElement>) {
    const nextX = Math.round((event.clientX / Math.max(window.innerWidth, 1)) * 100)
    const nextY = Math.round((event.clientY / Math.max(window.innerHeight, 1)) * 100)

    setPointer({ x: nextX, y: nextY })
  }

  // 这个函数切换手机菜单，入参为空，返回值为空。
  function toggleMenu() {
    setMenuOpen((current) => !current)
  }

  // 这个函数关闭手机菜单，入参为空，返回值为空。
  function closeMenu() {
    setMenuOpen(false)
  }

  // 这个对象把鼠标位置交给 CSS 变量，返回值用于背景光晕定位。
  const atmosphereStyle = {
    '--pointer-x': `${pointer.x}%`,
    '--pointer-y': `${pointer.y}%`
  } as CSSProperties

  return (
    <div className="public-layout" onPointerMove={handlePointerMove} style={atmosphereStyle}>
      <CloudBackground />
      <div className="site-atmosphere" aria-hidden="true" />
      <header className="public-header">
        <span className="scroll-progress" style={{ width: `${scrollPercent}%` }} />
        <div className="page-shell">
          <div className="public-header__inner">
            <TaskSeal caption="清醒温柔，同行自渡" />
            <nav className="public-nav" aria-label="公开官网导航">
              {desktopNavItems.map((item) => (
                <NavLink key={item.path} to={item.path} end={item.path === '/'}>
                  {item.label}
                </NavLink>
              ))}
            </nav>
            <div className="public-header__actions">
              <TaskLink to="/login" tone="primary">
                登录
              </TaskLink>
              <TaskLink to="/join" tone="primary">
                入册
              </TaskLink>
              <button
                aria-expanded={menuOpen}
                aria-controls="public-mobile-menu"
                aria-label="打开手机官网导航"
                className="mobile-menu-button public-header__menu-button"
                onClick={toggleMenu}
                type="button"
              >
                <span />
                <span />
                <span />
              </button>
            </div>
          </div>
          {menuOpen ? (
            <>
              <button aria-label="关闭手机官网导航遮罩" className="mobile-menu__shade" onClick={closeMenu} type="button" />
              <nav className="mobile-menu mobile-menu--public" id="public-mobile-menu" aria-label="手机官网导航">
                <div className="mobile-menu__head">
                  <strong>问云派导航</strong>
                  <span>从这里去读金典、赴考核、递名帖。</span>
                </div>
                {mobileNavItems.map((item) => (
                  <NavLink key={item.path} to={item.path} end={item.path === '/'} onClick={closeMenu}>
                    {item.label}
                  </NavLink>
                ))}
              </nav>
            </>
          ) : null}
        </div>
      </header>
      <main>
        <Outlet />
      </main>
      <footer className="public-footer">
        <div className="page-shell public-footer__inner">
          <div className="public-footer__brand">
            <TaskSeal caption="清醒温柔，同行自渡" />
            <p>以云为幕，以灯为证；清醒温柔，同行自渡。</p>
          </div>
          <nav className="public-footer__links" aria-label="页脚入口">
            {footerLinkGroups.map((group) => (
              <div className="public-footer__group" key={group.title}>
                <strong>{group.title}</strong>
                {group.links.map((link) => (
                  <NavLink key={`${group.title}-${link.label}`} to={link.path}>
                    {link.label}
                  </NavLink>
                ))}
              </div>
            ))}
            <div className="public-footer__mobile-row">
              {footerMobileLinks.map((link) => (
                <NavLink key={link.label} to={link.path}>
                  {link.label}
                </NavLink>
              ))}
            </div>
          </nav>
        </div>
      </footer>
      <PublicMusicPlayer />
    </div>
  )
}
