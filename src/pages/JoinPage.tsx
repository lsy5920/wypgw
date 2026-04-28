import { ClipboardPenLine, Send, UsersRound } from 'lucide-react'
import { FormEvent, useEffect, useState } from 'react'
import { CloudButton } from '../components/CloudButton'
import { EmptyState } from '../components/EmptyState'
import { ScrollPanel } from '../components/ScrollPanel'
import { SectionTitle } from '../components/SectionTitle'
import { StatusNotice } from '../components/StatusNotice'
import { applicationStatusLabels, genderOptions } from '../data/siteContent'
import { fetchPublicRoster, submitJoinApplication } from '../lib/services'
import type { JoinApplicationInput, MemberGender, RosterEntry } from '../lib/types'
import { validateJoinApplication } from '../lib/validators'

// 这个常量保存名册登记表单初始值，返回值用于重置表单。
const initialForm: JoinApplicationInput = {
  nickname: '',
  wechat_id: '',
  age_range: '',
  gender: '不公开',
  city: '',
  reason: '',
  accept_rules: false,
  offline_interest: '',
  remark: ''
}

// 这个函数格式化出生月份，入参是数据库保存的月份字符串，返回值是适合展示的中文月份。
function formatBirthMonth(value: string | null): string {
  // 这里处理未填写的情况，避免页面出现空白。
  if (!value) {
    return '未填写'
  }

  // 这里把 YYYY-MM 转成中文展示，读起来更像名册。
  const [year, month] = value.split('-')

  return year && month ? `${year}年${month}月` : value
}

// 这个函数格式化登记时间，入参是数据库时间字符串，返回值是中文日期。
function formatRosterDate(value: string): string {
  try {
    // 这里把数据库时间转成本地日期，便于手机端和桌面端阅读。
    return new Date(value).toLocaleDateString('zh-CN')
  } catch {
    // 这里兜底处理异常日期，避免页面因为时间格式问题报错。
    return value
  }
}

