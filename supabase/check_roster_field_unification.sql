-- 本脚本用于检查问云名册字段是否已经整理统一。
-- 执行方式：复制到 Supabase SQL 编辑器执行；本脚本只查询，不会修改数据。

-- 这里查看名帖表还剩哪些字段，方便确认旧字段已经被删除。
select
  ordinal_position as 顺序,
  column_name as 字段名,
  data_type as 字段类型,
  is_nullable as 是否可空
from information_schema.columns
where table_schema = 'public'
  and table_name = 'join_applications'
order by ordinal_position;

-- 这里检查已经废弃的旧字段是否还残留。
select
  count(*) as 废弃字段剩余数量
from information_schema.columns
where table_schema = 'public'
  and table_name = 'join_applications'
  and column_name in ('offline_interest', 'remark', 'public_story', 'raw_story', 'bond_status', 'cover_name');

-- 这里检查用户中心 profiles 道名是否和名册资料道名一致。
select
  count(*) as 道名不一致数量
from public.profiles as profile_row
join public.join_applications as application_row on application_row.user_id = profile_row.id
where application_row.status in ('approved', 'contacted', 'joined', 'pending')
  and application_row.nickname is distinct from profile_row.nickname;

-- 这里列出仍不一致的样例，正常情况下应没有结果。
select
  profile_row.id as 用户编号,
  profile_row.nickname as 用户中心道名,
  application_row.nickname as 名册资料道名,
  application_row.member_code as 名册编号,
  application_row.status as 名帖状态
from public.profiles as profile_row
join public.join_applications as application_row on application_row.user_id = profile_row.id
where application_row.status in ('approved', 'contacted', 'joined', 'pending')
  and application_row.nickname is distinct from profile_row.nickname
order by application_row.created_at desc
limit 20;

-- 这里检查归云堂二维码权限策略是否存在。
select
  policyname as 策略名称,
  cmd as 操作类型
from pg_policies
where schemaname = 'public'
  and tablename = 'guiyuntang_settings'
order by policyname;
