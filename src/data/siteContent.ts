import canonRaw from '../../网站开发资料/立派金典.txt?raw'

// 这个常量保存完整立派金典原文，返回值用于金典页逐章展示。
export const canonText = canonRaw

// 这个数组保存顶部导航项目，返回值用于桌面导航和移动端重点入口。
export const siteNavItems = [
  { label: '首页', path: '/' },
  { label: '立派金典', path: '/canon' },
  { label: '山门介绍', path: '/about' },
  { label: '问心考核', path: '/wenxin-quiz' },
  { label: '问云名册', path: '/join' },
  { label: '云灯留言', path: '/cloud-lantern' },
  { label: '门派公告', path: '/announcements' },
  { label: '问云雅集', path: '/events' },
  { label: '联系山门', path: '/contact' }
]

// 这个数组保存问云派六项精神，返回值用于首页和山门介绍页展示。
export const spiritItems = [
  { title: '清明', text: '遇事先明理，开口先留德，行事先问心。' },
  { title: '温暖', text: '不以嘲笑为聪明，不以冷漠为高明。' },
  { title: '真诚', text: '不虚饰身份，不夸张来路，以真心相见。' },
  { title: '平等', text: '不因人高而谄，不因人低而轻。' },
  { title: '自由', text: '愿说则说，愿静则静，来去皆坦荡。' },
  { title: '有界', text: '温暖不是越界，关心不是控制。' }
]

// 这个数组保存首页入派流程，返回值用于路线图展示。
export const joinSteps = [
  '问云而来',
  '阅读金典',
  '登记道名',
  '执事审核',
  '列入问云名册'
]

// 这个数组保存名册性别选项，返回值用于前台登记、前台筛选和后台编辑。
export const genderOptions = ['男', '女'] as const

// 这个数组保存名册公开身份选项，返回值用于后台名册编辑和前台筛选。
export const memberRoleOptions = ['同门', '护灯人', '执事', '掌门'] as const

// 这个数组保存门派架构，返回值用于山门介绍页展示。
export const sectRoles = [
  { title: '掌门', text: '主掌本派方向、愿景与大事，以初心守门。' },
  { title: '执事', text: '协助维护群务、入派、公告与活动秩序。' },
  { title: '护灯人', text: '关照新人、提醒规矩、传递温暖。' },
  { title: '同门', text: '凡入派者皆为同门，不分贵贱，彼此有礼。' }
]

// 这个数组保存后台状态按钮，返回值用于申请审核页面。
export const applicationStatusLabels = {
  pending: '待审核',
  approved: '已审核',
  rejected: '未通过',
  contacted: '已联系',
  draft: '暂存',
  retired: '已退派'
}

// 这个数组保存云灯审核状态文案，返回值用于后台留言审核页面。
export const lanternStatusLabels = {
  pending: '待审核',
  approved: '已公开',
  rejected: '已拒绝'
}
