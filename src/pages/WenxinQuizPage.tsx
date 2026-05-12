import { AlertTriangle, CheckCircle2, ChevronLeft, ChevronRight, FileText, Send, Star } from 'lucide-react'
import { FormEvent, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { GeneratedIcon } from '../components/GeneratedIcon'
import { StatusNotice } from '../components/StatusNotice'
import { wenxinQuizQuestions, wenxinScoreLevels } from '../data/quizContent'
import { getGuofengVisualPath } from '../data/visualAssets'
import { useAuth } from '../hooks/useAuth'
import { submitWenxinQuizResult } from '../lib/services'
import type { WenxinQuizAnswerMap, WenxinQuizResult } from '../lib/types'

// 这个常量表示问心考核通过线，返回值用于决定是否开放登记入册。
const passScore = 80

// 这个函数判断两个答案数组是否完全一致，入参是用户答案和正确答案，返回值表示是否答对。
function isSameAnswer(userAnswer: string[], correctAnswer: string[]): boolean {
  // 这里先排序再比较，避免多选题选项顺序影响判断。
  const left = [...userAnswer].sort().join('')
  const right = [...correctAnswer].sort().join('')

  return left === right
}

// 这个函数根据分数生成中文建议，入参是分数，返回值是对应分档说明。
function getScoreAdvice(score: number): string {
  // 这里从分档表中找到匹配分数的建议，没有命中时给最低档兜底。
  return wenxinScoreLevels.find((item) => score >= item.min && score <= item.max)?.text ?? wenxinScoreLevels[wenxinScoreLevels.length - 1].text
}

// 这个函数把题号格式化成两位数字，入参是题号，返回值用于题号导航显示。
function formatQuestionNumber(questionId: number): string {
  // 这里统一补零，让题号按钮在视觉上更整齐。
  return String(questionId).padStart(2, '0')
}

// 这个函数渲染问心考核页面，入参为空，返回值是按设计稿重写后的试卷、须知和交卷区域。
export function WenxinQuizPage() {
  // 这里读取登录资料，考核结果必须绑定账号后才能保存。
  const { profile, loading } = useAuth()
  // 这个状态保存用户答案，键是题号，值是选择的选项。
  const [answers, setAnswers] = useState<WenxinQuizAnswerMap>({})
  // 这个状态保存提交后的最新结果，返回值用于显示成绩。
  const [result, setResult] = useState<WenxinQuizResult | null>(null)
  // 这个状态保存当前正在作答的题目位置，从 0 开始计算。
  const [currentIndex, setCurrentIndex] = useState(0)
  // 这个状态保存被标记的题号，返回值用于题号导航和标记按钮高亮。
  const [markedQuestionIds, setMarkedQuestionIds] = useState<number[]>([])
  // 这个状态表示是否正在提交，返回值用于禁用交卷按钮。
  const [submitting, setSubmitting] = useState(false)
  // 这个状态保存页面提示，返回值用于展示登录、漏答、提交结果。
  const [notice, setNotice] = useState<{ type: 'success' | 'error' | 'info'; title: string; message: string } | null>(null)

  // 这个变量保存已答题数，用于顶部进度展示。
  const answeredCount = useMemo(() => {
    return wenxinQuizQuestions.filter((question) => (answers[String(question.id)] ?? []).length > 0).length
  }, [answers])

  // 这个变量保存题目总数，返回值用于进度条和翻题按钮。
  const totalQuestions = wenxinQuizQuestions.length
  // 这个变量保存当前题目，返回值用于页面一次只展示一道题。
  const currentQuestion = wenxinQuizQuestions[currentIndex] ?? wenxinQuizQuestions[0]
  // 这个变量保存当前题目的作答内容，返回值用于选项高亮和下一题校验。
  const currentAnswer = answers[String(currentQuestion.id)] ?? []
  // 这个变量表示当前题目是否已经作答，返回值用于控制下一题按钮。
  const currentAnswered = currentAnswer.length > 0
  // 这个变量表示当前题目是否已标记，返回值用于按钮文案和样式。
  const currentMarked = markedQuestionIds.includes(currentQuestion.id)
  // 这个变量保存当前进度百分比，返回值用于顶部进度条宽度。
  const progressPercent = Math.round((answeredCount / totalQuestions) * 100)
  // 这个变量保存剩余未答题数，返回值用于侧边状态卡和登录提示。
  const remainingCount = Math.max(totalQuestions - answeredCount, 0)
  // 这个变量保存题目背景插图，返回值用于题目解析卡片的右侧山水。
  const quizSceneImage = getGuofengVisualPath('quiz')

  // 这个函数切换某题答案，入参是题号、题型和选项，返回值为空。
  function toggleAnswer(questionId: number, type: 'single' | 'multiple', optionKey: string) {
    const key = String(questionId)

    setAnswers((current) => {
      // 这里单选题直接覆盖为唯一答案。
      if (type === 'single') {
        return { ...current, [key]: [optionKey] }
      }

      // 这里多选题再次点击同一个选项会取消选择。
      const currentValues = current[key] ?? []
      const nextValues = currentValues.includes(optionKey)
        ? currentValues.filter((item) => item !== optionKey)
        : [...currentValues, optionKey]

      return { ...current, [key]: nextValues }
    })

    // 这里单选题选完后自动进入下一题，减少手机端反复点击下一题的麻烦。
    if (type === 'single' && currentIndex < totalQuestions - 1) {
      window.setTimeout(() => {
        goToQuestion(currentIndex + 1)
      }, 260)
    }
  }

  // 这个函数跳转到指定题目，入参是题目位置，返回值为空。
  function goToQuestion(nextIndex: number) {
    // 这里把题目位置限制在有效范围内，避免越界导致页面没有题目可显示。
    const safeIndex = Math.min(Math.max(nextIndex, 0), totalQuestions - 1)
    setCurrentIndex(safeIndex)
    setNotice(null)
  }

  // 这个函数进入下一题，入参为空，返回值为空。
  function goNextQuestion() {
    // 这里要求当前题目先作答，再进入下一题，避免用户不小心漏题。
    if (!currentAnswered) {
      setNotice({ type: 'info', title: '先答完这一题', message: '当前题目还没有选择答案，作答后再进入下一题。' })
      return
    }

    setNotice(null)
    goToQuestion(currentIndex + 1)
  }

  // 这个函数回到上一题，入参为空，返回值为空。
  function goPrevQuestion() {
    setNotice(null)
    goToQuestion(currentIndex - 1)
  }

  // 这个函数切换当前题目标记，入参为空，返回值为空。
  function toggleCurrentMark() {
    setMarkedQuestionIds((current) => {
      // 这里已标记时再次点击会取消标记，方便用户整理需要回看的题。
      if (current.includes(currentQuestion.id)) {
        return current.filter((questionId) => questionId !== currentQuestion.id)
      }

      return [...current, currentQuestion.id]
    })
  }

  // 这个函数提示错题记录生成时机，入参为空，返回值为空。
  function showMistakeHint() {
    // 这里先给明确反馈，避免按钮点了没有反应；真实错题明细仍以交卷结果为准。
    setNotice({ type: 'info', title: '交卷后生成', message: '错题记录会在完成交卷后根据本次答案生成，请先答完全部题目。' })
  }

  // 这个函数计算当前答案得分，入参为空，返回值包含分数和答对数量。
  function calculateScore() {
    // 这里逐题判断答案是否完全正确，单选和多选都按题给分。
    return wenxinQuizQuestions.reduce(
      (summary, question) => {
        const userAnswer = answers[String(question.id)] ?? []
        const correct = isSameAnswer(userAnswer, question.answer)

        return {
          score: summary.score + (correct ? question.score : 0),
          singleCorrect: summary.singleCorrect + (correct && question.type === 'single' ? 1 : 0),
          multipleCorrect: summary.multipleCorrect + (correct && question.type === 'multiple' ? 1 : 0)
        }
      },
      { score: 0, singleCorrect: 0, multipleCorrect: 0 }
    )
  }

  // 这个函数提交考核，入参是表单事件，返回值为空。
  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    // 这里要求先登录，保证成绩能回到用户小院和后台。
    if (!profile) {
      setNotice({ type: 'error', title: '请先登录', message: '问云考核需要绑定你的问云小院账号，登录后才能记录成绩。' })
      return
    }

    // 这里检查是否完成全部题目，避免漏答造成误判。
    if (answeredCount < totalQuestions) {
      setNotice({ type: 'error', title: '还有题未作答', message: `当前已答 ${answeredCount} 题，请完成 ${totalQuestions} 题后再交卷。` })
      return
    }

    try {
      setSubmitting(true)
      const scoreSummary = calculateScore()
      const passed = scoreSummary.score >= passScore
      const saveResult = await submitWenxinQuizResult({
        score: scoreSummary.score,
        total_score: 100,
        passed,
        single_correct: scoreSummary.singleCorrect,
        multiple_correct: scoreSummary.multipleCorrect,
        answers
      })

      setResult(saveResult.data)
      setNotice({
        type: saveResult.ok && passed ? 'success' : saveResult.ok ? 'info' : 'error',
        title: saveResult.ok ? (passed ? '问云合格' : '已记录本次考核') : '提交失败',
        message: saveResult.ok ? `${scoreSummary.score} 分，${getScoreAdvice(scoreSummary.score)}。` : saveResult.message
      })
    } finally {
      // 这里无论保存成功或失败都恢复按钮状态，避免交卷按钮一直不可点。
      setSubmitting(false)
    }
  }

  return (
    <section className="interaction-reference-page quiz-reference-page" aria-label="问云考核">
      <div className="interaction-paper-shell">
        {/* 这里还原设计稿顶部标题、进度条和当前得分卡。 */}
        <header className="interaction-page-heading quiz-page-heading">
          <div className="interaction-title-cluster">
            <GeneratedIcon className="interaction-title-icon" name="shield" />
            <div>
              <h1>问云考核</h1>
              <p>以心明规，方可入派</p>
            </div>
          </div>
          <div className="quiz-progress-card">
            <span>进度：{answeredCount} / {totalQuestions}</span>
            <small>尚余 {remainingCount} 题</small>
            <div>
              <i style={{ width: `${progressPercent}%` }} />
            </div>
          </div>
          <div className="quiz-score-card">
            <span>当前得分</span>
            <strong>{result ? result.score : '--'} 分</strong>
          </div>
        </header>

        <div className="quiz-visual-rule" aria-hidden="true" />

        {notice ? (
          <div className="interaction-notice-row">
            <StatusNotice type={notice.type} title={notice.title} message={notice.message} />
          </div>
        ) : null}

        {loading ? (
          <section className="interaction-corner-card quiz-gate-card" aria-label="正在读取登录状态">
            <GeneratedIcon className="interaction-state-icon" name="gate" />
            <div>
              <h2>正在开卷</h2>
              <p>系统正在确认你的问云小院账号，请稍候片刻。</p>
            </div>
          </section>
        ) : !profile ? (
          <section className="interaction-corner-card quiz-gate-card" aria-label="登录后参加问云考核">
            <AlertTriangle className="quiz-gate-warning" />
            <div>
              <h2>请先登录小院</h2>
              <p>问云考核需要绑定你的问云小院账号，合格成绩会用于递交名帖和后台审核。</p>
              <Link className="interaction-primary-button" to="/login">
                登录后开考
              </Link>
            </div>
          </section>
        ) : (
        <form className="quiz-reference-form" onSubmit={handleSubmit}>
          <div className="quiz-reference-layout">
            {/* 这里还原设计稿左侧大试卷卡。 */}
            <main className="quiz-main-column">
              <section className="interaction-corner-card quiz-question-card" aria-label="当前题目">
                <div className="quiz-question-head">
                  <p>
                    第 {formatQuestionNumber(currentQuestion.id)} 题 <span>({currentQuestion.type === 'single' ? '单选题' : '多选题'})</span>
                  </p>
                  <small>本题 {currentQuestion.score} 分</small>
                </div>
                <div className="quiz-question-source">出处：{currentQuestion.source}</div>
                <h2>{currentQuestion.title}</h2>
                <div className="quiz-option-grid">
                  {currentQuestion.options.map((option) => {
                    // 这个变量判断当前选项是否已经被选择，用于切换深青选中态。
                    const selected = currentAnswer.includes(option.key)

                    return (
                      <button className={`quiz-option-button ${selected ? 'is-selected' : ''}`} key={option.key} onClick={() => toggleAnswer(currentQuestion.id, currentQuestion.type, option.key)} type="button">
                        <span>{option.key}.</span>
                        <em>{option.text}</em>
                        {selected ? <CheckCircle2 className="h-4 w-4" /> : null}
                      </button>
                    )
                  })}
                </div>
              </section>

              <section className="interaction-corner-card quiz-analysis-card" aria-label="题目解析">
                <div>
                  <p>题目解析（作答后可见）</p>
                  <span>问云派倡导清明自守，行事有不争之界，也有互相照见之心。</span>
                </div>
                <img alt="" aria-hidden="true" src={quizSceneImage} />
              </section>
            </main>

            {/* 这里还原设计稿右侧须知和本次状态卡。 */}
            <aside className="quiz-side-column" aria-label="考核须知">
              <section className="interaction-corner-card quiz-rule-card">
                <h2>考核须知</h2>
                <ul>
                  <li>共 {totalQuestions} 题，总分 100 分</li>
                  <li>80 分及以上为合格</li>
                  <li>单选题只选一项，多选题需选全</li>
                  <li>交卷后不可修改本次答案</li>
                </ul>
              </section>
              <section className="interaction-corner-card quiz-state-card">
                <h2>本次状态</h2>
                <strong>{answeredCount === totalQuestions ? '可以交卷' : '进行中'}</strong>
                <p>还需作答 {remainingCount} 题，已标记 {markedQuestionIds.length} 题。</p>
              </section>
              <section className="interaction-corner-card quiz-map-card" aria-label="题号导航">
                <h2>题号导航</h2>
                <div className="quiz-map-legend" aria-label="题号状态说明">
                  <span><i />答题中</span>
                  <span><i />已答题</span>
                  <span><i />标记题</span>
                  <span><i />未答题</span>
                </div>
                <div className="quiz-question-map">
                  {wenxinQuizQuestions.map((question, index) => {
                    // 这个变量表示该题是否已经有答案，用于题号按钮的完成态。
                    const answered = (answers[String(question.id)] ?? []).length > 0
                    // 这个变量表示该题是否被标记，用于题号按钮的星标态。
                    const marked = markedQuestionIds.includes(question.id)
                    // 这个变量表示该题是否是当前题，用于题号按钮的当前态。
                    const active = index === currentIndex

                    return (
                      <button
                        aria-label={`跳到第 ${question.id} 题`}
                        className={`quiz-map-button ${active ? 'is-active' : ''} ${answered ? 'is-answered' : ''} ${marked ? 'is-marked' : ''}`}
                        key={question.id}
                        onClick={() => goToQuestion(index)}
                        type="button"
                      >
                        {formatQuestionNumber(question.id)}
                      </button>
                    )
                  })}
                </div>
              </section>
            </aside>
          </div>

          {/* 这里还原底部上一题、标记、下一题和交卷按钮。 */}
          <div className="quiz-action-bar">
            <button className="interaction-ghost-button quiz-prev-button" disabled={currentIndex === 0} onClick={goPrevQuestion} type="button">
              <ChevronLeft className="h-4 w-4" />
              上一题
            </button>
            <button className={`interaction-ghost-button quiz-mark-button ${currentMarked ? 'is-marked' : ''}`} onClick={toggleCurrentMark} type="button">
              <Star className="h-4 w-4" />
              {currentMarked ? '取消标记' : '标记本题'}
            </button>
            <button className="interaction-ghost-button quiz-mistake-button" onClick={showMistakeHint} type="button">
              <FileText className="h-4 w-4" />
              错题记录
            </button>
            {currentIndex < totalQuestions - 1 ? (
              <button className="interaction-primary-button quiz-next-button" disabled={!currentAnswered} onClick={goNextQuestion} type="button">
                下一题
                <ChevronRight className="h-4 w-4" />
              </button>
            ) : (
              <button className="interaction-seal-button quiz-submit-button" disabled={submitting || !profile || answeredCount < totalQuestions} type="submit">
                {submitting ? '正在交卷...' : '交卷'}
                <Send className="h-4 w-4" />
              </button>
            )}
          </div>

          {result?.passed && profile ? (
            <div className="quiz-pass-card">
              <CheckCircle2 className="h-5 w-5" />
              <p>你已通过问云考核，可以前往问云名册递交登记。</p>
              <Link className="interaction-small-link" to="/join">
                前往登记
              </Link>
            </div>
          ) : null}
        </form>
        )}
      </div>
    </section>
  )
}
