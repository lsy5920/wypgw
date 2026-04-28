-- 这个脚本把管理员邮箱 3199912548@qq.com 绑定到 001 编号。
-- 执行结果：管理员账号会拥有“问云-云-001”的名册归属，并保留 founder/admin 后台权限。
-- 使用方法：复制本文件全部内容，到 Supabase SQL 编辑器执行一次。

begin;

do $$
declare
  -- 这个变量保存要绑定的管理员邮箱。
  target_admin_email text := '3199912548@qq.com';
  -- 这个变量保存旧编号内部邮箱。
  legacy_email text := '001@wenyun.local';
  -- 这个变量保存要绑定的完整名册编号。
  target_member_code text := '问云-云-001';
  -- 这个变量保存要绑定的短编号。
  target_roster_serial integer := 1;
  -- 这个变量保存管理员 Auth 用户编号。
  admin_user_id uuid;
  -- 这个变量保存旧 001 Auth 用户编号，如果没有旧账号则为空。
  legacy_user_id uuid;
  -- 这个变量保存 001 名帖编号。
  target_application_id uuid;
  -- 这个变量保存 001 道名，用于更新管理员小院资料。
  target_nickname text;
  -- 这个变量保存 001 公开地域，用于更新管理员小院资料。
  target_city text;
  -- 这个变量保存 001 宣言，用于更新管理员小院资料。
  target_bio text;
  -- 这个变量保存旧 001 账号归档后的邮箱。
  archived_legacy_email text;
