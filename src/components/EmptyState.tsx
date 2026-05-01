import { Cloud } from 'lucide-react'

// 这个类型描述空状态提示的入参，返回值用于列表无数据时展示。
interface EmptyStateProps {
  // 空状态标题。
  title: string
  // 空状态说明。
  message: string
}

// 这个函数渲染空状态，入参是标题和说明，返回值是柔和的占位内容。
export function EmptyState({ title, message }: EmptyStateProps) {
  return (
    <div className="scroll-panel rounded-[1.35rem] border-dashed p-8 text-center shadow-lg shadow-[#102a31]/8">
      {/* 这里用云图标说明当前只是暂时无内容，不是页面出错。 */}
      <Cloud className="cloud-drift mx-auto mb-3 h-9 w-9 text-[#5f8f83]" />
      <p className="font-semibold text-[#172b2c]">{title}</p>
      <p className="mt-2 text-sm leading-6 text-[#5c6f6a]">{message}</p>
    </div>
  )
}
