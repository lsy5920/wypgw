-- 本脚本用于在收不到 Supabase 确认邮件时，手动确认管理员邮箱并授予掌门权限。
-- 使用方法：先把下面的邮箱改成你的管理员邮箱，再复制整段到 Supabase SQL 编辑器执行。
-- 注意事项：这个脚本只建议给站长本人账号使用，不要给陌生邮箱执行。

do $$
declare
  -- 这个变量保存要处理的管理员邮箱，入参需要手动修改，返回值用于查找 auth.users 用户。
  admin_email text := '你的邮箱@example.com';
  -- 这个变量保存 Supabase 用户编号，入参来自 auth.users 查询结果，返回值用于更新 profiles。
  admin_user_id uuid;
begin
  -- 这里检查邮箱是否还是占位文字，避免小白直接执行后找不到用户。
  if admin_email = '你的邮箱@example.com' then
    raise exception '请先把 admin_email 改成真实管理员邮箱，再执行本脚本。';
  end if;

  -- 这里按邮箱查找 Supabase 登录用户，大小写不同也能匹配。
  select id
  into admin_user_id
  from auth.users
  where lower(email) = lower(admin_email)
  limit 1;

  -- 这里处理用户不存在的情况，说明还没有在 /login 页面注册过。
  if admin_user_id is null then
    raise exception '没有找到邮箱为 % 的用户，请先在官网 /login 页面注册一次。', admin_email;
  end if;

  -- 这里手动确认邮箱，解决收不到确认邮件导致无法登录的问题。
  update auth.users
  set email_confirmed_at = coalesce(email_confirmed_at, now()),
      updated_at = now()
  where id = admin_user_id;

  -- 这里补建成员资料，防止注册触发器没有正常创建 profiles 记录。
  insert into public.profiles (id, nickname, role)
  values (admin_user_id, split_part(admin_email, '@', 1), 'founder')
  on conflict (id) do update
  set role = 'founder',
      updated_at = now();

  -- 这里输出执行结果，看到这句就表示邮箱确认和掌门提权都完成了。
  raise notice '已确认邮箱并授予掌门权限：%', admin_email;
end $$;
