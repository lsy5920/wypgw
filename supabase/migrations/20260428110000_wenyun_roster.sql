-- 本脚本用于把原“入派申请”升级为“问云名册”。
-- 执行方式：复制到 Supabase SQL 编辑器执行；如果是新项目，请先执行 20260428090000_init_wenyunpai.sql。

-- 这里给入派申请表增加名册字段，旧数据不会丢失。
alter table public.join_applications
add column if not exists gender text not null default '不公开' check (gender in ('男', '女', '不公开')),
add column if not exists member_role text not null default '同门' check (member_role in ('掌门', '执事', '护灯人', '同门')),
add column if not exists generation_name text not null default '云',
add column if not exists member_code text;

-- 这里给名册编号创建唯一索引，避免两个同门拿到同一个编号。
create unique index if not exists join_applications_member_code_unique
on public.join_applications (member_code)
where member_code is not null;

-- 这个函数生成下一个问云编号，入参是辈分字，返回值类似“问云-云-001”。
create or replace function public.next_wenyun_member_code(target_generation text)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  -- 这个变量保存清理后的辈分字，空值会回到“云”。
  safe_generation text := coalesce(nullif(left(trim(target_generation), 1), ''), '云');
  -- 这个变量保存当前辈分字下已有最大编号。
  max_number integer := 0;
begin
  -- 这里按“问云-辈分字-数字”的格式查找已有最大编号。
  select coalesce(max(split_part(member_code, '-', 3)::integer), 0)
  into max_number
  from public.join_applications
  where split_part(member_code, '-', 1) = '问云'
    and split_part(member_code, '-', 2) = safe_generation
    and split_part(member_code, '-', 3) ~ '^[0-9]+$';

  -- 这里把数字补足三位，保证编号整齐。
  return '问云-' || safe_generation || '-' || lpad((max_number + 1)::text, 3, '0');
end;
$$;

-- 这个函数在新增或更新名册时补齐默认身份、辈分字和编号。
create or replace function public.set_wenyun_roster_fields()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- 这里清理道名，避免前后空格进入名册。
  new.nickname = trim(new.nickname);

  -- 这里补齐性别，未选择时默认不公开。
  new.gender = coalesce(nullif(trim(new.gender), ''), '不公开');

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

-- 这里绑定触发器，让前台登记和后台编辑都能自动补齐默认字段。
drop trigger if exists set_wenyun_roster_fields_before_write on public.join_applications;
create trigger set_wenyun_roster_fields_before_write
before insert or update on public.join_applications
for each row execute function public.set_wenyun_roster_fields();

-- 这里给旧数据补编号，保证旧申请也能进入名册管理。
update public.join_applications
set member_code = public.next_wenyun_member_code(coalesce(generation_name, '云'))
where member_code is null or trim(member_code) = '';

-- 这里创建公开名册视图，只暴露非敏感字段，不包含微信号、申请理由和管理员备注。
create or replace view public.roster_entries as
select
  id,
  nickname as dao_name,
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

-- 这里授权游客读取公开名册视图，视图中没有敏感联系方式。
grant select on public.roster_entries to anon, authenticated;

-- 这里收紧游客提交策略，游客只能登记待审核同门，不能自行把身份改成掌门或直接公开入册。
drop policy if exists "游客可提交入派申请" on public.join_applications;
drop policy if exists "游客可提交名册登记" on public.join_applications;
create policy "游客可提交名册登记"
on public.join_applications
for insert
with check (
  accept_rules = true
  and status = 'pending'
  and member_role = '同门'
  and generation_name = '云'
);
