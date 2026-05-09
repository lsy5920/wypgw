import { CloudButton } from '../components/CloudButton'
import { getGuofengVisualPath } from '../data/visualAssets'

// 这个函数渲染 404 页面，入参为空，返回值是按设计稿复刻的归路画面。
export function NotFoundPage() {
  // 这个常量保存 404 页面使用的山路水墨背景地址。
  const notFoundImage = getGuofengVisualPath('notFoundScene')

  return (
    <section className="public-art-page notfound-art-page" aria-label="404 页面">
      <section className="notfound-reference-scene">
        <img alt="空山归路水墨背景" className="notfound-scene-image" src={notFoundImage} />
        <div className="notfound-copy">
          <h1>空山归路，未见其页</h1>
          <p>此处云雾迷漫，页面尚未修通。</p>
          <CloudButton className="notfound-return-button" to="/" variant="primary">
            返回首页
          </CloudButton>
        </div>
        <strong aria-hidden="true">404</strong>
        <div className="notfound-crane" aria-hidden="true" />
      </section>
    </section>
  )
}
