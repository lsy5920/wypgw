-- 本脚本用于升级问云名册：新增江湖名、真实姓名、后台筛选状态，并移除性别“不公开”选项。
-- 执行方式：复制到 Supabase SQL 编辑器执行；如未执行旧脚本，请先执行 20260428090000 和 20260428110000 两个脚本。

-- 这里给名帖增加江湖名和真实姓名字段，真实姓名只供后台管理员查看。
alter table public.join_applications
add column if not exists jianghu_name text,
add column if not exists real_name text;

-- 这里清理旧的“不公开”性别数据，避免移除选项后旧数据违反约束。
update public.join_applications
set gender = '男'
where gender is null or gender not in ('男', '女');

-- 这里把性别默认值改成“男”，前台仍然要求用户主动选择。
alter table public.join_applications
alter column gender set default '男';

-- 这里重建性别约束，只允许“男”和“女”。
alter table public.join_applications
drop constraint if exists join_applications_gender_check;

alter table public.join_applications
add constraint join_applications_gender_check
check (gender in ('男', '女'));

-- 这里重建名帖状态约束，增加“暂存”和“已退派”两个状态。
alter table public.join_applications
drop constraint if exists join_applications_status_check;

alter table public.join_applications
add constraint join_applications_status_check
check (status in ('pending', 'approved', 'rejected', 'contacted', 'joined', 'draft', 'retired'));

-- 这里同步更新名册字段触发器，避免空性别继续被补成“不公开”。
create or replace function public.set_wenyun_roster_fields()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- 这里清理道名，避免前后空格进入名册。
  new.nickname = trim(new.nickname);

  -- 这里清理江湖名，空值保存为空，便于前台展示“未填写”。
  new.jianghu_name = nullif(trim(coalesce(new.jianghu_name, '')), '');

  -- 这里清理真实姓名，空值保存为空，真实姓名不会进入公开视图。
  new.real_name = nullif(trim(coalesce(new.real_name, '')), '');

  -- 这里补齐性别，移除“不公开”后默认回到“男”。
  new.gender = coalesce(nullif(trim(new.gender), ''), '男');

  -- 这里补齐身份，前台登记默认同门，后台可改为掌门、执事或护灯人。
  new.member_role = coalesce(nullif(trim(new.member_role), ''), '同门');

  -- 这里补齐辈分字，只取第一个字，默认是“云”。
  new.generation_name = coalesce(nullif(left(trim(new.generation_name), 1), ''), '云');

  -- 这里在编号为空时自动生成编号；管理员手动填写编号时保留管理员输入。
  if new.member_code is null or trim(new.member_code) = '' then
    new.member_code = public.next_wenyun_member_code(new.generation_name);
  else
    new.member_code = trim(new.member_code);
  end if;

  return new;
end;
$$;

-- 这里先删除旧公开名册视图，因为 PostgreSQL 不允许直接用 create or replace 改变已有视图的列顺序。
drop view if exists public.roster_entries;

-- 这里重新创建公开名册视图，公开江湖名，但不公开真实姓名、微信号、申请理由和管理员备注。
create view public.roster_entries as
select
  id,
  nickname as dao_name,
  jianghu_name,
  member_code,
  gender,
  age_range as birth_month,
  city,
  offline_interest,
  member_role,
  generation_name,
  status,
  created_at
from public.join_applications
where status in ('approved', 'contacted', 'joined')
order by member_code asc;

-- 这里授权游客读取公开名册视图，视图中没有敏感联系方式和真实姓名。
grant select on public.roster_entries to anon, authenticated;

-- 这里收紧游客提交策略，游客只能提交待审核同门，不能自行写入后台状态。
drop policy if exists "游客可提交名册登记" on public.join_applications;
create policy "游客可提交名册登记"
on public.join_applications
for insert
with check (
  accept_rules = true
  and status = 'pending'
  and member_role = '同门'
  and generation_name = '云'
  and gender in ('男', '女')
);
