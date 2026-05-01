import { Home, Lamp, Users } from 'lucide-react'
import { PageShell } from '../components/PageShell'
import { RitualCard } from '../components/RitualCard'
import { ScrollPanel } from '../components/ScrollPanel'
import { SectionTitle } from '../components/SectionTitle'
import { sectRoles, spiritItems } from '../data/siteContent'

// 这个函数渲染山门介绍页，入参为空，返回值是门派愿景、门风和架构。
export function AboutPage() {
  return (
    <PageShell size="wide">
      <SectionTitle center eyebrow="山门介绍" title="问云派，不是冷群，是有规矩的家">
        身处尘世，不失清明；心有疑问，仍向云天；来者可歇，去者自由。
      </SectionTitle>

      <div className="grid gap-6 lg:grid-cols-3">
        {[
          { title: '立派愿景', text: '成为当今纷乱社会中，一处可停靠的港湾，一个温馨的家。', icon: Home },
          { title: '门派总旨', text: '问云问心，守真守善。同道相扶，来去自由。', icon: Lamp },
          { title: '宗门所在', text: '初以微信群为主要山门，后续视规模发展线下雅集。', icon: Users }
        ].map((item) => {
          const Icon = item.icon

          return (
            <RitualCard key={item.title}>
              <Icon className="mb-5 h-9 w-9 text-[#6f8f8b]" />
              <h2 className="ink-title text-3xl font-bold">{item.title}</h2>
              <p className="mt-4 leading-8 text-[#526461]">{item.text}</p>
            </RitualCard>
          )
        })}
      </div>

      <section className="py-16">
        <SectionTitle eyebrow="问云门风" title="清、暖、真、和、静、善、自由、有界">
          凡问云同门，当常念：我在此处说的每一句话，都在共同塑造这个家。
        </SectionTitle>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {spiritItems.map((item) => (
            <ScrollPanel key={item.title}>
              <p className="ink-title text-3xl font-bold text-[#9e3d32]">{item.title}</p>
              <p className="mt-4 leading-8 text-[#526461]">{item.text}</p>
            </ScrollPanel>
          ))}
        </div>
      </section>

      <section>
        <SectionTitle eyebrow="宗门架构" title="从简设职，不以名位压人">
          架构服务于秩序，不服务于威风。掌门、执事、护灯人与同门，共同守护这盏灯。
        </SectionTitle>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {sectRoles.map((role) => (
            <ScrollPanel key={role.title}>
              <h3 className="ink-title text-2xl font-bold">{role.title}</h3>
              <p className="mt-4 leading-8 text-[#526461]">{role.text}</p>
            </ScrollPanel>
          ))}
        </div>
      </section>
    </PageShell>
  )
}
