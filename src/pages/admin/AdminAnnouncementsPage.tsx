import { FormEvent, useEffect, useState } from 'react'
import { CloudButton } from '../../components/CloudButton'
import { EmptyState } from '../../components/EmptyState'
import { ScrollPanel } from '../../components/ScrollPanel'
import { SectionTitle } from '../../components/SectionTitle'
import { StatusNotice } from '../../components/StatusNotice'
import { createAnnouncement, fetchAdminAnnouncements } from '../../lib/services'
import type { Announcement } from '../../lib/types'

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

// 这个常量保存公告表单初始值，返回值用于重置表单。
const initialForm: AnnouncementForm = {
  title: '',
  category: '山门公告',
  summary: '',
  content: '',
  status: 'draft'
}

// 这个函数渲染公告管理页，入参为空，返回值是公告创建表单和列表。
export function AdminAnnouncementsPage() {
  // 这个状态保存公告列表。
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  // 这个状态保存表单。
  const [form, setForm] = useState<AnnouncementForm>(initialForm)
  // 这个状态保存提示。
  const [notice, setNotice] = useState<{ type: 'success' | 'error' | 'info'; title: string; message: string } | null>(null)

  // 这个函数读取公告列表，入参为空，返回值为空。
  async function loadAnnouncements() {
    const result = await fetchAdminAnnouncements()
    setAnnouncements(result.data)

    if (!result.ok) {
      setNotice({ type: 'error', title: '读取失败', message: result.message })
    } else if (result.demoMode) {
      setNotice({ type: 'info', title: '演示模式提示', message: result.message })
    }
  }

  useEffect(() => {
    void loadAnnouncements()
  }, [])

  // 这个函数更新表单字段，入参是字段和值，返回值为空。
  function updateField(field: keyof AnnouncementForm, value: string) {
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
  }

  return (
    <div>
      <SectionTitle eyebrow="公告管理" title="发布山门近讯">
        公告可先保存草稿，也可直接发布到前台公告页。
      </SectionTitle>

      {notice ? <StatusNotice type={notice.type} title={notice.title} message={notice.message} /> : null}

      <ScrollPanel className="mt-8">
        <form className="grid gap-5" onSubmit={handleSubmit}>
          <div className="grid gap-5 md:grid-cols-2">
            <label className="grid gap-2">
              <span className="text-sm font-semibold">公告标题 *</span>
              <input
                className="rounded-xl border border-[#6f8f8b]/25 bg-white/80 px-4 py-3 outline-none focus:border-[#6f8f8b]"
                onChange={(event) => updateField('title', event.target.value)}
                value={form.title}
              />
            </label>
            <label className="grid gap-2">
              <span className="text-sm font-semibold">分类</span>
              <select
                className="rounded-xl border border-[#6f8f8b]/25 bg-white/80 px-4 py-3 outline-none focus:border-[#6f8f8b]"
                onChange={(event) => updateField('category', event.target.value)}
                value={form.category}
              >
                <option value="山门公告">山门公告</option>
                <option value="门规更新">门规更新</option>
                <option value="活动通知">活动通知</option>
                <option value="金典修订">金典修订</option>
                <option value="执事公告">执事公告</option>
              </select>
            </label>
          </div>
          <label className="grid gap-2">
            <span className="text-sm font-semibold">摘要</span>
            <input
              className="rounded-xl border border-[#6f8f8b]/25 bg-white/80 px-4 py-3 outline-none focus:border-[#6f8f8b]"
              onChange={(event) => updateField('summary', event.target.value)}
              value={form.summary}
            />
          </label>
          <label className="grid gap-2">
            <span className="text-sm font-semibold">正文 *</span>
            <textarea
              className="min-h-32 rounded-xl border border-[#6f8f8b]/25 bg-white/80 px-4 py-3 leading-7 outline-none focus:border-[#6f8f8b]"
              onChange={(event) => updateField('content', event.target.value)}
              value={form.content}
            />
          </label>
          <label className="grid gap-2">
            <span className="text-sm font-semibold">状态</span>
            <select
              className="rounded-xl border border-[#6f8f8b]/25 bg-white/80 px-4 py-3 outline-none focus:border-[#6f8f8b]"
              onChange={(event) => updateField('status', event.target.value)}
              value={form.status}
            >
              <option value="draft">草稿</option>
              <option value="published">发布</option>
            </select>
          </label>
          <CloudButton type="submit" variant="seal">
            创建公告
          </CloudButton>
        </form>
      </ScrollPanel>

      <div className="mt-8 grid gap-5">
        {announcements.length === 0 ? (
          <EmptyState title="暂无公告" message="创建公告后，会在这里显示。" />
        ) : (
          announcements.map((item) => (
            <ScrollPanel key={item.id}>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-2xl font-bold">{item.title}</h2>
                <span className="rounded-full bg-[#edf3ef] px-3 py-1 text-sm text-[#6f8f8b]">
                  {item.status === 'published' ? '已发布' : '草稿'}
                </span>
              </div>
              <p className="mt-3 text-sm text-[#9e3d32]">{item.category}</p>
              <p className="mt-4 leading-8 text-[#526461]">{item.summary}</p>
            </ScrollPanel>
          ))
        )}
      </div>
    </div>
  )
}
