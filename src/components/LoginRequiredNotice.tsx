import { LogIn } from 'lucide-react'
import { CloudButton } from './CloudButton'

// 这个接口描述登录提醒的入参，返回值用于各个需要登录的功能入口。
interface LoginRequiredNoticeProps {
  // 提醒标题。
  title: string
  // 提醒正文，说明为什么需要登录。
  message: string
}

// 这个函数渲染统一的登录提醒，入参是标题和正文，返回值是带登录按钮的提示卡片。
export function LoginRequiredNotice({ title, message }: LoginRequiredNoticeProps) {
  return (
    <div className="rounded-2xl border border-[#d6aa54]/38 bg-[#fff8e8]/88 p-4 text-sm leading-7 text-[#526461] shadow-xl shadow-[#102a31]/8 backdrop-blur">
      <p className="font-semibold text-[#a83b32]">{title}</p>
      <p className="mt-1 break-words">{message}</p>
      <CloudButton className="mt-4 w-full sm:w-auto" to="/login" variant="seal">
        去登录或注册
        <LogIn className="h-4 w-4" />
      </CloudButton>
    </div>
  )
}
