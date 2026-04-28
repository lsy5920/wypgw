-- 本脚本用于清空登录系统上线前产生的名册和云灯测试数据。
-- 执行位置：Supabase SQL 编辑器。
-- 重要提醒：本脚本会删除 public.join_applications、public.cloud_lanterns 以及相关站内提醒。
-- 保留内容：管理员账号、profiles 用户资料、公告、活动、站点设置、SMTP 设置都不会删除。
-- 建议顺序：先执行本脚本，再执行 supabase/migrations/20260428173000_import_yunqi_legacy_roster.sql。

begin;

-- 这里删除名册和云灯相关站内提醒，避免提醒指向已经删除的数据；如果旧库还没有提醒表，就自动跳过。
do $$
begin
  -- 这里判断提醒表是否存在，避免半升级数据库执行时报错。
  if to_regclass('public.user_notifications') is not null then
    delete from public.user_notifications
    where target_table in ('join_applications', 'cloud_lanterns')
       or kind in ('application', 'lantern');
  end if;
end;
$$;

-- 这里清空云灯留言，包含游客时代和登录时代的测试留言。
delete from public.cloud_lanterns;

-- 这里清空名册登记，包含游客时代和登录时代的测试名帖。
delete from public.join_applications;

commit;

-- 这里检查清空结果，三个数量都应该是 0。
select
  (select count(*) from public.join_applications) as 剩余名册数量,
  (select count(*) from public.cloud_lanterns) as 剩余云灯数量,
  case
    when to_regclass('public.user_notifications') is null then 0
    else (select count(*) from public.user_notifications where target_table in ('join_applications', 'cloud_lanterns') or kind in ('application', 'lantern'))
  end as 剩余相关提醒数量;
