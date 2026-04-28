-- 这个脚本专门修复 3199912548@qq.com 执事管理页面仍显示权限不足的问题。
-- 使用方法：复制本文件全部内容到 Supabase SQL 编辑器执行一次，然后退出网站账号并重新登录 3199912548@qq.com 或 001。

begin;

do $$
declare
  -- 这个变量保存超级管理员邮箱。
  target_admin_email text := '3199912548@qq.com';
  -- 这个变量保存旧 001 内部邮箱。
  legacy_email text := '001@wenyun.local';
  -- 这个变量保存 001 完整名册编号。
  target_member_code text := '问云-云-001';
  -- 这个变量保存超级管理员用户编号。
  admin_user_id uuid;
  -- 这个变量保存旧 001 用户编号。
  legacy_user_id uuid;
  -- 这个变量保存 001 名帖编号。
  target_application_id uuid;
begin
  -- 这里查找超级管理员邮箱账号。
  select id
  into admin_user_id
  from auth.users
  where lower(email) = lower(target_admin_email)
  limit 1;

  -- 这里如果账号不存在，直接给出明确提示。
  if admin_user_id is null then
    raise exception '没有找到 % 对应的 Auth 用户，请先用这个邮箱注册并登录一次。', target_admin_email;
  end if;

  -- 这里查找旧 001 内部账号，存在时用于迁移旧归属。
  select id
  into legacy_user_id
  from auth.users
  where lower(email) = lower(legacy_email)
  limit 1;

  -- 这里补建或更新超级管理员资料，确保 role 一定是 founder。
  insert into public.profiles (id, nickname, role, is_public, created_at, updated_at)
  values (admin_user_id, '云泽', 'founder', true, now(), now())
  on conflict (id) do update
  set role = 'founder',
      nickname = coalesce(nullif(public.profiles.nickname, ''), excluded.nickname),
      is_public = true,
      updated_at = now();

  -- 这里优先找到 001 名帖。
  select id
  into target_application_id
  from public.join_applications
  where roster_serial = 1
     or member_code = target_member_code
     or (legacy_user_id is not null and user_id = legacy_user_id)
  order by
    case
      when roster_serial = 1 then 1
      when member_code = target_member_code then 2
      else 3
    end
  limit 1;

  -- 这里如果旧名册已导入，就把 001 名帖归属绑定到超级管理员账号。
  if target_application_id is not null then
    update public.join_applications
    set user_id = admin_user_id,
        roster_serial = 1,
        member_code = target_member_code,
        generation_name = '云',
        status = case when status in ('pending', 'draft') then 'approved' else status end,
        admin_note = trim(both E'\n' from coalesce(admin_note, '') || E'\n已确认绑定超级管理员 3199912548@qq.com。')
    where id = target_application_id;
  end if;

  -- 这里把旧 001 账号的个人数据迁移到超级管理员账号，避免小院里看不到旧内容。
  if legacy_user_id is not null and legacy_user_id <> admin_user_id then
    update public.cloud_lanterns
    set created_by = admin_user_id
    where created_by = legacy_user_id;

    update public.user_notifications
    set user_id = admin_user_id
    where user_id = legacy_user_id;

    update public.event_registrations old_record
    set user_id = admin_user_id
    where old_record.user_id = legacy_user_id
      and not exists (
        select 1
        from public.event_registrations existing_record
        where existing_record.event_id = old_record.event_id
          and existing_record.user_id = admin_user_id
      );

    delete from public.event_registrations old_record
    where old_record.user_id = legacy_user_id
      and exists (
        select 1
        from public.event_registrations existing_record
        where existing_record.event_id = old_record.event_id
          and existing_record.user_id = admin_user_id
      );

    update public.profiles
    set nickname = '001编号已并入超级管理员',
        role = 'member',
        is_public = false,
        updated_at = now()
    where id = legacy_user_id;
  end if;

  -- 这里把超级管理员 Auth 元数据补上 001 编号，方便前端和排查识别。
  update auth.users
  set raw_user_meta_data = coalesce(raw_user_meta_data, '{}'::jsonb) || jsonb_build_object(
        'short_account', '001',
        'member_code', target_member_code,
        'bound_roster_serial', 1,
        'super_admin', true
      ),
      email_confirmed_at = coalesce(email_confirmed_at, now()),
      updated_at = now()
  where id = admin_user_id;

  -- 这里写入审计日志，方便确认脚本已经执行。
  insert into public.audit_logs (actor_id, action, target_table, target_id, detail, created_at)
  values (
    admin_user_id,
    '修复超级管理员权限',
    'profiles',
    admin_user_id,
    jsonb_build_object('admin_email', target_admin_email, 'member_code', target_member_code),
    now()
  );
end;
$$;

commit;

-- 这里显示最终结果，role 必须是 founder。
select
  u.email as 登录邮箱,
  p.role as 后台角色,
  a.member_code as 名册编号,
  a.roster_serial as 短编号,
  a.nickname as 道名
from auth.users u
left join public.profiles p on p.id = u.id
left join public.join_applications a on a.user_id = u.id and (a.roster_serial = 1 or a.member_code = '问云-云-001')
where lower(u.email) = '3199912548@qq.com';