begin
  -- 这里找到管理员邮箱对应的登录账号。
  select id
  into admin_user_id
  from auth.users
  where lower(email) = lower(target_admin_email)
  limit 1;

  -- 这里如果管理员账号不存在，直接停止，避免误绑到空账号。
  if admin_user_id is null then
    raise exception '没有找到管理员邮箱账号：%，请先用这个邮箱注册并登录一次。', target_admin_email;
  end if;

  -- 这里找到旧编号 001 的内部账号，存在时会把它归档，避免 001 继续登录到旧账号。
  select id
  into legacy_user_id
  from auth.users
  where lower(email) = lower(legacy_email)
  limit 1;

  -- 这里找到 001 对应名帖，优先按短编号和完整编号查找。
  select id, nickname, coalesce(public_region, city), motto
  into target_application_id, target_nickname, target_city, target_bio
  from public.join_applications
  where roster_serial = target_roster_serial
     or member_code = target_member_code
     or (legacy_user_id is not null and user_id = legacy_user_id)
  order by
    case
      when roster_serial = target_roster_serial then 1
      when member_code = target_member_code then 2
      else 3
    end
  limit 1;

  -- 这里如果找不到 001 名帖，说明旧名册还没有导入。
  if target_application_id is null then
    raise exception '没有找到 001 编号名帖，请先执行旧名册导入脚本。';
  end if;

  -- 这里防止数据库里意外存在多个 001 编号，避免绑定到错误记录。
  if exists (
    select 1
    from public.join_applications
    where id <> target_application_id
      and (roster_serial = target_roster_serial or member_code = target_member_code)
  ) then
    raise exception '检测到多个 001 编号名帖，请先人工清理重复数据后再绑定。';
  end if;

  -- 这里给管理员账号补齐或更新小院资料，并明确设为超级管理员 founder。
  insert into public.profiles (id, nickname, role, city, bio, is_public, created_at, updated_at)
  values (
    admin_user_id,
    coalesce(nullif(target_nickname, ''), '云泽'),
    'founder',
    nullif(target_city, ''),
    nullif(target_bio, ''),
    true,
    now(),
    now()
  )
  on conflict (id) do update
  set nickname = coalesce(nullif(excluded.nickname, ''), public.profiles.nickname),
      role = 'founder',
      city = coalesce(excluded.city, public.profiles.city),
      bio = coalesce(excluded.bio, public.profiles.bio),
      is_public = true,
      updated_at = now();

  -- 这里把 001 名帖归属到管理员账号，并确保编号为问云前缀。
  update public.join_applications
  set user_id = admin_user_id,
      roster_serial = target_roster_serial,
      member_code = target_member_code,
      generation_name = '云',
      status = case
        when status in ('pending', 'draft') then 'approved'
        else status
      end,
      admin_note = trim(both E'\n' from coalesce(admin_note, '') || E'\n已绑定管理员邮箱 3199912548@qq.com。')
  where id = target_application_id;

  -- 这里把旧 001 账号的云灯和提醒一并转给管理员账号，保证小院数据统一。
  if legacy_user_id is not null and legacy_user_id <> admin_user_id then
    update public.cloud_lanterns
    set created_by = admin_user_id
    where created_by = legacy_user_id;

    update public.user_notifications
    set user_id = admin_user_id
    where user_id = legacy_user_id;

    -- 这里迁移活动报名，若管理员账号已有同活动报名，则保留管理员记录，归档旧记录。
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

    -- 这里把旧 001 内部账号改名并随机化密码，避免旧编号继续登录到未绑定账号。
    archived_legacy_email := '001-merged-' || replace(gen_random_uuid()::text, '-', '') || '@wenyun.local';

    update auth.users
    set email = archived_legacy_email,
        encrypted_password = crypt(gen_random_uuid()::text, gen_salt('bf')),
        raw_user_meta_data = coalesce(raw_user_meta_data, '{}'::jsonb) || jsonb_build_object(
          'merged_to_user_id', admin_user_id::text,
          'merged_to_email', target_admin_email,
          'merged_member_code', target_member_code
        ),
        updated_at = now()
    where id = legacy_user_id;

    -- 这里同步旧账号身份记录的邮箱，防止 001@wenyun.local 继续命中旧身份。
    begin
      update auth.identities
      set provider_id = archived_legacy_email,
          identity_data = coalesce(identity_data, '{}'::jsonb) || jsonb_build_object(
            'email', archived_legacy_email,
            'merged_to_email', target_admin_email
          ),
          updated_at = now()
      where user_id = legacy_user_id
        and provider = 'email';
    exception
      -- 这里兼容不同 Supabase 版本的 identities 字段差异。
      when undefined_column then
        update auth.identities
        set identity_data = coalesce(identity_data, '{}'::jsonb) || jsonb_build_object(
              'email', archived_legacy_email,
              'merged_to_email', target_admin_email
            ),
            updated_at = now()
        where user_id = legacy_user_id
          and provider = 'email';
    end;

    -- 这里隐藏旧 001 资料，避免后台和小院出现两个 001 身份。
    update public.profiles
    set nickname = '001编号已并入管理员账号',
        is_public = false,
        updated_at = now()
    where id = legacy_user_id;
  end if;

  -- 这里给管理员 Auth 元数据补齐 001 编号，方便后续排查账号归属。
  update auth.users
  set raw_user_meta_data = coalesce(raw_user_meta_data, '{}'::jsonb) || jsonb_build_object(
        'short_account', '001',
        'member_code', target_member_code,
        'bound_roster_serial', target_roster_serial
      ),
      updated_at = now()
  where id = admin_user_id;

  -- 这里写一条审计日志，方便以后追踪这次绑定。
  insert into public.audit_logs (actor_id, action, target_table, target_id, detail, created_at)
  values (
    admin_user_id,
    '绑定管理员账号到001编号',
    'join_applications',
    target_application_id,
    jsonb_build_object(
      'admin_email', target_admin_email,
      'member_code', target_member_code,
      'legacy_email', legacy_email
    ),
    now()
  );
end;
$$;

commit;

-- 这里返回绑定结果，看到 user_id 与管理员邮箱对应即表示成功。
select
  u.email as 管理员邮箱,
  p.role as 后台角色,
  a.nickname as 道名,
  a.member_code as 名册编号,
  a.roster_serial as 短编号,
  a.status as 名帖状态
from public.join_applications a
join auth.users u on u.id = a.user_id
left join public.profiles p on p.id = u.id
where a.roster_serial = 1
   or a.member_code = '问云-云-001';
