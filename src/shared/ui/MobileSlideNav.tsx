import { useEffect, useState } from 'react'
import { NavLink } from 'react-router-dom'
import { getGuofengIconPath } from '../../data/visualAssets'
import { brandLogoPath } from './TaskUi'

// 这个接口描述手机滑出导航的单个入口，入参来自业务布局，返回值用于生成路由链接。
export interface MobileSlideNavItem {
  // 入口显示名称。
  label: string
  // 入口跳转地址。
  path: string
  // 是否只在完整路径匹配时高亮。
  end?: boolean
}

// 这个接口描述手机滑出导航组件参数，入参来自小院或后台布局，返回值是固定在页面上方的手机菜单。
interface MobileSlideNavProps {
  // 菜单标题。
  title: string
  // 菜单辅助说明。
  description: string
  // 触发按钮给读屏器读取的说明。
  ariaLabel: string
  // 导航入口数组。
  items: MobileSlideNavItem[]
  // 菜单视觉类型，用于区分小院和后台色彩。
  variant?: 'yard' | 'admin'
}

// 这个组件展示手机端右侧滑出导航，入参是入口数组和文案，返回值是固定浮在页面之上的菜单。
export function MobileSlideNav({ title, description, ariaLabel, items, variant = 'yard' }: MobileSlideNavProps) {
  // 这个状态记录菜单是否已经展开。
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    if (!isOpen) {
      return undefined
    }

    // 这个函数监听键盘退出键，入参是键盘事件，返回值为空。
    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false)
      }
    }

    try {
      // 这里绑定全局键盘事件，让外接键盘和辅助设备也能关闭菜单。
      window.addEventListener('keydown', handleEscape)
    } catch {
      // 浏览器环境异常时直接忽略，菜单按钮仍可手动关闭。
      return undefined
    }

    return () => {
      window.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen])

  // 这个函数切换菜单展开状态，入参为空，返回值为空。
  function toggleMenu() {
    setIsOpen((current) => !current)
  }

  // 这个函数关闭菜单，入参为空，返回值为空。
  function closeMenu() {
    setIsOpen(false)
  }

  return (
    <div className={`mobile-slide-nav mobile-slide-nav--${variant} ${isOpen ? 'is-open' : ''}`}>
      {isOpen ? <button aria-label="关闭手机导航遮罩" className="mobile-slide-nav__shade" onClick={closeMenu} type="button" /> : null}
      <div className="mobile-slide-nav__bar">
        {isOpen ? (
          <nav className="mobile-slide-nav__panel" id={`mobile-slide-nav-${variant}`} aria-label={ariaLabel}>
            <div className="mobile-slide-nav__head">
              <img alt="" className="mobile-slide-nav__logo" src={brandLogoPath} />
              <div>
                <strong>{title}</strong>
                <span>{description}</span>
              </div>
            </div>
            <div className="mobile-slide-nav__links">
              {items.map((item) => (
                <NavLink end={item.end} key={item.path} onClick={closeMenu} to={item.path}>
                  {item.label}
                </NavLink>
              ))}
            </div>
          </nav>
        ) : null}
        <button
          aria-controls={`mobile-slide-nav-${variant}`}
          aria-expanded={isOpen}
          aria-label={isOpen ? '收起手机导航' : '展开手机导航'}
          className="mobile-slide-nav__trigger"
          onClick={toggleMenu}
          type="button"
        >
          <img alt="" src={getGuofengIconPath('sliders')} />
          <span>{isOpen ? '收起' : '导航'}</span>
        </button>
      </div>
    </div>
  )
}
