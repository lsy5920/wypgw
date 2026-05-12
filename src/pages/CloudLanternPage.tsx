import { Lamp, Send } from 'lucide-react'
import { FormEvent, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { GeneratedIcon } from '../components/GeneratedIcon'
import { StatusNotice } from '../components/StatusNotice'
import { getGuofengVisualPath } from '../data/visualAssets'
import { useAuth } from '../hooks/useAuth'
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

// 这个数组保存常用心情标签，返回值用于复刻设计稿中的单选小标签。
const lanternMoodOptions = ['陪伴', '清醒', '成长', '守界', '向光', '其他']

// 这个数组保存云灯墙暂无真实数据时的展示卡片，返回值用于保持设计稿右侧留言墙布局。
const emptyLanternCards = [
  { author_name: '清风', mood: '陪伴', content: '愿每一位远行者，都能在这里望见一盏灯。' },
  { author_name: '山路', mood: '清醒', content: '最近有些辛苦，幸好还能在灯火里见到方向。' },
  { author_name: '匿名同门', mood: '守界', content: '愿你一路不必逞强，也不必独自走完。' },
  { author_name: '小鹿', mood: '欢喜', content: '今日一灯，送给正在赶路的人，愿心中有光。' },
  { author_name: '云边来客', mood: '安定', content: '把今天没说出口的话，暂且寄在这一盏灯里。' },
  { author_name: '归舟', mood: '明朗', content: '愿明日仍有勇气，也仍有温柔。' }
]

// 这个函数渲染云灯留言页，入参为空，返回值是按设计稿重写后的点灯表单和云灯墙。
export function CloudLanternPage() {
  // 这里读取当前登录资料，云灯提交要求先进入问云小院。
  const { profile, loading: authLoading } = useAuth()
  // 这个状态保存公开云灯，返回值用于右侧云灯墙。
  const [lanterns, setLanterns] = useState<CloudLantern[]>([])
  // 这个状态保存表单数据，返回值用于受控输入框。
  const [form, setForm] = useState<CloudLanternInput>(initialForm)
  // 这个状态表示是否正在提交，返回值用于禁用点灯按钮。
  const [submitting, setSubmitting] = useState(false)
  // 这个状态保存提示信息，返回值用于显示演示模式、校验错误或提交结果。
  const [notice, setNotice] = useState<{ type: 'success' | 'error' | 'info'; title: string; message: string } | null>(null)
  // 这个变量保存云灯背景插图，返回值用于底部山水灯影装饰。
  const lanternSceneImage = getGuofengVisualPath('cloudLantern')
  // 这个变量保存最终展示的留言列表，返回值用于真实数据和空数据之间平滑切换。
  const visibleLanterns = lanterns.length === 0 ? emptyLanternCards : lanterns

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

    // 这里拦截未登录用户，确保新云灯能在问云小院里看到审核状态。
    if (!profile) {
      setNotice({ type: 'error', title: '请先进入问云小院', message: '点亮云灯需要先用邮箱和密码登录，登录后可在小院查看审核状态。' })
      return
    }

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
      // 这里无论成功或失败都恢复提交状态，避免点灯按钮一直不可点。
      setSubmitting(false)
    }
  }

  return (
    <section className="interaction-reference-page lantern-reference-page" aria-label="云灯留言">
      <div className="interaction-paper-shell">
        {/* 这里还原设计稿顶部标题，左侧表单和右侧云灯墙各自承担主内容。 */}
        <header className="interaction-page-heading lantern-page-heading">
          <div className="interaction-title-cluster">
            <GeneratedIcon className="interaction-title-icon" name="lantern" />
            <div>
              <h1>云灯留言</h1>
              <p>点一盏云灯，愿光照见</p>
            </div>
          </div>
          <p className="lantern-page-note">留言会先由云纪执事审核，审核通过后公开展示。</p>
        </header>

        {notice ? (
          <div className="interaction-notice-row">
            <StatusNotice type={notice.type} title={notice.title} message={notice.message} />
          </div>
        ) : null}

        <div className="lantern-reference-layout">
          {/* 这里还原设计稿左侧点灯表单。 */}
          <section className="interaction-corner-card lantern-form-card" aria-label="点一盏云灯">
            <div className="lantern-form-heading">
              <p>点一盏云灯</p>
              <span>说出此刻心事，愿光照见</span>
            </div>

            {!profile ? (
              <div className="interaction-state-card">
                <Lamp className="h-5 w-5" />
                <div>
                  <strong>点灯前请先登录</strong>
                  <p>云灯留言需要绑定到你的问云小院，审核结果会回到你自己的消息里。</p>
                </div>
                <Link className="interaction-small-link" to="/login">
                  前往登录
                </Link>
              </div>
            ) : null}

            <form className="lantern-reference-form" onSubmit={handleSubmit}>
              <label>
                <span>署名</span>
                <input disabled={form.is_anonymous} onChange={(event) => updateField('author_name', event.target.value)} placeholder="可填写昵称" value={form.author_name} />
              </label>

              <fieldset className="lantern-mood-field">
                <legend>此刻心情 *</legend>
                <div>
                  {lanternMoodOptions.map((item) => (
                    <button className={form.mood === item ? 'is-active' : ''} key={item} onClick={() => updateField('mood', item)} type="button">
                      <span />
                      {item}
                    </button>
                  ))}
                </div>
              </fieldset>

              <label>
                <span>留言内容 *</span>
                <textarea maxLength={300} onChange={(event) => updateField('content', event.target.value)} placeholder="想对问云派说的话..." value={form.content} />
                <small>{form.content.length} / 300</small>
              </label>

              <label className="lantern-anonymous-switch">
                <span>
                  <strong>匿名留言</strong>
                  <em>开启后不显示你的署名</em>
                </span>
                <input checked={form.is_anonymous} onChange={(event) => updateField('is_anonymous', event.target.checked)} type="checkbox" />
                <i aria-hidden="true" />
              </label>

              <button className="interaction-seal-button lantern-submit-button" disabled={submitting || authLoading || !profile} type="submit">
                {submitting ? '正在点灯...' : '点亮云灯'}
                <Send className="h-4 w-4" />
              </button>
            </form>
          </section>

          {/* 这里还原设计稿右侧云灯墙，两列留言小笺在桌面端铺开。 */}
          <section className="lantern-wall-card" aria-label="云灯墙">
            <div className="lantern-wall-heading">
              <div>
                <p>云灯墙</p>
                <h2>最新留言</h2>
              </div>
              <span>共 {visibleLanterns.length} 盏</span>
            </div>

            <div className="lantern-card-grid">
              {visibleLanterns.map((item, index) => (
                <article className="lantern-message-card" key={'id' in item ? item.id : `${item.author_name}-${index}`}>
                  <div className="lantern-message-head">
                    <GeneratedIcon className="lantern-card-icon" name="lantern" />
                    <strong>{item.author_name || '匿名同门'}</strong>
                    <span>{item.mood || '陪伴'}</span>
                  </div>
                  <p>{item.content}</p>
                  <div className="lantern-like-row">
                    <span>灯火可见</span>
                    <small>{index + 9}</small>
                  </div>
                </article>
              ))}
            </div>

            <button className="lantern-more-button" type="button">
              加载更多
              <ChevronDownLike />
            </button>
          </section>
        </div>

        {/* 这里使用页面级云灯插图做底部氛围层，避免背景只剩纯色宣纸。 */}
        <img alt="" aria-hidden="true" className="lantern-bottom-scene" src={lanternSceneImage} />
      </div>
    </section>
  )
}

// 这个函数渲染“加载更多”小箭头，入参为空，返回值是纯代码装饰图标。
function ChevronDownLike() {
  return (
    <svg aria-hidden="true" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
      <path d="m7 10 5 5 5-5" />
    </svg>
  )
}
