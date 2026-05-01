import { CheckCircle2, Info, TriangleAlert } from 'lucide-react'

// 这个类型描述提示条的入参，返回值用于表单、演示模式和错误提示。
interface StatusNoticeProps {
  // 提示类型，用于决定颜色。
  type?: 'info' | 'success' | 'error'
  // 提示标题。
  title: string
  // 提示正文。
  message: string
}

// 这个函数渲染中文状态提示，入参是类型和文案，返回值是提示条。
export function StatusNotice({ type = 'info', title, message }: StatusNoticeProps) {
  // 这个常量保存不同状态对应的颜色，保证提示清晰但不刺眼。
  const colorClass = {
    info: 'border-[#5f8f83]/32 bg-[#edf5f1]/92 text-[#172b2c]',
    success: 'border-[#7e9368]/38 bg-[#f1f7e9]/94 text-[#314434]',
    error: 'border-[#a83b32]/34 bg-[#fff1ee]/94 text-[#6d2a24]'
  }[type]
  // 这个常量保存不同状态的图标，帮助用户快速区分提示类型。
  const Icon = {
    info: Info,
    success: CheckCircle2,
    error: TriangleAlert
  }[type]

  return (
    <div className={`flex gap-3 rounded-2xl border px-4 py-3 shadow-xl shadow-[#102a31]/8 backdrop-blur ${colorClass}`}>
      {/* 这里放状态图标，手机端也能一眼看出是提醒、成功还是错误。 */}
      <Icon className="mt-0.5 h-5 w-5 shrink-0" />
      <div className="min-w-0">
        <p className="font-semibold">{title}</p>
        <p className="mt-1 break-words text-sm leading-6">{message}</p>
      </div>
    </div>
  )
}
