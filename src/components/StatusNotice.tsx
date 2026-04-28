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
    info: 'border-[#6f8f8b]/30 bg-[#edf5f1] text-[#263238]',
    success: 'border-[#7a8b6f]/35 bg-[#f1f7e9] text-[#314434]',
    error: 'border-[#9e3d32]/30 bg-[#fff1ee] text-[#6d2a24]'
  }[type]

  return (
    <div className={`rounded-xl border px-4 py-3 ${colorClass}`}>
      <p className="font-semibold">{title}</p>
      <p className="mt-1 text-sm leading-6 opacity-85">{message}</p>
    </div>
  )
}
