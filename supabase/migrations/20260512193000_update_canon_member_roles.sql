-- 这个脚本用于同步新版《问云派立派金典》的组织职分，保证前台身份选项和数据库约束一致。

-- 这里先移除旧身份约束，避免更新历史数据时被旧规则拦住。
alter table public.join_applications
drop constraint if exists join_applications_member_role_check;

-- 这里把历史身份平滑迁移到新版职分，旧数据不会丢失，只会换成新版称呼。
update public.join_applications
set member_role = case
  when trim(coalesce(member_role, '')) = '掌门' then '掌门'
  when trim(coalesce(member_role, '')) in ('护灯人', '执灯长老') then '执灯长老'
  when trim(coalesce(member_role, '')) in ('执事', '护山执事', '云纪执事') then '云纪执事'
  when trim(coalesce(member_role, '')) = '文案执事' then '文案执事'
  when trim(coalesce(member_role, '')) = '雅集执事' then '雅集执事'
  else '同门'
end;

-- 这里重新添加新版身份约束，避免后台写入金典之外的身份。
alter table public.join_applications
add constraint join_applications_member_role_check
check (member_role in ('掌门', '执灯长老', '云纪执事', '文案执事', '雅集执事', '同门'));

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

  -- 这里在编号为空时沿用问云编号生成逻辑。
  if new.member_code is null or trim(new.member_code) = '' then
    new.member_code = public.next_wenyun_member_code(new.generation_name);
  else
    new.member_code = replace(trim(new.member_code), '云栖-云-', '问云-云-');
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
