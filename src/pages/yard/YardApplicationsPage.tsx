import { useEffect, useState } from 'react'
import { StatusNotice } from '../../components/StatusNotice'
import { YardEmptyBox, YardPageBanner, YardPaperCard, YardStatusPill } from '../../components/YardGuofengFrame'
import { applicationStatusLabels } from '../../data/siteContent'
import { getFriendlyErrorMessage } from '../../lib/errorMessage'
import { fetchMyApplications } from '../../lib/services'
import type { JoinApplication, JoinApplicationStatus } from '../../lib/types'

// 这个常量保存名帖审核进度节点，返回值用于复刻设计稿里的横向进度条。
const applicationProgressSteps = ['已发文', '审核中', '已联系', '已通过']

// 这个函数格式化日期，入参是数据库时间，返回值是中文日期。
function formatDate(value: string): string {
  try {
    return new Date(value).toLocaleDateString('zh-CN')
  } catch {
    // 这里日期异常时保留原始值，避免页面因为单条脏数据崩溃。
    return value
  }
}

// 这个函数把名帖状态转换成标签色调，入参是名帖状态，返回值是样式色调。
function getApplicationTone(status: JoinApplicationStatus): 'gold' | 'jade' | 'seal' | 'muted' | 'danger' {
  if (status === 'approved' || status === 'contacted') {
    return 'jade'
  }

  if (status === 'rejected' || status === 'retired') {
    return 'danger'
  }

  if (status === 'pending') {
    return 'gold'
  }

  return 'muted'
}

// 这个函数把名帖状态转换成进度位置，入参是名帖状态，返回值是当前所在步骤序号。
function getProgressIndex(status: JoinApplicationStatus): number {
  if (status === 'contacted') {
    return 2
  }

  if (status === 'approved') {
    return 3
  }

  if (status === 'pending') {
    return 1
  }

  return 0
}

// 这个函数渲染我的名帖页，入参为空，返回值是当前用户的名帖状态列表。
export function YardApplicationsPage() {
  // 这个状态保存我的名帖列表。
  const [applications, setApplications] = useState<JoinApplication[]>([])
  // 这个状态保存页面是否正在读取。
  const [loading, setLoading] = useState(true)
  // 这个状态保存页面提示。
  const [notice, setNotice] = useState<{ type: 'success' | 'error' | 'info'; title: string; message: string } | null>(null)

  useEffect(() => {
    // 这个函数读取我的名帖，入参为空，返回值为空。
    async function loadApplications() {
      try {
        const result = await fetchMyApplications()
        setApplications(result.data)

        if (!result.ok) {
          setNotice({ type: 'error', title: '读取失败', message: result.message })
        } else if (result.demoMode) {
          setNotice({ type: 'info', title: '演示模式提示', message: result.message })
        }
      } catch (error) {
        // 这里捕获读取异常，让网络错误也能显示中文提示。
        setNotice({ type: 'error', title: '读取失败', message: getFriendlyErrorMessage(error) })
      } finally {
        // 这里结束加载状态，保证空数据和失败状态都能展示。
        setLoading(false)
      }
    }

    void loadApplications()
  }, [])

  // 这个变量保存最新名帖，返回值用于顶部状态总览。
  const latestApplication = applications[0]
  // 这个变量保存最新名帖当前进度，返回值用于绘制进度节点。
  const progressIndex = latestApplication ? getProgressIndex(latestApplication.status) : 0

  return (
    <div className="yard-page-stack">
      <YardPageBanner
        indexLabel="3 我的名帖"
        subtitle="名帖递出后，审核状态、联系方式和管理员备注都会在此留痕。"
        title="名帖已递，静候山门"
        visual="yardApplications"
      />

      {notice ? <StatusNotice type={notice.type} title={notice.title} message={notice.message} /> : null}
      {loading ? <StatusNotice title="正在读取名帖" message="请稍候，正在查看你的递帖记录。" /> : null}

      {!loading && applications.length === 0 ? (
        <YardEmptyBox title="尚未递交名帖" message="可到问云名册页面递上名帖，之后会在这里看到审核进度。" />
      ) : null}

      {latestApplication ? (
        <div className="yard-application-overview">
          <YardPaperCard title="名帖状态" subtitle="最新一张名帖的审核状态。">
            <div className="yard-application-state-card">
              <YardStatusPill tone={getApplicationTone(latestApplication.status)}>{applicationStatusLabels[latestApplication.status]}</YardStatusPill>
              <h2>{latestApplication.nickname}</h2>
              <p>{latestApplication.member_code ?? '尚未编号'} · {latestApplication.member_role ?? '同门'}</p>
              <span>提交时间：{formatDate(latestApplication.created_at)}</span>
            </div>
          </YardPaperCard>

          <YardPaperCard title="审核进度" subtitle="进度会随云纪执事审核结果自动更新。">
            <div className="yard-progress-line">
              {applicationProgressSteps.map((step, index) => (
                <div className={`yard-progress-step ${index <= progressIndex ? 'yard-progress-step-active' : ''}`} key={step}>
                  <span>{index < progressIndex ? '✓' : index === progressIndex ? '×' : '·'}</span>
                  <p>{step}</p>
                </div>
              ))}
            </div>
            <div className="yard-progress-note">
              {latestApplication.status === 'rejected'
                ? '名帖未通过，如需重新递帖请联系执事确认原因。'
                : latestApplication.status === 'approved'
                  ? '名帖已通过，后续可在小院维护公开资料。'
                  : '审核中：执事正在核对你的资料，请耐心等待。'}
            </div>
          </YardPaperCard>
        </div>
      ) : null}

      {applications.map((item) => (
        <YardPaperCard className="yard-application-detail" key={item.id} title="名帖详情" subtitle={item.member_code ?? '尚未编号'}>
          <div className="yard-detail-grid">
            <div>
              <span>道名</span>
              <strong>{item.nickname}</strong>
            </div>
            <div>
              <span>江湖名</span>
              <strong>{item.jianghu_name ?? '未填写'}</strong>
            </div>
            <div>
              <span>联系方式</span>
              <strong>{item.legacy_contact ?? item.wechat_id}</strong>
            </div>
            <div>
              <span>所在城市</span>
              <strong>{item.public_region ?? item.city ?? '未填写'}</strong>
            </div>
            <div>
              <span>入册时间</span>
              <strong>{item.joined_at ? formatDate(item.joined_at) : formatDate(item.created_at)}</strong>
            </div>
            <div>
              <span>审核时间</span>
              <strong>{item.reviewed_at ? formatDate(item.reviewed_at) : '尚未审核'}</strong>
            </div>
          </div>

          <div className="yard-text-ledger">
            <div>
              <span>宣言</span>
              <p>{item.motto ?? item.reason}</p>
            </div>
            <div>
              <span>兴趣爱好</span>
              <p>{item.tags?.trim() || '未填写'}</p>
            </div>
            <div>
              <span>同行期待</span>
              <p>{item.companion_expectation ?? '未填写'}</p>
            </div>
            {item.admin_note ? (
              <div>
                <span>管理员备注</span>
                <p>{item.admin_note}</p>
              </div>
            ) : null}
          </div>
        </YardPaperCard>
      ))}
    </div>
  )
}
