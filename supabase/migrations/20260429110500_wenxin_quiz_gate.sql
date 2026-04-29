-- 这个脚本新增问心考核结果表，并把名册登记和最新合格成绩绑定。
-- 使用方法：复制本文件全部内容到 Supabase SQL 编辑器执行一次，然后刷新网站。

-- 这里创建问心考核结果表，用户每次交卷都会新增一条记录，页面展示和登记门槛以最新一次为准。
create table if not exists public.wenxin_quiz_results (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  score integer not null check (score >= 0 and score <= 100),
  total_score integer not null default 100 check (total_score = 100),
  passed boolean not null,
  single_correct integer not null default 0 check (single_correct >= 0 and single_correct <= 25),
  multiple_correct integer not null default 0 check (multiple_correct >= 0 and multiple_correct <= 5),
  answers jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint wenxin_quiz_results_passed_check check (passed = (score >= 80))
);

-- 这里给用户和时间建立索引，方便读取最新一次考核。
create index if not exists idx_wenxin_quiz_results_user_created
on public.wenxin_quiz_results(user_id, created_at desc);

-- 这里开启行级安全，防止普通用户查看别人考核结果。
alter table public.wenxin_quiz_results enable row level security;

-- 这里清理旧策略，保证重复执行不会报错。
drop policy if exists "用户可读取自己的问心考核" on public.wenxin_quiz_results;
drop policy if exists "用户可提交自己的问心考核" on public.wenxin_quiz_results;
drop policy if exists "管理员可管理问心考核" on public.wenxin_quiz_results;

-- 这里允许用户读取自己的考核结果，管理员可读取全部结果。
create policy "用户可读取自己的问心考核"
on public.wenxin_quiz_results
for select
using (auth.uid() = user_id or public.is_wenyun_admin());

-- 这里允许登录用户提交自己的考核结果，且只允许总分和通过标记符合规则。
create policy "用户可提交自己的问心考核"
on public.wenxin_quiz_results
for insert
to authenticated
with check (
  auth.uid() = user_id
  and total_score = 100
  and score >= 0
  and score <= 100
  and passed = (score >= 80)
  and single_correct >= 0
  and single_correct <= 25
  and multiple_correct >= 0
  and multiple_correct <= 5
);

-- 这里保留管理员管理全部考核结果的能力，方便后台复核和后续统计。
create policy "管理员可管理问心考核"
on public.wenxin_quiz_results
for all
using (public.is_wenyun_admin())
with check (public.is_wenyun_admin());

-- 这个函数判断某用户最新一次问心考核是否合格，入参是用户编号，返回值是真或假。
create or replace function public.latest_wenxin_quiz_passed(target_user_id uuid)
returns boolean
language sql
security definer
set search_path = public, pg_temp
stable
as $$
  select coalesce(
    (
      select result.passed
      from public.wenxin_quiz_results as result
      where result.user_id = target_user_id
      order by result.created_at desc
      limit 1
    ),
    false
  );
$$;

-- 这里重新收紧名册登记策略：必须登录、本人提交、认同门规、默认同门，并且最新问心考核合格。
drop policy if exists "登录用户可提交名册登记" on public.join_applications;

create policy "登录用户可提交名册登记"
on public.join_applications
for insert
to authenticated
with check (
  auth.uid() = user_id
  and public.latest_wenxin_quiz_passed(auth.uid())
  and accept_rules = true
  and status = 'pending'
  and member_role = '同门'
  and generation_name = '云'
  and gender in ('男', '女')
);

-- 这里显式授权登录用户访问问心考核表和函数，最终数据边界仍由 RLS 与函数内部逻辑保护。
grant select, insert on public.wenxin_quiz_results to authenticated;
grant execute on function public.latest_wenxin_quiz_passed(uuid) to authenticated;
