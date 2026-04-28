import { Send } from 'lucide-react'
import { FormEvent, useState } from 'react'
import { CloudButton } from '../components/CloudButton'
import { ScrollPanel } from '../components/ScrollPanel'
import { SectionTitle } from '../components/SectionTitle'
import { StatusNotice } from '../components/StatusNotice'
import { submitJoinApplication } from '../lib/services'
import type { JoinApplicationInput } from '../lib/types'
import { validateJoinApplication } from '../lib/validators'

// 这个常量保存入派申请表单初始值，返回值用于重置表单。
const initialForm: JoinApplicationInput = {
  nickname: '',
  wechat_id: '',
  age_range: '',
  city: '',
  reason: '',
  accept_rules: false,
  offline_interest: '',
  remark: ''
}

// 这个函数渲染入派申请页，入参为空，返回值是可提交的申请表单。
export function JoinPage() {
  // 这个状态保存表单数据。
  const [form, setForm] = useState<JoinApplicationInput>(initialForm)
  // 这个状态表示表单是否正在提交。
  const [submitting, setSubmitting] = useState(false)
  // 这个状态保存提交结果提示。
  const [notice, setNotice] = useState<{ type: 'success' | 'error' | 'info'; title: string; message: string } | null>(null)

  // 这个函数更新文字字段，入参是字段名和值，返回值为空。
  function updateField(field: keyof JoinApplicationInput, value: string | boolean) {
    setForm((current) => ({ ...current, [field]: value }))
  }

  // 这个函数处理表单提交，入参是提交事件，返回值为空。
  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    // 这里先做前端校验，让用户不用等数据库返回才知道问题。
    const errors = validateJoinApplication(form)
    if (errors.length > 0) {
      setNotice({ type: 'error', title: '入派帖还差一点', message: errors.join(' ') })
      return
    }

    try {
      setSubmitting(true)
      // 这里提交到服务层，服务层会自动判断真实数据库或演示模式。
      const result = await submitJoinApplication(form)
      setNotice({
        type: result.ok ? 'success' : 'error',
        title: result.ok ? '入派帖已送至山门' : '提交失败',
        message: result.message
      })

      // 这里成功后重置表单，让用户知道内容已经送出。
      if (result.ok) {
        setForm(initialForm)
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-14 md:px-6">
      <SectionTitle center eyebrow="入派问路" title="递上入派帖，叩问山门">
        问云派不求人数众多，只求同道真诚。若你认同清明、温暖、平等、自由与分寸，可在此递上入派帖。
      </SectionTitle>

      <ScrollPanel>
        {notice ? <StatusNotice type={notice.type} title={notice.title} message={notice.message} /> : null}

        <form className="mt-6 grid gap-5" onSubmit={handleSubmit}>
          <div className="grid gap-5 md:grid-cols-2">
            <label className="grid gap-2">
              <span className="text-sm font-semibold">昵称 *</span>
              <input
                className="rounded-xl border border-[#6f8f8b]/25 bg-white/80 px-4 py-3 outline-none focus:border-[#6f8f8b]"
                onChange={(event) => updateField('nickname', event.target.value)}
                placeholder="例如：云边来客"
                value={form.nickname}
              />
            </label>
            <label className="grid gap-2">
              <span className="text-sm font-semibold">微信号 *</span>
              <input
                className="rounded-xl border border-[#6f8f8b]/25 bg-white/80 px-4 py-3 outline-none focus:border-[#6f8f8b]"
                onChange={(event) => updateField('wechat_id', event.target.value)}
                placeholder="仅供执事联系，不会公开"
                value={form.wechat_id}
              />
            </label>
          </div>

          <div className="grid gap-5 md:grid-cols-3">
            <label className="grid gap-2">
              <span className="text-sm font-semibold">年龄段</span>
              <select
                className="rounded-xl border border-[#6f8f8b]/25 bg-white/80 px-4 py-3 outline-none focus:border-[#6f8f8b]"
                onChange={(event) => updateField('age_range', event.target.value)}
                value={form.age_range}
              >
                <option value="">暂不填写</option>
                <option value="18-24">18-24</option>
                <option value="25-30">25-30</option>
                <option value="31-40">31-40</option>
                <option value="40以上">40以上</option>
              </select>
            </label>
            <label className="grid gap-2">
              <span className="text-sm font-semibold">所在城市</span>
              <input
                className="rounded-xl border border-[#6f8f8b]/25 bg-white/80 px-4 py-3 outline-none focus:border-[#6f8f8b]"
                onChange={(event) => updateField('city', event.target.value)}
                placeholder="例如：上海"
                value={form.city}
              />
            </label>
            <label className="grid gap-2">
              <span className="text-sm font-semibold">线下雅集意愿</span>
              <select
                className="rounded-xl border border-[#6f8f8b]/25 bg-white/80 px-4 py-3 outline-none focus:border-[#6f8f8b]"
                onChange={(event) => updateField('offline_interest', event.target.value)}
                value={form.offline_interest}
              >
                <option value="">暂不填写</option>
                <option value="愿意参加">愿意参加</option>
                <option value="先线上交流">先线上交流</option>
                <option value="暂不考虑">暂不考虑</option>
              </select>
            </label>
          </div>

          <label className="grid gap-2">
            <span className="text-sm font-semibold">为什么想加入问云派？ *</span>
            <textarea
              className="min-h-36 rounded-xl border border-[#6f8f8b]/25 bg-white/80 px-4 py-3 leading-7 outline-none focus:border-[#6f8f8b]"
              onChange={(event) => updateField('reason', event.target.value)}
              placeholder="说说你为什么想来此处，也说说你愿意如何守护这份清净。"
              value={form.reason}
            />
          </label>

          <label className="grid gap-2">
            <span className="text-sm font-semibold">备注</span>
            <textarea
              className="min-h-24 rounded-xl border border-[#6f8f8b]/25 bg-white/80 px-4 py-3 leading-7 outline-none focus:border-[#6f8f8b]"
              onChange={(event) => updateField('remark', event.target.value)}
              placeholder="还有什么想补充的，可以写在这里。"
              value={form.remark}
            />
          </label>

          <label className="flex items-start gap-3 rounded-xl border border-[#c9a45c]/35 bg-white/60 p-4">
            <input
              checked={form.accept_rules}
              className="mt-1 h-4 w-4"
              onChange={(event) => updateField('accept_rules', event.target.checked)}
              type="checkbox"
            />
            <span className="text-sm leading-7 text-[#526461]">
              我认可问云派门规：不恶语伤人，不借信任谋私利，不泄露同门隐私，不把山门变成广告与争斗之地。
            </span>
          </label>

          <CloudButton disabled={submitting} type="submit" variant="seal">
            {submitting ? '正在送帖...' : '送出入派帖'}
            <Send className="h-4 w-4" />
          </CloudButton>
        </form>
      </ScrollPanel>
    </main>
  )
}
