import { ChevronDown, ChevronUp, ClipboardPenLine, Search, Send, Shuffle, SlidersHorizontal, UsersRound } from 'lucide-react'
import { FormEvent, useEffect, useMemo, useState } from 'react'
import { CloudButton } from '../components/CloudButton'
import { EmptyState } from '../components/EmptyState'
import { LoginRequiredNotice } from '../components/LoginRequiredNotice'
import { ScrollPanel } from '../components/ScrollPanel'
import { SectionTitle } from '../components/SectionTitle'
import { StatusNotice } from '../components/StatusNotice'
import { applicationStatusLabels, genderOptions, memberRoleOptions } from '../data/siteContent'
import { useAuth } from '../hooks/useAuth'
import { fetchMyApplications, fetchMyLatestWenxinQuizResult, fetchPublicRoster, submitJoinApplication } from '../lib/services'
import type { JoinApplication, JoinApplicationInput, MemberGender, RosterEntry, WenxinQuizResult } from '../lib/types'
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
  member_role: '同门',
  public_region: '',
  motto: '',
  public_story: '',
  tags: '',
  companion_expectation: '',
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

// 这个函数把旧故事和标签合并成兴趣爱好，入参是旧字段，返回值是统一展示文字。
function formatHobbies(publicStory: string | null, tags: string | null): string {
  // 这里过滤空值，避免页面显示多余标点。
  const parts = [publicStory, tags].map((item) => item?.trim()).filter(Boolean)

  return parts.length > 0 ? parts.join('、') : '未填写'
}

// 这个函数生成稳定的随机排序权重，入参是名册条目和种子，返回值用于横向卡片随机展示。
function createRosterWeight(item: RosterEntry, seed: number): number {
  // 这里把编号和种子拼在一起，保证点击“换一组”时顺序会变。
  const source = `${item.id}-${item.member_code}-${seed}`
  let hash = 0

  // 这里用简单哈希生成排序值，避免每次渲染都重新乱跳。
  for (let index = 0; index < source.length; index += 1) {
    hash = Math.imul(31, hash) + source.charCodeAt(index)
  }

  return Math.abs(hash)
}

