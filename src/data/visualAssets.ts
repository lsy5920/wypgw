// 这个类型描述页面级国风插图名称，入参用于页面标题、横幅和首屏选择对应图片。
export type GuofengPageVisualKey =
  | 'homeHero'
  | 'canon'
  | 'about'
  | 'announcements'
  | 'events'
  | 'contact'
  | 'notFound'
  | 'roster'
  | 'quiz'
  | 'cloudLantern'
  | 'login'
  | 'yardDashboard'
  | 'yardProfile'
  | 'yardApplications'
  | 'yardLanterns'
  | 'yardEvents'
  | 'yardNotifications'
  | 'adminDashboard'
  | 'adminApplications'
  | 'adminLanterns'
  | 'adminAnnouncements'
  | 'adminEvents'
  | 'adminStewards'
  | 'adminSettings'

// 这个类型描述旧场景别名，入参用于兼容旧页面传入的通用视觉主题。
export type GuofengLegacyVisualKey = 'gate' | 'scroll' | 'lantern' | 'courtyard' | 'workbench' | 'map'

// 这个类型描述所有可使用的国风插图名称，入参用于统一页面与旧组件的视觉资源。
export type GuofengVisualKey = GuofengPageVisualKey | GuofengLegacyVisualKey

// 这个类型描述白色底国风图标名称，入参用于按钮、卡片和状态入口的图标素材。
export type GuofengIconKey =
  | 'scroll'
  | 'shieldCheck'
  | 'lantern'
  | 'gate'
  | 'noticePaper'
  | 'calendar'
  | 'roster'
  | 'user'
  | 'settings'
  | 'home'
  | 'mail'
  | 'search'
  | 'bell'
  | 'file'
  | 'barChart'
  | 'megaphone'
  | 'users'
  | 'crown'
  | 'key'
  | 'mapPin'
  | 'save'
  | 'send'
  | 'check'
  | 'alertTriangle'
  | 'trash'
  | 'eye'
  | 'eyeOff'
  | 'qrCode'
  | 'logOut'
  | 'logIn'
  | 'arrowLeft'
  | 'arrowRight'
  | 'arrowUp'
  | 'refresh'
  | 'sliders'
  | 'teaEvent'

// 这个常量保存国风素材包根路径，返回值会跟随 Vite 部署路径自动变化。
const guofengAssetBasePath = `${import.meta.env.BASE_URL}assets/guofeng-ui-20260509`

// 这个对象保存页面插图相对路径，返回值用于把每个真实页面绑定到对应单张图片。
const pageVisualPathByKey: Record<GuofengPageVisualKey, string> = {
  homeHero: 'illustrations/public/home-hero-mountain-gate.png',
  canon: 'illustrations/public/canon-scroll-desk.png',
  about: 'illustrations/public/about-courtyard-path.png',
  announcements: 'illustrations/public/announcements-wood-board.png',
  events: 'illustrations/public/events-water-pavilion.png',
  contact: 'illustrations/public/contact-letter-clouds.png',
  notFound: 'illustrations/public/not-found-cloud-path.png',
  roster: 'illustrations/interaction/roster-namecards.png',
  quiz: 'illustrations/interaction/quiz-compass-scroll.png',
  cloudLantern: 'illustrations/interaction/cloud-lantern-river.png',
  login: 'illustrations/interaction/login-courtyard-door.png',
  yardDashboard: 'illustrations/yard/yard-dashboard-workbench.png',
  yardProfile: 'illustrations/yard/profile-scroll-desk.png',
  yardApplications: 'illustrations/yard/application-namecard-progress.png',
  yardLanterns: 'illustrations/yard/personal-lantern-ledger.png',
  yardEvents: 'illustrations/yard/yard-events-calendar-tea.png',
  yardNotifications: 'illustrations/yard/notifications-bell-timeline.png',
  adminDashboard: 'illustrations/admin/admin-dashboard-ledger.png',
  adminApplications: 'illustrations/admin/admin-applications-review.png',
  adminLanterns: 'illustrations/admin/admin-lantern-review.png',
  adminAnnouncements: 'illustrations/admin/admin-announcement-editor.png',
  adminEvents: 'illustrations/admin/admin-event-management.png',
  adminStewards: 'illustrations/admin/admin-steward-roles.png',
  adminSettings: 'illustrations/admin/admin-site-settings.png'
}

// 这个对象保存旧场景到新页面插图的映射，返回值用于老代码平滑过渡。
const legacyVisualAliasByKey: Record<GuofengLegacyVisualKey, GuofengPageVisualKey> = {
  gate: 'homeHero',
  scroll: 'canon',
  lantern: 'cloudLantern',
  courtyard: 'about',
  workbench: 'yardDashboard',
  map: 'events'
}

// 这个对象保存白底图标相对路径，返回值用于统一读取生成好的单图标 PNG。
const iconPathByKey: Record<GuofengIconKey, string> = {
  scroll: 'icons/scroll.png',
  shieldCheck: 'icons/shield-check.png',
  lantern: 'icons/lantern.png',
  gate: 'icons/gate.png',
  noticePaper: 'icons/notice-paper.png',
  calendar: 'icons/calendar.png',
  roster: 'icons/roster.png',
  user: 'icons/user.png',
  settings: 'icons/settings.png',
  home: 'icons/home.png',
  mail: 'icons/mail.png',
  search: 'icons/search.png',
  bell: 'icons/bell.png',
  file: 'icons/file.png',
  barChart: 'icons/bar-chart.png',
  megaphone: 'icons/megaphone.png',
  users: 'icons/users.png',
  crown: 'icons/crown.png',
  key: 'icons/key.png',
  mapPin: 'icons/map-pin.png',
  save: 'icons/save.png',
  send: 'icons/send.png',
  check: 'icons/check.png',
  alertTriangle: 'icons/alert-triangle.png',
  trash: 'icons/trash.png',
  eye: 'icons/eye.png',
  eyeOff: 'icons/eye-off.png',
  qrCode: 'icons/qr-code.png',
  logOut: 'icons/log-out.png',
  logIn: 'icons/log-in.png',
  arrowLeft: 'icons/arrow-left.png',
  arrowRight: 'icons/arrow-right.png',
  arrowUp: 'icons/arrow-up.png',
  refresh: 'icons/refresh.png',
  sliders: 'icons/sliders.png',
  teaEvent: 'icons/tea-event.png'
}

// 这个函数拼出国风素材包里的完整路径，入参是相对路径，返回值是浏览器可访问的素材地址。
function createGuofengAssetPath(relativePath: string): string {
  return `${guofengAssetBasePath}/${relativePath}`
}

// 这个函数判断视觉名称是否为旧别名，入参是视觉名称，返回值表示是否需要转换。
function isLegacyVisualKey(key: GuofengVisualKey): key is GuofengLegacyVisualKey {
  return key in legacyVisualAliasByKey
}

// 这个函数返回页面插图地址，入参是页面插图名称或旧主题别名，返回值是可直接放进图片标签的地址。
export function getGuofengVisualPath(visual: GuofengVisualKey): string {
  // 这里先把旧主题转换成新页面插图，避免旧组件传入 gate、scroll 时图片丢失。
  const pageKey = isLegacyVisualKey(visual) ? legacyVisualAliasByKey[visual] : visual

  return createGuofengAssetPath(pageVisualPathByKey[pageKey])
}

// 这个函数返回白底图标地址，入参是图标名称，返回值是可直接放进图片标签的地址。
export function getGuofengIconPath(icon: GuofengIconKey): string {
  return createGuofengAssetPath(iconPathByKey[icon])
}
