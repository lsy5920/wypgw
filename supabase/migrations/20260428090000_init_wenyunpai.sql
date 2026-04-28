-- 本脚本用于初始化问云派官网数据库。
-- 直接复制到 Supabase SQL 编辑器执行即可。

-- 这里启用 UUID 生成扩展，用于给各业务表生成唯一编号。
create extension if not exists "pgcrypto";

-- 这个函数用于自动刷新 updated_at 字段，入参是触发器上下文，返回值是更新后的记录。
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  -- 这里把更新时间改成当前时间，保证后台能看到最新修改时间。
  new.updated_at = now();
  return new;
end;
$$;

-- 这里创建成员资料表，用于保存用户昵称、角色和公开资料。
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  nickname text not null,
  avatar_url text,
  role text not null default 'member' check (role in ('visitor', 'applicant', 'member', 'guardian', 'admin', 'founder')),
  city text,
  bio text,
  is_public boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 这里创建入派申请表，用于保存游客递交的入派帖。
create table if not exists public.join_applications (
  id uuid primary key default gen_random_uuid(),
  nickname text not null,
  wechat_id text not null,
  age_range text,
  city text,
  reason text not null,
  accept_rules boolean not null default false,
  offline_interest text,
  remark text,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected', 'contacted', 'joined')),
  admin_note text,
  reviewed_by uuid references public.profiles(id),
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);

-- 这里创建云灯留言表，用于保存树洞、祝福和同门问候。
create table if not exists public.cloud_lanterns (
  id uuid primary key default gen_random_uuid(),
  author_name text not null default '匿名同门',
  content text not null,
  mood text,
  is_anonymous boolean not null default true,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_by uuid references public.profiles(id),
  reviewed_by uuid references public.profiles(id),
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);

-- 这里创建公告表，用于保存山门公告、门规更新和活动通知。
create table if not exists public.announcements (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text unique not null,
  category text not null,
  summary text,
  content text not null,
  cover_url text,
  is_pinned boolean not null default false,
  status text not null default 'draft' check (status in ('draft', 'published')),
  published_at timestamptz,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 这里创建活动表，用于保存线上清谈、读书会、茶会和线下雅集。
create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  type text not null,
  mode text not null check (mode in ('online', 'offline')),
  location text,
  event_time timestamptz,
  description text,
  capacity integer check (capacity is null or capacity > 0),
  status text not null default 'draft' check (status in ('draft', 'published', 'closed', 'ended')),
  cover_url text,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 这里创建活动报名表，用于后续成员报名问云雅集。
create table if not exists public.event_registrations (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete cascade,
  nickname text,
  contact text,
  note text,
  status text not null default 'registered' check (status in ('registered', 'cancelled', 'attended')),
  created_at timestamptz not null default now()
);

-- 这里创建站点设置表，用于保存联系人、二维码说明等可配置内容。
create table if not exists public.site_settings (
  key text primary key,
  value jsonb not null,
  updated_by uuid references public.profiles(id),
  updated_at timestamptz not null default now()
);

-- 这里创建操作日志表，用于后续记录后台重要动作。
create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.profiles(id),
  action text not null,
  target_table text,
  target_id uuid,
  detail jsonb,
  created_at timestamptz not null default now()
);

-- 这里添加常用索引，保证列表查询和审核筛选更快。
create index if not exists idx_join_applications_status_created on public.join_applications(status, created_at desc);
create index if not exists idx_cloud_lanterns_status_created on public.cloud_lanterns(status, created_at desc);
create index if not exists idx_announcements_status_pinned on public.announcements(status, is_pinned desc, published_at desc);
create index if not exists idx_events_status_time on public.events(status, event_time asc);
create index if not exists idx_event_registrations_event on public.event_registrations(event_id);

-- 这里给需要更新时间的表绑定触发器。
drop trigger if exists trg_profiles_updated_at on public.profiles;
create trigger trg_profiles_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

drop trigger if exists trg_announcements_updated_at on public.announcements;
create trigger trg_announcements_updated_at
before update on public.announcements
for each row execute function public.set_updated_at();

drop trigger if exists trg_events_updated_at on public.events;
create trigger trg_events_updated_at
before update on public.events
for each row execute function public.set_updated_at();

-- 这个函数用于新用户注册后自动创建资料，入参是 auth.users 新记录，返回值是原记录。
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- 这里用邮箱前缀作为默认昵称，避免资料表缺失导致后台无法判断角色。
  insert into public.profiles (id, nickname, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'nickname', split_part(new.email, '@', 1), '问云同门'),
    'member'
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

-- 这里绑定注册触发器，保证每个 Auth 用户都有 profiles 记录。
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- 这个函数用于判断当前登录者是否为掌门或执事，入参为空，返回值是真或假。
create or replace function public.is_wenyun_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role in ('admin', 'founder')
  );
$$;

-- 这里开启所有业务表的行级安全，防止前端匿名密钥越权读取数据。
alter table public.profiles enable row level security;
alter table public.join_applications enable row level security;
alter table public.cloud_lanterns enable row level security;
alter table public.announcements enable row level security;
alter table public.events enable row level security;
alter table public.event_registrations enable row level security;
alter table public.site_settings enable row level security;
alter table public.audit_logs enable row level security;