// 这个函数渲染问云名册页，入参为空，返回值是名册展示和登记表单。
export function JoinPage() {
  // 这个状态保存公开名册条目。
  const [roster, setRoster] = useState<RosterEntry[]>([])
  // 这个状态保存表单数据。
  const [form, setForm] = useState<JoinApplicationInput>(initialForm)
  // 这个状态表示表单是否正在提交。
  const [submitting, setSubmitting] = useState(false)
  // 这个状态保存页面提示。
  const [notice, setNotice] = useState<{ type: 'success' | 'error' | 'info'; title: string; message: string } | null>(null)

  // 这个函数读取公开名册，入参为空，返回值为空。
  async function loadRoster() {
    const result = await fetchPublicRoster()

    setRoster(result.data)

    // 这里展示演示模式或读取失败提示，让用户知道数据来源。
    if (!result.ok) {
      setNotice({ type: 'error', title: '名册读取失败', message: result.message })
    } else if (result.demoMode) {
      setNotice({ type: 'info', title: '演示模式提示', message: result.message })
    }
  }

  useEffect(() => {
    void loadRoster()
  }, [])

  // 这个函数更新文字字段，入参是字段名和值，返回值为空。
  function updateField(field: keyof JoinApplicationInput, value: string | boolean) {
    setForm((current) => ({ ...current, [field]: value }))
  }

  // 这个函数更新性别字段，入参是选中的性别，返回值为空。
  function updateGender(value: MemberGender) {
    setForm((current) => ({ ...current, gender: value }))
  }

  // 这个函数处理表单提交，入参是提交事件，返回值为空。
  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    // 这里先做前端校验，让用户不用等数据库返回才知道问题。
    const errors = validateJoinApplication(form)
    if (errors.length > 0) {
      setNotice({ type: 'error', title: '登记帖还差一点', message: errors.join(' ') })
      return
    }

    try {
      setSubmitting(true)
      // 这里提交到服务层，服务层会自动判断真实数据库或演示模式。
      const result = await submitJoinApplication(form)
      setNotice({
        type: result.ok ? 'success' : 'error',
        title: result.ok ? '登记帖已送至山门' : '提交失败',
        message: result.message
      })

      // 这里成功后重置表单，并刷新名册演示数据。
      if (result.ok) {
        setForm(initialForm)
        await loadRoster()
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-14 md:px-6">
      <SectionTitle center eyebrow="问云名册" title="列名于册，问云为号">
        名册展示已入册同门的道名、编号、性别、出生月份、所在城市与身份。微信号和申请理由只在后台供掌门、执事查看。
      </SectionTitle>

      {notice ? <StatusNotice type={notice.type} title={notice.title} message={notice.message} /> : null}

      <section className="mt-8 grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
        <ScrollPanel className="overflow-hidden">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="flex items-center gap-2 text-sm font-semibold text-[#9e3d32]">
                <UsersRound className="h-4 w-4" />
                名册展示
              </p>
              <h2 className="ink-title mt-2 text-3xl font-bold text-[#143044]">问云同门</h2>
            </div>
            <span className="rounded-full border border-[#c9a45c]/40 bg-white/70 px-4 py-2 text-sm text-[#7a6a48]">
              共 {roster.length} 人
            </span>
          </div>

          {roster.length === 0 ? (
            <EmptyState title="名册暂空" message="待执事审核通过后，同门会列入问云名册。" />
          ) : (
            <>
              <div className="hidden overflow-x-auto rounded-2xl border border-[#c9a45c]/25 bg-white/60 md:block">
                <table className="w-full min-w-[980px] text-left text-sm">
                  <thead className="bg-[#edf3ef] text-[#263238]">
                    <tr>
                      <th className="px-4 py-3">编号</th>
                      <th className="px-4 py-3">道名</th>
                      <th className="px-4 py-3">性别</th>
                      <th className="px-4 py-3">出生月份</th>
                      <th className="px-4 py-3">城市</th>
                      <th className="px-4 py-3">身份</th>
                      <th className="px-4 py-3">辈分字</th>
                      <th className="px-4 py-3">线下意愿</th>
                      <th className="px-4 py-3">状态</th>
                      <th className="px-4 py-3">登记时间</th>
                    </tr>
                  </thead>
                  <tbody>
                    {roster.map((item) => (
                      <tr className="border-t border-[#c9a45c]/15" key={item.id}>
                        <td className="px-4 py-3 font-semibold text-[#9e3d32]">{item.member_code}</td>
                        <td className="px-4 py-3 font-semibold">{item.dao_name}</td>
                        <td className="px-4 py-3">{item.gender}</td>
                        <td className="px-4 py-3">{formatBirthMonth(item.birth_month)}</td>
                        <td className="px-4 py-3">{item.city ?? '未填写'}</td>
                        <td className="px-4 py-3">{item.member_role}</td>
                        <td className="px-4 py-3">{item.generation_name}</td>
                        <td className="px-4 py-3">{item.offline_interest ?? '未填写'}</td>
                        <td className="px-4 py-3">{applicationStatusLabels[item.status]}</td>
                        <td className="px-4 py-3">{formatRosterDate(item.created_at)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="grid gap-3 md:hidden">
                {roster.map((item) => (
                  <div className="rounded-2xl border border-[#c9a45c]/25 bg-white/65 p-4" key={item.id}>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs text-[#9e3d32]">{item.member_code}</p>
                        <h3 className="ink-title mt-1 text-2xl font-bold">{item.dao_name}</h3>
                      </div>
                      <span className="rounded-full bg-[#edf3ef] px-3 py-1 text-xs text-[#6f8f8b]">{item.member_role}</span>
                    </div>
                    <div className="mt-4 grid grid-cols-2 gap-2 text-sm text-[#526461]">
                      <p>性别：{item.gender}</p>
                      <p>辈分：{item.generation_name}</p>
                      <p>出生：{formatBirthMonth(item.birth_month)}</p>
                      <p>城市：{item.city ?? '未填写'}</p>
                      <p>状态：{applicationStatusLabels[item.status]}</p>
                      <p>登记：{formatRosterDate(item.created_at)}</p>
                    </div>
                    <p className="mt-3 text-sm text-[#526461]">线下意愿：{item.offline_interest ?? '未填写'}</p>
                  </div>
                ))}
              </div>
            </>
          )}
        </ScrollPanel>

        <ScrollPanel>
          <div className="mb-6">
            <p className="flex items-center gap-2 text-sm font-semibold text-[#9e3d32]">
              <ClipboardPenLine className="h-4 w-4" />
              登记入口
            </p>
            <h2 className="ink-title mt-2 text-3xl font-bold text-[#143044]">递上问云名帖</h2>
            <p className="mt-3 text-sm leading-7 text-[#526461]">
              道名需以“云”字开头，长度 2 到 3 个字。编号默认按“问云-辈分字-001”顺延生成。
            </p>
          </div>

          <form className="grid gap-5" onSubmit={handleSubmit}>
            <label className="grid gap-2">
              <span className="text-sm font-semibold">道名 *</span>
              <input
                className="rounded-xl border border-[#6f8f8b]/25 bg-white/80 px-4 py-3 outline-none focus:border-[#6f8f8b]"
                onChange={(event) => updateField('nickname', event.target.value)}
                placeholder="例如：云山、云灯、云初"
                value={form.nickname}
              />
            </label>

            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
              <label className="grid gap-2">
                <span className="text-sm font-semibold">微信号 *</span>
                <input
                  className="rounded-xl border border-[#6f8f8b]/25 bg-white/80 px-4 py-3 outline-none focus:border-[#6f8f8b]"
                  onChange={(event) => updateField('wechat_id', event.target.value)}
                  placeholder="仅后台可见"
                  value={form.wechat_id}
                />
              </label>

              <label className="grid gap-2">
                <span className="text-sm font-semibold">出生月份</span>
                <input
                  className="rounded-xl border border-[#6f8f8b]/25 bg-white/80 px-4 py-3 outline-none focus:border-[#6f8f8b]"
                  onChange={(event) => updateField('age_range', event.target.value)}
                  type="month"
                  value={form.age_range}
                />
              </label>
            </div>

            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
              <label className="grid gap-2">
                <span className="text-sm font-semibold">性别 *</span>
                <select
                  className="rounded-xl border border-[#6f8f8b]/25 bg-white/80 px-4 py-3 outline-none focus:border-[#6f8f8b]"
                  onChange={(event) => updateGender(event.target.value as MemberGender)}
                  value={form.gender}
                >
                  {genderOptions.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
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
            </div>

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

            <label className="grid gap-2">
              <span className="text-sm font-semibold">为什么想加入问云派？ *</span>
              <textarea
                className="min-h-32 rounded-xl border border-[#6f8f8b]/25 bg-white/80 px-4 py-3 leading-7 outline-none focus:border-[#6f8f8b]"
                onChange={(event) => updateField('reason', event.target.value)}
                placeholder="说说你为什么想来此处，也说说你愿意如何守护这份清净。"
                value={form.reason}
              />
            </label>

            <label className="grid gap-2">
              <span className="text-sm font-semibold">备注</span>
              <textarea
                className="min-h-20 rounded-xl border border-[#6f8f8b]/25 bg-white/80 px-4 py-3 leading-7 outline-none focus:border-[#6f8f8b]"
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
              {submitting ? '正在送帖...' : '提交名册登记'}
              <Send className="h-4 w-4" />
            </CloudButton>
          </form>
        </ScrollPanel>
      </section>
    </main>
  )
}
