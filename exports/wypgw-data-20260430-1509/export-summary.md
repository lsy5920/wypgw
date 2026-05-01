# 数据导出说明

导出时间：2026-04-30T15:09:32.977Z

本次导出使用网站公开匿名权限，只包含当前网站在该权限下可读取的数据。

## 数据表统计
- 公开名册（roster_entries）：36 条
- 云灯留言（cloud_lanterns）：5 条
- 公告（announcements）：1 条
- 活动（events）：0 条
- 站点设置（site_settings）：1 条
- 公开资料（profiles）：28 条
- 名册申请（join_applications）：0 条
- 活动报名（event_registrations）：0 条
- 站内提醒（user_notifications）：0 条
- 问心考核结果（wenxin_quiz_results）：0 条
- 邮件设置（smtp_settings）：0 条
- 归云堂设置（guiyuntang_settings）：0 条

## 字段保留规则
仅保留当前网站页面、服务函数或公开视图正在使用的字段；未导出数据库中的操作日志、邮件授权码、认证密码等内容。

## 后台私有数据说明
名册申请、报名、提醒、问心考核、邮件设置、归云堂设置等后台或个人数据受 Supabase 行级权限保护。当前没有管理员会话或服务密钥时，公开导出会显示为 0 条。
