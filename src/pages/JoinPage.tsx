import { ClipboardPenLine, Search, Send, UsersRound } from 'lucide-react'
import { FormEvent, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { CloudButton } from '../components/CloudButton'
import { EmptyState } from '../components/EmptyState'
import { ScrollPanel } from '../components/ScrollPanel'
import { SectionTitle } from '../components/SectionTitle'
import { StatusNotice } from '../components/StatusNotice'
import { applicationStatusLabels, genderOptions, memberRoleOptions } from '../data/siteContent'
import { useAuth } from '../hooks/useAuth'
import { fetchPublicRoster, submitJoinApplication } from '../lib/services'
import type { JoinApplicationInput, MemberGender, RosterEntry, WenyunMemberRole } from '../lib/types'
import { validateJoinApplication } from '../lib/validators'

// 这个常量保存名册登记表单初始值，返回值用于重置表单。
const initialForm: JoinApplicationInput = {
  nickname: '',
  jianghu_name: '',
  real_name: '',
  wechat_id: '',
  age_range: '',
  gender: '男',
  city: '',
  member_role: '烟雨行客',
  public_region: '',
  motto: '',
  public_story: '',
  tags: '',
  bond_status: '',
  companion_expectation: '',
  cover_name: '',
  legacy_contact: '',
  accept_rules: false,
  offline_interest: '',
  remark: ''
}

// 这个函数格式化登记时间，入参是数据库时间字符串，返回值是中文日期。
function formatRosterDate(value: string | null): string {
  if (!value) {
    return '未记录'
  }

  try {
    // 这里把数据库时间转成本地日期，便于手机端和桌面端阅读。
    return new Date(value).toLocaleDateString('zh-CN')
  } catch {
    // 这里兜底处理异常日期，避免页面因为时间格式问题报错。
    return value
  }
}

// 这个函数渲染一段可公开展示的文字，入参是文字，返回值是兜底后的展示文案。
function showText(value: string | null): string {
  return value?.trim() || '未填写'
}

// 这个函数渲染问云名册页，入参为空，返回值是旧名册字段为主的名册展示和登记表单。
export function JoinPage() {
  // 这里读取当前登录资料，名帖登记要求先进入问云小院。
  const { profile, loading: authLoading } = useAuth()
  // 这个状态保存公开名册条目。
  const [roster, setRoster] = useState<RosterEntry[]>([])
  // 这个状态保存表单数据。
  const [form, setForm] = useState<JoinApplicationInput>(initialForm)
  // 这个状态保存前台名册搜索词。
  const [searchTerm, setSearchTerm] = useState('')
  // 这个状态保存前台辈分字筛选。
  const [generationFilter, setGenerationFilter] = useState('')
  // 这个状态保存前台性别筛选。
  const [genderFilter, setGenderFilter] = useState('')
  // 这个状态保存前台身份筛选。
  const [roleFilter, setRoleFilter] = useState('')
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

  // 这个变量保存名册中已有的辈分字，返回值用于筛选下拉框。
  const generationOptions = useMemo(() => {
    return Array.from(new Set(roster.map((item) => item.generation_name).filter(Boolean))).sort()
  }, [roster])

  // 这个变量保存筛选后的名册条目，返回值用于桌面表格和手机卡片展示。
  const filteredRoster = useMemo(() => {
    // 这里先清理搜索词，避免前后空格影响搜索结果。
    const keyword = searchTerm.trim()

    return roster.filter((item) => {
      // 这里支持按道名、江湖名和短编号搜索。
      const serialText = item.roster_serial ? String(item.roster_serial).padStart(3, '0') : ''
      const matchesKeyword =
        !keyword ||
        item.dao_name.includes(keyword) ||
        (item.jianghu_name ?? '').includes(keyword) ||
        item.member_code.includes(keyword) ||
        serialText.includes(keyword)
      // 这里按辈分字筛选。
      const matchesGeneration = !generationFilter || item.generation_name === generationFilter
      // 这里按性别筛选。
      const matchesGender = !genderFilter || item.gender === genderFilter
      // 这里按旧名册江湖身份筛选。
      const matchesRole = !roleFilter || item.member_role === roleFilter

      return matchesKeyword && matchesGeneration && matchesGender && matchesRole
    })
  }, [generationFilter, genderFilter, roleFilter, roster, searchTerm])

  // 这个函数更新文字字段，入参是字段名和值，返回值为空。
  function updateField(field: keyof JoinApplicationInput, value: string | boolean) {
    setForm((current) => ({ ...current, [field]: value }))
  }

  // 这个函数更新性别字段，入参是选中的性别，返回值为空。
  function updateGender(value: MemberGender) {
    setForm((current) => ({ ...current, gender: value }))
  }

  // 这个函数更新身份字段，入参是选中的身份，返回值为空。
  function updateMemberRole(value: WenyunMemberRole) {
    setForm((current) => ({ ...current, member_role: value }))
  }

  // 这个函数处理表单提交，入参是提交事件，返回值为空。
  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    // 这里拦截未登录用户，确保新名帖都能归属到具体账号。
    if (!profile) {
      setNotice({ type: 'error', title: '请先进入问云小院', message: '名册登记需要先登录，登录后再递上名帖。' })
      return
    }

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
        名册以旧系统字段为准，公开展示道名、江湖名、编号、性别、身份、地域、宣言、故事、标签、羁绊状态、同行期待、封面和入册时间。
      </SectionTitle>

      {notice ? <StatusNotice type={notice.type} title={notice.title} message={notice.message} /> : null}

      <section className="mt-8 grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
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
              显示 {filteredRoster.length} / {roster.length} 人
            </span>
          </div>

          <div className="mb-5 grid gap-3 rounded-2xl border border-[#c9a45c]/25 bg-white/60 p-4 lg:grid-cols-[1.2fr_0.7fr_0.7fr_0.8fr]">
            <label className="grid gap-2">
              <span className="text-sm font-semibold">搜索名册</span>
              <span className="relative">
                <Search className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-[#6f8f8b]" />
                <input
                  className="w-full rounded-xl border border-[#6f8f8b]/25 bg-white/85 px-10 py-3 outline-none focus:border-[#6f8f8b]"
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="道名、江湖名或 001"
                  value={searchTerm}
                />
              </span>
            </label>
            <label className="grid gap-2">
              <span className="text-sm font-semibold">辈分字</span>
              <select
                className="rounded-xl border border-[#6f8f8b]/25 bg-white/85 px-4 py-3 outline-none focus:border-[#6f8f8b]"
                onChange={(event) => setGenerationFilter(event.target.value)}
                value={generationFilter}
              >
                <option value="">全部辈分</option>
                {generationOptions.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </label>
            <label className="grid gap-2">
              <span className="text-sm font-semibold">性别</span>
              <select
                className="rounded-xl border border-[#6f8f8b]/25 bg-white/85 px-4 py-3 outline-none focus:border-[#6f8f8b]"
                onChange={(event) => setGenderFilter(event.target.value)}
                value={genderFilter}
              >
                <option value="">全部性别</option>
                {genderOptions.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </label>
            <label className="grid gap-2">
              <span className="text-sm font-semibold">身份</span>
              <select
                className="rounded-xl border border-[#6f8f8b]/25 bg-white/85 px-4 py-3 outline-none focus:border-[#6f8f8b]"
                onChange={(event) => setRoleFilter(event.target.value)}
                value={roleFilter}
              >
                <option value="">全部身份</option>
                {memberRoleOptions.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {roster.length === 0 ? (
            <EmptyState title="名册暂空" message="待执事审核通过后，同门会列入问云名册。" />
          ) : filteredRoster.length === 0 ? (
            <EmptyState title="暂无匹配同门" message="可以换一个道名、江湖名、编号或筛选条件再试。" />
          ) : (
            <div className="grid gap-4">
              {filteredRoster.map((item) => (
                <article className="rounded-3xl border border-[#c9a45c]/25 bg-white/65 p-5 shadow-sm" key={item.id}>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold text-[#9e3d32]">
                        {item.member_code}
                        {item.roster_serial ? ` · 账号 ${String(item.roster_serial).padStart(3, '0')}` : ''}
                      </p>
                      <h3 className="ink-title mt-1 text-3xl font-bold text-[#143044]">{item.dao_name}</h3>
                      <p className="mt-1 text-sm text-[#7a6a48]">江湖名：{showText(item.jianghu_name)}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <span className="rounded-full bg-[#edf3ef] px-3 py-1 text-xs text-[#6f8f8b]">{item.member_role}</span>
                      <span className="rounded-full bg-[#fff1ee] px-3 py-1 text-xs text-[#9e3d32]">{item.gender}</span>
                    </div>
                  </div>

                  <div className="mt-4 grid gap-3 text-sm leading-7 text-[#526461] md:grid-cols-2">
                    <p>地域：{showText(item.public_region)}</p>
                    <p>封面：{showText(item.cover_name)}</p>
                    <p>羁绊：{showText(item.bond_status)}</p>
                    <p>入册：{formatRosterDate(item.joined_at ?? item.created_at)}</p>
                  </div>

                  <div className="mt-4 grid gap-3">
                    <p className="rounded-2xl border border-[#c9a45c]/20 bg-[#fffaf0]/65 p-4 text-sm leading-7 text-[#526461]">
                      <span className="font-semibold text-[#143044]">宣言：</span>
                      {showText(item.motto)}
                    </p>
                    <p className="rounded-2xl border border-[#6f8f8b]/18 bg-[#edf3ef]/55 p-4 text-sm leading-7 text-[#526461]">
                      <span className="font-semibold text-[#143044]">故事：</span>
                      {showText(item.public_story)}
                    </p>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {showText(item.tags)
                      .split(/[、,，]/)
                      .map((tag) => tag.trim())
                      .filter(Boolean)
                      .map((tag) => (
                        <span className="rounded-full border border-[#c9a45c]/30 bg-white/70 px-3 py-1 text-xs text-[#7a6a48]" key={tag}>
                          {tag}
                        </span>
                      ))}
                  </div>

                  <p className="mt-4 text-sm leading-7 text-[#526461]">同行期待：{showText(item.companion_expectation)}</p>
                  <p className="mt-2 text-xs text-[#7a6a48]">状态：{applicationStatusLabels[item.status]}</p>
                </article>
              ))}
            </div>
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
              道名需以“云”字开头，长度 2 到 3 个字。联系方式和真实姓名只供后台核对，不在公开名册展示。
            </p>
          </div>

          {!profile ? (
            <div className="mb-5 rounded-2xl border border-[#c9a45c]/35 bg-[#fffaf0]/80 p-4 text-sm leading-7 text-[#526461]">
              名帖登记需要先进入问云小院，这样执事审核后你能在小院看到状态和提醒。
              <Link className="ml-2 font-semibold text-[#9e3d32]" to="/yard">
                去登录或注册
              </Link>
            </div>
          ) : null}

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

            <div className="grid gap-5 md:grid-cols-2">
              <label className="grid gap-2">
                <span className="text-sm font-semibold">江湖名</span>
                <input
                  className="rounded-xl border border-[#6f8f8b]/25 bg-white/80 px-4 py-3 outline-none focus:border-[#6f8f8b]"
                  onChange={(event) => updateField('jianghu_name', event.target.value)}
                  placeholder="例如：山月客、归舟"
                  value={form.jianghu_name}
                />
              </label>

              <label className="grid gap-2">
                <span className="text-sm font-semibold">真实姓名 *</span>
                <input
                  className="rounded-xl border border-[#6f8f8b]/25 bg-white/80 px-4 py-3 outline-none focus:border-[#6f8f8b]"
                  onChange={(event) => updateField('real_name', event.target.value)}
                  placeholder="仅后台可见"
                  value={form.real_name}
                />
              </label>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <label className="grid gap-2">
                <span className="text-sm font-semibold">联系方式 *</span>
                <input
                  className="rounded-xl border border-[#6f8f8b]/25 bg-white/80 px-4 py-3 outline-none focus:border-[#6f8f8b]"
                  onChange={(event) => {
                    updateField('legacy_contact', event.target.value)
                    updateField('wechat_id', event.target.value)
                  }}
                  placeholder="微信、QQ、手机号等，仅后台可见"
                  value={form.legacy_contact}
                />
              </label>

              <label className="grid gap-2">
                <span className="text-sm font-semibold">公开地域</span>
                <input
                  className="rounded-xl border border-[#6f8f8b]/25 bg-white/80 px-4 py-3 outline-none focus:border-[#6f8f8b]"
                  onChange={(event) => {
                    updateField('public_region', event.target.value)
                    updateField('city', event.target.value)
                  }}
                  placeholder="例如：上海、云深不知处"
                  value={form.public_region}
                />
              </label>
            </div>

            <div className="grid gap-5 md:grid-cols-3">
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
                <span className="text-sm font-semibold">身份 *</span>
                <select
                  className="rounded-xl border border-[#6f8f8b]/25 bg-white/80 px-4 py-3 outline-none focus:border-[#6f8f8b]"
                  onChange={(event) => updateMemberRole(event.target.value as WenyunMemberRole)}
                  value={form.member_role}
                >
                  {memberRoleOptions.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </label>

              <label className="grid gap-2">
                <span className="text-sm font-semibold">封面</span>
                <input
                  className="rounded-xl border border-[#6f8f8b]/25 bg-white/80 px-4 py-3 outline-none focus:border-[#6f8f8b]"
                  onChange={(event) => updateField('cover_name', event.target.value)}
                  placeholder="例如：晨雾云笺"
                  value={form.cover_name}
                />
              </label>
            </div>

            <label className="grid gap-2">
              <span className="text-sm font-semibold">宣言 *</span>
              <textarea
                className="min-h-24 rounded-xl border border-[#6f8f8b]/25 bg-white/80 px-4 py-3 leading-7 outline-none focus:border-[#6f8f8b]"
                onChange={(event) => updateField('motto', event.target.value)}
                placeholder="写一句你想留在名册上的话。"
                value={form.motto}
              />
            </label>

            <label className="grid gap-2">
              <span className="text-sm font-semibold">公开故事</span>
              <textarea
                className="min-h-24 rounded-xl border border-[#6f8f8b]/25 bg-white/80 px-4 py-3 leading-7 outline-none focus:border-[#6f8f8b]"
                onChange={(event) => updateField('public_story', event.target.value)}
                placeholder="说说你的兴趣、来处或想给同门看的故事。"
                value={form.public_story}
              />
            </label>

            <div className="grid gap-5 md:grid-cols-3">
              <label className="grid gap-2">
                <span className="text-sm font-semibold">标签</span>
                <input
                  className="rounded-xl border border-[#6f8f8b]/25 bg-white/80 px-4 py-3 outline-none focus:border-[#6f8f8b]"
                  onChange={(event) => updateField('tags', event.target.value)}
                  placeholder="例如：写文、摄影"
                  value={form.tags}
                />
              </label>

              <label className="grid gap-2">
                <span className="text-sm font-semibold">羁绊状态</span>
                <input
                  className="rounded-xl border border-[#6f8f8b]/25 bg-white/80 px-4 py-3 outline-none focus:border-[#6f8f8b]"
                  onChange={(event) => updateField('bond_status', event.target.value)}
                  placeholder="例如：静修旁观"
                  value={form.bond_status}
                />
              </label>

              <label className="grid gap-2">
                <span className="text-sm font-semibold">同行期待</span>
                <input
                  className="rounded-xl border border-[#6f8f8b]/25 bg-white/80 px-4 py-3 outline-none focus:border-[#6f8f8b]"
                  onChange={(event) => updateField('companion_expectation', event.target.value)}
                  placeholder="想遇见怎样的同门"
                  value={form.companion_expectation}
                />
              </label>
            </div>

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

            <CloudButton disabled={submitting || authLoading || !profile} type="submit" variant="seal">
              {submitting ? '正在送帖...' : '提交名册登记'}
              <Send className="h-4 w-4" />
            </CloudButton>
          </form>
        </ScrollPanel>
      </section>
    </main>
  )
}
