-- 本脚本用于同步最新名册规则：身份统一为掌门、执事、护灯人、同门，并补齐旧成员出生年份。
-- 执行方式：复制本文件全部内容到 Supabase SQL 编辑器执行；也可以用 Supabase CLI 推送迁移。

-- 这里给名帖增加待审核修改字段，道名和联系方式由用户申请、管理员同意后才生效。
alter table public.join_applications
add column if not exists requested_nickname text,
add column if not exists requested_legacy_contact text,
add column if not exists requested_at timestamptz;

-- 这里先移除旧身份约束，避免把旧身份迁移为新身份时被数据库拦住。
alter table public.join_applications
drop constraint if exists join_applications_member_role_check;

-- 这里把旧名册身份转换成现在官网使用的身份。
update public.join_applications
set member_role = case
  when member_role in ('掌门') then '掌门'
  when member_role in ('执事', '护山执事') then '执事'
  when member_role in ('护灯人') then '护灯人'
  else '同门'
end;

-- 这里重建身份约束，防止后续写入不认识的身份。
alter table public.join_applications
add constraint join_applications_member_role_check
check (member_role in ('掌门', '执事', '护灯人', '同门'));

-- 这里把旧年份资料直接登记到现有名册上，022 之后没有年份的成员保持为空。
with birth_years(roster_serial, birth_year) as (
  values
    (1, '2003'),
    (2, '2004'),
    (3, '1986'),
    (4, '2003'),
    (5, '2008'),
    (6, '2006'),
    (7, '1990'),
    (8, '2006'),
    (9, '2006'),
    (10, '2009'),
    (11, '1999'),
    (12, '2009'),
    (13, '1988'),
    (14, '2003'),
    (15, '2003'),
    (16, '1999'),
    (17, '1992'),
    (18, '2009'),
    (19, '2000'),
    (20, '2013'),
    (21, '2010')
)
update public.join_applications as target
set age_range = birth_years.birth_year
from birth_years
where target.roster_serial = birth_years.roster_serial;

-- 这个函数在新增或更新名册时补齐字段默认值，入参是触发器记录，返回值是清理后的记录。
create or replace function public.set_wenyun_roster_fields()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- 这里清理道名，避免前后空格进入名册。
  new.nickname = trim(new.nickname);

  -- 这里清理江湖名，空值保存为空。
  new.jianghu_name = nullif(trim(coalesce(new.jianghu_name, '')), '');

  -- 这里清理真实姓名，真实姓名不会进入公开视图。
  new.real_name = nullif(trim(coalesce(new.real_name, '')), '');

  -- 这里补齐性别。
  new.gender = coalesce(nullif(trim(new.gender), ''), '男');

  -- 这里兼容旧身份并统一成新身份。
  new.member_role = case
    when trim(coalesce(new.member_role, '')) in ('掌门') then '掌门'
    when trim(coalesce(new.member_role, '')) in ('执事', '护山执事') then '执事'
    when trim(coalesce(new.member_role, '')) in ('护灯人') then '护灯人'
    else '同门'
  end;

  -- 这里补齐辈分字，只取第一个字，默认是“云”。
  new.generation_name = coalesce(nullif(left(trim(new.generation_name), 1), ''), '云');

  -- 这里在编号为空时沿用问云编号生成逻辑。
  if new.member_code is null or trim(new.member_code) = '' then
    new.member_code = public.next_wenyun_member_code(new.generation_name);
  else
    new.member_code = replace(trim(new.member_code), '云栖-云-', '问云-云-');
  end if;

  -- 这里让所在城市、宣言、兴趣爱好和联系方式有稳定兜底值。
  new.public_region = nullif(trim(coalesce(new.public_region, new.city, '')), '');
  new.raw_region = nullif(trim(coalesce(new.raw_region, new.public_region, new.city, '')), '');
  new.motto = nullif(trim(coalesce(new.motto, new.reason, '')), '');
  new.public_story = nullif(trim(coalesce(new.public_story, '')), '');
  new.raw_story = nullif(trim(coalesce(new.raw_story, new.public_story, '')), '');
  new.tags = nullif(trim(coalesce(new.tags, '')), '');
  new.companion_expectation = nullif(trim(coalesce(new.companion_expectation, '')), '');
  new.legacy_contact = nullif(trim(coalesce(new.legacy_contact, new.wechat_id, '')), '');
  new.requested_nickname = nullif(trim(coalesce(new.requested_nickname, '')), '');
  new.requested_legacy_contact = nullif(trim(coalesce(new.requested_legacy_contact, '')), '');

  -- 这里没有待审核修改时清空提交时间，避免后台误判。
  if new.requested_nickname is null and new.requested_legacy_contact is null then
    new.requested_at = null;
  elsif new.requested_at is null then
    new.requested_at = now();
  end if;

  return new;
end;
$$;

