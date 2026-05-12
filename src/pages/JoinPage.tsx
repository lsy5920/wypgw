import { ChevronDown, ChevronUp, ClipboardPenLine, MapPin, Search, Send, Shuffle, UserRound, UsersRound } from 'lucide-react'
import { FormEvent, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { GeneratedIcon } from '../components/GeneratedIcon'
import { StatusNotice } from '../components/StatusNotice'
import { applicationStatusLabels, genderOptions, memberRoleOptions } from '../data/siteContent'
import { getGuofengVisualPath } from '../data/visualAssets'
import { useAuth } from '../hooks/useAuth'
import { fetchMyApplications, fetchMyLatestWenxinQuizResult, fetchPublicRoster, submitJoinApplication } from '../lib/services'
import type { JoinApplication, JoinApplicationInput, MemberGender, RosterEntry, WenxinQuizResult } from '../lib/types'
import { validateJoinApplication } from '../lib/validators'

// 这个常量保存名册登记表单初始值，返回值用于首次渲染和提交成功后的重置。
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
  tags: '',
  companion_expectation: '',
  legacy_contact: '',
  accept_rules: false
}

// 这个数组保存名册登记流程步骤，返回值用于折叠状态下给新同门看清先后顺序。
const rosterJoinSteps = ['登录小院', '问云合格', '递交名帖', '执事审核']

// 这个数组保存名册头像可复用插图，返回值用于让每张名帖有水墨头像而不是空白圆点。
const rosterAvatarVisuals = ['roster', 'quiz', 'cloudLantern', 'login'] as const

// 这个函数格式化登记时间，入参是数据库时间字符串，返回值是中文日期文字。
function formatRosterDate(value: string | null): string {
  if (!value) {
    return '未记录'
  }

  try {
    // 这里把数据库时间转成本地日期，方便普通访问者直接阅读。
    return new Date(value).toLocaleDateString('zh-CN')
  } catch {
    // 这里兜底处理异常日期，避免一条脏数据拖垮整页名册。
    return value
  }
}

// 这个函数渲染可公开展示的文字，入参是可能为空的文字，返回值是兜底后的展示文案。
function showText(value: string | null): string {
  return value?.trim() || '未填写'
}

// 这个函数格式化兴趣爱好，入参是兴趣爱好文字，返回值是统一展示文字。
function formatHobbies(tags: string | null): string {
  return tags?.trim() || '未填写'
}

// 这个函数生成稳定的随机排序权重，入参是名册条目和种子，返回值用于横向卡片随机展示。
function createRosterWeight(item: RosterEntry, seed: number): number {
  // 这里把编号和种子拼在一起，保证点击“换一组”时顺序会变，但同一次渲染不会乱跳。
  const source = `${item.id}-${item.member_code}-${seed}`
  let hash = 0

  // 这里用简单哈希生成排序值，避免每次渲染都重新打乱。
  for (let index = 0; index < source.length; index += 1) {
    hash = Math.imul(31, hash) + source.charCodeAt(index)
  }

  return Math.abs(hash)
}

