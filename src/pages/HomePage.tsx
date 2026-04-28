import { motion } from 'framer-motion'
import { ArrowRight, BookOpen, Cloud, Lamp, ShieldCheck, Sparkles } from 'lucide-react'
import { useEffect, useState } from 'react'
import { CloudButton } from '../components/CloudButton'
import { ScrollPanel } from '../components/ScrollPanel'
import { SectionTitle } from '../components/SectionTitle'
import { StatusNotice } from '../components/StatusNotice'
import { joinSteps, spiritItems } from '../data/siteContent'
import { getPublicAsset } from '../lib/assets'
import { fetchApprovedLanterns, fetchPublishedAnnouncements } from '../lib/services'
import type { Announcement, CloudLantern } from '../lib/types'

// 这个函数渲染官网首页，入参为空，返回值是完整的山门首页。
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
      <section className="relative overflow-hidden">
        {/* 这里使用本地生成的山门主视觉作为首页背景，保证第一屏有实际视觉资产。 */}
        <div className="absolute inset-0">
          <img className="h-full w-full object-cover" src={getPublicAsset('wenyun-hero.png')} alt="问云派山门远山主视觉" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#f6f4ef]/95 via-[#f6f4ef]/70 to-[#f6f4ef]/20" />
          <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-[#f6f4ef] to-transparent" />
        </div>

        {/* 这里放置漂移云雾层，制造轻微江湖氛围。 */}
        <div className="cloud-drift pointer-events-none absolute left-8 top-24 h-20 w-72 rounded-full bg-white/45 blur-2xl" />
        <div className="cloud-drift pointer-events-none absolute right-20 top-40 h-24 w-96 rounded-full bg-[#dbe9e4]/50 blur-3xl" />

        <div className="relative mx-auto grid min-h-[calc(100vh-112px)] max-w-7xl items-center gap-10 px-4 py-12 md:px-6 lg:grid-cols-[1.1fr_0.9fr]">
          <motion.div
            animate={{ opacity: 1, y: 0 }}
            initial={{ opacity: 0, y: 24 }}
            transition={{ duration: 0.7, ease: 'easeOut' }}
          >
            {/* 这里展示门派正式 Logo，让品牌第一眼就被看见。 */}
            <img
              className="mb-6 h-24 w-24 rounded-full object-cover shadow-2xl shadow-[#c9a45c]/30 md:h-32 md:w-32"
              src={getPublicAsset('wenyun-logo.png')}
              alt="问云派门派 Logo"
            />
            <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#c9a45c]/45 bg-white/65 px-4 py-2 text-sm text-[#7a6a48]">
              <Sparkles className="h-4 w-4" />
              线上山门 · 温暖港湾 · 江湖同道
            </p>
            <h1 className="ink-title max-w-3xl text-6xl font-black leading-tight text-[#143044] md:text-8xl">问云派</h1>
            <p className="mt-5 text-2xl font-semibold text-[#9e3d32] md:text-3xl">乱世问云，心有所栖。</p>
            <p className="mt-6 max-w-2xl text-lg leading-9 text-[#40524f]">
              当今社会太乱，人心奔忙，环境纷杂。问云派愿成为一处可停靠的港湾，一个温馨的家。
              此处不问来路高低，只愿真诚相待。
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <CloudButton to="/join" variant="seal">
                入派问路
                <ArrowRight className="h-4 w-4" />
              </CloudButton>
              <CloudButton to="/canon" variant="ghost">
                阅读金典
                <BookOpen className="h-4 w-4" />
              </CloudButton>
            </div>
          </motion.div>

          <motion.div
            animate={{ opacity: 1, scale: 1 }}
            className="hidden lg:block"
            initial={{ opacity: 0, scale: 0.94 }}
            transition={{ duration: 0.8, delay: 0.1, ease: 'easeOut' }}
          >
            <ScrollPanel className="relative overflow-hidden">
              <div className="lantern-breathe absolute right-8 top-8 h-20 w-20 rounded-full bg-[#c9a45c]/25 blur-xl" />
              <p className="ink-title text-3xl font-bold text-[#143044]">问云问心</p>
              <p className="mt-5 text-lg leading-9 text-[#526461]">
                问天地之清明，问人心之归处；问浮云何以自在，问此心何以安宁。
              </p>
              <div className="mt-8 grid grid-cols-2 gap-4">
                {['清', '暖', '真', '和'].map((word) => (
                  <div className="rounded-xl border border-[#c9a45c]/35 bg-white/60 p-5 text-center" key={word}>
                    <p className="ink-title text-4xl font-bold text-[#9e3d32]">{word}</p>
                  </div>
                ))}
              </div>
            </ScrollPanel>
          </motion.div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 md:px-6">
        {notice ? <StatusNotice title="演示模式提示" message={notice} /> : null}
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12 md:px-6">
        <SectionTitle eyebrow="为何立派" title="此处不是战场，是港湾">
          问云派不以争名为志，不以立威为先。愿在纷乱人间，留一盏温暖的灯。
        </SectionTitle>
        <div className="grid gap-5 md:grid-cols-3">
          {[
            { title: '世乱心疲', text: '当代生活节奏太快，人与人之间渐渐疏离。', icon: Cloud },
            { title: '愿作港湾', text: '不求一时热闹，只愿成为可以安心停靠之地。', icon: Lamp },
            { title: '以群为山门', text: '初以微信群为主要所在，待人心渐聚再发展线下。', icon: ShieldCheck }
          ].map((item) => {
            const Icon = item.icon

            return (
              <ScrollPanel className="min-h-56" key={item.title}>
                <Icon className="mb-5 h-9 w-9 text-[#6f8f8b]" />
                <h3 className="ink-title text-2xl font-bold">{item.title}</h3>
                <p className="mt-4 leading-8 text-[#526461]">{item.text}</p>
              </ScrollPanel>
            )
          })}
        </div>
      </section>

      <section className="bg-[#263238] py-16 text-[#f6f4ef]">
        <div className="mx-auto max-w-7xl px-4 md:px-6">
          <SectionTitle center eyebrow="门派精神" title="清、暖、真、和，静、善、自由、有界">
            <span className="text-[#d8d7ca]">每一句话，都在共同塑造这个家。</span>
          </SectionTitle>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {spiritItems.map((item, index) => (
              <motion.div
                className="rounded-2xl border border-white/10 bg-white/8 p-6"
                initial={{ opacity: 0, y: 20 }}
                key={item.title}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, delay: index * 0.05 }}
                viewport={{ once: true, margin: '-80px' }}
              >
                <p className="ink-title text-3xl font-bold text-[#c9a45c]">{item.title}</p>
                <p className="mt-4 leading-8 text-[#d8d7ca]">{item.text}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 md:px-6">
        <SectionTitle eyebrow="入派流程" title="问云而来，归心有路">
          申请不是门槛，而是彼此确认边界。愿来者真诚，守门者温和。
        </SectionTitle>
        <div className="grid gap-4 lg:grid-cols-5">
          {joinSteps.map((step, index) => (
            <div className="relative rounded-2xl border border-[#c9a45c]/35 bg-white/70 p-5" key={step}>
              <p className="mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-[#9e3d32] text-white">
                {index + 1}
              </p>
              <p className="ink-title text-2xl font-bold">{step}</p>
              {index < joinSteps.length - 1 ? (
                <ArrowRight className="absolute right-4 top-7 hidden h-5 w-5 text-[#c9a45c] lg:block" />
              ) : null}
            </div>
          ))}
        </div>
      </section>

      <section className="paper-texture py-16">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 md:px-6 lg:grid-cols-[0.9fr_1.1fr]">
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
            {lanterns.map((item) => (
              <ScrollPanel key={item.id}>
                <p className="text-sm text-[#9e3d32]">一盏云灯 · {item.mood ?? '温暖'}</p>
                <p className="mt-3 text-lg leading-8">{item.content}</p>
                <p className="mt-4 text-sm text-[#7a6a48]">—— {item.author_name}</p>
              </ScrollPanel>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 md:px-6">
        <SectionTitle eyebrow="山门近讯" title="门派公告">
          重要通知、门规更新和雅集安排都会在这里出现。
        </SectionTitle>
        <div className="grid gap-4 md:grid-cols-2">
          {announcements.map((item) => (
            <ScrollPanel key={item.id}>
              <p className="text-sm text-[#9e3d32]">{item.category}</p>
              <h3 className="mt-3 text-2xl font-bold">{item.title}</h3>
              <p className="mt-4 leading-8 text-[#526461]">{item.summary}</p>
            </ScrollPanel>
          ))}
        </div>
      </section>

      <section className="px-4 pb-20 md:px-6">
        <div className="mx-auto max-w-7xl rounded-3xl bg-[#143044] p-8 text-[#f6f4ef] md:p-12">
          <p className="ink-title text-4xl font-bold md:text-6xl">若你也在人间风雨中，想寻一处温暖之地。</p>
          <p className="mt-5 max-w-3xl leading-8 text-[#d8d7ca]">问云派山门已开。愿你此来，不添风浪，只添灯火。</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <CloudButton to="/join" variant="seal">
              申请入派
            </CloudButton>
            <CloudButton to="/contact" variant="ghost">
              叩问山门
            </CloudButton>
          </div>
        </div>
      </section>
    </>
  )
}
