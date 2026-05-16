import { FormEvent, useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { genderOptions, memberRoleOptions } from '../../data/siteContent'
import { wenxinQuizQuestions, wenxinScoreLevels } from '../../data/quizContent'
import { getGuofengVisualPath } from '../../data/visualAssets'
import type { CloudLanternInput, JoinApplicationInput, MemberGender, RosterEntry, WenxinQuizAnswerMap } from '../../lib/types'
import {
  fetchPublicRoster,
  isAdminProfile,
  isLegacyRosterAccount,
  sendPasswordRecovery,
  signInWithAccount,
  signUpWithEmail,
  submitCloudLantern,
  submitJoinApplication,
  submitWenxinQuizResult,
  updateRecoveredPassword,
  validateCloudLantern,
  validateJoinApplication
} from '../../shared/services'
import { EmptyState, Field, LoadingBlock, MissionCard, MissionHero, StatusNotice, TaskButton, TaskLink, formatDateTime } from '../../shared/ui/TaskUi'

// 这个类型描述登录页当前模式，入参来自用户点击，返回值用于切换不同表单。
type LoginMode = 'login' | 'register' | 'recover' | 'reset'

// 这个函数创建云灯默认表单，入参为空，返回值是可编辑的云灯对象。
function createDefaultLanternInput(): CloudLanternInput {
  return {
    author_name: '',
    content: '',
    mood: '',
    is_anonymous: true
  }
}

// 这个函数创建名帖默认表单，入参为空，返回值是可编辑的名帖对象。
function createDefaultJoinInput(): JoinApplicationInput {
  return {
    nickname: '',
    jianghu_name: '',
    real_name: '',
    wechat_id: '',
    age_range: '',
    gender: '女',
    city: '',
    member_role: '同门',
    public_region: '',
    motto: '',
    tags: '',
    companion_expectation: '',
    legacy_contact: '',
    accept_rules: false
  }
}

// 这个函数根据分数寻找说明，入参是分数，返回值是分数解读。
function getScoreLevel(score: number): string {
  return wenxinScoreLevels.find((level) => score >= level.min && score <= level.max)?.text ?? '本次成绩已记录'
}

// 这个组件展示可复用的视觉图块，入参是图片地址和说明，返回值是右侧画面。
function ActionVisual({ visual, caption }: { visual: Parameters<typeof getGuofengVisualPath>[0]; caption: string }) {
  return (
    <figure className="visual-plate">
      <img alt={caption} src={getGuofengVisualPath(visual)} />
      <figcaption className="visual-plate__caption">{caption}</figcaption>
    </figure>
  )
}

// 这个函数把公开标签文本拆成数组，入参是标签文本，返回值是可逐个展示的标签。
function splitPublicTags(value: string | null): string[] {
  if (!value) {
    return []
  }

  // 这里用集合去重，避免同一个公开标签重复渲染导致页面警告。
  return Array.from(new Set(value
    .split(/[、,，\s]+/)
    .map((item) => item.trim())
    .filter(Boolean)))
    .slice(0, 4)
}

// 这个函数取公开地区，入参是名册条目，返回值是适合前台展示的位置文本。
function getPublicRegion(item: RosterEntry): string {
  return item.public_region || item.city || '云中'
}

// 这个函数随机挑选公开名册条目，入参是完整列表和数量，返回值是用于前台展示的少量条目。
function pickRandomRosterItems(items: RosterEntry[], count: number): RosterEntry[] {
  // 这里复制一份再打乱，避免修改原始名册数据。
  const shuffled = [...items]

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    // 这里使用浏览器随机数抽取位置，只用于前台展示顺序，不参与任何业务安全逻辑。
    const randomIndex = Math.floor(Math.random() * (index + 1))
    const current = shuffled[index]
    shuffled[index] = shuffled[randomIndex]
    shuffled[randomIndex] = current
  }

  return shuffled.slice(0, count)
}

