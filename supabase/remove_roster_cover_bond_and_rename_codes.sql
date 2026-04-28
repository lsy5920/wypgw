-- 本脚本用于移除名册里的“封面”和“羁绊状态”字段，并把旧编号前缀从“云栖”改为“问云”。
-- 执行位置：Supabase SQL 编辑器。
-- 适用场景：已经导入过旧名册，或者线上名册还显示“云栖-云-001”这类编号。

begin;

-- 这里先把已有名册编号统一改为问云编号，避免前台继续显示旧门派前缀。
update public.join_applications
set member_code = replace(member_code, '云栖-云-', '问云-云-')
where member_code like '云栖-云-%';

-- 这里同步修正 Auth 用户元数据里的编号，方便后续排查账号归属时也显示问云编号。
update auth.users
set raw_user_meta_data = jsonb_set(
      coalesce(raw_user_meta_data, '{}'::jsonb),
      '{member_code}',
      to_jsonb(replace(raw_user_meta_data->>'member_code', '云栖-云-', '问云-云-')),
      true
    ),
    updated_at = now()
where email ~ '^[0-9]{3}@wenyun\.local$'
  and raw_user_meta_data ? 'member_code'
  and raw_user_meta_data->>'member_code' like '云栖-云-%';

-- 这里把旧导入备注里的短账号提示改成不公开短编号的说明。
update public.join_applications
set admin_note = '旧名册导入，已绑定历史编号。'
where member_code like '问云-云-%'
  and admin_note like '%编号账号%';

-- 这里重建名册触发器函数，去掉已经废弃的封面和羁绊字段。
create or replace function public.set_wenyun_roster_fields()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- 这里清理道名，避免前后空格进入名册。
  new.nickname = trim(new.nickname);

  -- 这里清理江湖名，空值保存为空，方便前台展示兜底文案。
  new.jianghu_name = nullif(trim(coalesce(new.jianghu_name, '')), '');

  -- 这里清理真实姓名，真实姓名只给后台核对，不进入公开视图。
  new.real_name = nullif(trim(coalesce(new.real_name, '')), '');

  -- 这里补齐性别。
  new.gender = coalesce(nullif(trim(new.gender), ''), '男');

  -- 这里补齐旧名册江湖身份。
  new.member_role = coalesce(nullif(trim(new.member_role), ''), '烟雨行客');

  -- 这里补齐辈分字，只取第一个字，默认是“云”。
  new.generation_name = coalesce(nullif(left(trim(new.generation_name), 1), ''), '云');

  -- 这里在编号为空时沿用问云编号生成逻辑。
  if new.member_code is null or trim(new.member_code) = '' then
    new.member_code = public.next_wenyun_member_code(new.generation_name);
  else
    new.member_code = replace(trim(new.member_code), '云栖-云-', '问云-云-');
  end if;

  -- 这里让公开地域、宣言、故事、标签和联系方式有兜底值。
  new.public_region = nullif(trim(coalesce(new.public_region, new.city, '')), '');
  new.raw_region = nullif(trim(coalesce(new.raw_region, new.public_region, new.city, '')), '');
  new.motto = nullif(trim(coalesce(new.motto, new.reason, '')), '');
  new.public_story = nullif(trim(coalesce(new.public_story, '')), '');
  new.raw_story = nullif(trim(coalesce(new.raw_story, new.public_story, '')), '');
  new.tags = nullif(trim(coalesce(new.tags, '')), '');
  new.companion_expectation = nullif(trim(coalesce(new.companion_expectation, '')), '');
  new.legacy_contact = nullif(trim(coalesce(new.legacy_contact, new.wechat_id, '')), '');

  return new;
end;
$$;

-- 这里重建公开名册视图，不再公开封面、羁绊状态和登录短号。
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

-- 这里真正删除废弃字段；如果线上库没有这些字段，语句会自动跳过。
alter table public.join_applications
drop column if exists bond_status,
drop column if exists cover_name;

commit;

-- 这里检查修复结果：旧前缀数量和废弃字段数量都应该是 0。
select
  (select count(*) from public.join_applications where member_code like '云栖-云-%') as 旧编号前缀数量,
  (select count(*) from information_schema.columns where table_schema = 'public' and table_name = 'join_applications' and column_name in ('bond_status', 'cover_name')) as 废弃字段数量;
