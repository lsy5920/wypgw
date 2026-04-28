import { useEffect, useState } from 'react'
import { EmptyState } from '../../components/EmptyState'
import { ScrollPanel } from '../../components/ScrollPanel'
import { SectionTitle } from '../../components/SectionTitle'
import { StatusNotice } from '../../components/StatusNotice'
import { lanternStatusLabels } from '../../data/siteContent'
import { fetchMyLanterns } from '../../lib/services'
import type { CloudLantern } from '../../lib/types'

// 这个函数格式化时间，入参是数据库时间，返回值是中文日期。
function formatDate(value: string): string {
  try {
    return new Date(value).toLocaleDateString('zh-CN')
  } catch {
    return value
  }
}

// 这个函数渲染我的云灯页，入参为空，返回值是当前用户提交过的云灯。
export function YardLanternsPage() {
  // 这个状态保存我的云灯列表。
  const [lanterns, setLanterns] = useState<CloudLantern[]>([])
  // 这个状态保存页面提示。
  const [notice, setNotice] = useState<{ type: 'success' | 'error' | 'info'; title: string; message: string } | null>(null)

  useEffect(() => {
    // 这个函数读取我的云灯，入参为空，返回值为空。
    async function loadLanterns() {
      const result = await fetchMyLanterns()
      setLanterns(result.data)

      if (!result.ok) {
        setNotice({ type: 'error', title: '读取失败', message: result.message })
      } else if (result.demoMode) {
        setNotice({ type: 'info', title: '演示模式提示', message: result.message })
      }
    }

    void loadLanterns()
  }, [])

  return (
    <div>
      <SectionTitle eyebrow="我的云灯" title="灯火已寄，静候清风">
        这里展示你提交过的云灯和审核状态。公开后的云灯会出现在前台云灯留言页。
      </SectionTitle>

      {notice ? <StatusNotice type={notice.type} title={notice.title} message={notice.message} /> : null}

      <div className="mt-8 grid gap-5 md:grid-cols-2">
        {lanterns.length === 0 ? (
          <EmptyState title="尚未点亮云灯" message="可到云灯留言页留下一句话，审核结果会回到小院提醒。" />
        ) : (
          lanterns.map((item) => (
            <ScrollPanel key={item.id}>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm text-[#9e3d32]">一盏云灯 · {item.mood ?? '温暖'}</p>
                <span className="rounded-full bg-[#edf3ef] px-3 py-1 text-sm text-[#6f8f8b]">
                  {lanternStatusLabels[item.status]}
                </span>
              </div>
              <p className="mt-4 text-lg leading-8 text-[#263238]">{item.content}</p>
              <div className="mt-5 grid gap-2 text-sm text-[#526461]">
                <p>署名：{item.author_name}</p>
                <p>提交时间：{formatDate(item.created_at)}</p>
                <p>审核时间：{item.reviewed_at ? formatDate(item.reviewed_at) : '尚未审核'}</p>
              </div>
            </ScrollPanel>
          ))
        )}
      </div>
    </div>
  )
}
