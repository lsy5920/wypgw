-- 本脚本用于新增问云小院、登录用户数据归属、站内提醒和邮件提醒记录。
-- 执行方式：请先执行前面的初始化和名册升级脚本，再复制本脚本到 Supabase SQL 编辑器执行。

-- 这里给名帖增加登录用户编号，旧游客名帖允许为空，新的登录名帖必须写入当前用户。
alter table public.join_applications
add column if not exists user_id uuid references public.profiles(id) on delete set null;

-- 这里给名帖用户编号加索引，方便问云小院快速读取“我的名帖”。
create index if not exists idx_join_applications_user_created
on public.join_applications(user_id, created_at desc);

-- 这里给云灯创建人加索引，方便问云小院快速读取“我的云灯”。
create index if not exists idx_cloud_lanterns_created_by_created
on public.cloud_lanterns(created_by, created_at desc);

-- 这里保证一个用户对同一个活动只有一条报名记录，取消后再次报名会复用旧记录。
create unique index if not exists event_registrations_event_user_unique
on public.event_registrations(event_id, user_id)
where user_id is not null;

-- 这里创建用户提醒表，用于记录名帖、云灯、活动状态变化和邮件发送情况。
create table if not exists public.user_notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  kind text not null check (kind in ('application', 'lantern', 'event')),
  title text not null,
  content text not null,
  target_table text,
  target_id uuid,
  email_status text not null default 'pending' check (email_status in ('pending', 'sent', 'failed', 'skipped')),
  email_error text,
  sent_at timestamptz,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

-- 这里给提醒按用户和时间排序加索引，让小院消息列表更快。
create index if not exists idx_user_notifications_user_created
on public.user_notifications(user_id, created_at desc);

-- 这里开启提醒表行级安全，防止用户看到别人的站内消息。
alter table public.user_notifications enable row level security;

-- 这里清理旧策略，保证脚本重复执行不会报错。
drop policy if exists "游客可提交名册登记" on public.join_applications;
drop policy if exists "登录用户可提交名册登记" on public.join_applications;
drop policy if exists "用户可读取自己的名帖" on public.join_applications;
drop policy if exists "游客可提交云灯" on public.cloud_lanterns;
drop policy if exists "登录用户可提交云灯" on public.cloud_lanterns;
drop policy if exists "用户可读取自己的云灯" on public.cloud_lanterns;
drop policy if exists "用户可更新自己的报名" on public.event_registrations;
drop policy if exists "用户可读取自己的提醒" on public.user_notifications;
drop policy if exists "用户可新增自己的提醒" on public.user_notifications;
drop policy if exists "用户可更新自己的提醒" on public.user_notifications;
drop policy if exists "管理员可管理提醒" on public.user_notifications;

-- 这里允许登录用户读取自己的名帖，管理员仍可读取全部名帖。
create policy "用户可读取自己的名帖"
on public.join_applications
for select
using (auth.uid() = user_id or public.is_wenyun_admin());

-- 这里收紧名帖提交权限：必须登录，且只能给自己提交待审核同门名帖。
create policy "登录用户可提交名册登记"
on public.join_applications
for insert
to authenticated
with check (
  auth.uid() = user_id
  and accept_rules = true
  and status = 'pending'
  and member_role = '同门'
  and generation_name = '云'
  and gender in ('男', '女')
);

-- 这里允许登录用户读取自己的云灯，包含待审核和被拒绝内容。
create policy "用户可读取自己的云灯"
on public.cloud_lanterns
for select
using (auth.uid() = created_by or public.is_wenyun_admin());

-- 这里收紧云灯提交权限：必须登录，且只能为自己提交待审核云灯。
create policy "登录用户可提交云灯"
on public.cloud_lanterns
for insert
to authenticated
with check (
  auth.uid() = created_by
  and status = 'pending'
  and length(trim(content)) > 0
);

-- 这里允许用户取消或恢复自己的活动报名，管理员仍可管理全部报名。
create policy "用户可更新自己的报名"
on public.event_registrations
for update
using (auth.uid() = user_id or public.is_wenyun_admin())
with check (auth.uid() = user_id or public.is_wenyun_admin());

-- 这里允许用户读取自己的提醒，管理员可读取全部提醒。
create policy "用户可读取自己的提醒"
on public.user_notifications
for select
using (auth.uid() = user_id or public.is_wenyun_admin());

-- 这里允许用户或管理员新增提醒。普通用户只能给自己新增，管理员可给任何用户新增。
create policy "用户可新增自己的提醒"
on public.user_notifications
for insert
with check (auth.uid() = user_id or public.is_wenyun_admin());

-- 这里允许用户标记自己的提醒为已读，也允许管理员更新邮件发送结果。
create policy "用户可更新自己的提醒"
on public.user_notifications
for update
using (auth.uid() = user_id or public.is_wenyun_admin())
with check (auth.uid() = user_id or public.is_wenyun_admin());

-- 这里保留管理员全量管理提醒的能力，方便后续排查邮件发送问题。
create policy "管理员可管理提醒"
on public.user_notifications
for all
using (public.is_wenyun_admin())
with check (public.is_wenyun_admin());

-- 这里显式授权登录用户访问小院相关表，权限最终仍由 RLS 策略决定。
grant select, insert, update on public.user_notifications to authenticated;
grant select, insert, update on public.event_registrations to authenticated;
grant select, insert on public.join_applications to authenticated;
grant select, insert on public.cloud_lanterns to authenticated;
