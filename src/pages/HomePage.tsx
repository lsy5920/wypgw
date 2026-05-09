import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Lamp,
  MessageCircle,
  Sparkles,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { CloudButton } from '../components/CloudButton'
import { GateHero } from '../components/GateHero'
import { GeneratedIcon, type GeneratedIconName } from '../components/GeneratedIcon'
import { PageShell } from '../components/PageShell'
import { RitualCard } from '../components/RitualCard'
import { SectionTitle } from '../components/SectionTitle'
import { StatusNotice } from '../components/StatusNotice'
import { joinSteps, spiritItems } from '../data/siteContent'
import { fetchApprovedLanterns, fetchPublishedAnnouncements } from '../lib/services'
import type { Announcement, CloudLantern } from '../lib/types'

// 这个数组保存首页核心承诺，返回值用于首屏下方的三张说明卡片。
const promiseCards: Array<{ title: string; text: string; icon: GeneratedIconName }> = [
  { title: '先立规矩', text: '新人先读金典，先明白门风、边界和相处方式。', icon: 'scroll' },
  { title: '再问本心', text: '用问心考核确认来意，不靠热闹筛人，只靠真诚相见。', icon: 'shield' },
  { title: '归入小院', text: '通过后进入问云小院，查看名帖、云灯、雅集和提醒。', icon: 'gate' }
]

// 这个数组保存首页四个主要入口，返回值用于把网站功能变成清晰路径。
const entryCards: Array<{ title: string; text: string; path: string; icon: GeneratedIconName }> = [
  { title: '立派金典', text: '完整阅读门派总纲，知道此地为何而立。', path: '/canon', icon: 'scroll' },
  { title: '问心考核', text: '先答一份小卷，确认你理解温暖和边界。', path: '/wenxin-quiz', icon: 'shield' },
  { title: '问云名册', text: '递交名帖，公开展示愿意被看见的资料。', path: '/join', icon: 'roster' },
  { title: '云灯留言', text: '留下一句话，给后来者一点安定灯火。', path: '/cloud-lantern', icon: 'lantern' }
]

