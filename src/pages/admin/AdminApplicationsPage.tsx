import { useEffect, useState } from 'react'
import { CloudButton } from '../../components/CloudButton'
import { EmptyState } from '../../components/EmptyState'
import { ScrollPanel } from '../../components/ScrollPanel'
import { SectionTitle } from '../../components/SectionTitle'
import { StatusNotice } from '../../components/StatusNotice'
import { applicationStatusLabels } from '../../data/siteContent'
import { fetchAdminApplications, updateApplicationStatus } from '../../lib/services'
import type { JoinApplication, JoinApplicationStatus } from '../../lib/types'

// 这个数组保存可选审核状态，返回值用于后台按钮。
const statuses: JoinApplicationStatus[] = ['pending', 'approved', 'rejected', 'contacted', 'joined']

// 这个函数渲染入派审核页，入参为空，返回值是申请列表和审核操作。
export function AdminApplicationsPage() {
  // 这个状态保存入派申请列表。
  const [applications, setApplications] = useState<JoinApplication[]>([])
  // 这个状态保存每条申请的备注输入。
  const [notes, setNotes] = useState<Record<string, string>>({})
  // 这个状态保存提示信息。
  const [notice, setNotice] = useState<{ type: 'success' | 'error' | 'info'; title: string; message: string } | null>(null)

  // 这个函数读取申请列表，入参为空，返回值为空。
  async function loadApplications() {
    const result = await fetchAdminApplications()
    setApplications(result.data)

    if (!result.ok) {
      setNotice({ type: 'error', title: '读取失败', message: result.message })
    } else if (result.demoMode) {
      setNotice({ type: 'info', title: '演示模式提示', message: result.message })
    }
  }

  useEffect(() => {
    void loadApplications()
  }, [])

  // 这个函数更新本地备注输入，入参是申请编号和值，返回值为空。
  function updateNote(id: string, value: string) {
    setNotes((current) => ({ ...current, [id]: value }))
  }

  // 这个函数提交状态更新，入参是申请编号和新状态，返回值为空。
  async function handleStatus(id: string, status: JoinApplicationStatus) {
    const result = await updateApplicationStatus(id, status, notes[id] ?? '')
    setNotice({
      type: result.ok ? 'success' : 'error',
      title: result.ok ? '状态已更新' : '更新失败',
      message: result.message
    })

    if (result.ok) {
      await loadApplications()
    }
  }

  return (
    <div>
      <SectionTitle eyebrow="入派审核" title="查看入派帖，温和守山门">
        微信号属于敏感联系方式，只应由掌门或执事在后台查看。
      </SectionTitle>

      {notice ? <StatusNotice type={notice.type} title={notice.title} message={notice.message} /> : null}

      <div className="mt-8 grid gap-5">
        {applications.length === 0 ? (
          <EmptyState title="暂无入派申请" message="有新申请提交后，会在这里等待审核。" />
        ) : (
          applications.map((item) => (
            <ScrollPanel key={item.id}>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-2xl font-bold">{item.nickname}</h2>
                  <p className="mt-1 text-sm text-[#526461]">微信号：{item.wechat_id}</p>
                </div>
                <span className="rounded-full bg-[#edf3ef] px-3 py-1 text-sm text-[#6f8f8b]">
                  {applicationStatusLabels[item.status]}
                </span>
              </div>
              <div className="mt-5 grid gap-3 text-sm text-[#526461] md:grid-cols-3">
                <p>年龄段：{item.age_range ?? '未填写'}</p>
                <p>城市：{item.city ?? '未填写'}</p>
                <p>线下意愿：{item.offline_interest ?? '未填写'}</p>
              </div>
              <p className="mt-5 rounded-xl bg-white/65 p-4 leading-8">{item.reason}</p>
              {item.remark ? <p className="mt-3 text-sm leading-7 text-[#526461]">备注：{item.remark}</p> : null}
              <textarea
                className="mt-5 min-h-20 w-full rounded-xl border border-[#6f8f8b]/25 bg-white/80 px-4 py-3 outline-none focus:border-[#6f8f8b]"
                onChange={(event) => updateNote(item.id, event.target.value)}
                placeholder="填写管理员备注，可为空"
                value={notes[item.id] ?? item.admin_note ?? ''}
              />
              <div className="mt-4 flex flex-wrap gap-2">
                {statuses.map((status) => (
                  <CloudButton
                    className="min-h-10 px-4 py-2"
                    key={status}
                    onClick={() => void handleStatus(item.id, status)}
                    variant={status === 'rejected' ? 'ghost' : status === 'joined' ? 'seal' : 'primary'}
                  >
                    {applicationStatusLabels[status]}
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
