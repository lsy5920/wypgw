-- 本脚本用于统一问云名册资料字段，并删除前端已经不再使用的旧字段。
-- 执行方式：复制本文件全部内容到 Supabase SQL 编辑器执行一次。
-- 处理原则：道名、城市等展示资料以名册资料为准，并同步回 profiles，避免用户中心和资料页显示不一致。

begin;

-- 这里先删除公开视图，因为旧视图可能依赖即将删除的旧字段。
drop view if exists public.roster_entries;

-- 这里把旧“公开故事”合并进“兴趣爱好”，避免删除旧字段前丢失线上已有文字。
do $$
begin
  -- 这里检查 public_story 是否存在，避免已经清理过的数据库重复执行时报错。
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'join_applications'
      and column_name = 'public_story'
  ) then
    execute $sql$
      update public.join_applications
      set tags = nullif(
        concat_ws(
          '、',
          nullif(trim(coalesce(tags, '')), ''),
          nullif(trim(coalesce(public_story, '')), '')
        ),
        ''
      )
      where nullif(trim(coalesce(public_story, '')), '') is not null
        and position(nullif(trim(coalesce(public_story, '')), '') in coalesce(tags, '')) = 0
    $sql$;
  end if;
end;
$$;

-- 这个函数根据名帖状态给资料同步排序，入参是状态，返回值越小优先级越高。
create or replace function public.get_wenyun_roster_profile_priority(target_status text)
returns integer
language sql
immutable
as $$
  select case target_status
    when 'joined' then 1
    when 'contacted' then 2
    when 'approved' then 3
    when 'pending' then 4
    when 'draft' then 5
    when 'rejected' then 6
    when 'retired' then 7
    else 99
  end;
$$;

