import { getGuofengVisualPath } from '../data/visualAssets'
import { canonText } from '../data/siteContent'

// 这个接口描述金典原文拆出的章节，title 是章节标题，lines 是该章节下的正文行。
export interface CanonSection {
  // 章节标题。
  title: string
  // 章节正文行。
  lines: string[]
}

// 这个接口描述金典目录项，name 是目录文字，targetId 用来跳到对应真实章节。
interface CanonMenuItem {
  // 目录显示名称。
  name: string
  // 对应章节锚点。
  targetId: string
}

// 这个函数把金典原文拆成章节，入参是完整文本，返回值是章节数组，供测试和后续长文阅读扩展继续使用。
export function parseCanonSections(text: string): CanonSection[] {
  // 这个数组保存拆分后的章节结果。
  const sections: CanonSection[] = []
  // 这个变量保存当前正在收集的章节。
  let currentSection: CanonSection | null = null

  // 这里逐行扫描原文，遇到标题时开启新章节。
  text.split(/\r?\n/).forEach((line) => {
    // 这里清理当前行首尾空格，便于判断是否为标题。
    const trimmedLine = line.trim()
    // 这里兼容任意一级标题和二级章节标题，避免金典名称调整后解析失败。
    const isSectionTitle = /^#{1,2}\s+/.test(trimmedLine)

    if (isSectionTitle) {
      // 这里把上一章放进结果，保证章节切换时内容不丢失。
      if (currentSection) {
        sections.push(currentSection)
      }

      currentSection = { title: trimmedLine.replace(/^#+\s*/, '').replace(/\*\*/g, ''), lines: [] }
      return
    }

    // 这里处理原文开头没有标题但已经有正文的情况。
    if (!currentSection && trimmedLine) {
      currentSection = { title: '开篇', lines: [] }
    }

    // 这里把普通正文行加入当前章节，空行也保留，方便后续阅读页还原段落。
    if (currentSection) {
      currentSection.lines.push(line)
    }
  })

  // 这里收尾，把最后一章放入结果。
  if (currentSection) {
    sections.push(currentSection)
  }

  return sections
}

// 这个函数清理金典原文中的 Markdown 符号，入参是原始正文行，返回值是页面可直接展示的中文文本。
function cleanCanonLine(line: string): string {
  return line.replace(/\*\*/g, '').replace(/^[-#]+\s*/, '').trim()
}

// 这个函数把章节标题转成稳定锚点，入参是章节序号，返回值是 HTML 元素编号。
function createCanonSectionId(index: number): string {
  return `canon-section-${index}`
}

// 这个函数渲染立派金典页面，入参为空，返回值是按设计稿复刻的卷轴目录和正文纸卡。
export function CanonPage() {
  // 这个常量保存当前页面使用的横幅山水插图地址。
  const canonImage = getGuofengVisualPath('canonBanner')
  // 这个常量保存从真实金典原文拆出的章节，避免页面继续使用设计稿假文案。
  const sections = parseCanonSections(canonText)
  // 这个常量保存左侧真实目录，用原金典章节生成可点击锚点。
  const canonMenuItems: CanonMenuItem[] = sections.map((section, index) => ({
    name: section.title.replace(/^([一二三四五六七八九十]+)、/, ''),
    targetId: createCanonSectionId(index)
  }))

  return (
    <section className="public-art-page canon-art-page" aria-label="立派金典">
      <div className="canon-reference-layout">
        {/* 这里还原左侧垂挂卷轴目录。 */}
        <aside className="canon-scroll-menu" aria-label="金典目录">
          <div className="canon-scroll-rod canon-scroll-rod-top" />
          <div className="canon-scroll-paper">
            <h2>金典目录</h2>
            <nav>
              {canonMenuItems.map((item) => (
                <a href={`#${item.targetId}`} key={item.targetId}>
                  {item.name}
                </a>
              ))}
            </nav>
          </div>
          <div className="canon-scroll-rod canon-scroll-rod-bottom" />
          <div className="canon-scroll-tassel" />
        </aside>

        {/* 这里还原右侧正文大纸卡，并写入之前完整的立派金典内容。 */}
        <article className="canon-paper-card" id="canon-main">
          <div className="public-card-corner public-card-corner-left-top" />
          <div className="public-card-corner public-card-corner-right-top" />
          <div className="public-card-corner public-card-corner-left-bottom" />
          <div className="public-card-corner public-card-corner-right-bottom" />
          <h1>问云派立派金典 <span>问云印</span></h1>
          <img alt="立派金典山水横幅" className="canon-banner-image" src={canonImage} />
          <div className="canon-full-content">
            {sections.map((section, sectionIndex) => (
              <section className="canon-full-section" id={createCanonSectionId(sectionIndex)} key={`${section.title}-${sectionIndex}`}>
                <h2>{section.title}</h2>
                <div className="canon-text-flow">
                  {section.lines.map((line, lineIndex) => {
                    const cleanLine = cleanCanonLine(line)

                    if (!cleanLine || cleanLine === '---') {
                      return <div className="canon-paragraph-gap" key={`${section.title}-${lineIndex}`} />
                    }

                    return <p key={`${section.title}-${lineIndex}`}>{cleanLine}</p>
                  })}
                </div>
              </section>
            ))}
          </div>
        </article>
      </div>
    </section>
  )
}