-- 这里重新创建公开名册视图，公开视图仍不包含真实姓名、联系方式和出生年份。
drop view if exists public.roster_entries;

create view public.roster_entries as
select
  id,
  nickname as dao_name,
  jianghu_name,
  member_code,
  gender,
  age_range as birth_month,
  city,
  member_role,
  generation_name,
  public_region,
  motto,
  public_story,
  tags,
  companion_expectation,
  joined_at,
  status,
  created_at
from public.join_applications
where status in ('approved', 'contacted', 'joined')
order by roster_serial asc nulls last, member_code asc;

grant select on public.roster_entries to anon, authenticated;

-- 这个函数让用户维护自己的名册资料，入参是页面表单字段，返回值是更新后的名帖。
create or replace function public.update_my_roster_profile(
  target_application_id uuid,
  next_jianghu_name text,
  next_gender text,
  next_city text,
  next_motto text,
  next_hobbies text,
  next_companion_expectation text,
  requested_dao_name text,
  requested_contact text
)
returns public.join_applications
language plpgsql
security definer
set search_path = public
as $$
declare
  -- 这个变量保存当前登录用户编号。
  current_user_id uuid := auth.uid();
  -- 这个变量保存当前名帖，用于判断是否属于本人。
  current_record public.join_applications%rowtype;
  -- 这个变量保存更新后的名帖。
  updated_record public.join_applications%rowtype;
  -- 这个变量保存待审核道名。
  pending_dao_name text := nullif(trim(coalesce(requested_dao_name, '')), '');
  -- 这个变量保存待审核联系方式。
  pending_contact text := nullif(trim(coalesce(requested_contact, '')), '');
begin
  -- 这里拦截未登录调用。
  if current_user_id is null then
    raise exception '请先登录问云小院。';
  end if;

  -- 这里读取本人的名帖，防止用户越权修改别人资料。
  select *
  into current_record
  from public.join_applications
  where id = target_application_id
    and user_id = current_user_id
  limit 1;

  if not found then
    raise exception '没有找到属于你的名帖。';
  end if;

  -- 这里校验性别，只允许官网当前支持的选项。
  if next_gender not in ('男', '女') then
    raise exception '性别选项不正确。';
  end if;

  -- 这里校验待审核道名，空值表示不申请修改。
  if pending_dao_name is not null and (left(pending_dao_name, 1) <> '云' or char_length(pending_dao_name) not between 2 and 3) then
    raise exception '道名需以“云”字开头，长度为 2 到 3 个字。';
  end if;

  -- 这里如果用户填写的道名或联系方式和当前一致，就不创建待审核修改。
  if pending_dao_name = current_record.nickname then
    pending_dao_name := null;
  end if;

  if pending_contact = coalesce(current_record.legacy_contact, current_record.wechat_id) then
    pending_contact := null;
  end if;

  -- 这里更新用户可直接修改的字段，道名和联系方式只写入待审核字段。
  update public.join_applications
  set jianghu_name = nullif(trim(coalesce(next_jianghu_name, '')), ''),
      gender = next_gender,
      city = nullif(trim(coalesce(next_city, '')), ''),
      public_region = nullif(trim(coalesce(next_city, '')), ''),
      raw_region = nullif(trim(coalesce(next_city, '')), ''),
      motto = nullif(trim(coalesce(next_motto, '')), ''),
      reason = coalesce(nullif(trim(coalesce(next_motto, '')), ''), reason),
      public_story = null,
      raw_story = null,
      tags = nullif(trim(coalesce(next_hobbies, '')), ''),
      companion_expectation = nullif(trim(coalesce(next_companion_expectation, '')), ''),
      requested_nickname = pending_dao_name,
      requested_legacy_contact = pending_contact,
      requested_at = case
        when pending_dao_name is not null or pending_contact is not null then now()
        else null
      end
  where id = current_record.id
  returning * into updated_record;

  return updated_record;
end;
$$;

-- 这里允许登录用户调用自己的名册资料更新函数。
grant execute on function public.update_my_roster_profile(uuid, text, text, text, text, text, text, text, text) to authenticated;

-- 这里重建名册提交策略，普通用户提交时身份固定为同门。
drop policy if exists "游客可提交名册登记" on public.join_applications;
drop policy if exists "登录用户可提交名册登记" on public.join_applications;

create policy "登录用户可提交名册登记"
on public.join_applications
for insert
to authenticated
with check (
  auth.uid() = user_id
  and accept_rules = true
  and status = 'pending'
  and member_role = '同门'
  and generation_name = '云'
  and gender in ('男', '女')
);

-- 这里返回关键检查结果，方便在 SQL 编辑器确认脚本执行成功。
select
  count(*) filter (where age_range is not null and roster_serial between 1 and 21) as 已补出生年份数量,
  count(*) filter (where member_role = '同门') as 同门数量,
  count(*) filter (where member_role in ('掌门', '执事', '护灯人')) as 特殊身份数量
from public.join_applications;
