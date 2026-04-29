-- 这个脚本新增归云堂入群二维码后台设置表。
-- 重要：二维码只保存在受 RLS 保护的后台表中，不放进公开 site_settings，也不放进 public 静态资源。

-- 这里创建归云堂设置表，固定一条 default 记录即可。
create table if not exists public.guiyuntang_settings (
  id text primary key default 'default',
  enabled boolean not null default true,
  qr_image_data_url text,
  instruction text not null default '名帖审核通过后，可引导同门扫码加入归云堂；确认进群后将名帖状态改为“已入群”。',
  warning text not null default '归云堂入群二维码只供后台审核使用，严禁截图外传、公开发布或转交未审核人员。',
  updated_by uuid references public.profiles(id),
  updated_at timestamptz not null default now(),
  constraint guiyuntang_settings_singleton check (id = 'default')
);

-- 这里复用更新时间触发器，让后台能看到最后保存时间。
drop trigger if exists trg_guiyuntang_settings_updated_at on public.guiyuntang_settings;
create trigger trg_guiyuntang_settings_updated_at
before update on public.guiyuntang_settings
for each row execute function public.set_updated_at();

-- 这里自动记录最后修改人，方便以后排查是谁更新了二维码。
create or replace function public.set_guiyuntang_settings_updated_by()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  new.updated_by = auth.uid();
  return new;
end;
$$;

drop trigger if exists trg_guiyuntang_settings_updated_by on public.guiyuntang_settings;
create trigger trg_guiyuntang_settings_updated_by
before insert or update on public.guiyuntang_settings
for each row execute function public.set_guiyuntang_settings_updated_by();

-- 这里开启行级安全，确保普通用户无法读取二维码。
alter table public.guiyuntang_settings enable row level security;

-- 这里清理旧策略，保证脚本可以重复执行。
drop policy if exists "管理员可管理归云堂二维码" on public.guiyuntang_settings;

-- 这里只允许掌门或执事读取和维护归云堂二维码。
create policy "管理员可管理归云堂二维码"
on public.guiyuntang_settings
for all
to authenticated
using (public.is_wenyun_admin())
with check (public.is_wenyun_admin());

-- 这里授权登录用户访问表，真实可读写范围仍由 RLS 决定。
grant select, insert, update on public.guiyuntang_settings to authenticated;

-- 这里写入默认配置，不包含真实二维码，避免把群二维码写入 SQL 或代码仓库。
insert into public.guiyuntang_settings (id, enabled, qr_image_data_url, instruction, warning)
values (
  'default',
  true,
  null,
  '名帖审核通过后，可引导同门扫码加入归云堂；确认进群后将名帖状态改为“已入群”。',
  '归云堂入群二维码只供后台审核使用，严禁截图外传、公开发布或转交未审核人员。'
)
on conflict (id) do nothing;
