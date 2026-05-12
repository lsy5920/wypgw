import { FormEvent, useEffect, useState } from 'react'
import { CloudButton } from '../../components/CloudButton'
import { EmptyState } from '../../components/EmptyState'
import { StatusNotice } from '../../components/StatusNotice'
import { createAnnouncement, fetchAdminAnnouncements } from '../../lib/services'
import type { Announcement, PublishStatus } from '../../lib/types'
import { AdminPageShell, AdminPanel, AdminStatusPill, formatAdminDate } from './AdminUi'

// 这个接口描述公告表单，入参来自后台输入，返回值用于创建公告。
interface AnnouncementForm {
  // 公告标题。
  title: string
  // 公告分类。
  category: string
  // 公告摘要。
  summary: string
  // 公告正文。
  content: string
  // 发布状态。
  status: 'draft' | 'published'
}

// 这个常量保存公告表单初始值，返回值用于清空表单。
const initialForm: AnnouncementForm = {
  title: '',
  category: '山门公告',
  summary: '',
  content: '',
  status: 'draft'
}

// 这个数组保存公告分类选项，返回值用于下拉框。
const categoryOptions = ['山门公告', '金典修订', '活动通知', '组织公告', '执事公告']

// 这个对象保存发布状态中文文案，入参是数据库状态，返回值用于后台表格展示。
const publishStatusLabels: Record<PublishStatus, string> = {
  draft: '草稿',
  published: '已发布',
  closed: '已关闭',
  ended: '已结束'
}

// 这个对象保存发布状态颜色，入参是数据库状态，返回值用于状态章。
const publishStatusTones: Record<PublishStatus, 'green' | 'gold' | 'gray'> = {
  draft: 'gold',
  published: 'green',
  closed: 'gray',
  ended: 'gray'
}

// 这个函数渲染公告管理页，入参为空，返回值是设计稿第四屏样式的公告编辑和台账。
export function AdminAnnouncementsPage() {
  // 这个状态保存公告列表。
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  // 这个状态保存公告表单。
  const [form, setForm] = useState<AnnouncementForm>(initialForm)
  // 这个状态保存正在提交标记。
  const [submitting, setSubmitting] = useState(false)
  // 这个状态保存提示。
  const [notice, setNotice] = useState<{ type: 'success' | 'error' | 'info'; title: string; message: string } | null>(null)

  // 这个函数读取公告列表，入参为空，返回值为空。
  async function loadAnnouncements() {
    try {
      const result = await fetchAdminAnnouncements()
      setAnnouncements(result.data)

      if (!result.ok) {
        setNotice({ type: 'error', title: '读取失败', message: result.message })
      } else if (result.demoMode) {
        setNotice({ type: 'info', title: '演示模式提示', message: result.message })
      }
    } catch (error) {
      // 这里兜底捕获意外异常，避免公告管理页白屏。
      setNotice({ type: 'error', title: '读取异常', message: error instanceof Error ? error.message : '公告列表暂时无法读取。' })
    }
  }

  useEffect(() => {
    void loadAnnouncements()
  }, [])

  // 这个函数更新公告表单字段，入参是字段和值，返回值为空。
  function updateField(field: keyof AnnouncementForm, value: string) {
    // 这里只更新当前字段，避免输入一个表单项时清掉其他内容。
    setForm((current) => ({ ...current, [field]: value }))
  }

  // 这个函数创建公告，入参是表单事件，返回值为空。
  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    // 这里做基础校验，避免空公告进入数据库。
    if (!form.title.trim() || !form.content.trim()) {
      setNotice({ type: 'error', title: '公告还不能发布', message: '请填写公告标题和正文。' })
      return
    }

    try {
      // 这里进入提交状态，避免管理员重复点击创建。
      setSubmitting(true)
      const result = await createAnnouncement(form)
      setNotice({
        type: result.ok ? 'success' : 'error',
        title: result.ok ? '公告已创建' : '创建失败',
        message: result.message
      })

      if (result.ok) {
        setForm(initialForm)
        await loadAnnouncements()
      }
    } finally {
      // 这里恢复提交状态，让按钮重新可用。
      setSubmitting(false)
    }
  }

  return (
    <AdminPageShell index="4" title="公告管理" description="左侧拟稿，右侧查看公告台账，草稿和发布都可追溯。">
      {notice ? <StatusNotice type={notice.type} title={notice.title} message={notice.message} /> : null}

      <div className="admin-two-column">
        <AdminPanel title="发布公告" description="公告会进入门派公告页；草稿可先留在后台。">
          <form className="admin-form-grid" onSubmit={handleSubmit}>
            <label>
              <span>公告标题 *</span>
              <input onChange={(event) => updateField('title', event.target.value)} value={form.title} />
            </label>

            <label>
              <span>公告分类</span>
              <select onChange={(event) => updateField('category', event.target.value)} value={form.category}>
                {categoryOptions.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </label>

            <label>
              <span>公告摘要</span>
              <input onChange={(event) => updateField('summary', event.target.value)} value={form.summary} />
            </label>

            <label>
              <span>公告正文 *</span>
              <textarea onChange={(event) => updateField('content', event.target.value)} rows={6} value={form.content} />
            </label>

            <label>
              <span>发布状态</span>
              <select onChange={(event) => updateField('status', event.target.value)} value={form.status}>
                <option value="draft">草稿</option>
                <option value="published">发布</option>
              </select>
            </label>

            <CloudButton disabled={submitting} type="submit" variant="primary">
              {submitting ? '正在创建...' : '保存公告'}
            </CloudButton>
          </form>
        </AdminPanel>

        <AdminPanel title="公告列表" description={`当前共 ${announcements.length} 条公告。`}>
          {announcements.length === 0 ? (
            <EmptyState title="暂无公告" message="创建公告后，会在这里显示。" />
          ) : (
            <div className="admin-table-wrap">
              <table className="admin-data-table">
                <thead>
                  <tr>
                    <th>标题</th>
                    <th>分类</th>
                    <th>状态</th>
                    <th>发布时间</th>
                    <th>更新时间</th>
                  </tr>
                </thead>
                <tbody>
                  {announcements.map((item) => (
                    <tr key={item.id}>
                      <td className="admin-table-main">
                        <strong>{item.title}</strong>
                        <span>{item.summary ?? '未填写摘要'}</span>
                      </td>
                      <td>{item.category}</td>
                      <td>
                        <AdminStatusPill tone={publishStatusTones[item.status]}>{publishStatusLabels[item.status]}</AdminStatusPill>
                      </td>
                      <td>{formatAdminDate(item.published_at)}</td>
                      <td>{formatAdminDate(item.updated_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </AdminPanel>
      </div>
    </AdminPageShell>
  )
}