-- 这个函数把名册资料同步到 profiles，入参是用户编号，返回值为空。
create or replace function public.sync_profile_from_roster(target_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  -- 这个变量保存最适合作为资料来源的名帖。
  source_record public.join_applications%rowtype;
begin
  -- 这里没有用户编号时直接结束，旧游客数据不会写入 profiles。
  if target_user_id is null then
    return;
  end if;

  -- 这里挑选当前用户最正式的一张名帖作为资料来源。
  select *
  into source_record
  from public.join_applications
  where user_id = target_user_id
  order by public.get_wenyun_roster_profile_priority(status) asc, created_at desc
  limit 1;

  -- 这里没有名帖时不改 profiles，避免空值覆盖原资料。
  if not found then
    return;
  end if;

  -- 这里把道名和所在城市同步到 profiles，保证小院总览、权限栏和资料页显示一致。
  insert into public.profiles (id, nickname, city, role, is_public, created_at, updated_at)
  values (
    target_user_id,
    source_record.nickname,
    coalesce(source_record.public_region, source_record.city),
    'member',
    false,
    now(),
    now()
  )
  on conflict (id) do update
  set nickname = excluded.nickname,
      city = excluded.city,
      updated_at = now();
end;
$$;

-- 这个触发器函数在名帖变更后同步 profiles，入参是触发器记录，返回值是变更后的记录。
create or replace function public.sync_profile_from_roster_trigger()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  -- 这里分别处理新增、修改和删除，确保资料主显示不会留旧道名。
  if tg_op = 'DELETE' then
    perform public.sync_profile_from_roster(old.user_id);
    return old;
  end if;

  perform public.sync_profile_from_roster(new.user_id);
  return new;
end;
$$;

-- 这个函数在新增或更新名册时补齐字段默认值，入参是触发器记录，返回值是清理后的记录。
create or replace function public.set_wenyun_roster_fields()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- 这里清理道名，避免前后空格进入名册。
  new.nickname = trim(new.nickname);

  -- 这里清理江湖名，空值保存为空，方便前台展示兜底文案。
  new.jianghu_name = nullif(trim(coalesce(new.jianghu_name, '')), '');

  -- 这里清理真实姓名，真实姓名只给后台核对，不进入公开视图。
  new.real_name = nullif(trim(coalesce(new.real_name, '')), '');

  -- 这里补齐性别。
  new.gender = coalesce(nullif(trim(new.gender), ''), '男');

  -- 这里兼容旧身份并统一成新身份。
  new.member_role = case
    when trim(coalesce(new.member_role, '')) in ('掌门') then '掌门'
    when trim(coalesce(new.member_role, '')) in ('执事', '护山执事') then '执事'
    when trim(coalesce(new.member_role, '')) in ('护灯人') then '护灯人'
    else '同门'
  end;

  -- 这里补齐辈分字，只取第一个字，默认是“云”。
  new.generation_name = coalesce(nullif(left(trim(new.generation_name), 1), ''), '云');

  -- 这里在编号为空时沿用问云编号生成逻辑。
  if new.member_code is null or trim(new.member_code) = '' then
    new.member_code = public.next_wenyun_member_code(new.generation_name);
  else
    new.member_code = replace(trim(new.member_code), '云栖-云-', '问云-云-');
  end if;

  -- 这里让所在城市、宣言、兴趣爱好和联系方式有兜底值。
  new.public_region = nullif(trim(coalesce(new.public_region, new.city, '')), '');
  new.raw_region = nullif(trim(coalesce(new.raw_region, new.public_region, new.city, '')), '');
  new.motto = nullif(trim(coalesce(new.motto, new.reason, '')), '');
  new.tags = nullif(trim(coalesce(new.tags, '')), '');
  new.companion_expectation = nullif(trim(coalesce(new.companion_expectation, '')), '');
  new.legacy_contact = nullif(trim(coalesce(new.legacy_contact, new.wechat_id, '')), '');
  new.requested_nickname = nullif(trim(coalesce(new.requested_nickname, '')), '');
  new.requested_legacy_contact = nullif(trim(coalesce(new.requested_legacy_contact, '')), '');

  -- 这里没有待审核修改时清空提交时间，避免后台误判。
  if new.requested_nickname is null and new.requested_legacy_contact is null then
    new.requested_at = null;
  elsif new.requested_at is null then
    new.requested_at = now();
  end if;

  return new;
end;
$$;

-- 这个函数让用户维护自己的名册资料，入参是页面表单字段，返回值是更新后的名帖。
create or replace function public.update_my_roster_profile(
  target_application_id uuid,
  next_jianghu_name text,
  next_gender text,
  next_city text,
  next_motto text,
  next_hobbies text,
  next_companion_expectation text,
  requested_dao_name text,
  requested_contact text
)
returns public.join_applications
language plpgsql
security definer
set search_path = public
as $$
declare
  -- 这个变量保存当前登录用户编号。
  current_user_id uuid := auth.uid();
  -- 这个变量保存当前名帖，用于判断是否属于本人。
  current_record public.join_applications%rowtype;
  -- 这个变量保存更新后的名帖。
  updated_record public.join_applications%rowtype;
  -- 这个变量保存待审核道名。
  pending_dao_name text := nullif(trim(coalesce(requested_dao_name, '')), '');
  -- 这个变量保存待审核联系方式。
  pending_contact text := nullif(trim(coalesce(requested_contact, '')), '');
begin
  -- 这里拦截未登录调用。
  if current_user_id is null then
    raise exception '请先登录问云小院。';
  end if;

  -- 这里读取本人的名帖，防止用户越权修改别人资料。
  select *
  into current_record
  from public.join_applications
  where id = target_application_id
    and user_id = current_user_id
  limit 1;

  if not found then
    raise exception '没有找到属于你的名帖。';
  end if;

  -- 这里校验性别，只允许官网当前支持的选项。
  if next_gender not in ('男', '女') then
    raise exception '性别选项不正确。';
  end if;

  -- 这里校验待审核道名，空值表示不申请修改。
  if pending_dao_name is not null and (left(pending_dao_name, 1) <> '云' or char_length(pending_dao_name) not between 2 and 3) then
    raise exception '道名需以“云”字开头，长度为 2 到 3 个字。';
  end if;

  -- 这里如果用户填写的道名或联系方式和当前一致，就不创建待审核修改。
  if pending_dao_name = current_record.nickname then
    pending_dao_name := null;
  end if;

  if pending_contact = coalesce(current_record.legacy_contact, current_record.wechat_id) then
    pending_contact := null;
  end if;

  -- 这里更新用户可直接修改的字段，道名和联系方式只写入待审核字段。
  update public.join_applications
  set jianghu_name = nullif(trim(coalesce(next_jianghu_name, '')), ''),
      gender = next_gender,
      city = nullif(trim(coalesce(next_city, '')), ''),
      public_region = nullif(trim(coalesce(next_city, '')), ''),
      raw_region = nullif(trim(coalesce(next_city, '')), ''),
      motto = nullif(trim(coalesce(next_motto, '')), ''),
      reason = coalesce(nullif(trim(coalesce(next_motto, '')), ''), reason),
      tags = nullif(trim(coalesce(next_hobbies, '')), ''),
      companion_expectation = nullif(trim(coalesce(next_companion_expectation, '')), ''),
      requested_nickname = pending_dao_name,
      requested_legacy_contact = pending_contact,
      requested_at = case
        when pending_dao_name is not null or pending_contact is not null then now()
        else null
      end
  where id = current_record.id
  returning * into updated_record;

  return updated_record;
end;
$$;

-- 这里重建同步触发器，确保后续后台审核和用户资料修改都会同步 profiles。
drop trigger if exists sync_profile_from_roster_after_write on public.join_applications;
create trigger sync_profile_from_roster_after_write
after insert or update or delete on public.join_applications
for each row execute function public.sync_profile_from_roster_trigger();

-- 这里批量同步一次现有资料，修复已经出现的道名不一致。
select public.sync_profile_from_roster(profile_row.id)
from public.profiles as profile_row;

-- 这里重建公开名册视图，不再暴露或依赖已经废弃的旧字段。
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
where status in ('approved', 'contacted', 'joined')
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
      and application_row.status in ('approved', 'contacted', 'joined')
  )
);

