import { GeneratedIcon, type GeneratedIconName } from '../components/GeneratedIcon'
import { PageShell } from '../components/PageShell'
import { RitualCard } from '../components/RitualCard'
import { ScrollPanel } from '../components/ScrollPanel'
import { SectionTitle } from '../components/SectionTitle'
import { sectRoles, spiritItems } from '../data/siteContent'

// 这个数组保存山门介绍顶部三张大卡，入参为空，返回值用于复刻设计稿的三栏说明。
const aboutFeatureCards: Array<{ title: string; text: string; icon: GeneratedIconName }> = [
  { title: '立派愿景', text: '成为当今纷乱社会中，一处可停靠的港湾，一个温馨的家。', icon: 'gate' },
  { title: '门派总旨', text: '问云问心，守真守善。同道相扶，来去自由。', icon: 'lantern' },
  { title: '宗门所在', text: '初以微信群为主要山门，后续视规模发展线下雅集。', icon: 'user' }
]

// 这个函数渲染山门介绍页，入参为空，返回值是门派愿景、门风和架构。
export function AboutPage() {
  return (
    <PageShell className="compact-design-page about-design-page" size="wide">
      <SectionTitle center eyebrow="山门介绍" title="问云派，不是冷群，是有规矩的家" visual="about">
        身处尘世，不失清明；心有疑问，仍向云天；来者可歇，去者自由。
      </SectionTitle>

      <div className="about-feature-grid grid gap-6 lg:grid-cols-3">
        {aboutFeatureCards.map((item, index) => (
          <RitualCard className="about-feature-card min-h-64" delay={index * 0.05} key={item.title}>
            <GeneratedIcon className="h-14 w-14" name={item.icon} />
            <h2 className="ink-title mt-7 text-3xl font-bold">{item.title}</h2>
            <p className="mt-4 leading-8 text-[#526461]">{item.text}</p>
          </RitualCard>
        ))}
      </div>

      <section className="about-spirit-section py-16">
        <ScrollPanel className="about-spirit-ledger seal-mark-bg">
          <p className="inline-flex rounded-lg border border-[#2f6f68]/20 bg-white/72 px-3 py-1 text-sm font-semibold text-[#b8473f]">问云门风</p>
          <div className="mt-5 grid gap-8 lg:grid-cols-[0.48fr_1fr] lg:items-end">
            <div>
              <h2 className="ink-title text-balance text-5xl font-bold leading-tight text-[#143044] md:text-7xl">
                清、暖、真、和、静、善、自由、有界
              </h2>
              <p className="mt-5 leading-8 text-[#526461]">凡问云同门，当常念：我在此处说的每一句话，都在共同塑造这个家。</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {spiritItems.map((item) => (
                <div className="about-spirit-chip rounded-lg border border-[#c9a45c]/25 bg-white/60 p-4" key={item.title}>
                  <p className="ink-title text-2xl font-bold text-[#9e3d32]">{item.title}</p>
                  <p className="mt-3 text-sm leading-7 text-[#526461]">{item.text}</p>
                </div>
              ))}
            </div>
          </div>
        </ScrollPanel>
      </section>

      <section className="about-role-section">
        <SectionTitle eyebrow="宗门架构" title="从简设职，不以名位压人">
          架构服务于秩序，不服务于威风。掌门、执事、护灯人与同门，共同守护这盏灯。
        </SectionTitle>
        <div className="about-role-ledger grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {sectRoles.map((role, index) => (
            <ScrollPanel className="about-role-card" key={role.title}>
              <p className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-[#fff8e8] text-sm font-bold text-[#9e3d32]">
                {index + 1}
              </p>
              <h3 className="ink-title text-2xl font-bold">{role.title}</h3>
              <p className="mt-4 leading-8 text-[#526461]">{role.text}</p>
            </ScrollPanel>
          ))}
        </div>
      </section>
    </PageShell>
  )
}
