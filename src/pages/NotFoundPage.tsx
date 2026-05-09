import { CloudButton } from '../components/CloudButton'
import { BrandMark } from '../components/BrandMark'
import { PageShell } from '../components/PageShell'
import { ScrollPanel } from '../components/ScrollPanel'
import { SectionTitle } from '../components/SectionTitle'

// 这个函数渲染 404 页面，入参为空，返回值是误入云深处提示。
export function NotFoundPage() {
  return (
    <PageShell className="not-found-page-layout" size="wide">
      <SectionTitle center eyebrow="404 页面" title="空山归路，未见其页" visual="notFound">
        此处云雾迷漫，页面尚未修通。不妨回到问云派首页，再寻来处。
      </SectionTitle>

      <ScrollPanel className="not-found-return-panel mx-auto max-w-3xl text-center seal-mark-bg">
        <BrandMark className="mx-auto shadow-xl" size="large" />
        <p className="ink-title mt-6 text-5xl font-bold text-[#143044]">误入云深处</p>
        <p className="mx-auto mt-5 max-w-xl leading-8 text-[#526461]">
          此路暂无山门，或许云雾遮了归途。问云派山门仍在，清风也仍在。
        </p>
        <div className="mt-8">
          <CloudButton to="/" variant="seal">
            返回山门
          </CloudButton>
        </div>
      </ScrollPanel>
    </PageShell>
  )
}