// 这个函数渲染问云名册页，入参为空，返回值是折叠登记入口、折叠筛选和横向滑动资料卡片。
export function JoinPage() {
  // 这里读取当前登录资料，名帖登记要求先进入问云小院。
  const { profile, loading: authLoading } = useAuth()
  // 这个状态保存公开名册条目。
  const [roster, setRoster] = useState<RosterEntry[]>([])
  // 这个状态保存表单数据。
  const [form, setForm] = useState<JoinApplicationInput>(initialForm)
  // 这个状态控制登记入口是否展开。
  const [formOpen, setFormOpen] = useState(false)
  // 这个状态控制筛选条件是否展开。
  const [filtersOpen, setFiltersOpen] = useState(false)
  // 这个状态保存前台名册搜索词。
  const [searchTerm, setSearchTerm] = useState('')
  // 这个状态保存前台辈分字筛选。
  const [generationFilter, setGenerationFilter] = useState('')
  // 这个状态保存前台性别筛选。
  const [genderFilter, setGenderFilter] = useState('')
  // 这个状态保存前台身份筛选。
  const [roleFilter, setRoleFilter] = useState('')
  // 这个状态保存随机展示种子。
  const [rosterSeed, setRosterSeed] = useState(() => Date.now())
  // 这个状态保存当前用户最新一次问心考核结果。
  const [quizResult, setQuizResult] = useState<WenxinQuizResult | null>(null)
  // 这个状态保存当前账号已经递交过的名帖，防止重复提交。
  const [existingApplication, setExistingApplication] = useState<JoinApplication | null>(null)
  // 这个状态表示表单是否正在提交。
  const [submitting, setSubmitting] = useState(false)
  // 这个状态保存页面提示。
  const [notice, setNotice] = useState<{ type: 'success' | 'error' | 'info'; title: string; message: string } | null>(null)

  // 这个函数读取公开名册，入参为空，返回值为空。
  async function loadRoster() {
    const result = await fetchPublicRoster()

    setRoster(result.data)
    setRosterSeed(Date.now())

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

  useEffect(() => {
    // 这个函数读取最新问心考核，入参为空，返回值为空。
    async function loadUserGateInfo() {
      if (!profile) {
        setQuizResult(null)
        setExistingApplication(null)
        return
      }

      const [quizResultData, applicationResult] = await Promise.all([fetchMyLatestWenxinQuizResult(), fetchMyApplications()])
      setQuizResult(quizResultData.data)
      setExistingApplication(applicationResult.data[0] ?? null)

      if (!quizResultData.ok) {
        setNotice({ type: 'error', title: '考核结果读取失败', message: quizResultData.message })
      } else if (!applicationResult.ok) {
        setNotice({ type: 'error', title: '名帖状态读取失败', message: applicationResult.message })
      }
    }

    void loadUserGateInfo()
  }, [profile])

  // 这个变量保存名册中已有的辈分字，返回值用于筛选下拉框。
  const generationOptions = useMemo(() => {
    return Array.from(new Set(roster.map((item) => item.generation_name).filter(Boolean))).sort()
  }, [roster])

  // 这个变量保存筛选后的名册条目，返回值用于资料卡片展示。
  const filteredRoster = useMemo(() => {
    // 这里先清理搜索词，避免前后空格影响搜索结果。
    const keyword = searchTerm.trim()

    return roster.filter((item) => {
      // 这里支持按道名、江湖名和公开编号搜索，不展示也不搜索登录短号。
      const matchesKeyword =
        !keyword ||
        item.dao_name.includes(keyword) ||
        (item.jianghu_name ?? '').includes(keyword) ||
        item.member_code.includes(keyword)
      // 这里按辈分字筛选。
      const matchesGeneration = !generationFilter || item.generation_name === generationFilter
      // 这里按性别筛选。
      const matchesGender = !genderFilter || item.gender === genderFilter
      // 这里按公开身份筛选。
      const matchesRole = !roleFilter || item.member_role === roleFilter

      return matchesKeyword && matchesGeneration && matchesGender && matchesRole
    })
  }, [generationFilter, genderFilter, roleFilter, roster, searchTerm])

  // 这个变量保存随机排序后的名册条目，返回值用于横向滑动展示。
  const randomizedRoster = useMemo(() => {
    return [...filteredRoster].sort((left, right) => createRosterWeight(left, rosterSeed) - createRosterWeight(right, rosterSeed))
  }, [filteredRoster, rosterSeed])

  // 这个函数更新文字字段，入参是字段名和值，返回值为空。
  function updateField(field: keyof JoinApplicationInput, value: string | boolean) {
    setForm((current) => ({ ...current, [field]: value }))
  }

  // 这个函数更新性别字段，入参是选中的性别，返回值为空。
  function updateGender(value: MemberGender) {
    setForm((current) => ({ ...current, gender: value }))
  }

  // 这个函数清空筛选条件，入参为空，返回值为空。
  function resetFilters() {
    setSearchTerm('')
    setGenerationFilter('')
    setGenderFilter('')
    setRoleFilter('')
  }

  // 这个函数处理表单提交，入参是提交事件，返回值为空。
  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    // 这里拦截未登录用户，确保新名帖都能归属到具体登录用户。
    if (!profile) {
      setNotice({ type: 'error', title: '请先进入问云小院', message: '名册登记需要先登录，登录后再递上名帖。' })
      return
    }

    // 这里拦截重复提交，引导用户回到问云小院维护已有资料。
    if (existingApplication) {
      setNotice({ type: 'error', title: '你已经递交过名帖', message: '每个账号只能提交一份名帖。请到问云小院的“我的资料”修改资料，或到“我的名帖”查看审核状态。' })
      return
    }

    // 这里要求最新一次问心考核合格后才能提交名帖。
    if (!quizResult?.passed) {
      setNotice({ type: 'error', title: '请先完成问心考核', message: '登记入册前需要先完成问心考核，并且最新成绩达到 80 分以上。' })
      return
    }

    // 这里先做前端校验，让用户不用等数据库返回才知道问题。
    const errors = validateJoinApplication({ ...form, member_role: '同门' })
    if (errors.length > 0) {
      setNotice({ type: 'error', title: '登记帖还差一点', message: errors.join(' ') })
      return
    }

    try {
      setSubmitting(true)
      // 这里提交到服务层，服务层会自动判断真实数据库或演示模式。
      const result = await submitJoinApplication({ ...form, member_role: '同门' })
      setNotice({
        type: result.ok ? 'success' : 'error',
        title: result.ok ? '登记帖已送至山门' : '提交失败',
        message: result.message
      })

      // 这里成功后重置表单，并刷新名册演示数据。
      if (result.ok) {
        setForm(initialForm)
        setFormOpen(false)
        await loadRoster()
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-14 md:px-6">
      <SectionTitle center eyebrow="问云名册" title="列名于册，问云为号">
        先过问心考核，再递问云名帖。名册公开展示道名、江湖名、编号、性别、身份、所在城市、宣言、兴趣爱好、同行期待和入册时间。
      </SectionTitle>

      {notice ? <StatusNotice type={notice.type} title={notice.title} message={notice.message} /> : null}

      <ScrollPanel className="mt-8 overflow-hidden">
        <button
          className="flex w-full flex-col gap-5 text-left md:flex-row md:items-center md:justify-between"
          onClick={() => setFormOpen((current) => !current)}
          type="button"
        >
          <span className="flex items-start gap-4">
            <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#9e3d32]/10 text-[#9e3d32]">
              <ClipboardPenLine className="h-6 w-6" />
            </span>
            <span>
              <span className="text-sm font-semibold text-[#9e3d32]">登记入口</span>
              <span className="ink-title mt-2 block text-3xl font-bold text-[#143044]">递上问云名帖</span>
              <span className="mt-2 block text-sm leading-7 text-[#526461]">
                登记前需先完成问心考核，最新成绩达到 80 分以上后方可递帖；道名需以“云”字开头，身份默认同门。
              </span>
              <span className="mt-3 inline-flex rounded-full bg-[#edf3ef] px-3 py-1 text-xs font-semibold text-[#6f8f8b]">
                {!profile
                  ? '请先登录问云小院'
                  : existingApplication
                    ? `已递交名帖：${applicationStatusLabels[existingApplication.status]}`
                    : quizResult?.passed
                      ? `问心已合格：${quizResult.score} 分`
                      : '待完成问心考核'}
              </span>
            </span>
          </span>
          <span className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full border border-[#c9a45c]/45 bg-white/75 px-5 py-3 text-sm font-semibold text-[#7a6a48]">
            {formOpen ? '收起名帖' : '展开填写'}
            {formOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </span>
        </button>

        {!formOpen ? (
          <div className="mt-6 grid gap-4 md:grid-cols-4">
            {['登录小院', '问心合格', '递交名帖', '执事审核'].map((item, index) => (
              <div className="rounded-2xl border border-[#c9a45c]/25 bg-white/55 p-4" key={item}>
                <p className="text-xs font-semibold text-[#9e3d32]">第 {index + 1} 步</p>
                <p className="ink-title mt-2 text-2xl font-bold text-[#143044]">{item}</p>
                <p className="mt-2 text-xs leading-6 text-[#526461]">
                  {index === 0
                    ? '绑定自己的问云小院账号'
                    : index === 1
                      ? '最新成绩达到 80 分'
                      : index === 2
                        ? '填写道名与公开资料'
                        : '通过后列入公开名册'}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-6 border-t border-[#c9a45c]/20 pt-6">
            {!profile ? (
              <LoginRequiredNotice
                title="递交名帖前请先登录"
                message="名帖登记需要绑定到你的问云小院，执事审核后你才能看到状态和提醒。"
              />
            ) : existingApplication ? (
              <div className="mb-5 rounded-2xl border border-[#c9a45c]/35 bg-[#fffaf0]/85 p-4 text-sm leading-7 text-[#526461]">
                <p className="font-semibold text-[#9e3d32]">你已经递交过名帖</p>
                <p className="mt-1">
                  每个账号只能提交一份名帖。当前状态为“{applicationStatusLabels[existingApplication.status]}”。
                  如需修改资料，请到问云小院处理；道名和联系方式会进入管理员审核，其余可直接保存。
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <CloudButton to="/yard/profile" variant="seal">
                    去小院修改资料
                  </CloudButton>
                  <CloudButton to="/yard/applications" variant="ghost">
                    查看我的名帖
                  </CloudButton>
                </div>
              </div>
            ) : !quizResult?.passed ? (
              <div className="mb-5 rounded-2xl border border-[#c9a45c]/35 bg-[#fffaf0]/85 p-4 text-sm leading-7 text-[#526461]">
                <p className="font-semibold text-[#9e3d32]">请先完成问心考核</p>
                <p className="mt-1">
                  登记入册需要最新问心考核达到 80 分以上。当前结果：
                  {quizResult ? `${quizResult.score} 分，尚未达到登记门槛。` : '尚未参加考核。'}
                </p>
                <CloudButton className="mt-4 w-full sm:w-auto" to="/wenxin-quiz" variant="seal">
                  前往问心考核
                </CloudButton>
              </div>
            ) : null}

            {profile && quizResult?.passed && !existingApplication ? (
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
                  <span className="text-sm font-semibold">所在城市</span>
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
                  <span className="text-sm font-semibold">出生年份</span>
                  <input
                    className="rounded-xl border border-[#6f8f8b]/25 bg-white/80 px-4 py-3 outline-none focus:border-[#6f8f8b]"
                    inputMode="numeric"
                    maxLength={4}
                    onChange={(event) => updateField('age_range', event.target.value.replace(/\D/g, '').slice(0, 4))}
                    placeholder="例如：2003，仅后台可见"
                    value={form.age_range}
                  />
                </label>

                <label className="grid gap-2">
                  <span className="text-sm font-semibold">身份</span>
                  <input
                    className="rounded-xl border border-[#6f8f8b]/20 bg-[#edf3ef]/75 px-4 py-3 text-[#7a6a48] outline-none"
                    disabled
                    value="同门"
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

              <div className="grid gap-5 md:grid-cols-2">
                <label className="grid gap-2">
                  <span className="text-sm font-semibold">兴趣爱好</span>
                  <input
                    className="rounded-xl border border-[#6f8f8b]/25 bg-white/80 px-4 py-3 outline-none focus:border-[#6f8f8b]"
                    onChange={(event) => updateField('tags', event.target.value)}
                    placeholder="例如：写文、摄影、饮茶"
                    value={form.tags}
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

              <CloudButton disabled={submitting || authLoading || !profile || !quizResult?.passed} type="submit" variant="seal">
                {submitting ? '正在送帖...' : '提交名册登记'}
                <Send className="h-4 w-4" />
              </CloudButton>
            </form>
            ) : null}
          </div>
        )}
      </ScrollPanel>

      <ScrollPanel className="mt-8 overflow-hidden">
        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="flex items-center gap-2 text-sm font-semibold text-[#9e3d32]">
              <UsersRound className="h-4 w-4" />
              名册展示
            </p>
            <h2 className="ink-title mt-2 text-3xl font-bold text-[#143044]">问云同门</h2>
            <p className="mt-2 text-sm leading-7 text-[#526461]">资料卡片会随机排序，可在手机上左右滑动查看。</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              className="inline-flex min-h-11 items-center gap-2 rounded-full border border-[#6f8f8b]/25 bg-white/75 px-4 text-sm font-semibold text-[#526461]"
              onClick={() => setFiltersOpen((current) => !current)}
              type="button"
            >
              <SlidersHorizontal className="h-4 w-4" />
              筛选
              {filtersOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>
            <button
              className="inline-flex min-h-11 items-center gap-2 rounded-full border border-[#c9a45c]/35 bg-white/75 px-4 text-sm font-semibold text-[#7a6a48]"
              onClick={() => setRosterSeed(Date.now())}
              type="button"
            >
              <Shuffle className="h-4 w-4" />
              换一组
            </button>
            <span className="inline-flex min-h-11 items-center rounded-full bg-[#edf3ef] px-4 text-sm text-[#6f8f8b]">
              {filteredRoster.length} / {roster.length} 人
            </span>
          </div>
        </div>

        {filtersOpen ? (
          <div className="mb-5 grid gap-3 rounded-2xl border border-[#c9a45c]/25 bg-white/60 p-4 lg:grid-cols-[1.2fr_0.7fr_0.7fr_0.8fr_auto]">
            <label className="grid gap-2">
              <span className="text-sm font-semibold">搜索名册</span>
              <span className="relative">
                <Search className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-[#6f8f8b]" />
                <input
                  className="w-full rounded-xl border border-[#6f8f8b]/25 bg-white/85 px-10 py-3 outline-none focus:border-[#6f8f8b]"
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="道名、江湖名或编号"
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
            <button
              className="min-h-12 self-end rounded-full border border-[#c9a45c]/35 bg-white/75 px-4 text-sm font-semibold text-[#7a6a48]"
              onClick={resetFilters}
              type="button"
            >
              清空
            </button>
          </div>
        ) : null}

        {roster.length === 0 ? (
          <EmptyState title="名册暂空" message="待执事审核通过后，同门会列入问云名册。" />
        ) : randomizedRoster.length === 0 ? (
          <EmptyState title="暂无匹配同门" message="可以换一个道名、江湖名、编号或筛选条件再试。" />
        ) : (
          <div className="-mx-4 flex snap-x gap-4 overflow-x-auto px-4 pb-4">
            {randomizedRoster.map((item) => (
              <article
                className="min-w-[min(86vw,26rem)] snap-start rounded-3xl border border-[#c9a45c]/25 bg-white/70 p-5 shadow-sm md:min-w-[25rem]"
                key={item.id}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold text-[#9e3d32]">{item.member_code}</p>
                    <h3 className="ink-title mt-1 text-3xl font-bold text-[#143044]">{item.dao_name}</h3>
                    <p className="mt-1 text-sm text-[#7a6a48]">江湖名：{showText(item.jianghu_name)}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <span className="rounded-full bg-[#edf3ef] px-3 py-1 text-xs text-[#6f8f8b]">{item.member_role}</span>
                    <span className="rounded-full bg-[#fff1ee] px-3 py-1 text-xs text-[#9e3d32]">{item.gender}</span>
                  </div>
                </div>

                <div className="mt-4 grid gap-3 text-sm leading-7 text-[#526461]">
                  <p>城市：{showText(item.public_region ?? item.city)}</p>
                  <p>入册：{formatRosterDate(item.joined_at ?? item.created_at)}</p>
                </div>

                <p className="mt-4 rounded-2xl border border-[#c9a45c]/20 bg-[#fffaf0]/65 p-4 text-sm leading-7 text-[#526461]">
                  <span className="font-semibold text-[#143044]">宣言：</span>
                  {showText(item.motto)}
                </p>

                <p className="mt-4 rounded-2xl border border-[#6f8f8b]/18 bg-[#edf3ef]/55 p-4 text-sm leading-7 text-[#526461]">
                  <span className="font-semibold text-[#143044]">兴趣爱好：</span>
                  {formatHobbies(item.public_story, item.tags)}
                </p>

                <p className="mt-4 text-sm leading-7 text-[#526461]">同行期待：{showText(item.companion_expectation)}</p>
                <p className="mt-2 text-xs text-[#7a6a48]">状态：{applicationStatusLabels[item.status]}</p>
              </article>
            ))}
          </div>
        )}
      </ScrollPanel>
    </main>
  )
}
