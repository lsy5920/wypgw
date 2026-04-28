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
    <div className="rounded-2xl border border-dashed border-[#c9a45c]/45 bg-white/55 p-8 text-center">
      {/* 这里用云图标说明当前只是暂时无内容，不是页面出错。 */}
      <Cloud className="mx-auto mb-3 h-9 w-9 text-[#6f8f8b]" />
      <p className="font-semibold text-[#263238]">{title}</p>
      <p className="mt-2 text-sm leading-6 text-[#687773]">{message}</p>
    </div>
  )
}
