import { ArrowUp } from 'lucide-react'
import { PageShell } from '../components/PageShell'
import { RitualCard } from '../components/RitualCard'
import { ScrollPanel } from '../components/ScrollPanel'
import { SectionTitle } from '../components/SectionTitle'
import { canonText } from '../data/siteContent'

// 这个接口描述金典章节，入参来自原始文本，返回值用于页面目录和正文。
interface CanonSection {
  // 章节标题。
  title: string
  // 章节内容行。
  lines: string[]
}

// 这个函数把原始金典文本拆成章节，入参是完整文本，返回值是章节数组。
export function parseCanonSections(text: string): CanonSection[] {
  // 这个数组用于保存拆分后的章节。
  const sections: CanonSection[] = []
  // 这个变量保存当前正在收集的章节。
  let current: CanonSection | null = null

  // 这里逐行读取文本，遇到二级标题或一级总纲时新开章节。
  text.split(/\r?\n/).forEach((line) => {
    const trimmed = line.trim()
    const isSectionTitle = /^##\s+/.test(trimmed) || trimmed === '# 问云派总纲'

    if (isSectionTitle) {
      if (current) {
        sections.push(current)
      }
      current = { title: trimmed.replace(/^#+\s*/, '').replace(/\*\*/g, ''), lines: [] }
      return
    }

    if (!current && trimmed) {
      current = { title: '开篇', lines: [] }
    }

    if (current) {
      current.lines.push(line)
    }
  })

  // 这里把最后一个章节放入结果，避免尾部内容丢失。
  if (current) {
    sections.push(current)
  }

  return sections
}

// 这个函数把 Markdown 装饰清理成可读文字，入参是原始行，返回值是页面展示文字。
function cleanMarkdownLine(line: string): string {
  return line.replace(/\*\*/g, '').replace(/^[-#]+\s*/, '').trim()
}

// 这个函数渲染立派金典页，入参为空，返回值是完整金典阅读页面。
export function CanonPage() {
  // 这个常量保存拆分后的章节，页面刷新时从资料文件实时生成。
  const sections = parseCanonSections(canonText)

  // 这个函数滚动到指定章节，入参是章节序号，返回值为空。
  const scrollToSection = (index: number) => {
    try {
      // 这里用浏览器原生滚动，不修改地址栏哈希，避免 HashRouter 把章节锚点误判成页面路由。
      document.getElementById(`canon-${index}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    } catch {
      // 这里兜底处理少数旧浏览器不支持平滑滚动的情况，失败时不影响页面阅读。
      document.getElementById(`canon-${index}`)?.scrollIntoView()
    }
  }

  // 这个函数返回页面顶部，入参为空，返回值为空。
  const scrollToTop = () => {
    try {
      // 这里不使用 href="#top"，避免破坏当前的 #/canon 路由。
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch {
      // 这里兜底处理滚动异常，至少保证能回到顶部。
      window.scrollTo(0, 0)
    }
  }

  return (
    <PageShell size="wide">
      <SectionTitle center eyebrow="立派金典" title="问云派立派金典">
        问云而来，栖心于此；乱世暂歇，同归一处。
      </SectionTitle>

      <div className="grid gap-8 lg:grid-cols-[280px_1fr]">
        {/* 这里展示金典目录，方便长文快速跳转。 */}
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <RitualCard className="seal-mark-bg">
            <p className="mb-4 font-semibold text-[#9e3d32]">金典目录</p>
            <nav className="grid max-h-[70vh] gap-2 overflow-y-auto pr-1 text-sm">
              {sections.map((section, index) => (
                <button
                  className="rounded-xl px-3 py-2 text-left text-[#40524f] transition hover:bg-[#edf3ef]"
                  key={`${section.title}-${index}`}
                  onClick={() => scrollToSection(index)}
                  type="button"
                >
                  {section.title}
                </button>
              ))}
            </nav>
          </RitualCard>
        </aside>

        {/* 这里展示金典正文。 */}
        <div className="grid gap-6">
          {sections.map((section, index) => (
            <ScrollPanel key={`${section.title}-${index}`}>
              <article className="scroll-mt-32" id={`canon-${index}`}>
                <h2 className="ink-title mb-6 border-b border-[#c9a45c]/25 pb-4 text-3xl font-bold text-[#143044]">{section.title}</h2>
                <div className="space-y-3 text-base leading-9 text-[#40524f] md:text-lg">
                  {section.lines.map((line, lineIndex) => {
                    // 这里清理每一行，空行保留为段落间距。
                    const cleanLine = cleanMarkdownLine(line)

                    if (!cleanLine || cleanLine === '---') {
                      return <div className="h-2" key={`${lineIndex}-${line}`} />
                    }

                    return <p key={`${lineIndex}-${line}`}>{cleanLine}</p>
                  })}
                </div>
              </article>
            </ScrollPanel>
          ))}
        </div>
      </div>

      {/* 这里提供返回顶部按钮，方便长文阅读。 */}
      <button
        className="fixed bottom-6 right-4 z-30 flex h-12 w-12 items-center justify-center rounded-full bg-[#9e3d32] text-white shadow-xl"
        onClick={scrollToTop}
        type="button"
        aria-label="返回顶部"
      >
        <ArrowUp className="h-5 w-5" />
      </button>
    </PageShell>
  )
}
