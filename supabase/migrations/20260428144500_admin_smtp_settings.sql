-- 本脚本用于新增管理员可维护的 SMTP 服务设置表。
-- 执行方式：请先执行前面的初始化和问云小院脚本，再复制本脚本到 Supabase SQL 编辑器执行。

-- 这里创建 SMTP 设置表，授权码只允许管理员通过 RLS 读写，不放进公开 site_settings。
create table if not exists public.smtp_settings (
  id text primary key default 'default',
  enabled boolean not null default false,
  host text not null default 'smtp.qq.com',
  port integer not null default 465 check (port > 0 and port < 65536),
  secure boolean not null default true,
  username text not null default '',
  password text not null default '',
  from_email text not null default '',
  updated_by uuid references public.profiles(id),
  updated_at timestamptz not null default now()
);

-- 这里复用更新时间触发器，让后台能看到最后保存时间。
drop trigger if exists trg_smtp_settings_updated_at on public.smtp_settings;
create trigger trg_smtp_settings_updated_at
before update on public.smtp_settings
for each row execute function public.set_updated_at();

-- 这里开启行级安全，避免普通用户读取 SMTP 授权码。
alter table public.smtp_settings enable row level security;

-- 这里清理旧策略，保证脚本重复执行不会报错。
drop policy if exists "管理员可管理 SMTP 设置" on public.smtp_settings;

-- 这里只允许掌门或执事读取和保存 SMTP 设置。
create policy "管理员可管理 SMTP 设置"
on public.smtp_settings
for all
using (public.is_wenyun_admin())
with check (public.is_wenyun_admin());

-- 这里授权登录用户访问表，实际是否可读写由 RLS 判断。
grant select, insert, update on public.smtp_settings to authenticated;

-- 这里写入一条默认配置，管理员后续可在后台设置页修改。
insert into public.smtp_settings (id, enabled, host, port, secure, username, password, from_email)
values ('default', false, 'smtp.qq.com', 465, true, '', '', '')
on conflict (id) do nothing;
