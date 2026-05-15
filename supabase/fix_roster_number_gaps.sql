-- 本脚本用于释放“待审核”名帖占用的编号，并把后面的已有编号依次往前补齐。
-- 执行方式：复制本文件全部内容到 Supabase SQL 编辑器执行一次。
-- 修复范围：待审核名帖不保留编号；已审核、已联系、未通过、暂存、已退派这些已有编号会参与重排，例如 031 会变成 030。
-- 安全提醒：执行前建议先在 Supabase 后台备份数据库；脚本不会删除名帖，也不会删除登录账号。

begin;

-- 这里锁住名册表，避免修复编号时后台同时新增或编辑名帖造成编号混乱。
lock table public.join_applications in share row exclusive mode;

-- 这里补齐旧库可能缺少的入册序号字段，保证脚本在不同线上库中都能运行。
alter table public.join_applications
add column if not exists roster_serial integer;

-- 这里清理同一 SQL 会话里可能残留的临时表，保证脚本可以重复执行。
drop table if exists roster_pending_number_release;
drop table if exists roster_number_repair;
drop table if exists roster_number_collision;

-- 这里先记录所有待审核但已经占用编号的名帖，后面会把这些编号释放出来。
create temporary table roster_pending_number_release as
select
  id,
  user_id,
  nickname,
  status,
  roster_serial as old_roster_serial,
  member_code as old_member_code,
  case
    when member_code ~ '^问云-云-[0-9]+$' then lpad(split_part(member_code, '-', 3)::integer::text, 3, '0')
    when roster_serial is not null then lpad(roster_serial::text, 3, '0')
    else null
  end as old_short_account
from public.join_applications
where status = 'pending'
  and (member_code is not null or roster_serial is not null);

-- 这里整理所有非待审核且已有编号的名帖；这些记录会按原编号顺序重新压成连续编号。
create temporary table roster_number_repair as
with source_roster as (
  select
    id,
    user_id,
    nickname,
    status,
    roster_serial as old_roster_serial,
    member_code as old_member_code,
    coalesce(
      roster_serial,
      case
        when member_code ~ '^问云-云-[0-9]+$' then split_part(member_code, '-', 3)::integer
        else null
      end
    ) as old_number,
    coalesce(joined_at, reviewed_at, created_at) as sort_time,
    created_at
  from public.join_applications
  where status <> 'pending'
    and (
      roster_serial is not null
      or member_code ~ '^问云-云-[0-9]+$'
    )
),
numbered_roster as (
  select
    id,
    user_id,
    nickname,
    status,
    old_roster_serial,
    old_member_code,
    old_number,
    row_number() over (
      order by
        old_number asc,
        sort_time asc,
        created_at asc,
        id asc
    )::integer as new_roster_serial
  from source_roster
  where old_number is not null
)
select
  id,
  user_id,
  nickname,
  status,
  old_roster_serial,
  old_member_code,
  old_number,
  lpad(old_number::text, 3, '0') as old_short_account,
  new_roster_serial,
  lpad(new_roster_serial::text, 3, '0') as new_short_account,
  '问云-云-' || lpad(new_roster_serial::text, 3, '0') as new_member_code,
  old_roster_serial is distinct from new_roster_serial
    or old_member_code is distinct from '问云-云-' || lpad(new_roster_serial::text, 3, '0') as need_update
from numbered_roster;

-- 这里先清空待审核名帖的编号，给后面已有编号往前移动腾出位置。
update public.join_applications as application_row
set roster_serial = null,
    member_code = null
from roster_pending_number_release as pending_row
where application_row.id = pending_row.id;

-- 这里先把需要改号的名帖写成临时编号，避免 031 改成 030 时撞上唯一索引。
update public.join_applications as application_row
set roster_serial = -1000000000 - repair_row.new_roster_serial,
    member_code = '临时-编号修复-' || application_row.id::text
from roster_number_repair as repair_row
where application_row.id = repair_row.id
  and repair_row.need_update = true;

