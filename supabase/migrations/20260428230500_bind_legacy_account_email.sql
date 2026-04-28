-- 这个脚本修复旧编号账号绑定真实邮箱的问题。
-- 适用场景：旧账号邮箱类似 001@wenyun.local，Supabase 普通邮箱变更会因为内部邮箱不可收信或格式校验失败而拦住。
-- 使用方法：把本文件全部复制到 Supabase SQL 编辑器执行一次，前端“我的资料”里的绑定邮箱功能就会调用此函数。

-- 这个函数让当前登录用户绑定真实邮箱，入参是新邮箱，返回值是中文结果和账号安全信息。
create or replace function public.bind_current_user_email(new_email text)
returns jsonb
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  -- 这个变量保存当前登录用户编号，来自 Supabase 登录令牌。
  current_user_id uuid := auth.uid();
  -- 这个变量保存清理后的邮箱，统一小写，避免大小写造成重复。
  normalized_email text := lower(trim(coalesce(new_email, '')));
  -- 这个变量保存是否已有其他账号使用同一个邮箱。
  existing_user_id uuid;
  -- 这个变量保存更新到 auth.users 的行数。
  changed_count integer := 0;
begin
  -- 这里要求必须登录后才能绑定邮箱，避免游客改动认证表。
  if current_user_id is null then
    return jsonb_build_object(
      'ok', false,
      'code', 'not_logged_in',
      'message', '请先登录问云小院，再绑定邮箱。'
    );
  end if;

  -- 这里检查邮箱基础格式，避免把明显错误的地址写进认证表。
  if normalized_email !~* '^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$' then
    return jsonb_build_object(
      'ok', false,
      'code', 'invalid_email',
      'message', '请填写正确的真实邮箱。'
    );
  end if;

  -- 这里禁止继续绑定内部邮箱，内部邮箱只用于旧编号账号导入。
  if normalized_email like '%@wenyun.local' then
    return jsonb_build_object(
      'ok', false,
      'code', 'internal_email',
      'message', '请绑定真实邮箱，不要填写旧编号内部邮箱。'
    );
  end if;

  -- 这里检查邮箱是否已经属于另一个账号，防止误把别人账号抢走。
  select id
  into existing_user_id
  from auth.users
  where lower(email) = normalized_email
  limit 1;

  if existing_user_id is not null and existing_user_id <> current_user_id then
    return jsonb_build_object(
      'ok', false,
      'code', 'email_taken',
      'message', '这个邮箱已经注册过另一个账号。请先用那个邮箱账号登录，或在 Supabase 后台删除不用的重复账号后再绑定。'
    );
  end if;

  -- 这里直接更新当前用户邮箱，并把邮箱标记为已确认，避免旧内部邮箱收不到确认邮件。
  update auth.users
  set email = normalized_email,
      email_confirmed_at = coalesce(email_confirmed_at, now()),
      confirmation_token = '',
      email_change = '',
      email_change_token_new = '',
      email_change_token_current = '',
      updated_at = now(),
      raw_user_meta_data = coalesce(raw_user_meta_data, '{}'::jsonb) || jsonb_build_object(
        'bound_email', normalized_email,
        'email', normalized_email
      )
  where id = current_user_id;

  get diagnostics changed_count = row_count;

  -- 这里兜底处理极少数账号不存在的异常状态。
  if changed_count <> 1 then
    return jsonb_build_object(
      'ok', false,
      'code', 'user_missing',
      'message', '没有找到当前登录账号，请退出后重新登录再试。'
    );
  end if;

  -- 这里同步 email 登录身份记录，保证下次可以使用真实邮箱加密码登录。
  begin
    update auth.identities
    set provider_id = normalized_email,
        identity_data = coalesce(identity_data, '{}'::jsonb) || jsonb_build_object(
          'email', normalized_email,
          'email_verified', true
        ),
        updated_at = now()
    where user_id = current_user_id
      and provider = 'email';

    -- 这里处理极少数缺少 identities 记录的账号，补一条 email 身份。
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
        current_user_id,
        current_user_id,
        jsonb_build_object(
          'sub', current_user_id::text,
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
      where user_id = current_user_id
        and provider = 'email';
  end;

  -- 这里返回前端需要展示的账号状态。
  return jsonb_build_object(
    'ok', true,
    'code', 'bound',
    'message', '邮箱已绑定成功，下次可用真实邮箱和当前密码登录问云小院。',
    'email', normalized_email,
    'is_legacy_email', false,
    'pending_email', null,
    'email_confirmed_at', now()
  );
end;
$$;

-- 这里授权已登录用户调用函数，函数内部仍会检查只能修改自己。
grant execute on function public.bind_current_user_email(text) to authenticated;
