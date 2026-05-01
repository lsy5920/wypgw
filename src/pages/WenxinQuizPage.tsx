import { CheckCircle2, ChevronLeft, ChevronRight, RotateCcw, ScrollText, Send } from 'lucide-react'
import { FormEvent, useMemo, useState } from 'react'
import { CloudButton } from '../components/CloudButton'
import { LoginRequiredNotice } from '../components/LoginRequiredNotice'
import { PageShell } from '../components/PageShell'
import { ScrollPanel } from '../components/ScrollPanel'
import { SectionTitle } from '../components/SectionTitle'
import { StatusNotice } from '../components/StatusNotice'
import { wenxinQuizQuestions, wenxinScoreLevels } from '../data/quizContent'
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

// 这个函数渲染问心考核页面，入参为空，返回值是逐题作答的自动计分试卷。
export function WenxinQuizPage() {
  // 这里读取登录资料，考核结果必须绑定账号。
  const { profile, loading } = useAuth()
  // 这个状态保存用户答案，键是题号，值是选择的选项。
  const [answers, setAnswers] = useState<WenxinQuizAnswerMap>({})
  // 这个状态保存提交后的最新结果。
  const [result, setResult] = useState<WenxinQuizResult | null>(null)
  // 这个状态保存当前正在作答的题目位置，从 0 开始计算。
  const [currentIndex, setCurrentIndex] = useState(0)
  // 这个状态表示是否正在提交。
  const [submitting, setSubmitting] = useState(false)
  // 这个状态保存页面提示。
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
  // 这个变量保存当前进度百分比，返回值用于顶部进度条宽度。
  const progressPercent = Math.round(((currentIndex + 1) / totalQuestions) * 100)

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
  }

  // 这个函数跳转到指定题目，入参是题目位置，返回值为空。
  function goToQuestion(nextIndex: number) {
    // 这里把题目位置限制在有效范围内，避免越界导致页面没有题目可显示。
    const safeIndex = Math.min(Math.max(nextIndex, 0), totalQuestions - 1)
    setCurrentIndex(safeIndex)
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
      setNotice({ type: 'error', title: '请先登录', message: '问心考核需要绑定你的问云小院账号，登录后才能记录成绩。' })
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
        title: saveResult.ok ? (passed ? '问心合格' : '已记录本次考核') : '提交失败',
        message: saveResult.ok ? `${scoreSummary.score} 分，${getScoreAdvice(scoreSummary.score)}。` : saveResult.message
      })
    } finally {
      setSubmitting(false)
    }
  }

  // 这个函数清空当前答案，入参为空，返回值为空。
  function resetAnswers() {
    setAnswers({})
    setResult(null)
    setNotice(null)
    setCurrentIndex(0)
  }

  return (
    <PageShell className="overflow-x-hidden" size="normal">
      <SectionTitle center eyebrow="问心考核" title="一题一问，照见门风">
        此卷共三十题，皆据《问云派立派金典》而设。逐题作答，答案皆可于金典中查得；最新成绩合格后，方可递交问云名帖。
      </SectionTitle>

      <div className="grid gap-5 md:grid-cols-4">
        <ScrollPanel className="md:col-span-1">
          <ScrollText className="h-5 w-5 text-[#9e3d32]" />
          <p className="mt-3 text-sm text-[#7a6a48]">题型</p>
          <p className="mt-2 text-2xl font-bold text-[#143044]">30 题</p>
          <p className="mt-2 text-sm leading-7 text-[#526461]">单选 25 题，每题 3 分；多选 5 题，每题 5 分。</p>
        </ScrollPanel>
        <ScrollPanel className="md:col-span-1">
          <CheckCircle2 className="h-5 w-5 text-[#6f8f8b]" />
          <p className="mt-3 text-sm text-[#7a6a48]">通过线</p>
          <p className="mt-2 text-2xl font-bold text-[#143044]">80 分</p>
          <p className="mt-2 text-sm leading-7 text-[#526461]">最新一次考核合格后，名册登记入口才会开放。</p>
        </ScrollPanel>
        <ScrollPanel className="md:col-span-2">
          <p className="text-sm text-[#9e3d32]">考核说明</p>
          <p className="mt-3 text-sm leading-7 text-[#526461]">
            此考非为难新人，乃为使入门者先知问云之愿、问云之风、问云之规、问云之界。愿来者不添风浪，只添灯火。
          </p>
          <div className="mt-4 flex flex-wrap gap-2 text-xs">
            {wenxinScoreLevels.map((item) => (
              <span className="rounded-full bg-white/70 px-3 py-1 text-[#526461]" key={item.text}>
                {item.min}—{item.max} 分：{item.text}
              </span>
            ))}
          </div>
        </ScrollPanel>
      </div>

      <div className="mt-6 grid gap-4">
        {!profile && !loading ? (
          <LoginRequiredNotice title="考核前请先登录" message="问心考核成绩需要记录到你的问云小院，登录后合格成绩会自动用于登记入册。" />
        ) : null}
        {notice ? <StatusNotice type={notice.type} title={notice.title} message={notice.message} /> : null}
        {result?.passed ? (
          <ScrollPanel className="border-[#7a8b6f]/35 bg-[#f1f7e9]/80">
            <p className="text-lg font-semibold text-[#314434]">你已通过问心考核，可以前往问云名册递交登记。</p>
            <CloudButton className="mt-4" to="/join" variant="seal">
              前往登记入册
            </CloudButton>
          </ScrollPanel>
        ) : null}
      </div>

      <form className="mt-8 grid min-w-0 gap-5" onSubmit={handleSubmit}>
        <ScrollPanel className="min-w-0 overflow-hidden p-5 md:p-8 seal-mark-bg">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm font-semibold text-[#9e3d32]">
              第 {currentQuestion.id} 题 · {currentQuestion.type === 'single' ? '单选题' : '多选题'} · {currentQuestion.score} 分
            </p>
            <p className="text-xs text-[#7a6a48]">{currentQuestion.source}</p>
          </div>

          <div className="mt-4 h-2 overflow-hidden rounded-full bg-[#edf3ef]">
            <div className="h-full rounded-full bg-[#6f8f8b] transition-all" style={{ width: `${progressPercent}%` }} />
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-[#526461]">
            <span>
              进度 {currentIndex + 1} / {totalQuestions}
            </span>
            <span>
              已答 {answeredCount} / {totalQuestions} 题
            </span>
          </div>

          <div className="mt-4 flex max-w-full gap-2 overflow-x-auto pb-2">
            {wenxinQuizQuestions.map((question, index) => {
              // 这里判断每个题号是否已经作答，用不同颜色帮助用户快速定位漏题。
              const answered = (answers[String(question.id)] ?? []).length > 0
              const current = index === currentIndex

              return (
                <button
                  className={`h-9 min-w-9 rounded-full border text-xs font-semibold transition ${
                    current
                      ? 'border-[#9e3d32] bg-[#9e3d32] text-white'
                      : answered
                        ? 'border-[#6f8f8b] bg-[#edf3ef] text-[#526461]'
                        : 'border-[#c9a45c]/35 bg-white/70 text-[#7a6a48]'
                  }`}
                  key={question.id}
                  onClick={() => goToQuestion(index)}
                  type="button"
                >
                  {question.id}
                </button>
              )
            })}
          </div>

          <h2 className="mt-5 break-words text-xl font-bold leading-9 text-[#143044] md:text-2xl">{currentQuestion.title}</h2>
          <div className="mt-5 grid gap-3">
            {currentQuestion.options.map((option) => {
              const selected = currentAnswer.includes(option.key)

              return (
                <button
                  className={`w-full min-w-0 whitespace-normal break-words rounded-2xl border px-4 py-3 text-left text-sm leading-7 transition ${
                    selected ? 'border-[#6f8f8b] bg-[#edf3ef] text-[#143044]' : 'border-[#6f8f8b]/18 bg-white/70 text-[#526461]'
                  }`}
                  key={option.key}
                  onClick={() => toggleAnswer(currentQuestion.id, currentQuestion.type, option.key)}
                  type="button"
                >
                  <span className="font-semibold">{option.key}. </span>
                  {option.text}
                </button>
              )
            })}
          </div>
        </ScrollPanel>

        <div className="sticky bottom-4 z-20 grid min-w-0 gap-3 rounded-3xl border border-[#c9a45c]/35 bg-[#fffaf0]/92 p-4 shadow-2xl shadow-[#263238]/16 backdrop-blur md:flex md:flex-row md:items-center md:justify-between">
          <p className="text-sm font-semibold text-[#526461]">
            第 {currentIndex + 1} 题，共 {totalQuestions} 题
          </p>
          <div className="grid min-w-0 grid-cols-2 gap-2 sm:flex sm:flex-wrap">
            <CloudButton className="w-full px-3 sm:w-auto sm:px-5" onClick={resetAnswers} variant="ghost">
              重新作答
              <RotateCcw className="h-4 w-4" />
            </CloudButton>
            <CloudButton className="w-full px-3 sm:w-auto sm:px-5" disabled={currentIndex === 0} onClick={goPrevQuestion} variant="ghost">
              上一题
              <ChevronLeft className="h-4 w-4" />
            </CloudButton>
            {currentIndex < totalQuestions - 1 ? (
              <CloudButton className="col-span-2 w-full px-3 sm:w-auto sm:px-5" disabled={!currentAnswered} onClick={goNextQuestion} variant="seal">
                下一题
                <ChevronRight className="h-4 w-4" />
              </CloudButton>
            ) : (
              <CloudButton className="col-span-2 w-full px-3 sm:w-auto sm:px-5" disabled={submitting || !profile || answeredCount < totalQuestions} type="submit" variant="seal">
                {submitting ? '正在交卷...' : '交卷并记录成绩'}
                <Send className="h-4 w-4" />
              </CloudButton>
            )}
          </div>
        </div>
      </form>
    </PageShell>
  )
}
