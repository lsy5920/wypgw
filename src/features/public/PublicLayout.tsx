import { useEffect, useState, type CSSProperties, type PointerEvent } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import { siteNavItems } from '../../data/siteContent'
import { TaskButton, TaskLink, TaskSeal } from '../../shared/ui/TaskUi'
import { PublicMusicPlayer } from './PublicMusicPlayer'

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
      <div className="site-atmosphere" aria-hidden="true" />
      <header className="public-header">
        <span className="scroll-progress" style={{ width: `${scrollPercent}%` }} />
        <div className="page-shell">
          <div className="public-header__inner">
            <TaskSeal caption="清醒温柔，同行自渡" />
            <nav className="public-nav" aria-label="公开官网导航">
              {siteNavItems.map((item) => (
                <NavLink key={item.path} to={item.path} end={item.path === '/'}>
                  {item.label}
                </NavLink>
              ))}
            </nav>
            <div className="public-header__actions">
              <TaskLink to="/login" tone="quiet" icon="logIn">
                入小院
              </TaskLink>
              <TaskButton
                aria-expanded={menuOpen}
                aria-controls="public-mobile-menu"
                className="mobile-menu-button"
                icon="sliders"
                onClick={toggleMenu}
                tone="secondary"
                type="button"
              >
                导航
              </TaskButton>
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
                {siteNavItems.map((item) => (
                  <NavLink key={item.path} to={item.path} end={item.path === '/'} onClick={closeMenu}>
                    {item.label}
                  </NavLink>
                ))}
                <NavLink to="/login" onClick={closeMenu}>
                  入小院
                </NavLink>
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
            <p>问云派以陪伴、清醒、成长、守正、温柔、共建为愿。来者可读金典、点云灯、递名帖，也可只在山门前安静停一停。</p>
          </div>
          <nav className="public-footer__links" aria-label="页脚入口">
            <NavLink to="/canon">读金典</NavLink>
            <NavLink to="/wenxin-quiz">赴考核</NavLink>
            <NavLink to="/join">递名帖</NavLink>
            <NavLink to="/cloud-lantern">点云灯</NavLink>
            <NavLink to="/contact">传信笺</NavLink>
          </nav>
        </div>
      </footer>
      <PublicMusicPlayer />
    </div>
  )
}
