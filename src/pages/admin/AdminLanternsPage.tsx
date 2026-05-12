import { Search } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { CloudButton } from '../../components/CloudButton'
import { EmptyState } from '../../components/EmptyState'
import { StatusNotice } from '../../components/StatusNotice'
import { lanternStatusLabels } from '../../data/siteContent'
import { fetchAdminLanterns, updateLanternStatus } from '../../lib/services'
import type { CloudLantern, LanternStatus } from '../../lib/types'
import { AdminPageShell, AdminPanel, AdminStatusPill, formatAdminDate } from './AdminUi'

// 这个数组保存云灯审核状态，入参是状态值，返回值用于按钮和筛选。
const statuses: LanternStatus[] = ['pending', 'approved', 'rejected']

// 这个对象保存云灯状态颜色，入参是状态值，返回值用于状态章。
const statusTones: Record<LanternStatus, 'red' | 'green' | 'gray'> = {
  pending: 'red',
  approved: 'green',
  rejected: 'gray'
}

// 这个函数渲染云灯审核页，入参为空，返回值是设计稿第三屏样式的留言审核台账。
export function AdminLanternsPage() {
  // 这个状态保存云灯列表。
  const [lanterns, setLanterns] = useState<CloudLantern[]>([])
  // 这个状态保存搜索词。
  const [keyword, setKeyword] = useState('')
  // 这个状态保存当前筛选状态。
  const [filter, setFilter] = useState<LanternStatus | 'all'>('all')
  // 这个状态保存正在更新的云灯编号。
  const [updatingId, setUpdatingId] = useState('')
  // 这个状态保存提示信息。
  const [notice, setNotice] = useState<{ type: 'success' | 'error' | 'info'; title: string; message: string } | null>(null)

  // 这个函数读取云灯列表，入参为空，返回值为空。
  async function loadLanterns() {
    try {
      const result = await fetchAdminLanterns()
      setLanterns(result.data)

      if (!result.ok) {
        setNotice({ type: 'error', title: '读取失败', message: result.message })
      } else if (result.demoMode) {
        setNotice({ type: 'info', title: '演示模式提示', message: result.message })
      }
    } catch (error) {
      // 这里兜底捕获意外异常，避免云灯审核页白屏。
      setNotice({ type: 'error', title: '读取异常', message: error instanceof Error ? error.message : '云灯列表暂时无法读取。' })
    }
  }

  useEffect(() => {
    void loadLanterns()
  }, [])

  // 这个变量保存筛选后的云灯列表，返回值用于表格展示。
  const filteredLanterns = useMemo(() => {
    // 这里统一清理搜索词，避免空格影响搜索。
    const normalizedKeyword = keyword.trim()

    return lanterns.filter((item) => {
      // 这里先按状态筛选，再按作者、内容和心情搜索。
      const matchesStatus = filter === 'all' || item.status === filter
      const matchesKeyword =
        !normalizedKeyword ||
        item.author_name.includes(normalizedKeyword) ||
        item.content.includes(normalizedKeyword) ||
        (item.mood ?? '').includes(normalizedKeyword)

      return matchesStatus && matchesKeyword
    })
  }, [filter, keyword, lanterns])

  // 这个函数更新云灯状态，入参是留言编号和目标状态，返回值为空。
  async function handleStatus(id: string, status: LanternStatus) {
    try {
      // 这里进入更新状态，避免同一条云灯重复提交。
      setUpdatingId(id)
      const result = await updateLanternStatus(id, status)
      setNotice({
        type: result.ok ? 'success' : 'error',
        title: result.ok ? '审核状态已更新' : '更新失败',
        message: result.message
      })

      if (result.ok) {
        await loadLanterns()
      }
    } finally {
      // 这里恢复按钮状态，保证后续还能继续审核。
      setUpdatingId('')
    }
  }

  return (
    <AdminPageShell index="3" title="云灯审核" description="所有云灯先入后台，确认真诚清净后再公开。">
      {notice ? <StatusNotice type={notice.type} title={notice.title} message={notice.message} /> : null}

      <AdminPanel>
        <div className="admin-filter-bar">
          <label className="admin-search-field">
            <Search className="h-4 w-4" />
            <input onChange={(event) => setKeyword(event.target.value)} placeholder="搜索云灯内容、作者或心情" value={keyword} />
          </label>
          <div className="admin-segmented">
            <button className={filter === 'all' ? 'active' : ''} onClick={() => setFilter('all')} type="button">
              全部
            </button>
            {statuses.map((status) => (
              <button className={filter === status ? 'active' : ''} key={status} onClick={() => setFilter(status)} type="button">
                {lanternStatusLabels[status]}
              </button>
            ))}
          </div>
        </div>
      </AdminPanel>

      <AdminPanel title="云灯台账" description={`共 ${filteredLanterns.length} 条符合条件的留言。`}>
        {filteredLanterns.length === 0 ? (
          <EmptyState title="暂无云灯留言" message="有新云灯提交后，会在这里等待审核。" />
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-data-table">
              <thead>
                <tr>
                  <th>作者</th>
                  <th>内容</th>
                  <th>心情</th>
                  <th>状态</th>
                  <th>提交时间</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {filteredLanterns.map((item) => (
                  <tr key={item.id}>
                    <td>{item.author_name}</td>
                    <td className="admin-table-main">{item.content}</td>
                    <td>{item.mood ?? '未填写'}</td>
                    <td>
                      <AdminStatusPill tone={statusTones[item.status]}>{lanternStatusLabels[item.status]}</AdminStatusPill>
                    </td>
                    <td>{formatAdminDate(item.created_at)}</td>
                    <td>
                      <div className="admin-table-actions">
                        <CloudButton disabled={updatingId === item.id} onClick={() => void handleStatus(item.id, 'approved')} variant="primary">
                          通过
                        </CloudButton>
                        <CloudButton disabled={updatingId === item.id} onClick={() => void handleStatus(item.id, 'rejected')} variant="seal">
                          拒绝
                        </CloudButton>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </AdminPanel>
    </AdminPageShell>
  )
}
