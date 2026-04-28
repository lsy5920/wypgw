// 这个函数用于生成 public 目录资源地址，入参是文件名，返回值能同时兼容本地和 GitHub Pages 子路径。
export function getPublicAsset(fileName: string): string {
  // 这里去掉开头斜杠，避免 GitHub Pages 部署到仓库子路径时资源指向域名根目录。
  const cleanName = fileName.replace(/^\/+/, '')

  return `${import.meta.env.BASE_URL}${cleanName}`
}
