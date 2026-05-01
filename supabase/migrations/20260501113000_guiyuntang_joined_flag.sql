-- 这个脚本把“是否已入归云堂”从名帖审核状态中拆出来，避免“已审核”和“已入群”混在一起。
-- 执行方式：复制本文件全部内容到 Supabase SQL 编辑器执行一次，然后重新部署并刷新网站。

begin;

-- 这里先删除公开视图，避免后续调整名帖状态约束时被旧视图依赖。
drop view if exists public.roster_entries;

-- 这里新增独立入群字段，分别记录是否入群、确认时间和确认人。
alter table public.join_applications
add column if not exists guiyuntang_joined boolean not null default false,
add column if not exists guiyuntang_joined_at timestamptz,
add column if not exists guiyuntang_joined_by uuid references public.profiles(id);

-- 这里给入群状态加索引，后台筛选和后续统计会更稳定。
create index if not exists idx_join_applications_guiyuntang_joined
on public.join_applications(guiyuntang_joined, guiyuntang_joined_at desc);

-- 这里迁移旧数据：旧版 status='joined' 表示已入群，新版改成独立字段并把审核状态回到已审核。
update public.join_applications
set guiyuntang_joined = true,
    guiyuntang_joined_at = coalesce(guiyuntang_joined_at, reviewed_at, joined_at, created_at, now()),
    guiyuntang_joined_by = coalesce(guiyuntang_joined_by, reviewed_by, user_id),
    status = 'approved'
where status = 'joined';

-- 这里重建名帖审核状态约束，删除旧的 joined 状态。
alter table public.join_applications
drop constraint if exists join_applications_status_check;

alter table public.join_applications
add constraint join_applications_status_check
check (status in ('pending', 'approved', 'rejected', 'contacted', 'draft', 'retired'));

-- 这个函数根据名帖状态给资料同步排序，入参是状态，返回值越小优先级越高。
create or replace function public.get_wenyun_roster_profile_priority(target_status text)
returns integer
language sql
immutable
as $$
  select case target_status
    when 'contacted' then 1
    when 'approved' then 2
    when 'pending' then 3
    when 'draft' then 4
    when 'rejected' then 5
    when 'retired' then 6
    else 99
  end;
$$;

-- 这里重建公开名册视图，只展示正式审核通过或已联系的成员，不把入群状态当成公开名册状态。
create view public.roster_entries as
select
  id,
  nickname as dao_name,
  jianghu_name,
  member_code,
  gender,
  age_range as birth_month,
  city,
  member_role,
  generation_name,
  public_region,
  motto,
  tags,
  companion_expectation,
  joined_at,
  status,
  created_at
from public.join_applications
where status in ('approved', 'contacted')
order by roster_serial asc nulls last, member_code asc;

grant select on public.roster_entries to anon, authenticated;

-- 这里重建归云堂二维码权限：管理员可管理，审核通过的本人可读取。
drop policy if exists "管理员可管理归云堂二维码" on public.guiyuntang_settings;
drop policy if exists "合格成员可读取归云堂二维码" on public.guiyuntang_settings;

create policy "管理员可管理归云堂二维码"
on public.guiyuntang_settings
for all
to authenticated
using (public.is_wenyun_admin())
with check (public.is_wenyun_admin());

create policy "合格成员可读取归云堂二维码"
on public.guiyuntang_settings
for select
to authenticated
using (
  enabled = true
  and exists (
    select 1
    from public.join_applications as application_row
    where application_row.user_id = auth.uid()
      and application_row.status in ('approved', 'contacted')
  )
);

-- 这里把旧设置里的说明文案同步成新版，避免后台仍提示“把状态改为已入群”。
update public.guiyuntang_settings
set instruction = '名帖审核通过后，可引导同门扫码加入归云堂；用户或管理员确认进群后，会写入独立入群状态。'
where instruction like '%状态改为%已入群%';

-- 这个函数由成员本人点击“我已入群”时调用，入参是名帖编号，返回值是更新后的名帖。
create or replace function public.confirm_my_guiyuntang_joined(target_application_id uuid)
returns public.join_applications
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  -- 这个变量保存当前登录用户编号。
  current_user_id uuid := auth.uid();
  -- 这个变量保存更新后的名帖记录。
  updated_record public.join_applications%rowtype;
begin
  -- 这里拦截未登录调用，避免匿名用户确认入群。
  if current_user_id is null then
    raise exception '请先登录问云小院。';
  end if;

  -- 这里只允许本人确认自己的已审核名帖，未审核、拒绝、暂存、退派都不能读取或确认二维码。
  update public.join_applications
  set guiyuntang_joined = true,
      guiyuntang_joined_at = coalesce(guiyuntang_joined_at, now()),
      guiyuntang_joined_by = current_user_id
  where id = target_application_id
    and user_id = current_user_id
    and status in ('approved', 'contacted')
  returning * into updated_record;

  -- 这里没有更新到记录时给出明确中文错误，方便前端提醒用户刷新或联系执事。
  if not found then
    raise exception '没有找到可确认入群的已审核名帖。';
  end if;

  return updated_record;
end;
$$;

-- 这里授权登录用户执行确认函数，函数内部仍会检查本人和名帖状态。
grant execute on function public.confirm_my_guiyuntang_joined(uuid) to authenticated;

commit;

-- 这里输出检查结果，旧 joined 状态应为 0，独立入群字段会显示已确认人数。
select
  (
    select count(*)
    from public.join_applications
    where status = 'joined'
  ) as 旧入群状态剩余数量,
  (
    select count(*)
    from public.join_applications
    where guiyuntang_joined = true
  ) as 已确认入群人数;