// 这个组件展示单个公开名册详情弹窗，入参是名册条目和关闭方法，返回值是只含公开字段的弹窗。
function PublicRosterDialog({ item, onClose }: { item: RosterEntry; onClose: () => void }) {
  // 这个数组保存公开兴趣标签，返回值用于弹窗展示。
  const tags = splitPublicTags(item.tags)

  return (
    <div className="public-roster-dialog" role="dialog" aria-modal="true" aria-labelledby="public-roster-dialog-title">
      <button aria-label="关闭公开名册详情遮罩" className="public-roster-dialog__shade" onClick={onClose} type="button" />
      <article className="public-roster-dialog__panel">
        <div className="public-roster-card__seal" aria-hidden="true">
          {item.generation_name || item.dao_name.slice(0, 1)}
        </div>
        <div className="public-roster-dialog__content">
          <p className="section-eyebrow">公开名册详情</p>
          <h2 id="public-roster-dialog-title">{item.dao_name}</h2>
          <span>{item.jianghu_name || '未留江湖名'} · {item.member_code}</span>
          <dl className="public-roster-dialog__list">
            <div>
              <dt>门派身份</dt>
              <dd>{item.member_role}</dd>
            </div>
            <div>
              <dt>公开地区</dt>
              <dd>{getPublicRegion(item)}</dd>
            </div>
            <div>
              <dt>入册时间</dt>
              <dd>{item.joined_at ? formatDateTime(item.joined_at) : '待记录'}</dd>
            </div>
            <div>
              <dt>入派宣言</dt>
              <dd>{item.motto || '愿清醒温柔，同行自渡。'}</dd>
            </div>
            <div>
              <dt>同行期待</dt>
              <dd>{item.companion_expectation || '暂未填写。'}</dd>
            </div>
          </dl>
          {tags.length > 0 ? (
            <div className="public-roster-card__tags">
              {tags.map((tag) => (
                <span key={tag}>{tag}</span>
              ))}
            </div>
          ) : null}
          <TaskButton onClick={onClose} tone="primary" type="button">
            收起详情
          </TaskButton>
        </div>
      </article>
    </div>
  )
}

// 这个组件展示已经正式入册的公开名单，入参是名册列表和加载状态，返回值是公开名册展示区。
function PublicRosterShowcase({ items, loading }: { items: RosterEntry[]; loading: boolean }) {
  // 这个数组只保留已入册通过或已联系的公开条目，避免展示未审核数据。
  const approvedItems = useMemo(() => items.filter((item) => item.status === 'approved' || item.status === 'contacted'), [items])
  // 这个状态保存当前随机展示的少量同门。
  const [visibleItems, setVisibleItems] = useState<RosterEntry[]>([])
  // 这个状态保存当前打开详情的名册条目。
  const [selectedItem, setSelectedItem] = useState<RosterEntry | null>(null)

  useEffect(() => {
    // 这里在名册变化后随机挑选少量条目，避免一次性展示全部成员。
    setVisibleItems(pickRandomRosterItems(approvedItems, 6))
  }, [approvedItems])

  // 这个函数重新随机展示一组同门，入参为空，返回值为空。
  function refreshVisibleItems() {
    setVisibleItems(pickRandomRosterItems(approvedItems, 6))
  }

  return (
    <section className="public-roster-showcase" aria-label="已入册同门名单">
      <div className="public-roster-showcase__head">
        <div>
          <p className="section-eyebrow">已入册名单</p>
          <h2>先看见同行的人，再决定是否同行。</h2>
          <p>这里随机展示几位已入册同门，只露出公开摘要；点击卡片可查看更完整的公开信息。真实姓名和联系方式不会出现在公开名册里。</p>
        </div>
        <div className="public-roster-showcase__actions">
          <strong>{approvedItems.length} 位</strong>
          {approvedItems.length > 6 ? (
            <TaskButton onClick={refreshVisibleItems} tone="secondary" type="button">
              换一组
            </TaskButton>
          ) : null}
        </div>
      </div>

      {loading ? <LoadingBlock label="正在展开公开名册" /> : null}
      {!loading && approvedItems.length === 0 ? <EmptyState title="暂无公开同门" description="名册尚未挂出通过名单。等执事审核后，会在这里展示公开信息。" /> : null}
      {!loading && approvedItems.length > 0 ? (
        <div className="public-roster-rail">
          {visibleItems.map((item) => (
            <button aria-label={`查看${item.dao_name}的公开名册详情`} className="public-roster-card" key={item.id} onClick={() => setSelectedItem(item)} type="button">
              <div className="public-roster-card__seal" aria-hidden="true">
                {item.generation_name || item.dao_name.slice(0, 1)}
              </div>
              <div className="public-roster-card__main">
                <div className="public-roster-card__title">
                  <div>
                    <strong>{item.dao_name}</strong>
                    <span>{item.jianghu_name || '未留江湖名'}</span>
                  </div>
                </div>
                <div className="public-roster-card__meta">
                  <span>{item.member_role}</span>
                  <span>{getPublicRegion(item)}</span>
                </div>
                <p>{item.motto || '愿清醒温柔，同行自渡。'}</p>
                <small className="public-roster-card__more">点击查看公开详情</small>
              </div>
            </button>
          ))}
        </div>
      ) : null}
      {selectedItem ? <PublicRosterDialog item={selectedItem} onClose={() => setSelectedItem(null)} /> : null}
    </section>
  )
}