// 这个函数渲染官网首页，入参为空，返回值是重新设计后的问云派首页。
export function HomePage() {
  // 这个状态保存首页展示的云灯留言。
  const [lanterns, setLanterns] = useState<CloudLantern[]>([])
  // 这个状态保存首页展示的公告。
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  // 这个状态保存演示模式提示。
  const [notice, setNotice] = useState('')

  useEffect(() => {
    // 这个函数读取首页需要的数据，入参为空，返回值为空。
    async function loadHomeData() {
      try {
        // 这里同时读取云灯和公告，减少页面等待时间。
        const [lanternResult, announcementResult] = await Promise.all([fetchApprovedLanterns(), fetchPublishedAnnouncements()])

        setLanterns(lanternResult.data.slice(0, 3))
        setAnnouncements(announcementResult.data.slice(0, 2))

        // 这里在演示模式下给出温和提示，避免用户误以为已经连上数据库。
        if (lanternResult.demoMode || announcementResult.demoMode) {
          setNotice(
            '当前未读取到 Supabase 配置，页面正在展示演示数据；本地请填写 .env.local，GitHub Pages 请在仓库 Actions 密钥中填写 VITE_SUPABASE_URL 和 VITE_SUPABASE_ANON_KEY。'
          )
        }
      } catch {
        // 这里兜底处理首页数据读取异常，避免远程服务短暂异常时白屏。
        setNotice('首页动态内容暂时读取失败，静态内容仍可正常浏览。请稍后刷新页面重试。')
      }
    }

    void loadHomeData()
  }, [])

  return (
    <>
      <GateHero
        eyebrow="问云山门 · 清明立愿 · 有界相扶"
        showLogo
        title="问云派"
      >
        <p className="text-balance">
          问心 · 问道 · 问云派
        </p>
      </GateHero>

      <PageShell size="wide">
        {notice ? <StatusNotice title="演示模式提示" message={notice} /> : null}

        <section className="grid gap-4 md:grid-cols-3">
          {promiseCards.map((item, index) => (
            <RitualCard className="min-h-48" delay={index * 0.06} key={item.title}>
              <GeneratedIcon className="mb-5 h-14 w-14" name={item.icon} />
              <h2 className="ink-title text-3xl font-bold text-[#173332]">{item.title}</h2>
              <p className="mt-4 leading-8 text-[#526461]">{item.text}</p>
            </RitualCard>
          ))}
        </section>

        <section className="mt-16">
          <SectionTitle eyebrow="主要入口" title="每个入口都只做一件清楚的事">
            前台给来者看清门风，小院让同门管理自己，后台负责长期维护秩序。
          </SectionTitle>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {entryCards.map((item, index) => {
              return (
                <RitualCard className="group min-h-64" delay={index * 0.05} key={item.title}>
                  <GeneratedIcon className="h-14 w-14" name={item.icon} />
                  <h2 className="ink-title mt-6 text-3xl font-bold text-[#173332]">{item.title}</h2>
                  <p className="mt-4 min-h-20 leading-8 text-[#526461]">{item.text}</p>
                  <CloudButton className="mt-6 w-full justify-between" to={item.path} variant="ghost">
                    进入查看
                    <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
                  </CloudButton>
                </RitualCard>
              )
            })}
          </div>
        </section>

        <section className="mt-16">
          <SectionTitle eyebrow="门派精神" title="正派之正，在于有愿、有规、有界" visual="about">
            每一句话，都在共同塑造这个家。温暖要真实，边界也要清楚。
          </SectionTitle>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {spiritItems.map((item, index) => (
              <RitualCard className="min-h-36" delay={index * 0.04} key={item.title}>
                <p className="ink-title text-2xl font-bold text-[#b8473f]">{item.title}</p>
                <p className="mt-3 leading-7 text-[#526461]">{item.text}</p>
              </RitualCard>
            ))}
          </div>
        </section>

        <section className="mt-16">
          <SectionTitle eyebrow="入册流程" title="问云而来，归心有路" visual="roster">
            申请不是门槛，而是彼此确认边界。愿来者真诚，守门者温和。
          </SectionTitle>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            {joinSteps.map((step, index) => (
              <RitualCard className="min-h-40" delay={index * 0.05} key={step}>
                <p className="mb-5 flex h-10 w-10 items-center justify-center rounded-lg bg-[#b8473f] text-sm font-bold text-white shadow-md shadow-[#b8473f]/22">
                  {index + 1}
                </p>
                <p className="ink-title text-2xl font-bold text-[#173332]">{step}</p>
                <p className="mt-3 text-sm leading-7 text-[#526461]">这一步完成后，下一步才会更稳。</p>
              </RitualCard>
            ))}
          </div>
        </section>

        <section className="mt-16">
          <SectionTitle eyebrow="云灯留言" title="一盏云灯，照见同道" visual="cloudLantern">
            给疲惫的人一句话，给陌生的同门一点温暖。留言审核后会公开展示。
          </SectionTitle>
          <div className="grid gap-8 lg:grid-cols-[0.85fr_1.15fr]">
            <div>
            <CloudButton to="/cloud-lantern">
              点一盏云灯
              <Lamp className="h-4 w-4" />
            </CloudButton>
            </div>
            <div className="grid gap-4">
              {lanterns.map((item, index) => (
                <RitualCard delay={index * 0.06} key={item.id}>
                  <p className="flex items-center gap-2 text-sm font-semibold text-[#b8473f]">
                    <MessageCircle className="h-4 w-4" />
                    云灯 · {item.mood ?? '温暖'}
                  </p>
                  <p className="mt-3 text-lg leading-8 text-[#173332]">{item.content}</p>
                  <p className="mt-4 text-sm text-[#7b6b4a]">—— {item.author_name}</p>
                </RitualCard>
              ))}
            </div>
          </div>
        </section>

        <section className="mt-16">
          <SectionTitle eyebrow="山门近讯" title="公告须清楚，事务有回应" visual="announcements">
            重要通知、门规更新和雅集安排都会在这里出现。
          </SectionTitle>
          <div className="grid gap-4 md:grid-cols-2">
            {announcements.map((item, index) => (
              <RitualCard delay={index * 0.06} key={item.id}>
                <p className="inline-flex items-center gap-2 rounded-lg bg-[#e4f0eb] px-3 py-1 text-sm font-semibold text-[#0f5f59]">
                  <Sparkles className="h-4 w-4" />
                  {item.category}
                </p>
                <h3 className="mt-4 text-2xl font-bold text-[#173332]">{item.title}</h3>
                <p className="mt-4 leading-8 text-[#526461]">{item.summary}</p>
              </RitualCard>
            ))}
          </div>
        </section>

        <section className="mountain-frame relative mt-16 overflow-hidden rounded-lg p-7 text-[#fff8e8] shadow-xl shadow-[#173332]/18 md:p-12">
          {/* 这里用扫光效果强化最终行动区，但保持文字清晰可读。 */}
          <div className="hero-light-beam shine-sweep pointer-events-none absolute inset-y-0 left-[-26%] w-[78%] opacity-50" />
          <div className="relative grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end">
            <div>
              <p className="ink-title text-balance text-4xl font-bold leading-tight md:text-6xl">
                若你也想寻一处有规矩的温暖之地。
              </p>
              <p className="mt-5 max-w-3xl leading-8 text-[#edf3ef]">问云派山门已开。愿你此来，不添风浪，只添灯火。</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <CloudButton to="/wenxin-quiz" variant="seal">
                先过问心
                <CheckCircle2 className="h-4 w-4" />
              </CloudButton>
              <CloudButton to="/events" variant="ghost">
                查看雅集
                <CalendarDays className="h-4 w-4" />
              </CloudButton>
            </div>
          </div>
        </section>

      </PageShell>
    </>
  )
}
