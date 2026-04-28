-- 这个脚本新增执事管理所需的数据库函数。
-- 执行结果：3199912548@qq.com 会被设为 founder 超级管理员；超级管理员可在后台把成员设为 admin 执事。
-- 使用方法：复制本文件全部内容到 Supabase SQL 编辑器执行一次。

-- 这个函数判断当前登录者是否为超级管理员，入参为空，返回值是真或假。
create or replace function public.is_wenyun_founder()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role = 'founder'
  );
$$;

-- 这个函数读取执事管理所需的用户列表，入参为空，返回值包含邮箱、昵称、角色和名册编号。
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
    u.id as user_id,
    coalesce(u.email, '') as email,
    coalesce(p.nickname, split_part(coalesce(u.email, ''), '@', 1), '问云同门') as nickname,
    coalesce(p.role, 'member') as role,
    p.city,
    coalesce(p.is_public, false) as is_public,
    coalesce(p.created_at, u.created_at) as created_at,
    a.member_code,
    a.nickname as dao_name
  from auth.users u
  left join public.profiles p on p.id = u.id
  left join lateral (
    select ja.member_code, ja.nickname
    from public.join_applications ja
    where ja.user_id = u.id
    order by ja.roster_serial asc nulls last, ja.created_at asc
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

-- 这个函数设置用户后台身份，入参是目标用户和目标角色，返回值是更新后的用户行。
create or replace function public.set_wenyun_user_role(target_user_id uuid, target_role text)
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
declare
  -- 这个变量保存目标用户邮箱，用于补建资料和返回结果。
  target_email text;
  -- 这个变量保存目标用户当前角色，用于保护超级管理员不被误改。
  old_role text;
begin
  -- 这里限制只有超级管理员能设置执事身份。
  if not public.is_wenyun_founder() then
    raise exception '只有超级管理员可以设置执事身份。';
  end if;

  -- 这里只允许在普通成员和执事之间切换，避免页面误把别人设为超级管理员。
  if target_role not in ('member', 'admin') then
    raise exception '只能设置为普通成员或执事。';
  end if;

  -- 这里确认目标账号存在。
  select u.email, p.role
  into target_email, old_role
  from auth.users u
  left join public.profiles p on p.id = u.id
  where u.id = target_user_id
    and u.deleted_at is null
  limit 1;

  if target_email is null then
    raise exception '没有找到这个用户账号。';
  end if;

  -- 这里禁止通过执事管理页面修改超级管理员，避免把最后的掌门权限撤掉。
  if old_role = 'founder' then
    raise exception '超级管理员不能在执事管理里被修改。';
  end if;

  -- 这里补建或更新资料角色，确保被设为执事后能进入管理后台。
  insert into public.profiles (id, nickname, role, is_public, created_at, updated_at)
  values (
    target_user_id,
    split_part(target_email, '@', 1),
    target_role,
    false,
    now(),
    now()
  )
  on conflict (id) do update
  set role = target_role,
      updated_at = now();

  -- 这里写审计日志，方便以后追踪是谁设置了执事。
  insert into public.audit_logs (actor_id, action, target_table, target_id, detail, created_at)
  values (
    auth.uid(),
    case when target_role = 'admin' then '设置执事' else '撤回执事' end,
    'profiles',
    target_user_id,
    jsonb_build_object('target_email', target_email, 'target_role', target_role),
    now()
  );

  -- 这里返回更新后的用户行。
  return query
  select listed.*
  from public.list_wenyun_role_users() as listed
  where listed.user_id = target_user_id;
end;
$$;

-- 这里授权登录用户调用函数，函数内部会再次检查是否为超级管理员。
grant execute on function public.is_wenyun_founder() to authenticated;
grant execute on function public.list_wenyun_role_users() to authenticated;
grant execute on function public.set_wenyun_user_role(uuid, text) to authenticated;

-- 这里把指定邮箱设为超级管理员；如果资料不存在则补建资料。
insert into public.profiles (id, nickname, role, is_public, created_at, updated_at)
select
  u.id,
  coalesce(nullif(u.raw_user_meta_data->>'nickname', ''), split_part(u.email, '@', 1), '问云掌门'),
  'founder',
  false,
  now(),
  now()
from auth.users u
where lower(u.email) = '3199912548@qq.com'
on conflict (id) do update
set role = 'founder',
    nickname = coalesce(nullif(public.profiles.nickname, ''), excluded.nickname),
    updated_at = now();