// 这个函数渲染问云名册页，入参为空，返回值是按互动设计稿重写后的公开名册和递帖表单。
export function JoinPage() {
  // 这里读取当前登录资料，名帖登记必须归属到具体问云小院账号。
  const { profile, loading: authLoading } = useAuth()
  // 这个状态保存公开名册条目，返回值用于上方横向卡片展示。
  const [roster, setRoster] = useState<RosterEntry[]>([])
  // 这个状态保存表单数据，返回值用于受控输入框。
  const [form, setForm] = useState<JoinApplicationInput>(initialForm)
  // 这个状态控制登记表单是否展开，返回值用于模拟设计稿下方“递交名帖”区域。
  const [formOpen, setFormOpen] = useState(true)
  // 这个状态保存前台名册搜索词，返回值用于按道名、江湖名或编号筛选。
  const [searchTerm, setSearchTerm] = useState('')
  // 这个状态保存前台辈分字筛选，返回值用于筛选公开名册。
  const [generationFilter, setGenerationFilter] = useState('')
  // 这个状态保存前台性别筛选，返回值用于筛选公开名册。
  const [genderFilter, setGenderFilter] = useState('')
  // 这个状态保存前台身份筛选，返回值用于筛选公开名册。
  const [roleFilter, setRoleFilter] = useState('')
  // 这个状态保存随机展示种子，返回值用于“换一组”按钮。
  const [rosterSeed, setRosterSeed] = useState(() => Date.now())
  // 这个状态保存当前用户最新一次问心考核结果，返回值用于判断是否能递帖。
  const [quizResult, setQuizResult] = useState<WenxinQuizResult | null>(null)
  // 这个状态保存当前账号已经递交过的名帖，返回值用于阻止重复提交。
  const [existingApplication, setExistingApplication] = useState<JoinApplication | null>(null)
  // 这个状态表示表单是否正在提交，返回值用于禁用按钮和显示提交中文字。
  const [submitting, setSubmitting] = useState(false)
  // 这个状态保存页面提示，返回值用于显示读取失败、演示模式或提交结果。
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
    // 这个函数读取当前用户的考核结果和递帖状态，入参为空，返回值为空。
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
    // 这里清理搜索词，避免前后空格影响搜索结果。
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

  // 这个变量保存当前递帖门槛状态，返回值用于设计稿右侧小状态签。
  const gateStatusText = !profile
    ? '请先登录问云小院'
    : existingApplication
      ? `已递交名帖：${applicationStatusLabels[existingApplication.status]}`
      : quizResult?.passed
        ? `问云已合格：${quizResult.score} 分`
        : '待完成问云考核'

  // 这个函数更新文字或勾选字段，入参是字段名和值，返回值为空。
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
      setNotice({ type: 'error', title: '请先完成问云考核', message: '登记入册前需要先完成问云考核，并且最新成绩达到 80 分以上。' })
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
      // 这里无论成功失败都恢复按钮状态，避免按钮长期停在加载中。
      setSubmitting(false)
    }
  }

  return (
    <section className="interaction-reference-page roster-reference-page" aria-label="问云名册">
      <div className="interaction-paper-shell">
        {/* 这里还原设计稿顶部标题、云纹和搜索条。 */}
        <header className="interaction-page-heading roster-page-heading">
          <div className="interaction-title-cluster">
            <GeneratedIcon className="interaction-title-icon" name="roster" />
            <div>
              <h1>问云名册</h1>
              <p>同进相逢，名帖寄心</p>
            </div>
          </div>
          <label className="interaction-search-box" aria-label="搜索名册">
            <Search className="h-4 w-4" />
            <input onChange={(event) => setSearchTerm(event.target.value)} placeholder="搜索道名 / 江湖名 / 编号" value={searchTerm} />
          </label>
        </header>

        {/* 这里集中展示读取、演示模式和提交提示，不压住核心名册区。 */}
        {notice ? (
          <div className="interaction-notice-row">
            <StatusNotice type={notice.type} title={notice.title} message={notice.message} />
          </div>
        ) : null}

        {/* 这里复刻设计稿上半部分：筛选条和横向名册卡片。 */}
        <section className="interaction-corner-card roster-wall-card" aria-label="公开名册">
          <div className="roster-filter-strip">
            <button className={`interaction-filter-pill ${!searchTerm && !generationFilter && !genderFilter && !roleFilter ? 'is-active' : ''}`} onClick={resetFilters} type="button">
              全部
            </button>
            <select aria-label="辈分字筛选" onChange={(event) => setGenerationFilter(event.target.value)} value={generationFilter}>
              <option value="">辈分</option>
              {generationOptions.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
            <select aria-label="性别筛选" onChange={(event) => setGenderFilter(event.target.value)} value={genderFilter}>
              <option value="">性别</option>
              {genderOptions.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
            <select aria-label="身份筛选" onChange={(event) => setRoleFilter(event.target.value)} value={roleFilter}>
              <option value="">身份</option>
              {memberRoleOptions.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
            <button className="interaction-filter-pill" onClick={() => setRosterSeed(Date.now())} type="button">
              <Shuffle className="h-4 w-4" />
              换一组
            </button>
            <span className="interaction-count-pill">{filteredRoster.length} / {roster.length} 人</span>
          </div>

          {roster.length === 0 ? (
            <div className="interaction-empty-card">
              <UsersRound className="h-7 w-7" />
              <p>名册暂空，待执事审核通过后，同门会列入问云名册。</p>
            </div>
          ) : randomizedRoster.length === 0 ? (
            <div className="interaction-empty-card">
              <Search className="h-7 w-7" />
              <p>暂无匹配同门，可以换一个道名、江湖名、编号或筛选条件再试。</p>
            </div>
          ) : (
            <div className="roster-card-row">
              {randomizedRoster.map((item, index) => {
                // 这个变量保存当前卡片头像插图，避免所有名帖头像完全一样。
                const avatarImage = getGuofengVisualPath(rosterAvatarVisuals[index % rosterAvatarVisuals.length])

                return (
                  <article className="roster-reference-card" key={item.id}>
                    <div className="roster-card-avatar">
                      <img alt="" aria-hidden="true" src={avatarImage} />
                    </div>
                    <div className="roster-card-body">
                      <p className="roster-card-code">{item.member_code}</p>
                      <h2>{item.dao_name}</h2>
                      <p className="roster-card-meta">
                        {item.member_role} <span>|</span> {showText(item.jianghu_name)}
                      </p>
                      <p className="roster-card-location">
                        <MapPin className="h-3.5 w-3.5" />
                        {showText(item.public_region ?? item.city)}
                      </p>
                      <p className="roster-card-motto">宜言：{showText(item.motto)}</p>
                      <p className="roster-card-tags">兴趣：{formatHobbies(item.tags)}</p>
                    </div>
                    <button className="roster-card-button" type="button">
                      查看名帖
                    </button>
                  </article>
                )
              })}
            </div>
          )}
        </section>

        {/* 这里复刻设计稿下半部分：递交名帖表单和当前门槛状态。 */}
        <section className="interaction-corner-card roster-submit-card" aria-label="递交名帖">
          <div className="roster-submit-heading">
            <div>
              <p className="interaction-section-kicker">
                <ClipboardPenLine className="h-4 w-4" />
                递交名帖
              </p>
              <h2>新成员登记入口</h2>
              <p>第一次来的同门，请先完成问云考核，再填写可公开与仅后台核对的资料。</p>
            </div>
            <div className="roster-submit-actions">
              <span>{gateStatusText}</span>
              <button className="interaction-filter-pill" onClick={() => setFormOpen((current) => !current)} type="button">
                {formOpen ? '收起表单' : '展开表单'}
                {formOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {!formOpen ? (
            <div className="roster-step-grid">
              {rosterJoinSteps.map((item, index) => (
                <div className="roster-step-card" key={item}>
                  <span>第 {index + 1} 步</span>
                  <strong>{item}</strong>
                  <p>{index === 0 ? '绑定自己的账号' : index === 1 ? '最新成绩满 80 分' : index === 2 ? '填写公开资料' : '通过后列入名册'}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="roster-form-region">
              {!profile ? (
                <div className="interaction-state-card">
                  <UserRound className="h-5 w-5" />
                  <div>
                    <strong>递交名帖前请先登录</strong>
                    <p>名帖登记需要绑定到你的问云小院，执事审核后你才能看到状态和提醒。</p>
                  </div>
                  <Link className="interaction-small-link" to="/login">
                    前往登录
                  </Link>
                </div>
              ) : existingApplication ? (
                <div className="interaction-state-card">
                  <ClipboardPenLine className="h-5 w-5" />
                  <div>
                    <strong>你已经递交过名帖</strong>
                    <p>当前状态为“{applicationStatusLabels[existingApplication.status]}”。如需修改资料，请到问云小院处理。</p>
                  </div>
                  <Link className="interaction-small-link" to="/yard/profile">
                    去小院修改
                  </Link>
                </div>
              ) : !quizResult?.passed ? (
                <div className="interaction-state-card">
                  <GeneratedIcon className="interaction-state-icon" name="shield" />
                  <div>
                    <strong>请先完成问云考核</strong>
                    <p>当前结果：{quizResult ? `${quizResult.score} 分，尚未达到登记门槛。` : '尚未参加考核。'}</p>
                  </div>
                  <Link className="interaction-small-link" to="/wenxin-quiz">
                    去考核
                  </Link>
                </div>
              ) : null}

              {profile && quizResult?.passed && !existingApplication ? (
                <form className="roster-reference-form" onSubmit={handleSubmit}>
                  <label>
                    <span>道名（昵称）*</span>
                    <input onChange={(event) => updateField('nickname', event.target.value)} placeholder="请输入后能长留的名字" value={form.nickname} />
                  </label>
                  <label>
                    <span>江湖名</span>
                    <input onChange={(event) => updateField('jianghu_name', event.target.value)} placeholder="可填写你行走群中的称呼" value={form.jianghu_name} />
                  </label>
                  <label>
                    <span>真实姓名 *</span>
                    <input onChange={(event) => updateField('real_name', event.target.value)} placeholder="请输入真实姓名" value={form.real_name} />
                  </label>
                  <fieldset className="roster-gender-field">
                    <legend>性别 *</legend>
                    {genderOptions.map((item) => (
                      <label key={item}>
                        <input checked={form.gender === item} onChange={() => updateGender(item)} type="radio" />
                        <span>{item}</span>
                      </label>
                    ))}
                  </fieldset>
                  <label>
                    <span>联系方式（微信号）*</span>
                    <input
                      onChange={(event) => {
                        updateField('legacy_contact', event.target.value)
                        updateField('wechat_id', event.target.value)
                      }}
                      placeholder="用于联系与审核"
                      value={form.legacy_contact}
                    />
                  </label>
                  <label>
                    <span>出生年份</span>
                    <input inputMode="numeric" maxLength={4} onChange={(event) => updateField('age_range', event.target.value.replace(/\D/g, '').slice(0, 4))} placeholder="例如：1995" value={form.age_range} />
                  </label>
                  <label className="roster-wide-field">
                    <span>宣言 / 自我介绍 *</span>
                    <input onChange={(event) => updateField('motto', event.target.value)} placeholder="写下你来到问云的第一句话" value={form.motto} />
                  </label>
                  <label>
                    <span>所在城市</span>
                    <input
                      onChange={(event) => {
                        updateField('public_region', event.target.value)
                        updateField('city', event.target.value)
                      }}
                      placeholder="例如：杭州"
                      value={form.public_region}
                    />
                  </label>
                  <label className="roster-wide-field">
                    <span>兴趣 / 自我介绍</span>
                    <input onChange={(event) => updateField('tags', event.target.value)} placeholder="写下爱好或擅长方向" value={form.tags} />
                  </label>
                  <label className="roster-rule-check">
                    <input checked={form.accept_rules} onChange={(event) => updateField('accept_rules', event.target.checked)} type="checkbox" />
                    <span>我已阅读并认可问云门规，愿意守住边界，不伤人、不泄密、不广告。</span>
                  </label>
                  <button className="interaction-primary-button roster-form-submit" disabled={submitting || authLoading || !profile || !quizResult?.passed} type="submit">
                    {submitting ? '正在送帖...' : '提交名帖'}
                    <Send className="h-4 w-4" />
                  </button>
                </form>
              ) : null}
            </div>
          )}
        </section>
      </div>
    </section>
  )
}