// 这个组件展示云灯留言页，入参为空，返回值是公开点灯表单和提示。
export function CloudLanternPage() {
  // 这个状态保存云灯表单内容。
  const [form, setForm] = useState<CloudLanternInput>(createDefaultLanternInput)
  // 这个状态保存表单校验错误。
  const [errors, setErrors] = useState<string[]>([])
  // 这个状态保存提交反馈。
  const [message, setMessage] = useState('')
  // 这个状态保存提交中标记。
  const [submitting, setSubmitting] = useState(false)

  // 这个函数更新云灯表单字段，入参是字段名和值，返回值为空。
  function updateField<K extends keyof CloudLanternInput>(key: K, value: CloudLanternInput[K]) {
    setForm((current) => ({ ...current, [key]: value }))
  }

  // 这个函数提交云灯，入参是表单事件，返回值为空。
  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const nextErrors = validateCloudLantern(form)
    setErrors(nextErrors)
    setMessage('')

    if (nextErrors.length > 0) {
      return
    }

    setSubmitting(true)
    const result = await submitCloudLantern(form)
    setSubmitting(false)
    setMessage(result.message)

    if (result.ok) {
      setForm(createDefaultLanternInput())
    }
  }

  return (
    <div className="page-shell page-stack">
      <MissionHero
        eyebrow="寄语任务"
        title="点一盏云灯"
        lead="写给自己，写给同行者，也可以只写给山风。云灯递出后会先由执事查看，适合公开的灯才会挂上墙。"
        aside={<ActionVisual visual="cloudLantern" caption="云灯候审" />}
      />

      <section className="mission-grid mission-grid--two">
        <MissionCard title="写云灯" eyebrow="轻声即可">
          <form className="form-grid form-grid--single" onSubmit={handleSubmit}>
            <Field label="署名" hint="匿名点灯时可不写。">
              <input disabled={form.is_anonymous} onChange={(event) => updateField('author_name', event.target.value)} value={form.author_name} />
            </Field>
            <Field label="灯上文字" hint="请控制在 260 字以内。">
              <textarea onChange={(event) => updateField('content', event.target.value)} value={form.content} />
            </Field>
            <Field label="心情小签" hint="例如：清醒、陪伴、安静。">
              <input onChange={(event) => updateField('mood', event.target.value)} value={form.mood} />
            </Field>
            <div className="checkbox-row">
              <label>
                <input checked={form.is_anonymous} onChange={(event) => updateField('is_anonymous', event.target.checked)} type="checkbox" />
                匿名挂灯
              </label>
            </div>
            {errors.length > 0 ? <StatusNotice tone="danger">{errors.join(' ')}</StatusNotice> : null}
            {message ? <StatusNotice tone={message.includes('失败') ? 'danger' : 'success'}>{message}</StatusNotice> : null}
            <TaskButton disabled={submitting} tone="primary" type="submit" icon="send">
              {submitting ? '正在递灯' : '递出云灯'}
            </TaskButton>
          </form>
        </MissionCard>
        <MissionCard title="云灯之约" eyebrow="守一盏灯">
          <p>云灯墙适合温柔、清醒、可公开的话。涉及隐私、攻击、广告或让人不适的内容不会公开。</p>
          <p>若你想递名帖，请先读金典并完成问云考核。</p>
          <div className="mission-card__action">
            <TaskLink to="/canon" tone="secondary" icon="scroll">
              读立派金典
            </TaskLink>
            <TaskLink to="/wenxin-quiz" tone="secondary" icon="shieldCheck">
              赴问云考核
            </TaskLink>
          </div>
        </MissionCard>
      </section>
    </div>
  )
}