-- 这里清理旧策略，方便重复执行本脚本时不会报策略已存在。
drop policy if exists "公开资料可读" on public.profiles;
drop policy if exists "用户可新增自己的资料" on public.profiles;
drop policy if exists "用户可更新自己的资料" on public.profiles;
drop policy if exists "管理员可管理资料" on public.profiles;
drop policy if exists "游客可提交入派申请" on public.join_applications;
drop policy if exists "管理员可管理入派申请" on public.join_applications;
drop policy if exists "公开可读已审核云灯" on public.cloud_lanterns;
drop policy if exists "游客可提交云灯" on public.cloud_lanterns;
drop policy if exists "管理员可管理云灯" on public.cloud_lanterns;
drop policy if exists "公开可读已发布公告" on public.announcements;
drop policy if exists "管理员可管理公告" on public.announcements;
drop policy if exists "公开可读已发布活动" on public.events;
drop policy if exists "管理员可管理活动" on public.events;
drop policy if exists "用户可读取自己的报名" on public.event_registrations;
drop policy if exists "用户可提交自己的报名" on public.event_registrations;
drop policy if exists "管理员可管理报名" on public.event_registrations;
drop policy if exists "公开可读站点设置" on public.site_settings;
drop policy if exists "管理员可管理站点设置" on public.site_settings;
drop policy if exists "管理员可读取操作日志" on public.audit_logs;
drop policy if exists "管理员可写入操作日志" on public.audit_logs;

-- 资料表策略：公开资料、本人资料和管理员可读。
create policy "公开资料可读"
on public.profiles
for select
using (is_public = true or auth.uid() = id or public.is_wenyun_admin());

-- 资料表策略：用户只能新增自己的资料。
create policy "用户可新增自己的资料"
on public.profiles
for insert
with check (auth.uid() = id);

-- 资料表策略：用户只能更新自己的非管理员资料。
create policy "用户可更新自己的资料"
on public.profiles
for update
using (auth.uid() = id)
with check (auth.uid() = id and role in ('visitor', 'applicant', 'member', 'guardian'));

-- 资料表策略：管理员可管理全部资料。
create policy "管理员可管理资料"
on public.profiles
for all
using (public.is_wenyun_admin())
with check (public.is_wenyun_admin());

-- 入派申请策略：任何人都能提交，但必须确认门规。
create policy "游客可提交入派申请"
on public.join_applications
for insert
with check (accept_rules = true and status = 'pending');

-- 入派申请策略：只有管理员能读取、更新和删除。
create policy "管理员可管理入派申请"
on public.join_applications
for all
using (public.is_wenyun_admin())
with check (public.is_wenyun_admin());

-- 云灯策略：公开用户只能读审核通过的云灯。
create policy "公开可读已审核云灯"
on public.cloud_lanterns
for select
using (status = 'approved' or public.is_wenyun_admin());

-- 云灯策略：任何人都能提交待审核云灯。
create policy "游客可提交云灯"
on public.cloud_lanterns
for insert
with check (status = 'pending' and length(trim(content)) > 0);

-- 云灯策略：管理员可审核和管理全部云灯。
create policy "管理员可管理云灯"
on public.cloud_lanterns
for all
using (public.is_wenyun_admin())
with check (public.is_wenyun_admin());

-- 公告策略：公开用户只能读已发布公告。
create policy "公开可读已发布公告"
on public.announcements
for select
using (status = 'published' or public.is_wenyun_admin());

-- 公告策略：管理员可管理全部公告。
create policy "管理员可管理公告"
on public.announcements
for all
using (public.is_wenyun_admin())
with check (public.is_wenyun_admin());

-- 活动策略：公开用户只能读已发布活动。
create policy "公开可读已发布活动"
on public.events
for select
using (status = 'published' or public.is_wenyun_admin());

-- 活动策略：管理员可管理全部活动。
create policy "管理员可管理活动"
on public.events
for all
using (public.is_wenyun_admin())
with check (public.is_wenyun_admin());

-- 报名策略：用户可读取自己的报名，管理员可读取全部。
create policy "用户可读取自己的报名"
on public.event_registrations
for select
using (auth.uid() = user_id or public.is_wenyun_admin());

-- 报名策略：用户可提交自己的报名。
create policy "用户可提交自己的报名"
on public.event_registrations
for insert
with check (auth.uid() = user_id);

-- 报名策略：管理员可管理全部报名。
create policy "管理员可管理报名"
on public.event_registrations
for all
using (public.is_wenyun_admin())
with check (public.is_wenyun_admin());

-- 设置策略：公开用户可读取站点基础设置，方便联系页展示。
create policy "公开可读站点设置"
on public.site_settings
for select
using (true);

-- 设置策略：管理员可管理站点设置。
create policy "管理员可管理站点设置"
on public.site_settings
for all
using (public.is_wenyun_admin())
with check (public.is_wenyun_admin());

-- 日志策略：管理员可读取操作日志。
create policy "管理员可读取操作日志"
on public.audit_logs
for select
using (public.is_wenyun_admin());

-- 日志策略：管理员可写入操作日志。
create policy "管理员可写入操作日志"
on public.audit_logs
for insert
with check (public.is_wenyun_admin());

-- 这里写入默认联系设置，前台联系页会优先读取它。
insert into public.site_settings (key, value)
values (
  'contact',
  jsonb_build_object(
    'wechatName', '问云派执事',
    'contactTip', '请先提交入派帖，执事查看后会择时联系。',
    'qrDescription', '首版不公开永久群二维码，避免广告和陌生人直接入群。'
  )
)
on conflict (key) do nothing;

-- 管理员初始化示例：
-- 1. 先在官网 /login 注册并登录一次。
-- 2. 到 Supabase SQL 编辑器执行下面语句，把邮箱改成你的管理员邮箱。
-- update public.profiles
-- set role = 'founder'
-- where id = (select id from auth.users where email = '你的邮箱@example.com');