-- 这里把需要改号的旧编号身份记录先挪到临时邮箱，避免身份表邮箱唯一规则冲突。
do $$
begin
  -- 这里兼容新版 Supabase 身份表，存在 provider_id 字段时同步更新它。
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'auth'
      and table_name = 'identities'
      and column_name = 'provider_id'
  ) then
    update auth.identities as identity_row
    set provider_id = 'linshi-' || identity_row.user_id::text || '@wenyun.local',
        identity_data = jsonb_set(
          jsonb_set(
            coalesce(identity_data, '{}'::jsonb),
            '{email}',
            to_jsonb('linshi-' || identity_row.user_id::text || '@wenyun.local'),
            true
          ),
          '{email_verified}',
          'true'::jsonb,
          true
        ),
        updated_at = now()
    from roster_number_repair as repair_row
    where identity_row.user_id = repair_row.user_id
      and repair_row.need_update = true
      and identity_row.provider = 'email'
      and (
        lower(coalesce(identity_row.provider_id, '')) = lower(repair_row.old_short_account || '@wenyun.local')
        or lower(coalesce(identity_row.identity_data->>'email', '')) = lower(repair_row.old_short_account || '@wenyun.local')
      );
  else
    -- 这里兼容少数旧版 Supabase 身份表，没有 provider_id 字段时只同步身份内容。
    update auth.identities as identity_row
    set identity_data = jsonb_set(
          jsonb_set(
            coalesce(identity_data, '{}'::jsonb),
            '{email}',
            to_jsonb('linshi-' || identity_row.user_id::text || '@wenyun.local'),
            true
          ),
          '{email_verified}',
          'true'::jsonb,
          true
        ),
        updated_at = now()
    from roster_number_repair as repair_row
    where identity_row.user_id = repair_row.user_id
      and repair_row.need_update = true
      and identity_row.provider = 'email'
      and lower(coalesce(identity_row.identity_data->>'email', '')) = lower(repair_row.old_short_account || '@wenyun.local');
  end if;
end;
$$;

-- 这里把需要改号的旧编号登录邮箱先挪到临时邮箱，真实邮箱账号不会被改动。
update auth.users as user_row
set email = 'linshi-' || user_row.id::text || '@wenyun.local',
    updated_at = now()
from roster_number_repair as repair_row
where user_row.id = repair_row.user_id
  and repair_row.need_update = true
  and lower(coalesce(user_row.email, '')) = lower(repair_row.old_short_account || '@wenyun.local');

-- 这里找出仍然占用新短号的账号；如果它不属于本次重排记录，就改成归档邮箱释放短号。
create temporary table roster_number_collision as
select distinct on (user_row.id)
  user_row.id as user_id,
  user_row.email as old_email,
  'guidang-' || split_part(user_row.email, '@', 1) || '-' || replace(user_row.id::text, '-', '') || '@wenyun.local' as new_email
from auth.users as user_row
join (
  select distinct new_short_account
  from roster_number_repair
) as target_number
  on lower(coalesce(user_row.email, '')) = lower(target_number.new_short_account || '@wenyun.local')
left join roster_number_repair as repair_row
  on repair_row.user_id = user_row.id
where repair_row.user_id is null
order by user_row.id, user_row.email;

-- 这里把占用目标短号的孤立身份记录归档，避免最终短号写入失败。
do $$
begin
  -- 这里兼容新版 Supabase 身份表，存在 provider_id 字段时同步更新它。
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'auth'
      and table_name = 'identities'
      and column_name = 'provider_id'
  ) then
    update auth.identities as identity_row
    set provider_id = collision_row.new_email,
        identity_data = jsonb_set(
          jsonb_set(
            coalesce(identity_data, '{}'::jsonb),
            '{email}',
            to_jsonb(collision_row.new_email),
            true
          ),
          '{email_verified}',
          'true'::jsonb,
          true
        ),
        updated_at = now()
    from roster_number_collision as collision_row
    where identity_row.user_id = collision_row.user_id
      and identity_row.provider = 'email'
      and (
        lower(coalesce(identity_row.provider_id, '')) = lower(collision_row.old_email)
        or lower(coalesce(identity_row.identity_data->>'email', '')) = lower(collision_row.old_email)
      );
  else
    -- 这里兼容少数旧版 Supabase 身份表，没有 provider_id 字段时只同步身份内容。
    update auth.identities as identity_row
    set identity_data = jsonb_set(
          jsonb_set(
            coalesce(identity_data, '{}'::jsonb),
            '{email}',
            to_jsonb(collision_row.new_email),
            true
          ),
          '{email_verified}',
          'true'::jsonb,
          true
        ),
        updated_at = now()
    from roster_number_collision as collision_row
    where identity_row.user_id = collision_row.user_id
      and identity_row.provider = 'email'
      and lower(coalesce(identity_row.identity_data->>'email', '')) = lower(collision_row.old_email);
  end if;
end;
$$;

-- 这里把占用目标短号的孤立登录账号改成归档邮箱，不删除账号，只释放短号。
update auth.users as user_row
set email = collision_row.new_email,
    raw_user_meta_data = coalesce(raw_user_meta_data, '{}'::jsonb) || jsonb_build_object(
      'number_repair_note',
      '此旧编号账号没有参与本次编号重排，已在编号修复时归档释放短号。'
    ),
    updated_at = now()
