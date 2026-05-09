import { getGuofengVisualPath, type GuofengPageVisualKey } from '../data/visualAssets'
import { sectRoles, spiritItems } from '../data/siteContent'

// 这个接口描述山门介绍卡片，title 是卡片标题，subtitle 是短说明，imagePosition 控制背景插图焦点。
interface AboutDisplayCard {
  // 卡片标题。
  title: string
  // 卡片副标题。
  subtitle: string
  // 背景插图焦点位置。
  imagePosition: string
  // 页面使用的专用插图名称，没有插图时表示渲染结构图。
  visual?: GuofengPageVisualKey
  // 底部仿文本线条数量。
  lineCount: number
}

// 这个数组保存设计稿中的三张介绍卡，前两张文案来自站点真实精神配置，第三张承接真实架构配置。
const aboutCards: AboutDisplayCard[] = [
  { title: '宗门愿景', subtitle: '清明立愿 有界相扶', imagePosition: 'center 46%', visual: 'aboutVision', lineCount: 4 },
  { title: '门风', subtitle: spiritItems.slice(0, 3).map((item) => item.title).join(' · '), imagePosition: 'center 55%', visual: 'aboutPavilion', lineCount: 3 },
  { title: '宗门架构', subtitle: '山门低调 各院协同', imagePosition: 'center 64%', lineCount: 0 }
]

// 这个函数渲染山门介绍页，入参为空，返回值是按设计稿复刻的三张横向介绍卡。
export function AboutPage() {
  // 这个常量保存真实门派架构标题，并补充页面固定院部名称，让关系图既接真实配置又保留设计稿密度。
  const structureNodes = [...sectRoles.map((role) => role.title), '问心院', '问道院', '问云院', '云灯间'].slice(0, 8)

  return (
    <section className="public-art-page about-art-page" aria-label="山门介绍">
      <div className="about-reference-grid">
        {aboutCards.map((card, index) => (
          <article className="about-reference-card" key={card.title}>
            <div className="about-card-cloud-mark" aria-hidden="true" />
            <h1>{card.title}</h1>
            <p>{card.subtitle}</p>

            {index < 2 ? (
              <>
                <img
                  alt={`${card.title}水墨插图`}
                  className="about-reference-image"
                  src={getGuofengVisualPath(card.visual ?? 'about')}
                  style={{ objectPosition: card.imagePosition }}
                />
                <div className="about-card-lines" aria-hidden="true">
                  {Array.from({ length: card.lineCount }).map((_, lineIndex) => (
                    <i key={index === 1 ? (spiritItems[lineIndex]?.title ?? lineIndex) : lineIndex} />
                  ))}
                </div>
              </>
            ) : (
              <div className="about-structure-chart" aria-label="宗门架构">
                <span className="structure-root">掌门</span>
                <div className="structure-branches" aria-hidden="true" />
                <div className="structure-node-grid">
                  {structureNodes.map((node) => (
                    <span key={node}>{node}</span>
                  ))}
                </div>
              </div>
            )}
          </article>
        ))}
      </div>
    </section>
  )
}
