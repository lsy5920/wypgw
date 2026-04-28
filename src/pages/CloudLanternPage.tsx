import { Lamp } from 'lucide-react'
import { FormEvent, useEffect, useState } from 'react'
import { CloudButton } from '../components/CloudButton'
import { EmptyState } from '../components/EmptyState'
import { ScrollPanel } from '../components/ScrollPanel'
import { SectionTitle } from '../components/SectionTitle'
import { StatusNotice } from '../components/StatusNotice'
import { fetchApprovedLanterns, submitCloudLantern } from '../lib/services'
import type { CloudLantern, CloudLanternInput } from '../lib/types'
import { validateCloudLantern } from '../lib/validators'

// 这个常量保存云灯表单初始值，返回值用于提交后重置。
const initialForm: CloudLanternInput = {
  author_name: '',
  content: '',
  mood: '',
  is_anonymous: true
}

// 这个函数渲染云灯留言页，入参为空，返回值是留言表单和公开云灯列表。
export function CloudLanternPage() {
  // 这个状态保存公开云灯。
  const [lanterns, setLanterns] = useState<CloudLantern[]>([])
  // 这个状态保存表单数据。
  const [form, setForm] = useState<CloudLanternInput>(initialForm)
  // 这个状态表示是否正在提交。
  const [submitting, setSubmitting] = useState(false)
  // 这个状态保存提示信息。
  const [notice, setNotice] = useState<{ type: 'success' | 'error' | 'info'; title: string; message: string } | null>(null)

  useEffect(() => {
    // 这个函数读取公开云灯，入参为空，返回值为空。
    async function loadLanterns() {
      const result = await fetchApprovedLanterns()
      setLanterns(result.data)

      if (result.demoMode) {
        setNotice({ type: 'info', title: '演示模式提示', message: '当前展示演示云灯，配置 Supabase 后会读取真实留言。' })
      }
    }

    void loadLanterns()
  }, [])

  // 这个函数更新表单字段，入参是字段名和值，返回值为空。
  function updateField(field: keyof CloudLanternInput, value: string | boolean) {
    setForm((current) => ({ ...current, [field]: value }))
  }

  // 这个函数处理云灯提交，入参是表单事件，返回值为空。
  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    // 这里先校验留言内容，避免空内容进入审核列表。
    const errors = validateCloudLantern(form)
    if (errors.length > 0) {
      setNotice({ type: 'error', title: '云灯还未点亮', message: errors.join(' ') })
      return
    }

    try {
      setSubmitting(true)
      const result = await submitCloudLantern(form)
      setNotice({
        type: result.ok ? 'success' : 'error',
        title: result.ok ? '云灯已送至山门' : '提交失败',
        message: result.message
      })

      if (result.ok) {
        setForm(initialForm)
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-14 md:px-6">
      <SectionTitle center eyebrow="云灯留言" title="点一盏云灯，照一段归途">
        留下一句祝福、一段心情、一个问候。云灯默认先由执事审核，避免广告和恶意内容扰乱山门。
      </SectionTitle>

      <div className="grid gap-8 lg:grid-cols-[0.85fr_1.15fr]">
        <ScrollPanel>
          {notice ? <StatusNotice type={notice.type} title={notice.title} message={notice.message} /> : null}
          <form className="mt-6 grid gap-5" onSubmit={handleSubmit}>
            <label className="grid gap-2">
              <span className="text-sm font-semibold">署名</span>
              <input
                className="rounded-xl border border-[#6f8f8b]/25 bg-white/80 px-4 py-3 outline-none focus:border-[#6f8f8b]"
                disabled={form.is_anonymous}
                onChange={(event) => updateField('author_name', event.target.value)}
                placeholder="匿名时不用填写"
                value={form.author_name}
              />
            </label>
            <label className="grid gap-2">
              <span className="text-sm font-semibold">心情标签</span>
              <input
                className="rounded-xl border border-[#6f8f8b]/25 bg-white/80 px-4 py-3 outline-none focus:border-[#6f8f8b]"
                onChange={(event) => updateField('mood', event.target.value)}
                placeholder="例如：温暖、清明、安静"
                value={form.mood}
              />
            </label>
            <label className="grid gap-2">
              <span className="text-sm font-semibold">云灯内容 *</span>
              <textarea
                className="min-h-36 rounded-xl border border-[#6f8f8b]/25 bg-white/80 px-4 py-3 leading-7 outline-none focus:border-[#6f8f8b]"
                onChange={(event) => updateField('content', event.target.value)}
                placeholder="写给疲惫的人，也写给此刻的自己。"
                value={form.content}
              />
            </label>
            <label className="flex items-center gap-3 rounded-xl border border-[#c9a45c]/35 bg-white/60 p-4">
              <input
                checked={form.is_anonymous}
                onChange={(event) => updateField('is_anonymous', event.target.checked)}
                type="checkbox"
              />
              <span className="text-sm text-[#526461]">匿名展示为“匿名同门”</span>
            </label>
            <CloudButton disabled={submitting} type="submit">
              {submitting ? '正在点灯...' : '点亮云灯'}
              <Lamp className="h-4 w-4" />
            </CloudButton>
          </form>
        </ScrollPanel>

        <div className="grid gap-4">
          {lanterns.length === 0 ? (
            <EmptyState title="暂无公开云灯" message="待执事审核后，温暖的话会在这里亮起。" />
          ) : (
            lanterns.map((item) => (
              <ScrollPanel key={item.id}>
                <p className="text-sm text-[#9e3d32]">一盏云灯 · {item.mood ?? '温暖'}</p>
                <p className="mt-3 text-lg leading-8">{item.content}</p>
                <p className="mt-4 text-sm text-[#7a6a48]">—— {item.author_name}</p>
              </ScrollPanel>
            ))
          )}
        </div>
      </div>
    </main>
  )
}