-- 这里重建执事管理名单函数，让名单里的昵称和道名都优先使用同步后的资料。
create or replace function public.list_wenyun_role_users()
returns table (
  user_id uuid,
  email text,
  nickname text,
  role text,
  city text,
  is_public boolean,
  created_at timestamptz,
  member_code text,
  dao_name text
)
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
begin
  -- 这里限制只有超级管理员能读取所有用户邮箱，避免普通执事越权查看账号信息。
  if not public.is_wenyun_founder() then
    raise exception '只有超级管理员可以查看执事管理名单。';
  end if;

  return query
  select
    u.id::uuid as user_id,
    coalesce(u.email::text, '')::text as email,
    coalesce(p.nickname::text, a.nickname::text, split_part(coalesce(u.email::text, ''), '@', 1), '问云同门')::text as nickname,
    coalesce(p.role::text, 'member')::text as role,
    coalesce(p.city::text, a.city::text, a.public_region::text) as city,
    coalesce(p.is_public, false)::boolean as is_public,
    coalesce(p.created_at, u.created_at)::timestamptz as created_at,
    a.member_code::text as member_code,
    coalesce(p.nickname::text, a.nickname::text) as dao_name
  from auth.users u
  left join public.profiles p on p.id = u.id
  left join lateral (
    select ja.member_code, ja.nickname, ja.city, ja.public_region
    from public.join_applications ja
    where ja.user_id = u.id
    order by public.get_wenyun_roster_profile_priority(ja.status) asc, ja.roster_serial asc nulls last, ja.created_at desc
    limit 1
  ) a on true
  where u.deleted_at is null
  order by
    case coalesce(p.role, 'member')
      when 'founder' then 1
      when 'admin' then 2
      else 3
    end,
    a.member_code asc nulls last,
    u.created_at desc;
end;
$$;

-- 这里真正删除已经不再使用的旧字段；如果线上库没有这些字段，语句会自动跳过。
alter table public.join_applications
drop column if exists offline_interest,
drop column if exists remark,
drop column if exists public_story,
drop column if exists raw_story,
drop column if exists bond_status,
drop column if exists cover_name;

commit;

-- 这里输出清理结果，废弃字段数量应为 0。
select
  (
    select count(*)
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'join_applications'
      and column_name in ('offline_interest', 'remark', 'public_story', 'raw_story', 'bond_status', 'cover_name')
  ) as 废弃字段剩余数量,
  (
    select count(*)
    from public.profiles as profile_row
    join public.join_applications as application_row on application_row.user_id = profile_row.id
    where application_row.nickname is distinct from profile_row.nickname
      and application_row.status in ('approved', 'contacted', 'joined', 'pending')
  ) as 道名仍不一致数量;
