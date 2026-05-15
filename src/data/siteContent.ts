import canonRaw from '../../网站开发资料/立派金典.txt?raw'

// 这个常量保存完整立派金典原文，返回值用于金典页逐章展示。
export const canonText = canonRaw

// 这个数组保存顶部导航项目，返回值用于桌面导航和移动端重点入口。
export const siteNavItems = [
  { label: '首页', path: '/' },
  { label: '立派金典', path: '/canon' },
  { label: '山门介绍', path: '/about' },
  { label: '问云考核', path: '/wenxin-quiz' },
  { label: '问云名册', path: '/join' },
  { label: '云灯留言', path: '/cloud-lantern' },
  { label: '门派公告', path: '/announcements' },
  { label: '问云雅集', path: '/events' },
  { label: '联系山门', path: '/contact' }
]

// 这个数组保存问云派六项核心气质，返回值用于首页和山门介绍页展示。
export const spiritItems = [
  { title: '陪伴', text: '使孤者不孤，使疲者可息，让久困心事之人有处安心言说。' },
  { title: '清醒', text: '不以热闹遮蔽现实，不以虚言蛊惑人心。' },
  { title: '成长', text: '以读书、写作、谈心、行走、分享、互助为径，让日子有光。' },
  { title: '守正', text: '依法依规而行，尊重个人边界，守护信息安全。' },
  { title: '温柔', text: '讨论可有锋芒，待人不可刻薄。' },
  { title: '共建', text: '群不是一人之群，人人皆为此间风气之守护者。' }
]

// 这个数组保存名册性别选项，返回值用于前台登记、前台筛选和后台编辑。
export const genderOptions = ['男', '女'] as const

// 这个数组保存名册公开身份选项，返回值用于后台名册编辑和前台筛选。
export const memberRoleOptions = ['同门', '雅集执事', '文案执事', '云纪执事', '执灯长老', '掌门'] as const

// 这个数组保存门派架构，返回值用于山门介绍页展示。
export const sectRoles = [
  { title: '掌门', text: '主理方向、章程、重大决策、核心氛围与对外事务。' },
  { title: '执灯长老', text: '负责社群精神气质、重要谈心、冲突调和与重大关怀。' },
  { title: '云纪执事', text: '负责入群审核、群内秩序、违规提醒、公告发布与风险处置。' },
  { title: '文案执事', text: '负责群公告、活动文案、问云语录、节令寄语和成员故事整理。' },
  { title: '雅集执事', text: '负责线上活动、读书会、茶话会、主题夜谈与线下聚会筹备。' },
  { title: '同门', text: '凡入群并认可金典者皆为问云同门，无高低贵贱。' }
]