from roster_number_collision as collision_row
where user_row.id = collision_row.user_id
  and lower(coalesce(user_row.email, '')) = lower(collision_row.old_email);

-- 这里把名帖从临时编号改成最终连续编号。
update public.join_applications as application_row
set roster_serial = repair_row.new_roster_serial,
    member_code = repair_row.new_member_code
from roster_number_repair as repair_row
where application_row.id = repair_row.id
  and repair_row.need_update = true;

-- 这里把临时身份邮箱改成新的短号邮箱，保证旧编号登录规则跟名册编号一致。
do $$
begin
  -- 这里兼容新版 Supabase 身份表，存在 provider_id 字段时同步更新它。
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'auth'
      and table_name = 'identities'
      and column_name = 'provider_id'
  ) then
    update auth.identities as identity_row
    set provider_id = repair_row.new_short_account || '@wenyun.local',
        identity_data = jsonb_set(
          jsonb_set(
            coalesce(identity_data, '{}'::jsonb),
            '{email}',
            to_jsonb(repair_row.new_short_account || '@wenyun.local'),
            true
          ),
          '{email_verified}',
          'true'::jsonb,
          true
        ),
        updated_at = now()
    from roster_number_repair as repair_row
    where identity_row.user_id = repair_row.user_id
      and repair_row.need_update = true
      and identity_row.provider = 'email'
      and (
        lower(coalesce(identity_row.provider_id, '')) = lower('linshi-' || identity_row.user_id::text || '@wenyun.local')
        or lower(coalesce(identity_row.identity_data->>'email', '')) = lower('linshi-' || identity_row.user_id::text || '@wenyun.local')
      );
  else
    -- 这里兼容少数旧版 Supabase 身份表，没有 provider_id 字段时只同步身份内容。
    update auth.identities as identity_row
    set identity_data = jsonb_set(
          jsonb_set(
            coalesce(identity_data, '{}'::jsonb),
            '{email}',
            to_jsonb(repair_row.new_short_account || '@wenyun.local'),
            true
          ),
          '{email_verified}',
          'true'::jsonb,
          true
        ),
        updated_at = now()
    from roster_number_repair as repair_row
    where identity_row.user_id = repair_row.user_id
      and repair_row.need_update = true
      and identity_row.provider = 'email'
      and lower(coalesce(identity_row.identity_data->>'email', '')) = lower('linshi-' || identity_row.user_id::text || '@wenyun.local');
  end if;
end;
$$;

-- 这里把临时登录邮箱改成新的短号邮箱，真实邮箱账号仍保持原来的真实邮箱。
update auth.users as user_row
set email = repair_row.new_short_account || '@wenyun.local',
    updated_at = now()
from roster_number_repair as repair_row
where user_row.id = repair_row.user_id
  and repair_row.need_update = true
  and lower(coalesce(user_row.email, '')) = lower('linshi-' || user_row.id::text || '@wenyun.local');

-- 这里同步登录账号元数据，方便后续排查账号归属时看到最新编号。
update auth.users as user_row
set raw_user_meta_data = coalesce(raw_user_meta_data, '{}'::jsonb) || jsonb_build_object(
      'short_account',
      repair_row.new_short_account,
      'member_code',
      repair_row.new_member_code,
      'roster_serial',
      repair_row.new_roster_serial
    ),
    updated_at = now()
from roster_number_repair as repair_row
where user_row.id = repair_row.user_id;

-- 这个函数生成下一个问云编号，入参是辈分字，返回值是类似“问云-云-030”的编号。
create or replace function public.next_wenyun_member_code(target_generation text)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  -- 这个变量保存整理后的辈分字，空值统一用“云”。
  safe_generation text := coalesce(nullif(left(trim(coalesce(target_generation, '云')), 1), ''), '云');
  -- 这个变量保存当前已经使用的最大编号；待审核名帖不参与统计。
  max_number integer := 0;
begin
  -- 这里排除待审核名帖，只统计已经确定要保留的已有编号。
  select coalesce(max(split_part(member_code, '-', 3)::integer), 0)
  into max_number
  from public.join_applications
  where status <> 'pending'
    and split_part(member_code, '-', 1) = '问云'
    and split_part(member_code, '-', 2) = safe_generation
    and split_part(member_code, '-', 3) ~ '^[0-9]+$';

  -- 这里把数字补足三位，保证编号显示整齐。
  return '问云-' || safe_generation || '-' || lpad((max_number + 1)::text, 3, '0');
