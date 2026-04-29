-- 这个脚本限制每个账号只能递交一份名帖，并补齐管理员彻底删除名帖所需权限。
-- 使用方法：复制本文件全部内容到 Supabase SQL 编辑器执行一次，然后刷新网站后台。

-- 这个函数判断某个账号是否已经有名帖，入参是用户编号，返回值表示是否存在名帖。
create or replace function public.user_has_join_application(target_user_id uuid)
returns boolean
language sql
security definer
set search_path = public, pg_temp
stable
as $$
  select exists (
    select 1
    from public.join_applications as application
    where application.user_id = target_user_id
  );
$$;

-- 这个函数在新增名帖前拦截重复提交，入参是即将写入的新记录，返回值是允许写入的记录。
create or replace function public.prevent_duplicate_join_application()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  -- 这里兼容历史游客数据；新登录系统下 user_id 应该始终存在。
  if new.user_id is null then
    return new;
  end if;

  -- 这里发现同一个账号已有名帖时直接阻止新增，避免后台出现重复名帖。
  if exists (
    select 1
    from public.join_applications as application
    where application.user_id = new.user_id
  ) then
    raise exception '每个账号只能提交一份名帖，请到问云小院修改资料或联系执事处理。';
  end if;

  return new;
end;
$$;

-- 这里绑定重复提交拦截触发器，保证绕过前端也无法重复写入。
drop trigger if exists prevent_duplicate_join_application_before_insert on public.join_applications;
create trigger prevent_duplicate_join_application_before_insert
before insert on public.join_applications
for each row execute function public.prevent_duplicate_join_application();

-- 这里重建登录用户提交策略，把“没有已有名帖”也加入数据库权限边界。
drop policy if exists "登录用户可提交名册登记" on public.join_applications;

create policy "登录用户可提交名册登记"
on public.join_applications
for insert
to authenticated
with check (
  auth.uid() = user_id
  and not public.user_has_join_application(auth.uid())
  and public.latest_wenxin_quiz_passed(auth.uid())
  and accept_rules = true
  and status = 'pending'
  and member_role = '同门'
  and generation_name = '云'
  and gender in ('男', '女')
);

-- 这里给管理员单独补一条删除策略，确保后台可以彻底删除名帖。
drop policy if exists "管理员可彻底删除名帖" on public.join_applications;
create policy "管理员可彻底删除名帖"
on public.join_applications
for delete
to authenticated
using (public.is_wenyun_admin());

-- 这里允许管理员删除名帖相关提醒，避免小院消息残留已经不存在的名帖。
drop policy if exists "管理员可删除提醒" on public.user_notifications;
create policy "管理员可删除提醒"
on public.user_notifications
for delete
to authenticated
using (public.is_wenyun_admin());

-- 这里显式授权登录用户执行函数和删除操作，最终是否能删除仍由 RLS 决定。
grant execute on function public.user_has_join_application(uuid) to authenticated;
grant execute on function public.prevent_duplicate_join_application() to authenticated;
grant delete on public.join_applications to authenticated;
grant delete on public.user_notifications to authenticated;
