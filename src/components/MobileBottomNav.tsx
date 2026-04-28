import { BookOpen, Cloud, Home, Lamp, Mail } from 'lucide-react'
import { NavLink } from 'react-router-dom'

// 这个数组保存手机底部导航，返回值用于移动端快速访问核心页面。
const mobileItems = [
  { label: '首页', path: '/', icon: Home },
  { label: '金典', path: '/canon', icon: BookOpen },
  { label: '云灯', path: '/cloud-lantern', icon: Lamp },
  { label: '入派', path: '/join', icon: Cloud },
  { label: '联系', path: '/contact', icon: Mail }
]

// 这个函数渲染手机底部导航，入参为空，返回值是固定在底部的核心入口。
export function MobileBottomNav() {
  return (
    <nav className="fixed inset-x-3 bottom-3 z-40 grid grid-cols-5 rounded-2xl border border-[#c9a45c]/35 bg-[#fffaf0]/95 p-1 shadow-2xl shadow-[#263238]/15 backdrop-blur-xl md:hidden">
      {mobileItems.map((item) => {
        // 这个变量保存当前导航项图标组件。
        const Icon = item.icon

        return (
          <NavLink
            className={({ isActive }) =>
              `flex min-h-14 flex-col items-center justify-center gap-1 rounded-xl text-xs transition ${
                isActive ? 'bg-[#6f8f8b] text-white' : 'text-[#526461]'
              }`
            }
            key={item.path}
            to={item.path}
          >
            <Icon className="h-4 w-4" />
            <span>{item.label}</span>
          </NavLink>
        )
      })}
    </nav>
  )
}