end;
$$;

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

  -- 这里清理江湖名，空值保存为空，方便前台展示兜底文案。
  new.jianghu_name = nullif(trim(coalesce(new.jianghu_name, '')), '');

  -- 这里清理真实姓名，真实姓名只给后台核对，不进入公开视图。
  new.real_name = nullif(trim(coalesce(new.real_name, '')), '');

  -- 这里补齐性别，避免旧数据为空时影响前台筛选。
  new.gender = coalesce(nullif(trim(new.gender), ''), '男');

  -- 这里兼容旧身份并统一成新版金典身份。
  new.member_role = case
    when trim(coalesce(new.member_role, '')) = '掌门' then '掌门'
    when trim(coalesce(new.member_role, '')) in ('护灯人', '执灯长老') then '执灯长老'
    when trim(coalesce(new.member_role, '')) in ('执事', '护山执事', '云纪执事') then '云纪执事'
    when trim(coalesce(new.member_role, '')) = '文案执事' then '文案执事'
    when trim(coalesce(new.member_role, '')) = '雅集执事' then '雅集执事'
    else '同门'
  end;

  -- 这里补齐辈分字，只取第一个字，默认是“云”。
  new.generation_name = coalesce(nullif(left(trim(new.generation_name), 1), ''), '云');

  -- 这里待审核名帖不分配公开编号，避免提前占用正式名册编号。
  if new.status = 'pending' then
    new.member_code = null;
    new.roster_serial = null;
  else
    -- 这里已审核和已联系名帖没有编号时才自动生成；其他状态不会凭空生成新编号。
    if new.status in ('approved', 'contacted') and (new.member_code is null or trim(new.member_code) = '') then
      new.member_code = public.next_wenyun_member_code(new.generation_name);
    elsif new.member_code is not null and trim(new.member_code) <> '' then
      new.member_code = replace(trim(new.member_code), '云栖-云-', '问云-云-');
    else
      new.member_code = null;
      new.roster_serial = null;
    end if;

    -- 这里把入册序号和编号数字同步，避免后台排序和公开编号不一致。
    if new.member_code ~ '^问云-云-[0-9]+$' then
      new.roster_serial = split_part(new.member_code, '-', 3)::integer;
    end if;
  end if;

  -- 这里让所在城市、宣言、兴趣爱好和联系方式有兜底值。
  new.public_region = nullif(trim(coalesce(new.public_region, new.city, '')), '');
  new.raw_region = nullif(trim(coalesce(new.raw_region, new.public_region, new.city, '')), '');
  new.motto = nullif(trim(coalesce(new.motto, new.reason, '')), '');
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

-- 这里确保触发器使用上面新的编号规则。
drop trigger if exists set_wenyun_roster_fields_before_write on public.join_applications;
create trigger set_wenyun_roster_fields_before_write
before insert or update on public.join_applications
for each row execute function public.set_wenyun_roster_fields();

commit;

-- 这里输出本次被释放编号的待审核名帖，方便确认释放了哪些编号。
select
  nickname as 道名,
  status as 状态,
  old_roster_serial as 原入册序号,
  old_member_code as 原名册编号
from roster_pending_number_release
order by coalesce(old_roster_serial, 2147483647), old_member_code asc;

-- 这里输出本次编号往前补齐的名帖，方便确认 031 是否已经变成 030。
select
  nickname as 道名,
  status as 状态,
  old_roster_serial as 原入册序号,
  old_member_code as 原名册编号,
  new_roster_serial as 新入册序号,
  new_member_code as 新名册编号
from roster_number_repair
where need_update = true
order by new_roster_serial asc;

-- 这里输出被归档的孤立旧登录账号；正常情况下可以为空。
select
  old_email as 原孤立登录邮箱,
  new_email as 归档后登录邮箱
from roster_number_collision
order by old_email asc;

-- 这里做最终检查：待审核不应再占号，其余已有编号应当连续。
with checked_roster as (
  select
    id,
    roster_serial,
    member_code,
    row_number() over (
      order by
        coalesce(roster_serial, split_part(member_code, '-', 3)::integer) asc,
        coalesce(joined_at, reviewed_at, created_at) asc,
        created_at asc,
        id asc
    )::integer as expected_serial
  from public.join_applications
  where status <> 'pending'
    and member_code ~ '^问云-云-[0-9]+$'
)
select
  (
    select count(*)
    from public.join_applications
    where status = 'pending'
      and (member_code is not null or roster_serial is not null)
  ) as 待审核仍占号数量,
  count(*) as 已保留编号名帖数量,
  count(*) filter (where roster_serial is distinct from expected_serial) as 入册序号不连续数量,
  count(*) filter (where member_code is distinct from '问云-云-' || lpad(expected_serial::text, 3, '0')) as 名册编号不连续数量
from checked_roster;
