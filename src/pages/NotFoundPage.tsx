import { CloudButton } from '../components/CloudButton'
import { BrandMark } from '../components/BrandMark'
import { CodeScene } from '../components/CodeScene'

// 这个函数渲染 404 页面，入参为空，返回值是误入云深处提示。
export function NotFoundPage() {
  return (
    <main className="mx-auto flex min-h-[70vh] max-w-3xl flex-col items-center justify-center px-4 py-20 text-center md:px-6">
      <BrandMark className="mb-6 shadow-xl" size="large" />
      <p className="ink-title text-5xl font-bold text-[#143044]">误入云深处</p>
      <p className="mt-5 max-w-xl leading-8 text-[#526461]">
        此路暂无山门，或许云雾遮了归途。不妨回到问云派首页，再寻来处。
      </p>
      {/* 这里用纯代码山门场景提示路径已断，不使用任何现有图片素材。 */}
      <CodeScene className="code-scene-light mt-8 min-h-56 w-full" label="问云派 404 归途纯代码场景" variant="map" />
      <div className="mt-8">
        <CloudButton to="/" variant="seal">
          返回山门
        </CloudButton>
      </div>
    </main>
  )
}
