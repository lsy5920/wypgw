import { ArrowRight, BookOpen, Lamp, ScrollText, ShieldCheck, Sparkles, UserRound, UsersRound } from 'lucide-react'
import { useEffect, useState } from 'react'
import { CloudButton } from '../components/CloudButton'
import { GateHero } from '../components/GateHero'
import { PageShell } from '../components/PageShell'
import { RitualCard } from '../components/RitualCard'
import { ScrollPanel } from '../components/ScrollPanel'
import { SectionTitle } from '../components/SectionTitle'
import { StatusNotice } from '../components/StatusNotice'
import { joinSteps, spiritItems } from '../data/siteContent'
import { getPublicAsset } from '../lib/assets'
import { fetchApprovedLanterns, fetchPublishedAnnouncements } from '../lib/services'
import type { Announcement, CloudLantern } from '../lib/types'

// 这个函数渲染官网首页，入参为空，返回值是重构后的名门山门首页。
export function HomePage() {
  // 这个常量保存问心考核插画路径，用于首页展示功能入口。
  const quizIllustrationPath = getPublicAsset('visual-v2/quiz-illustration-v2.svg')
  // 这个常量保存问云名册插画路径，用于首页展示公开名册气质。
  const rosterIllustrationPath = getPublicAsset('visual-v2/roster-illustration-v2.svg')
  // 这个常量保存问云小院插画路径，用于首页展示登录后的个人空间。
  const courtyardIllustrationPath = getPublicAsset('visual-v2/courtyard-illustration-v2.svg')
  // 这个常量保存云灯插画路径，用于首页云灯区域的视觉展示。
  const lanternIllustrationPath = getPublicAsset('visual-v2/lantern-illustration-v2.svg')
  // 这个常量保存灯火流程插画路径，用于入册流程展示。
  const lanternMapPath = getPublicAsset('visual-v2/lantern-map-v2.svg')
  // 这个状态保存首页展示的云灯留言。
  const [lanterns, setLanterns] = useState<CloudLantern[]>([])
  // 这个状态保存首页展示的公告。
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  // 这个状态保存演示模式提示。
  const [notice, setNotice] = useState('')

  useEffect(() => {
    // 这个函数读取首页需要的数据，入参为空，返回值为空。
    async function loadHomeData() {
      // 这里同时读取云灯和公告，减少页面等待时间。
      const [lanternResult, announcementResult] = await Promise.all([
        fetchApprovedLanterns(),
        fetchPublishedAnnouncements()
      ])

      setLanterns(lanternResult.data.slice(0, 3))
      setAnnouncements(announcementResult.data.slice(0, 2))

      // 这里在演示模式下给出温和提示，避免用户误以为已经连上数据库。
      if (lanternResult.demoMode || announcementResult.demoMode) {
        setNotice(
          '当前未读取到 Supabase 配置，页面正在展示演示数据；本地请填写 .env.local，GitHub Pages 请在仓库 Actions 密钥中填写 VITE_SUPABASE_URL 和 VITE_SUPABASE_ANON_KEY。'
        )
      }
    }

    void loadHomeData()
  }, [])

  return (
    <>
      <GateHero
        actions={
          <>
            <CloudButton className="w-full sm:w-auto" to="/join" variant="seal">
              登记名册
              <ArrowRight className="h-4 w-4" />
            </CloudButton>
            <CloudButton className="w-full sm:w-auto" to="/wenxin-quiz" variant="ghost">
              问心考核
              <ShieldCheck className="h-4 w-4" />
            </CloudButton>
            <CloudButton className="w-full sm:w-auto" to="/yard" variant="ghost">
              问云小院
              <UserRound className="h-4 w-4" />
            </CloudButton>
            <CloudButton className="w-full sm:w-auto" to="/canon" variant="ghost">
              阅读金典
              <BookOpen className="h-4 w-4" />
            </CloudButton>
          </>
        }
        eyebrow="问云山门 · 名册有序 · 门风有界"
        showLogo
        title="问云派"
      >
        <p className="text-balance">
          乱世问云，心有所栖。此处不以热闹立门，不以声势服人，只以清明、温暖、真诚与边界，守一方可归之地。
        </p>
      </GateHero>

      <PageShell size="wide">
        {notice ? <StatusNotice title="演示模式提示" message={notice} /> : null}

        <section className="grid gap-5 md:grid-cols-3">
          {[
            { title: '立派有典', text: '所有新人先读金典，知其愿、知其风、知其界。', icon: ScrollText },
            { title: '入册有序', text: '问心考核合格后方可递交名帖，执事再作审核。', icon: ShieldCheck },
            { title: '同门有礼', text: '愿说则说，愿静则静；温暖相扶，也守彼此边界。', icon: UsersRound }
          ].map((item, index) => {
            // 这个变量保存当前卡片图标组件。
            const Icon = item.icon

            return (
              <RitualCard className="min-h-52" delay={index * 0.06} key={item.title}>
                <Icon className="mb-5 h-8 w-8 text-[#a83b32]" />
                <h2 className="ink-title text-3xl font-bold text-[#102a31]">{item.title}</h2>
                <p className="mt-4 leading-8 text-[#526461]">{item.text}</p>
              </RitualCard>
            )
          })}
        </section>

        <section className="mt-16 grid gap-5 lg:grid-cols-3">
          {[
            {
              title: '问心先照己',
              text: '用一张卷轴式考卷，把门风、边界和相处规则先讲清楚。',
              image: quizIllustrationPath
            },
            {
              title: '名册见同道',
              text: '用卡片式名册展示公开资料，让同门彼此看见但不过度暴露隐私。',
              image: rosterIllustrationPath
            },
            {
              title: '小院安归处',
              text: '登录后看名帖、云灯、雅集和提醒，每个人都有自己的清静角落。',
              image: courtyardIllustrationPath
            }
          ].map((item, index) => (
            <RitualCard className="p-0" delay={index * 0.06} key={item.title}>
              {/* 这里展示每个核心功能的插画，让首页二版具备完整插画设计感。 */}
              <img className="aspect-[1.45] w-full object-cover" src={item.image} alt={`${item.title}插画`} />
              <div className="p-5 md:p-7">
                <h2 className="ink-title text-3xl font-bold text-[#122327]">{item.title}</h2>
                <p className="mt-4 leading-8 text-[#526461]">{item.text}</p>
              </div>
            </RitualCard>
          ))}
        </section>

        <section className="liquid-glass relative mt-16 overflow-hidden rounded-[2rem] px-5 py-14 text-[#f6f4ef] md:px-10">
          {/* 这里给深色精神区增加流动雾气，让区块更像山门内景。 */}
          <div className="hero-cloud-layer mist-flow pointer-events-none absolute inset-x-[-18%] top-10 h-28 opacity-30" />
          <SectionTitle center eyebrow="门派精神" title="正派之正，在于有愿、有规、有界" tone="dark">
            <span className="text-[#f4efe0]">每一句话，都在共同塑造这个家。</span>
          </SectionTitle>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {spiritItems.map((item, index) => (
              <RitualCard className="border-white/10 bg-white/8" dark delay={index * 0.04} key={item.title}>
                <p className="ink-title text-3xl font-bold text-[#c9a45c]">{item.title}</p>
                <p className="mt-4 leading-8 text-[#f4efe0]">{item.text}</p>
              </RitualCard>
            ))}
          </div>
        </section>

        <section className="mt-16 grid gap-6 lg:grid-cols-[1.08fr_0.92fr]">
          <div className="mountain-frame relative overflow-hidden rounded-[2rem] text-[#fff8e8] shadow-2xl shadow-[#102a31]/18">
            {/* 这里用云灯插画替代纯色背景，让信息架构更有画面感。 */}
            <img className="h-full min-h-96 w-full object-cover opacity-90" src={lanternIllustrationPath} alt="问云派云灯插画" />
            <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(6,23,29,0.86),rgba(6,23,29,0.18))]" />
            <div className="absolute inset-0 p-7 md:p-10">
              <p className="text-sm font-semibold text-[#f8df9d]">插画山门 · 问云有序</p>
              <h2 className="ink-title mt-3 text-balance text-4xl font-black leading-tight md:text-6xl">云起处见山门，归来时有小院</h2>
              <p className="mt-5 max-w-2xl leading-8 text-[#f4efe0]">
                前台负责让来者看见门风，小院负责安放每位同门的状态，后台负责守住审核、公告与雅集秩序。
              </p>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {[
              { value: '01', label: '先读金典' },
              { value: '02', label: '再问本心' },
              { value: '03', label: '递交名帖' },
              { value: '04', label: '归入小院' }
            ].map((item, index) => (
              <RitualCard delay={index * 0.05} key={item.label}>
                <p className="ink-title text-4xl font-black text-[#d6aa54]">{item.value}</p>
                <p className="mt-4 text-lg font-semibold text-[#102a31]">{item.label}</p>
                <p className="mt-2 text-sm leading-7 text-[#526461]">每一步都有回应，每一次申请都有边界。</p>
              </RitualCard>
            ))}
          </div>
        </section>

        <section className="mt-16">
          <SectionTitle eyebrow="入册流程" title="问云而来，归心有路">
            申请不是门槛，而是彼此确认边界。愿来者真诚，守门者温和。
          </SectionTitle>
          <ScrollPanel className="mb-5 p-0">
            {/* 这里使用灯火流程插画，把文字流程转成更直观的路线图。 */}
            <img className="w-full object-cover" src={lanternMapPath} alt="问云派入册灯火流程插画" />
          </ScrollPanel>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            {joinSteps.map((step, index) => (
              <RitualCard className="min-h-42" delay={index * 0.05} key={step}>
                <p className="mb-5 flex h-11 w-11 items-center justify-center rounded-full bg-[#9e3d32] text-white shadow-lg shadow-[#9e3d32]/22">
                  {index + 1}
                </p>
                <p className="ink-title text-2xl font-bold text-[#143044]">{step}</p>
                {index < joinSteps.length - 1 ? (
                  <ArrowRight className="absolute right-5 top-8 hidden h-5 w-5 text-[#c9a45c] xl:block" />
                ) : null}
              </RitualCard>
            ))}
          </div>
        </section>

        <section className="mt-16 grid gap-8 lg:grid-cols-[0.82fr_1.18fr]">
          <div>
            <SectionTitle eyebrow="云灯留言" title="一盏云灯，照见同道">
              给疲惫的人一句话，给陌生的同门一点温暖。留言审核后会公开展示。
            </SectionTitle>
            <CloudButton to="/cloud-lantern">
              点一盏云灯
              <Lamp className="h-4 w-4" />
            </CloudButton>
          </div>
          <div className="grid gap-4">
            {lanterns.map((item, index) => (
              <RitualCard delay={index * 0.06} key={item.id}>
                <p className="text-sm font-semibold text-[#9e3d32]">云灯 · {item.mood ?? '温暖'}</p>
                <p className="mt-3 text-lg leading-8 text-[#143044]">{item.content}</p>
                <p className="mt-4 text-sm text-[#7a6a48]">—— {item.author_name}</p>
              </RitualCard>
            ))}
          </div>
        </section>

        <section className="mt-16">
          <SectionTitle eyebrow="山门近讯" title="公告须清楚，事务有回应">
            重要通知、门规更新和雅集安排都会在这里出现。
          </SectionTitle>
          <div className="grid gap-4 md:grid-cols-2">
            {announcements.map((item, index) => (
              <RitualCard delay={index * 0.06} key={item.id}>
                <p className="inline-flex items-center gap-2 rounded-full bg-[#edf3ef] px-3 py-1 text-sm font-semibold text-[#6f8f8b]">
                  <Sparkles className="h-4 w-4" />
                  {item.category}
                </p>
                <h3 className="mt-4 text-2xl font-bold text-[#143044]">{item.title}</h3>
                <p className="mt-4 leading-8 text-[#526461]">{item.summary}</p>
              </RitualCard>
            ))}
          </div>
        </section>

        <section className="mountain-frame relative mt-16 overflow-hidden rounded-[2.25rem] p-7 text-[#fff8e8] shadow-2xl shadow-[#102a31]/20 md:p-12">
          {/* 这里用微动效光带强化最终行动区的仪式感。 */}
          <div className="hero-light-beam shine-sweep pointer-events-none absolute inset-y-0 left-[-26%] w-[78%] opacity-60" />
          <p className="ink-title relative text-balance text-4xl font-bold md:text-6xl">若你也在人间风雨中，想寻一处有规矩的温暖之地。</p>
          <p className="relative mt-5 max-w-3xl leading-8 text-[#edf3ef]">问云派山门已开。愿你此来，不添风浪，只添灯火。</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <CloudButton to="/wenxin-quiz" variant="seal">
              先过问心
            </CloudButton>
            <CloudButton to="/contact" variant="ghost">
              叩问山门
            </CloudButton>
          </div>
        </section>
      </PageShell>
    </>
  )
}
