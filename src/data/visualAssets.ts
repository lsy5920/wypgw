// 这个类型描述页面级国风插图名称，入参用于页面标题、横幅和首屏选择对应图片。
export type GuofengPageVisualKey =
  | 'homeHero'
  | 'canonBanner'
  | 'aboutVision'
  | 'aboutPavilion'
  | 'announcementBoard'
  | 'eventPavilion'
  | 'contactNote'
  | 'notFoundScene'
  | 'roster'
  | 'quiz'
  | 'cloudLantern'
  | 'login'

// 这个类型描述白色底国风图标名称，入参用于按钮、卡片和状态入口的图标素材。
export type GuofengIconKey =
  | 'scroll'
  | 'shieldCheck'
  | 'lantern'
  | 'calendar'
  | 'roster'
  | 'home'
  | 'mail'
  | 'megaphone'
  | 'save'
  | 'send'
  | 'check'
  | 'alertTriangle'
  | 'trash'
  | 'logOut'
  | 'logIn'
  | 'arrowLeft'
  | 'arrowRight'
  | 'sliders'

// 这个常量保存国风素材包根路径，返回值会跟随 Vite 部署路径自动变化。
const guofengAssetBasePath = `${import.meta.env.BASE_URL}assets/guofeng-ui-20260509`

// 这个对象保存页面插图相对路径，返回值用于把每个真实页面绑定到对应单张图片。
const pageVisualPathByKey: Record<GuofengPageVisualKey, string> = {
  homeHero: 'illustrations/public/home-hero-mountain-gate.png',
  canonBanner: 'illustrations/public/canon-banner-mountains-v2.png',
  aboutVision: 'illustrations/public/about-vision-mountains-v2.png',
  aboutPavilion: 'illustrations/public/about-pavilion-bamboo-v2.png',
  announcementBoard: 'illustrations/public/announcements-board-landscape-v2.png',
  eventPavilion: 'illustrations/public/events-pavilion-spring-v2.png',
  contactNote: 'illustrations/public/contact-letter-note-v2.png',
  notFoundScene: 'illustrations/public/not-found-path-figure-v2.png',
  roster: 'illustrations/interaction/roster-namecards.png',
  quiz: 'illustrations/interaction/quiz-compass-scroll.png',
  cloudLantern: 'illustrations/interaction/cloud-lantern-river.png',
  login: 'illustrations/interaction/login-courtyard-door.png'
}

// 这个对象保存白底图标相对路径，返回值用于统一读取生成好的单图标 PNG。
const iconPathByKey: Record<GuofengIconKey, string> = {
  scroll: 'icons/scroll.png',
  shieldCheck: 'icons/shield-check.png',
  lantern: 'icons/lantern.png',
  calendar: 'icons/calendar.png',
  roster: 'icons/roster.png',
  home: 'icons/home.png',
  mail: 'icons/mail.png',
  megaphone: 'icons/megaphone.png',
  save: 'icons/save.png',
  send: 'icons/send.png',
  check: 'icons/check.png',
  alertTriangle: 'icons/alert-triangle.png',
  trash: 'icons/trash.png',
  logOut: 'icons/log-out.png',
  logIn: 'icons/log-in.png',
  arrowLeft: 'icons/arrow-left.png',
  arrowRight: 'icons/arrow-right.png',
  sliders: 'icons/sliders.png'
}

// 这个函数拼出国风素材包里的完整路径，入参是相对路径，返回值是浏览器可访问的素材地址。
function createGuofengAssetPath(relativePath: string): string {
  return `${guofengAssetBasePath}/${relativePath}`
}

// 这个函数返回页面插图地址，入参是当前页面插图名称，返回值是可直接放进图片标签的地址。
export function getGuofengVisualPath(visual: GuofengPageVisualKey): string {
  return createGuofengAssetPath(pageVisualPathByKey[visual])
}

// 这个函数返回白底图标地址，入参是图标名称，返回值是可直接放进图片标签的地址。
export function getGuofengIconPath(icon: GuofengIconKey): string {
  return createGuofengAssetPath(iconPathByKey[icon])
}
