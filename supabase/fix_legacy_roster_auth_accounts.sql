-- 本脚本用于修复旧名册编号账号登录时报 “Database error querying schema” 的问题。
-- 执行位置：Supabase SQL 编辑器。
-- 适用场景：已经执行过旧云栖名册导入脚本，但用 001 这类编号登录时报认证库错误。
-- 修复原因：Supabase Auth 手动写入账号时，部分令牌字段不能为 null，否则登录时会触发认证库查询失败。

begin;

-- 这里补齐旧编号账号的 Auth 必填令牌字段，避免 Supabase 登录接口在读取认证库时失败。
update auth.users
set confirmation_token = coalesce(confirmation_token, ''),
    recovery_token = coalesce(recovery_token, ''),
    email_change = coalesce(email_change, ''),
    email_change_token_new = coalesce(email_change_token_new, ''),
    email_change_token_current = coalesce(email_change_token_current, ''),
    phone_change = coalesce(phone_change, ''),
    phone_change_token = coalesce(phone_change_token, ''),
    reauthentication_token = coalesce(reauthentication_token, ''),
    email_confirmed_at = coalesce(email_confirmed_at, now()),
    updated_at = now()
where email ~ '^[0-9]{3}@wenyun\.local$';

commit;

-- 这里检查修复结果，异常令牌字段数量应为 0，旧编号账号数量应为 29。
select
  count(*) as 旧编号账号数量,
  count(*) filter (
    where confirmation_token is null
       or recovery_token is null
       or email_change is null
       or email_change_token_new is null
       or email_change_token_current is null
       or phone_change is null
       or phone_change_token is null
       or reauthentication_token is null
  ) as 异常令牌字段数量
from auth.users
where email ~ '^[0-9]{3}@wenyun\.local$';
