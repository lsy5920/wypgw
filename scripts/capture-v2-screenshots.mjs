import { existsSync, mkdirSync } from 'node:fs'
import { mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { spawnSync } from 'node:child_process'

// 这个常量保存项目根目录，入参为空，返回值用于拼接截图输出路径。
const projectRoot = process.cwd()

// 这个常量保存截图基础目录，返回值用于把桌面端和移动端图片分类存放。
const screenshotRoot = join(projectRoot, '网站重构2.0', '04-运行截图')

// 这个常量保存本地预览地址，入参为空，返回值用于浏览器打开各个页面。
const baseUrl = process.argv[2] ?? 'http://localhost:5177/'

// 这个数组保存需要截图的前台页面，返回值用于批量导出 UI 图片。
const pages = [
  { name: '首页', path: '#/' },
  { name: '立派金典', path: '#/canon' },
  { name: '山门介绍', path: '#/about' },
  { name: '问心考核', path: '#/wenxin-quiz' },
  { name: '问云名册', path: '#/join' },
  { name: '云灯留言', path: '#/cloud-lantern' },
  { name: '门派公告', path: '#/announcements' },
  { name: '问云雅集', path: '#/events' },
  { name: '联系山门', path: '#/contact' },
  { name: '登录小院', path: '#/login' }
]

// 这个数组保存截图规格，桌面端看宽屏首屏，移动端用 500 像素宽预览来避免 Chrome 命令行错误裁切。
const viewports = [
  { name: '桌面', width: 1440, height: 1200 },
  { name: '移动', width: 500, height: 1200 }
]

// 这个函数查找本机 Chrome 或 Edge 浏览器路径，入参为空，返回值是浏览器可执行文件路径。
function findBrowserPath() {
  // 这里按常见 Windows 安装路径查找，优先使用 Chrome，没有 Chrome 时使用 Edge。
  const candidates = [
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'
  ]

  return candidates.find((item) => existsSync(item)) ?? ''
}

// 这个函数确保目录存在，入参是目录路径，返回值为空。
function ensureDir(dirPath) {
  mkdirSync(dirPath, { recursive: true })
}

// 这个函数拼接可访问地址，入参是哈希路由路径，返回值是完整页面地址。
function createUrl(path) {
  // 这里去掉基础地址尾部多余斜杠，避免生成双斜杠地址。
  const cleanBaseUrl = baseUrl.replace(/\/+$/, '/')

  return `${cleanBaseUrl}${path}`
}

// 这个函数导出单张截图，入参是浏览器路径、页面和视口，返回值为空。
function capturePage(browserPath, page, viewport) {
  // 这里给每次截图创建独立浏览器资料目录，避免被用户正在打开的浏览器会话影响。
  const userDataDir = mkdtempSync(join(tmpdir(), 'wenyun-v2-shot-'))
  // 这里按分类目录输出截图，方便小白直接查看桌面端和移动端效果。
  const outputDir = join(screenshotRoot, viewport.name)
  ensureDir(outputDir)

  // 这个变量保存截图输出文件名，返回值用于浏览器命令写入图片。
  const outputFile = join(outputDir, `${page.name}.png`)
  // 这个数组保存浏览器截图参数，避免使用复杂 shell 拼接导致中文路径出错。
  const args = [
    '--headless=new',
    '--disable-gpu',
    '--no-first-run',
    '--no-default-browser-check',
    '--hide-scrollbars',
    '--force-device-scale-factor=1',
    '--run-all-compositor-stages-before-draw',
    `--window-size=${viewport.width},${viewport.height}`,
    `--user-data-dir=${userDataDir}`,
    '--virtual-time-budget=5000',
    `--screenshot=${outputFile}`,
    createUrl(page.path)
  ]

  // 这里执行浏览器截图命令，失败时直接抛出中文错误，方便定位是哪一页失败。
  const result = spawnSync(browserPath, args, { encoding: 'utf8' })

  if (result.status !== 0) {
    throw new Error(`截图失败：${viewport.name}端 ${page.name}。${result.stderr || result.stdout}`)
  }
}

// 这个函数批量导出截图，入参为空，返回值为空。
function main() {
  // 这里先确认浏览器存在，避免没有截图工具时静默失败。
  const browserPath = findBrowserPath()

  if (!browserPath) {
    throw new Error('没有找到 Chrome 或 Edge，无法导出运行截图。')
  }

  // 这里依次导出桌面端和移动端截图，保证归档目录完整。
  viewports.forEach((viewport) => {
    pages.forEach((page) => capturePage(browserPath, page, viewport))
  })

  console.log('网站重构2.0运行截图已导出。')
}

main()
