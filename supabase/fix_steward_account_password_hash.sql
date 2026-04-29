-- 这个脚本修复执事管理里修改邮箱或重置密码时报 gen_salt 找不到的问题。
-- 原因：部分 Supabase 项目把 pgcrypto 扩展函数放在 extensions 命名空间，旧函数搜索路径没有包含它。
-- 使用方法：复制本文件全部内容到 Supabase SQL 编辑器执行一次，然后刷新执事管理页面再重试。

create extension if not exists "pgcrypto";

-- 这个函数让超级管理员修改成员登录邮箱或重置密码，入参是目标用户、新邮箱和新密码，返回值是更新后的执事管理用户行。
create or replace function public.update_wenyun_user_account(
  target_user_id uuid,
  new_email text,
  new_password text default null
)
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
set search_path = public, auth, extensions, pg_temp
as $$
declare
  -- 这个变量保存当前登录者编号，用来确认操作人身份。
  current_user_id uuid := auth.uid();
  -- 这个变量保存整理后的邮箱，统一小写，避免大小写造成重复账号。
  normalized_email text := lower(trim(coalesce(new_email, '')));
  -- 这个变量保存整理后的新密码，空值表示不修改密码。
  normalized_password text := btrim(coalesce(new_password, ''));
  -- 这个变量保存目标账号原邮箱，用于审计日志。
  target_old_email text;
  -- 这个变量保存目标账号当前后台角色，用于保护超级管理员。
  target_old_role text;
  -- 这个变量保存已经占用新邮箱的其他账号编号。
  duplicate_user_id uuid;
  -- 这个变量记录本次是否修改了密码，审计日志只记录真假，不记录明文。
  password_changed boolean := false;
  -- 这个变量保存认证表更新行数，用于兜底判断账号是否存在。
  changed_count integer := 0;
begin
  -- 这里要求必须登录，避免游客调用安全函数。
  if current_user_id is null then
    raise exception '请先登录问云小院，再管理成员账号。';
  end if;

  -- 这里限制只有超级管理员可以修改成员邮箱和密码。
  if not public.is_wenyun_founder() then
    raise exception '只有超级管理员可以修改成员账号邮箱和密码。';
  end if;

  -- 这里检查邮箱基础格式，避免把错误邮箱写进认证表。
  if normalized_email !~* '^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$' then
    raise exception '请填写正确的真实邮箱。';
  end if;

  -- 这里禁止继续使用旧编号内部邮箱，内部邮箱只用于旧数据导入。
  if normalized_email like '%@wenyun.local' then
    raise exception '请填写真实邮箱，不要使用旧编号内部邮箱。';
  end if;

  -- 这里读取目标账号，确认账号存在并取得当前角色。
  select u.email::text, coalesce(p.role::text, 'member')
  into target_old_email, target_old_role
  from auth.users u
  left join public.profiles p on p.id = u.id
  where u.id = target_user_id
    and u.deleted_at is null
  limit 1;

  -- 这里兜底处理传入了不存在账号的情况。
  if target_old_email is null then
    raise exception '没有找到这个用户账号。';
  end if;

  -- 这里保护超级管理员账号，避免在成员管理里误改最后的超级管理员登录方式。
  if target_old_role = 'founder' then
    raise exception '超级管理员账号不能在执事管理里修改，请到问云小院里修改自己的邮箱或密码。';
  end if;

  -- 这里检查新邮箱是否已经被其他账号占用，防止两个账号共用同一个登录邮箱。
  select u.id
  into duplicate_user_id
  from auth.users u
  where lower(u.email::text) = normalized_email
    and u.id <> target_user_id
    and u.deleted_at is null
  limit 1;

  if duplicate_user_id is not null then
    raise exception '这个邮箱已被其他账号使用。请先把占用该邮箱的账号改成其他邮箱，再绑定到当前成员。';
  end if;

  -- 这里判断是否需要重置密码，空密码表示只修改邮箱。
  password_changed := length(normalized_password) > 0;

  -- 这里直接更新 Supabase 认证用户，确认邮箱并在需要时重置密码。
  update auth.users
  set email = normalized_email,
      encrypted_password = case
        when password_changed then crypt(normalized_password, gen_salt('bf'))
        else encrypted_password
      end,
      email_confirmed_at = coalesce(email_confirmed_at, now()),
      confirmation_token = '',
      recovery_token = '',
      email_change = '',
      email_change_token_new = '',
      email_change_token_current = '',
      updated_at = now(),
      raw_user_meta_data = coalesce(raw_user_meta_data, '{}'::jsonb) || jsonb_build_object(
        'bound_email', normalized_email,
        'email', normalized_email
      )
  where id = target_user_id
    and deleted_at is null;

  get diagnostics changed_count = row_count;

  -- 这里处理认证表没有成功更新的异常情况。
  if changed_count <> 1 then
    raise exception '账号更新失败，请刷新后重试。';
  end if;

  -- 这里同步 email 登录身份记录，保证成员下次可以用新邮箱和新密码登录。
  begin
    update auth.identities
    set provider_id = normalized_email,
        identity_data = coalesce(identity_data, '{}'::jsonb) || jsonb_build_object(
          'email', normalized_email,
          'email_verified', true
        ),
        updated_at = now()
    where user_id = target_user_id
      and provider = 'email';

    -- 这里处理极少数缺少 email 身份记录的账号，补一条可登录身份。
    if not found then
      insert into auth.identities (
        id,
        user_id,
        identity_data,
        provider,
        provider_id,
        last_sign_in_at,
        created_at,
        updated_at
      )
      values (
        target_user_id,
        target_user_id,
        jsonb_build_object(
          'sub', target_user_id::text,
          'email', normalized_email,
          'email_verified', true,
          'phone_verified', false
        ),
        'email',
        normalized_email,
        now(),
        now(),
        now()
      )
      on conflict do nothing;
    end if;
  exception
    -- 这里兼容不同 Supabase 版本的 auth.identities 字段差异。
    when undefined_column then
      update auth.identities
      set identity_data = coalesce(identity_data, '{}'::jsonb) || jsonb_build_object(
            'email', normalized_email,
            'email_verified', true
          ),
          updated_at = now()
      where user_id = target_user_id
        and provider = 'email';
  end;

  -- 这里补齐资料行，避免只有 Auth 账号但 profiles 缺失时前端无法展示。
  insert into public.profiles (id, nickname, role, is_public, created_at, updated_at)
  values (
    target_user_id,
    split_part(normalized_email, '@', 1),
    'member',
    false,
    now(),
    now()
  )
  on conflict (id) do update
  set nickname = coalesce(nullif(public.profiles.nickname, ''), excluded.nickname),
      updated_at = now();

  -- 这里写审计日志，只记录是否改过密码，不保存密码明文。
  insert into public.audit_logs (actor_id, action, target_table, target_id, detail, created_at)
  values (
    current_user_id,
    '修改成员账号',
    'auth.users',
    target_user_id,
    jsonb_build_object(
      'old_email', target_old_email,
      'new_email', normalized_email,
      'password_changed', password_changed
    ),
    now()
  );

  -- 这里返回更新后的用户行，前端可以马上刷新卡片邮箱。
  return query
  select listed.*
  from public.list_wenyun_role_users() as listed
  where listed.user_id = target_user_id;
end;
$$;

-- 这里授权已登录用户调用函数，函数内部会再次检查是否为超级管理员。
grant execute on function public.update_wenyun_user_account(uuid, text, text) to authenticated;
