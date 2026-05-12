import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { StatusNotice } from '../../components/StatusNotice'
import { YardEmptyBox, YardPageBanner, YardPaperCard, YardStatusPill } from '../../components/YardGuofengFrame'
import { lanternStatusLabels } from '../../data/siteContent'
import { getGuofengVisualPath } from '../../data/visualAssets'
import { getFriendlyErrorMessage } from '../../lib/errorMessage'
import { fetchMyLanterns } from '../../lib/services'
import type { CloudLantern, LanternStatus } from '../../lib/types'

// 这个函数格式化时间，入参是数据库时间，返回值是中文日期。
function formatDate(value: string): string {
  try {
    return new Date(value).toLocaleDateString('zh-CN')
  } catch {
    // 这里日期异常时返回原值，避免单条数据影响整个页面。
    return value
  }
}

// 这个函数把云灯审核状态转换成标签色调，入参是审核状态，返回值是样式色调。
function getLanternTone(status: LanternStatus): 'gold' | 'jade' | 'seal' | 'muted' | 'danger' {
  if (status === 'approved') {
    return 'jade'
  }

  if (status === 'rejected') {
    return 'danger'
  }

  return 'gold'
}

// 这个函数渲染我的云灯页，入参为空，返回值是当前用户提交过的云灯。
export function YardLanternsPage() {
  // 这个状态保存我的云灯列表。
  const [lanterns, setLanterns] = useState<CloudLantern[]>([])
  // 这个状态保存页面是否正在读取。
  const [loading, setLoading] = useState(true)
  // 这个状态保存页面提示。
  const [notice, setNotice] = useState<{ type: 'success' | 'error' | 'info'; title: string; message: string } | null>(null)

  useEffect(() => {
    // 这个函数读取我的云灯，入参为空，返回值为空。
    async function loadLanterns() {
      try {
        const result = await fetchMyLanterns()
        setLanterns(result.data)

        if (!result.ok) {
          setNotice({ type: 'error', title: '读取失败', message: result.message })
        } else if (result.demoMode) {
          setNotice({ type: 'info', title: '演示模式提示', message: result.message })
        }
      } catch (error) {
        // 这里捕获读取异常，保证网络波动时仍能展示中文错误。
        setNotice({ type: 'error', title: '读取失败', message: getFriendlyErrorMessage(error) })
      } finally {
        // 这里结束加载状态，避免空列表一直显示等待中。
        setLoading(false)
      }
    }

    void loadLanterns()
  }, [])

  // 这个变量保存已公开云灯数量，返回值用于页签统计。
  const approvedCount = lanterns.filter((item) => item.status === 'approved').length
  // 这个变量保存审核中云灯数量，返回值用于页签统计。
  const pendingCount = lanterns.filter((item) => item.status === 'pending').length
  // 这个变量保存未通过云灯数量，返回值用于页签统计。
  const rejectedCount = lanterns.filter((item) => item.status === 'rejected').length

  return (
    <div className="yard-page-stack">
      <YardPageBanner
        action={
          <Link className="yard-action-button" to="/cloud-lantern">
            再点云灯
          </Link>
        }
        center
        indexLabel="4 我的云灯"
        subtitle="一盏云灯，守一念陪伴，愿诸君安好。"
        title="灯火已寄，静候清风"
        visual="yardLanterns"
      />

      {notice ? <StatusNotice type={notice.type} title={notice.title} message={notice.message} /> : null}
      {loading ? <StatusNotice title="正在读取云灯" message="请稍候，正在整理你的云灯记录。" /> : null}

      <YardPaperCard className="yard-filter-card">
        <div className="yard-filter-tabs" aria-label="云灯状态统计">
          <span className="yard-filter-tab-active">全部 {lanterns.length}</span>
          <span>审核中 {pendingCount}</span>
          <span>已公开 {approvedCount}</span>
          <span>未通过 {rejectedCount}</span>
        </div>

        {!loading && lanterns.length === 0 ? (
          <YardEmptyBox title="尚未点亮云灯" message="可到云灯留言页留下一句话，审核结果会回到小院提醒。" />
        ) : (
          <div className="yard-lantern-list">
            {lanterns.map((item) => (
              <article className="yard-lantern-row" key={item.id}>
                <img alt="" src={getGuofengVisualPath('yardLanterns')} />
                <div>
                  <div className="yard-lantern-row-head">
                    <h2>{item.content}</h2>
                    <YardStatusPill tone={getLanternTone(item.status)}>{lanternStatusLabels[item.status]}</YardStatusPill>
                  </div>
                  <p>{formatDate(item.created_at)} 提交 · 心情：{item.mood ?? '平静'}</p>
                  <span>署名：{item.author_name}{item.is_anonymous ? '（匿名展示）' : ''}</span>
                </div>
                <time>{item.reviewed_at ? `审核时间：${formatDate(item.reviewed_at)}` : '等待审核'}</time>
              </article>
            ))}
          </div>
        )}
      </YardPaperCard>
    </div>
  )
}
