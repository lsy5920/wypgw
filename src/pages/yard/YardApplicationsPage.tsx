import { useEffect, useState } from 'react'
import { EmptyState } from '../../components/EmptyState'
import { ScrollPanel } from '../../components/ScrollPanel'
import { SectionTitle } from '../../components/SectionTitle'
import { StatusNotice } from '../../components/StatusNotice'
import { applicationStatusLabels } from '../../data/siteContent'
import { fetchMyApplications } from '../../lib/services'
import type { JoinApplication } from '../../lib/types'

// 这个函数格式化时间，入参是数据库时间，返回值是中文日期。
function formatDate(value: string): string {
  try {
    return new Date(value).toLocaleDateString('zh-CN')
  } catch {
    return value
  }
}

// 这个函数渲染我的名帖页，入参为空，返回值是当前用户的名帖状态列表。
export function YardApplicationsPage() {
  // 这个状态保存我的名帖列表。
  const [applications, setApplications] = useState<JoinApplication[]>([])
  // 这个状态保存页面提示。
  const [notice, setNotice] = useState<{ type: 'success' | 'error' | 'info'; title: string; message: string } | null>(null)

  useEffect(() => {
    // 这个函数读取我的名帖，入参为空，返回值为空。
    async function loadApplications() {
      const result = await fetchMyApplications()
      setApplications(result.data)

      if (!result.ok) {
        setNotice({ type: 'error', title: '读取失败', message: result.message })
      } else if (result.demoMode) {
        setNotice({ type: 'info', title: '演示模式提示', message: result.message })
      }
    }

    void loadApplications()
  }, [])

  return (
    <div>
      <SectionTitle eyebrow="我的名帖" title="名帖已递，静候山门">
        这里展示你提交过的名帖、当前状态和管理员备注。名帖内容由后台审核维护，普通同门不可自行改状态。
      </SectionTitle>

      {notice ? <StatusNotice type={notice.type} title={notice.title} message={notice.message} /> : null}

      <div className="mt-8 grid gap-5">
        {applications.length === 0 ? (
          <EmptyState title="尚未递交名帖" message="可到问云名册页面递上名帖，之后会在这里看到审核进度。" />
        ) : (
          applications.map((item) => (
            <ScrollPanel key={item.id}>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm text-[#9e3d32]">{item.member_code ?? '尚未编号'}</p>
                  <h2 className="ink-title mt-1 text-3xl font-bold text-[#143044]">{item.nickname}</h2>
                </div>
                <span className="rounded-full bg-[#edf3ef] px-3 py-1 text-sm text-[#6f8f8b]">
                  {applicationStatusLabels[item.status]}
                </span>
              </div>
              <div className="mt-5 grid gap-3 text-sm leading-7 text-[#526461] md:grid-cols-2">
                <p>江湖名：{item.jianghu_name ?? '未填写'}</p>
                <p>城市：{item.city ?? '未填写'}</p>
                <p>出生月份：{item.age_range ?? '未填写'}</p>
                <p>提交时间：{formatDate(item.created_at)}</p>
                <p>线下意愿：{item.offline_interest ?? '未填写'}</p>
                <p>审核时间：{item.reviewed_at ? formatDate(item.reviewed_at) : '尚未审核'}</p>
              </div>
              <div className="mt-5 rounded-2xl border border-[#c9a45c]/25 bg-white/55 p-4">
                <p className="text-sm font-semibold text-[#143044]">申请理由</p>
                <p className="mt-2 text-sm leading-7 text-[#526461]">{item.reason}</p>
              </div>
              {item.admin_note ? (
                <div className="mt-4 rounded-2xl border border-[#9e3d32]/20 bg-[#fff1ee]/70 p-4">
                  <p className="text-sm font-semibold text-[#9e3d32]">管理员备注</p>
                  <p className="mt-2 text-sm leading-7 text-[#526461]">{item.admin_note}</p>
                </div>
              ) : null}
            </ScrollPanel>
          ))
        )}
      </div>
    </div>
  )
}
