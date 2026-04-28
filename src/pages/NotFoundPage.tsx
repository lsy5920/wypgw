import { CloudButton } from '../components/CloudButton'
import { getPublicAsset } from '../lib/assets'

// 这个函数渲染 404 页面，入参为空，返回值是误入云深处提示。
export function NotFoundPage() {
  return (
    <main className="mx-auto flex min-h-[70vh] max-w-3xl flex-col items-center justify-center px-4 py-20 text-center md:px-6">
      <img className="mb-6 h-28 w-28 rounded-full object-cover shadow-xl" src={getPublicAsset('wenyun-logo.png')} alt="问云派门派 Logo" />
      <p className="ink-title text-5xl font-bold text-[#143044]">误入云深处</p>
      <p className="mt-5 max-w-xl leading-8 text-[#526461]">
        此路暂无山门，或许云雾遮了归途。不妨回到问云派首页，再寻来处。
      </p>
      <div className="mt-8">
        <CloudButton to="/" variant="seal">
          返回山门
        </CloudButton>
      </div>
    </main>
  )
}