// 这个组件展示名帖登记页，入参为空，返回值是公开名册说明和递帖表单。
export function JoinPage() {
  // 这个状态保存名帖表单内容。
  const [form, setForm] = useState<JoinApplicationInput>(createDefaultJoinInput)
  // 这个状态保存校验错误。
  const [errors, setErrors] = useState<string[]>([])
  // 这个状态保存提交反馈。
  const [message, setMessage] = useState('')
  // 这个状态保存提交中标记。
  const [submitting, setSubmitting] = useState(false)
  // 这个状态保存公开名册条目。
  const [rosterItems, setRosterItems] = useState<RosterEntry[]>([])
  // 这个状态保存公开名册加载标记。
  const [rosterLoading, setRosterLoading] = useState(true)

  useEffect(() => {
    // 这里读取已公开的正式名册，用于在递帖前展示同行名单。
    async function loadPublicRoster() {
      const result = await fetchPublicRoster()
      setRosterItems(result.data)
      setRosterLoading(false)
    }

    void loadPublicRoster()
  }, [])

  // 这个函数更新名帖字段，入参是字段名和值，返回值为空。
  function updateField<K extends keyof JoinApplicationInput>(key: K, value: JoinApplicationInput[K]) {
    setForm((current) => ({ ...current, [key]: value }))
  }

  // 这个函数提交名帖，入参是表单事件，返回值为空。
  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const nextErrors = validateJoinApplication(form)
    setErrors(nextErrors)
    setMessage('')

    if (nextErrors.length > 0) {
      return
    }

    setSubmitting(true)
    const result = await submitJoinApplication(form)
    setSubmitting(false)
    setMessage(result.message)

    if (result.ok) {
      setForm(createDefaultJoinInput())
    }
  }

  return (
    <div className="page-shell page-stack">
      <MissionHero
        eyebrow="递帖任务"
        title="问云名册"
        lead="名帖是一份自愿的同行说明。它需要登录账号、问云考核合格，并由执事审核；每个账号只递一帖。"
        aside={<ActionVisual visual="roster" caption="名帖待递" />}
      />

      <PublicRosterShowcase items={rosterItems} loading={rosterLoading} />

      <section className="mission-grid mission-grid--two">
        <MissionCard title="递交名帖" eyebrow="一人一帖">
          <form className="form-grid" onSubmit={handleSubmit}>
            <Field label="道名" hint="需以“云”开头，2 到 3 个汉字。">
              <input onChange={(event) => updateField('nickname', event.target.value)} value={form.nickname} />
            </Field>
            <Field label="江湖名">
              <input onChange={(event) => updateField('jianghu_name', event.target.value)} value={form.jianghu_name} />
            </Field>
            <Field label="真实姓名" hint="只供执事核对，不公开。">
              <input onChange={(event) => updateField('real_name', event.target.value)} value={form.real_name} />
            </Field>
            <Field label="联系方式" hint="用于审核联系，不公开。">
              <input onChange={(event) => updateField('wechat_id', event.target.value)} value={form.wechat_id} />
            </Field>
            <Field label="出生年份" hint="可留空；若填写，请写四位年份。">
              <input inputMode="numeric" onChange={(event) => updateField('age_range', event.target.value)} value={form.age_range} />
            </Field>
            <Field label="公开性别">
              <select onChange={(event) => updateField('gender', event.target.value as MemberGender)} value={form.gender}>
                {genderOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="所在城市">
              <input onChange={(event) => updateField('city', event.target.value)} value={form.city} />
            </Field>
            <Field label="公开地区">
              <input onChange={(event) => updateField('public_region', event.target.value)} value={form.public_region} />
            </Field>
            <Field label="公开身份">
              <select onChange={(event) => updateField('member_role', event.target.value as JoinApplicationInput['member_role'])} value={form.member_role}>
                {memberRoleOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="备用联系">
              <input onChange={(event) => updateField('legacy_contact', event.target.value)} value={form.legacy_contact} />
            </Field>
            <Field label="入派宣言">
              <textarea onChange={(event) => updateField('motto', event.target.value)} value={form.motto} />
            </Field>
            <Field label="兴趣爱好">
              <textarea onChange={(event) => updateField('tags', event.target.value)} value={form.tags} />
            </Field>
            <Field label="同行期待">
              <textarea onChange={(event) => updateField('companion_expectation', event.target.value)} value={form.companion_expectation} />
            </Field>
            <div className="checkbox-row">
              <label>
                <input checked={form.accept_rules} onChange={(event) => updateField('accept_rules', event.target.checked)} type="checkbox" />
                我已阅读并认同立派金典
              </label>
            </div>
            {errors.length > 0 ? <StatusNotice tone="danger">{errors.join(' ')}</StatusNotice> : null}
            {message ? <StatusNotice tone={message.includes('失败') || message.includes('请先') ? 'warning' : 'success'}>{message}</StatusNotice> : null}
            <TaskButton disabled={submitting} tone="primary" type="submit" icon="send">
              {submitting ? '正在递帖' : '递交名帖'}
            </TaskButton>
          </form>
        </MissionCard>
        <MissionCard title="递帖门槛" eyebrow="先明愿，再入册">
          <ul className="timeline">
            <li className="timeline-item timeline-item--done">
              <span>01</span>
              <div>
                <h3>登录小院</h3>
                <p>名帖会绑定账号，方便查看审核状态和维护公开资料。</p>
              </div>
            </li>
            <li className="timeline-item timeline-item--done">
              <span>02</span>
              <div>
                <h3>通过考核</h3>
                <p>问云考核合格后，再递交名帖。</p>
              </div>
            </li>
            <li className="timeline-item">
              <span>03</span>
              <div>
                <h3>等待审核</h3>
                <p>执事查看后会更新状态，结果可在小院查看。</p>
              </div>
            </li>
          </ul>
          <div className="mission-card__action">
            <TaskLink to="/login" tone="secondary" icon="logIn">
              先去登录
            </TaskLink>
            <TaskLink to="/wenxin-quiz" tone="secondary" icon="shieldCheck">
              赴问云考核
            </TaskLink>
          </div>
        </MissionCard>
      </section>
    </div>
  )
}

// 这个组件展示问云考核页，入参为空，返回值是题目、交卷和成绩。
export function WenxinQuizPage() {
  // 这个状态保存用户答案。
  const [answers, setAnswers] = useState<WenxinQuizAnswerMap>({})
  // 这个状态保存当前聚焦题目序号，避免一次展示太多题导致手机端压力大。
  const [currentIndex, setCurrentIndex] = useState(0)
  // 这个状态保存成绩提示。
  const [message, setMessage] = useState('')
  // 这个状态保存提交中标记。
  const [submitting, setSubmitting] = useState(false)

  // 这个变量保存总分，返回值用于显示进度。
  const totalScore = useMemo(() => wenxinQuizQuestions.reduce((sum, question) => sum + question.score, 0), [])
  // 这个变量保存已作答数量，返回值用于提醒是否完成。
  const answeredCount = useMemo(() => wenxinQuizQuestions.filter((question) => (answers[String(question.id)] ?? []).length > 0).length, [answers])
  // 这个变量保存当前题目，返回值用于焦点答题卡。
  const currentQuestion = wenxinQuizQuestions[currentIndex] ?? wenxinQuizQuestions[0]!
  // 这个变量保存当前题目的已选答案，返回值用于选项高亮。
  const currentSelected = answers[String(currentQuestion.id)] ?? []
  // 这个变量表示当前题是否为多选，返回值用于输入类型和提示。
  const currentMultiple = currentQuestion.type === 'multiple'

  // 这个函数切换答案，入参是题号、选项和是否多选，返回值为空。
  function toggleAnswer(questionId: number, optionKey: string, multiple: boolean) {
    setAnswers((current) => {
      const key = String(questionId)
      const currentAnswer = current[key] ?? []

      if (!multiple) {
        return { ...current, [key]: [optionKey] }
      }

      const nextAnswer = currentAnswer.includes(optionKey) ? currentAnswer.filter((item) => item !== optionKey) : [...currentAnswer, optionKey]
      return { ...current, [key]: nextAnswer.sort() }
    })
  }

  // 这个函数切换当前题目，入参是目标序号，返回值为空。
  function jumpToQuestion(index: number) {
    setCurrentIndex(Math.min(wenxinQuizQuestions.length - 1, Math.max(0, index)))
  }

  // 这个函数进入上一题，入参为空，返回值为空。
  function goPreviousQuestion() {
    jumpToQuestion(currentIndex - 1)
  }

  // 这个函数进入下一题，入参为空，返回值为空。
  function goNextQuestion() {
    jumpToQuestion(currentIndex + 1)
  }

  // 这个函数交卷计分，入参为空，返回值为空。
  async function submitQuiz() {
    const missing = wenxinQuizQuestions.filter((question) => (answers[String(question.id)] ?? []).length === 0)

    if (missing.length > 0) {
      setMessage(`还有 ${missing.length} 题未答，请答完再交卷。`)
      return
    }

    let score = 0
    let singleCorrect = 0
    let multipleCorrect = 0

    wenxinQuizQuestions.forEach((question) => {
      const answer = answers[String(question.id)] ?? []
      const correct = answer.length === question.answer.length && answer.every((item) => question.answer.includes(item))

      if (correct) {
        score += question.score
        if (question.type === 'single') {
          singleCorrect += 1
        } else {
          multipleCorrect += 1
        }
      }
    })

    setSubmitting(true)
    const result = await submitWenxinQuizResult({
      score,
      total_score: totalScore,
      passed: score >= 80,
      single_correct: singleCorrect,
      multiple_correct: multipleCorrect,
      answers
    })
    setSubmitting(false)
    setMessage(`${result.message} 本次得分 ${score}/${totalScore}，${getScoreLevel(score)}。`)
  }

  return (
    <div className="page-shell page-stack">
      <MissionHero
        eyebrow="闯关试卷"
        title="问云考核"
        lead="这份试卷只问是否明白金典。答完后会记录成绩；合格者可继续递交名帖。"
        aside={<ActionVisual visual="quiz" caption={`${answeredCount}/${wenxinQuizQuestions.length} 已答`} />}
      />

      <section className="mission-card">
        <div className="task-progress" aria-label="答题进度">
          <strong>
            已答 {answeredCount} / {wenxinQuizQuestions.length} 题
          </strong>
          <div className="task-progress__bar">
            <span style={{ width: `${(answeredCount / wenxinQuizQuestions.length) * 100}%` }} />
          </div>
        </div>
      </section>

      <section className="quiz-stage">
        <MissionCard
          className="quiz-focus-card"
          title={`${currentQuestion.id}. ${currentQuestion.title}`}
          eyebrow={currentMultiple ? '多选题' : '单选题'}
          meta={<span className="status-pill">{currentQuestion.score} 分</span>}
        >
          <div className="radio-row radio-row--stacked" role={currentMultiple ? 'group' : 'radiogroup'} aria-label={currentQuestion.title}>
            {currentQuestion.options.map((option) => (
              <label className={currentSelected.includes(option.key) ? 'selected' : ''} key={option.key}>
                <input
                  checked={currentSelected.includes(option.key)}
                  name={`question-${currentQuestion.id}`}
                  onChange={() => toggleAnswer(currentQuestion.id, option.key, currentMultiple)}
                  type={currentMultiple ? 'checkbox' : 'radio'}
                />
                <span>{option.key}</span>
                {option.text}
              </label>
            ))}
          </div>
          <small>出处：{currentQuestion.source}</small>
          <div className="mission-card__action">
            <TaskButton disabled={currentIndex === 0} onClick={goPreviousQuestion} tone="secondary" type="button" icon="arrowLeft">
              上一题
            </TaskButton>
            <TaskButton disabled={currentIndex === wenxinQuizQuestions.length - 1} onClick={goNextQuestion} tone="primary" type="button" icon="arrowRight">
              下一题
            </TaskButton>
          </div>
        </MissionCard>

        <aside className="quiz-map" aria-label="题目导航">
          {wenxinQuizQuestions.map((question, index) => {
            // 这个变量判断题目是否已经作答，用于地图状态。
            const answered = (answers[String(question.id)] ?? []).length > 0

            return (
              <button className={`${index === currentIndex ? 'active' : ''} ${answered ? 'answered' : ''}`} key={question.id} onClick={() => jumpToQuestion(index)} type="button">
                {String(question.id).padStart(2, '0')}
              </button>
            )
          })}
        </aside>
      </section>

      <section className="mission-card">
        {message ? <StatusNotice tone={message.includes('未答') ? 'warning' : 'success'}>{message}</StatusNotice> : null}
        <div className="mission-card__action">
          <TaskButton disabled={submitting} onClick={submitQuiz} tone="primary" type="button" icon="check">
            {submitting ? '正在交卷' : '交卷记分'}
          </TaskButton>
          <TaskLink to="/join" tone="secondary" icon="roster">
            去递名帖
          </TaskLink>
        </div>
      </section>
    </div>
  )
}

// 这个组件展示登录、注册和找回密码，入参为空，返回值是账号入口页面。
export function LoginPage() {
  // 这个变量用于读取回跳模式。
  const [searchParams] = useSearchParams()
  // 这个变量用于登录成功后跳转。
  const navigate = useNavigate()
  // 这个状态保存当前表单模式。
  const [mode, setMode] = useState<LoginMode>(searchParams.get('mode') === 'reset-password' ? 'reset' : 'login')
  // 这个状态保存账号。
  const [account, setAccount] = useState('')
  // 这个状态保存密码。
  const [password, setPassword] = useState('')
  // 这个状态保存确认密码。
  const [confirmPassword, setConfirmPassword] = useState('')
  // 这个状态保存反馈消息。
  const [message, setMessage] = useState('')
  // 这个状态保存提交中标记。
  const [submitting, setSubmitting] = useState(false)

  // 这个函数切换登录模式，入参是模式，返回值为空。
  function switchMode(nextMode: LoginMode) {
    setMode(nextMode)
    setMessage('')
  }

  // 这个函数处理账号动作，入参是表单事件，返回值为空。
  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitting(true)
    setMessage('')

    if (mode === 'recover') {
      const result = await sendPasswordRecovery(account)
      setMessage(result.message)
      setSubmitting(false)
      return
    }

    if (mode === 'reset') {
      const result = await updateRecoveredPassword(password, confirmPassword)
      setMessage(result.message)
      setSubmitting(false)
      if (result.ok) {
        setMode('login')
      }
      return
    }

    const input = {
      account,
      password,
      kind: isLegacyRosterAccount(account) ? 'legacy' : 'email'
    } as const
    const result = mode === 'register' ? await signUpWithEmail(input) : await signInWithAccount(input)
    setMessage(result.message)
    setSubmitting(false)

    if (result.ok) {
      navigate(isAdminProfile(result.data) ? '/admin' : '/yard')
    }
  }

  return (
    <div className="page-shell page-stack">
      <MissionHero
        eyebrow="入院凭证"
        title="问云小院"
        lead="小院用于查看名帖、云灯、雅集和提醒。旧编号可以继续登录，新同门也可用邮箱注册。"
        aside={<ActionVisual visual="login" caption="小院开门" />}
      />

      <section className="login-panel">
        <MissionCard title="选择入口" eyebrow="账号任务">
          <div className="login-switch" role="tablist" aria-label="账号入口">
            {[
              ['login', '登录'],
              ['register', '注册'],
              ['recover', '找回'],
              ['reset', '重置']
            ].map(([value, label]) => (
              <button className={mode === value ? 'active' : ''} key={value} onClick={() => switchMode(value as LoginMode)} type="button">
                {label}
              </button>
            ))}
          </div>
          <p>旧编号账号可直接填写编号；邮箱账号请填写完整邮箱。若管理员已授予执事权限，登录后可进入执事任务台。</p>
        </MissionCard>

        <MissionCard title={mode === 'register' ? '注册账号' : mode === 'recover' ? '找回密码' : mode === 'reset' ? '重置密码' : '登录小院'} eyebrow="入院登记">
          <form className="form-grid form-grid--single" onSubmit={handleSubmit}>
            {mode !== 'reset' ? (
              <Field label={mode === 'recover' || mode === 'register' ? '邮箱' : '邮箱或旧编号'}>
                <input autoComplete="username" onChange={(event) => setAccount(event.target.value)} value={account} />
              </Field>
            ) : null}
            {mode !== 'recover' ? (
              <Field label={mode === 'reset' ? '新密码' : '密码'}>
                <input autoComplete={mode === 'login' ? 'current-password' : 'new-password'} onChange={(event) => setPassword(event.target.value)} type="password" value={password} />
              </Field>
            ) : null}
            {mode === 'reset' ? (
              <Field label="确认新密码">
                <input autoComplete="new-password" onChange={(event) => setConfirmPassword(event.target.value)} type="password" value={confirmPassword} />
              </Field>
            ) : null}
            {message ? <StatusNotice tone={message.includes('成功') || message.includes('已') ? 'success' : 'warning'}>{message}</StatusNotice> : null}
            <TaskButton disabled={submitting} tone="primary" type="submit">
              {submitting ? '正在处理' : mode === 'register' ? '注册并进入' : mode === 'recover' ? '发送邮件' : mode === 'reset' ? '保存新密码' : '进入小院'}
            </TaskButton>
          </form>
        </MissionCard>
      </section>
    </div>
  )
}
