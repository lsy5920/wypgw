import type { Announcement, CloudLantern, JoinApplication, SiteSetting, WenyunEvent } from '../lib/types'

// 这个常量保存演示用时间，返回值用于无数据库时保持页面内容稳定。
const demoNow = '2026-04-28T09:00:00+08:00'

// 这个数组保存首页和云灯页演示留言，未连接 Supabase 时用于兜底展示。
export const mockLanterns: CloudLantern[] = [
  {
    id: 'lantern-1',
    author_name: '匿名同门',
    content: '愿每个疲惫的人，都能在问云派找到一处可以停靠的港湾。',
    mood: '温暖',
    is_anonymous: true,
    status: 'approved',
    created_by: null,
    reviewed_by: null,
    reviewed_at: demoNow,
    created_at: demoNow
  },
  {
    id: 'lantern-2',
    author_name: '云边来客',
    content: '今日问云，明日归心。愿我们都不添风浪，只添灯火。',
    mood: '清明',
    is_anonymous: false,
    status: 'approved',
    created_by: null,
    reviewed_by: null,
    reviewed_at: demoNow,
    created_at: demoNow
  },
  {
    id: 'lantern-3',
    author_name: '匿名同门',
    content: '在吵闹的人间，也想守住一点温柔和分寸。',
    mood: '安静',
    is_anonymous: true,
    status: 'approved',
    created_by: null,
    reviewed_by: null,
    reviewed_at: demoNow,
    created_at: demoNow
  }
]

// 这个数组保存演示公告，未连接 Supabase 时用于公告页和后台兜底。
export const mockAnnouncements: Announcement[] = [
  {
    id: 'announcement-1',
    title: '问云派山门初开',
    slug: 'wenyun-open',
    category: '山门公告',
    summary: '问云派官网第一版上线，愿来者可歇，留者相知。',
    content: '问云派官网第一版上线，前台展示、入派问路、云灯留言与后台雏形已经准备完毕。',
    cover_url: null,
    is_pinned: true,
    status: 'published',
    published_at: demoNow,
    created_by: null,
    created_at: demoNow,
    updated_at: demoNow
  },
  {
    id: 'announcement-2',
    title: '入派申请采用人工审核',
    slug: 'join-review',
    category: '门规更新',
    summary: '为了守护群内清净，所有入派帖都会由掌门或执事人工查看。',
    content: '入派申请不会自动公开微信号，也不会直接公开微信群二维码，请安心填写。',
    cover_url: null,
    is_pinned: false,
    status: 'published',
    published_at: demoNow,
    created_by: null,
    created_at: demoNow,
    updated_at: demoNow
  }
]

// 这个数组保存演示活动，未连接 Supabase 时用于活动页和后台兜底。
export const mockEvents: WenyunEvent[] = [
  {
    id: 'event-1',
    title: '问云清谈：何以安放此心',
    type: '线上清谈',
    mode: 'online',
    location: '微信群',
    event_time: '2026-05-05T20:00:00+08:00',
    description: '围绕生活、心情、理想与困惑做一场轻松清谈。',
    capacity: 30,
    status: 'published',
    cover_url: null,
    created_by: null,
    created_at: demoNow,
    updated_at: demoNow
  },
  {
    id: 'event-2',
    title: '云灯时刻：给陌生人的一句话',
    type: '云灯互助',
    mode: 'online',
    location: '云灯留言区',
    event_time: '2026-05-12T21:00:00+08:00',
    description: '每位同门留下一句话，给疲惫的人一点温暖。',
    capacity: null,
    status: 'published',
    cover_url: null,
    created_by: null,
    created_at: demoNow,
    updated_at: demoNow
  }
]

// 这个数组保存演示入派申请，未连接 Supabase 时用于后台申请审核演示。
export const mockApplications: JoinApplication[] = [
  {
    id: 'application-1',
    nickname: '山月',
    wechat_id: 'wenyun_demo_001',
    age_range: '25-30',
    city: '杭州',
    reason: '想找一个不吵闹、能真诚说话的地方，也愿意一起守护门派氛围。',
    accept_rules: true,
    offline_interest: '愿意参加',
    remark: '希望先从线上交流开始。',
    status: 'pending',
    admin_note: null,
    reviewed_by: null,
    reviewed_at: null,
    created_at: demoNow
  }
]

// 这个数组保存演示站点设置，未连接 Supabase 时用于联系页和后台设置。
export const mockSettings: SiteSetting[] = [
  {
    key: 'contact',
    value: {
      wechatName: '问云派执事',
      contactTip: '请先提交入派帖，执事查看后会择时联系。',
      qrDescription: '首版不公开永久群二维码，避免广告和陌生人直接入群。'
    },
    updated_by: null,
    updated_at: demoNow
  }
]
