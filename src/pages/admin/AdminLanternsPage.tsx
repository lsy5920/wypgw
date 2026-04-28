import { useEffect, useState } from 'react'
import { CloudButton } from '../../components/CloudButton'
import { EmptyState } from '../../components/EmptyState'
import { ScrollPanel } from '../../components/ScrollPanel'
import { SectionTitle } from '../../components/SectionTitle'
import { StatusNotice } from '../../components/StatusNotice'
import { lanternStatusLabels } from '../../data/siteContent'
import { fetchAdminLanterns, updateLanternStatus } from '../../lib/services'
import type { CloudLantern, LanternStatus } from '../../lib/types'

// 这个数组保存云灯审核状态，返回值用于审核按钮。
const statuses: LanternStatus[] = ['pending', 'approved', 'rejected']

// 这个函数渲染云灯审核页，入参为空，返回值是留言列表和审核按钮。
export function AdminLanternsPage() {
  // 这个状态保存云灯列表。
  const [lanterns, setLanterns] = useState<CloudLantern[]>([])
  // 这个状态保存提示信息。
  const [notice, setNotice] = useState<{ type: 'success' | 'error' | 'info'; title: string; message: string } | null>(null)

  // 这个函数读取云灯列表，入参为空，返回值为空。
  async function loadLanterns() {
    const result = await fetchAdminLanterns()
    setLanterns(result.data)

    if (!result.ok) {
      setNotice({ type: 'error', title: '读取失败', message: result.message })
    } else if (result.demoMode) {
      setNotice({ type: 'info', title: '演示模式提示', message: result.message })
    }
  }

  useEffect(() => {
    void loadLanterns()
  }, [])

  // 这个函数更新云灯状态，入参是留言编号和状态，返回值为空。
  async function handleStatus(id: string, status: LanternStatus) {
    const result = await updateLanternStatus(id, status)
    setNotice({
      type: result.ok ? 'success' : 'error',
      title: result.ok ? '审核状态已更新' : '更新失败',
      message: result.message
    })

    if (result.ok) {
      await loadLanterns()
    }
  }

  return (
    <div>
      <SectionTitle eyebrow="云灯审核" title="让温暖公开，让杂音止步">
        云灯默认先审核再公开，避免广告、低俗内容和恶意刷屏。
      </SectionTitle>

      {notice ? <StatusNotice type={notice.type} title={notice.title} message={notice.message} /> : null}

      <div className="mt-8 grid gap-5">
        {lanterns.length === 0 ? (
          <EmptyState title="暂无云灯留言" message="有新云灯提交后，会在这里等待审核。" />
        ) : (
          lanterns.map((item) => (
            <ScrollPanel key={item.id}>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="font-semibold">{item.author_name}</p>
                <span className="rounded-full bg-[#edf3ef] px-3 py-1 text-sm text-[#6f8f8b]">
                  {lanternStatusLabels[item.status]}
                </span>
              </div>
              <p className="mt-4 text-lg leading-8">{item.content}</p>
              <p className="mt-3 text-sm text-[#7a6a48]">心情：{item.mood ?? '未填写'}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {statuses.map((status) => (
                  <CloudButton
                    className="min-h-10 px-4 py-2"
                    key={status}
                    onClick={() => void handleStatus(item.id, status)}
                    variant={status === 'rejected' ? 'ghost' : status === 'approved' ? 'seal' : 'primary'}
                  >
                    {lanternStatusLabels[status]}
                  </CloudButton>
                ))}
              </div>
            </ScrollPanel>
          ))
        )}
      </div>
    </div>
  )
}
