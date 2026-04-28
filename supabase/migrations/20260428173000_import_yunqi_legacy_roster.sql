-- 本脚本用于把旧名册同步到问云派官网。
-- 执行方式：请先执行前面的初始化、名册、小院和 SMTP 脚本，再复制本脚本到 Supabase SQL 编辑器执行。
-- 注意：本脚本不会导入“热度、推荐等级、更新时间、公开链接标识”。
-- 旧同门登录方式：账号为三位短编号，例如 001；有出生年份时密码为年份，没有年份时密码等于短编号。

create extension if not exists "pgcrypto";

-- 这里扩展名册表字段，让官网字段以旧名册表单为主。
alter table public.join_applications
add column if not exists roster_serial integer,
add column if not exists public_region text,
add column if not exists raw_region text,
add column if not exists motto text,
add column if not exists public_story text,
add column if not exists raw_story text,
add column if not exists tags text,
add column if not exists companion_expectation text,
add column if not exists legacy_contact text,
add column if not exists joined_at timestamptz;

-- 这里给短编号建立唯一索引，避免两个账号共用 001 这类编号。
create unique index if not exists join_applications_roster_serial_unique
on public.join_applications (roster_serial)
where roster_serial is not null;

-- 这里把旧版问云身份先迁移到旧名册身份体系，避免重建约束时失败。
update public.join_applications
set member_role = case
  when member_role = '执事' then '护山执事'
  when member_role = '掌门' then '护山执事'
  when member_role = '护灯人' then '护山执事'
  when member_role = '同门' then '烟雨行客'
  when member_role in ('烟雨行客', '护山执事', '执剑游侠') then member_role
  else '烟雨行客'
end;

-- 这里重建江湖身份约束，选项以旧名册表单为准。
alter table public.join_applications
drop constraint if exists join_applications_member_role_check;

alter table public.join_applications
add constraint join_applications_member_role_check
check (member_role in ('烟雨行客', '护山执事', '执剑游侠'));

-- 这个函数在新增或更新名册时补齐旧名册字段默认值。
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

  -- 这里补齐性别。
  new.gender = coalesce(nullif(trim(new.gender), ''), '男');

  -- 这里补齐旧名册江湖身份。
  new.member_role = coalesce(nullif(trim(new.member_role), ''), '烟雨行客');

  -- 这里补齐辈分字，只取第一个字，默认是“云”。
  new.generation_name = coalesce(nullif(left(trim(new.generation_name), 1), ''), '云');

  -- 这里在编号为空时沿用原问云编号生成逻辑，旧导入数据会直接写入问云编号。
  if new.member_code is null or trim(new.member_code) = '' then
    new.member_code = public.next_wenyun_member_code(new.generation_name);
  else
    new.member_code = trim(new.member_code);
  end if;

  -- 这里让旧名册公开地域和联系方式有兜底值。
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

-- 这里重新创建公开名册视图，只公开旧表单允许展示的字段。
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

-- 这里收紧名册提交策略，允许登录用户提交旧名册身份选项。
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
  and member_role in ('烟雨行客', '护山执事', '执剑游侠')
  and generation_name = '云'
  and gender in ('男', '女')
);

-- 这里导入旧名册账号和名册记录。
do $$
declare
  -- 这个变量逐条保存旧名册数据。
  item jsonb;
  -- 这个变量保存导入账号的三位短编号。
  short_account text;
  -- 这个变量保存 Supabase Auth 内部邮箱。
  login_email text;
  -- 这个变量保存初始密码，来自年份或短编号。
  login_password text;
  -- 这个变量保存 Auth 用户编号。
  target_user_id uuid;
  -- 这个变量保存旧名帖编号。
  target_application_id uuid;
begin
  for item in select * from jsonb_array_elements($legacy$
[
  {
    "member_code": "问云-云-001",
    "generation_name": "云",
    "roster_serial": 1,
    "short_account": "001",
    "initial_password": "2003",
    "dao_name": "云泽",
    "jianghu_name": "云泽",
    "real_name": "杨爱平",
    "gender": "男",
    "member_role": "烟雨行客",
    "public_region": "台州",
    "raw_region": "台州",
    "motto": "寻一方净土~",
    "public_story": "搞点奇奇怪怪的东西",
    "raw_story": "搞点奇奇怪怪的东西",
    "tags": "学生、自行登门、旧册迁移",
    "companion_expectation": "小楼一夜听春雨",
    "legacy_contact": "ykxklmyt0611 无 3199912548@qq.com 无",
    "joined_at": "2026-04-23T09:30:58.266252+00:00"
  },
  {
    "member_code": "问云-云-002",
    "generation_name": "云",
    "roster_serial": 2,
    "short_account": "002",
    "initial_password": "2004",
    "dao_name": "云有为",
    "jianghu_name": "希为",
    "real_name": "马望洲",
    "gender": "男",
    "member_role": "护山执事",
    "public_region": "江苏无锡",
    "raw_region": "江苏无锡",
    "motto": "寻志同道合的朋友，共筑江湖梦",
    "public_story": "摄影，书法，吃饭，睡觉，打豆豆",
    "raw_story": "摄影，书法，吃饭，睡觉，打豆豆",
    "tags": "法师、自行登门、旧册迁移",
    "companion_expectation": "茶会雅集，诗词唱和",
    "legacy_contact": "RuoNe-7 无 1810187300 13211910221",
    "joined_at": "2026-04-23T09:32:23.697574+00:00"
  },
  {
    "member_code": "问云-云-003",
    "generation_name": "云",
    "roster_serial": 3,
    "short_account": "003",
    "initial_password": "1986",
    "dao_name": "云清",
    "jianghu_name": "徐清",
    "real_name": "陈沛君",
    "gender": "女",
    "member_role": "烟雨行客",
    "public_region": "桂林",
    "raw_region": "桂林",
    "motto": "寻清净之所，同清净之人一同修行",
    "public_story": "驾车，写作，剪辑，主持，运营，策划，设计",
    "raw_story": "驾车，写作，剪辑，主持，运营，策划，设计",
    "tags": "设计师、希为、旧册迁移",
    "companion_expectation": "看书，听音乐，赏花品茶，游玩",
    "legacy_contact": "c584253280 无 584253280 无",
    "joined_at": "2026-04-23T10:08:48.201544+00:00"
  },
  {
    "member_code": "问云-云-004",
    "generation_name": "云",
    "roster_serial": 4,
    "short_account": "004",
    "initial_password": "2003",
    "dao_name": "云芜",
    "jianghu_name": "清芜",
    "real_name": "张甜",
    "gender": "女",
    "member_role": "烟雨行客",
    "public_region": "辽宁朝阳",
    "raw_region": "辽宁朝阳",
    "motto": "自身格言：先掌己心，再掌乾坤，以文会友，墨香留情，心与心交汇，共赴文学之程。",
    "public_story": "算卦修行，精通通灵，略通巫术，诗词歌赋创作，",
    "raw_story": "算卦修行，精通通灵，略通巫术，诗词歌赋创作，",
    "tags": "自由职业、自行登门、旧册迁移",
    "companion_expectation": "唱和闻香，观自然之景，闲修散步，听曲",
    "legacy_contact": "BX-2697 11515838048 2979472641 暂无",
    "joined_at": "2026-04-23T10:33:40.602251+00:00"
  },
  {
    "member_code": "问云-云-005",
    "generation_name": "云",
    "roster_serial": 5,
    "short_account": "005",
    "initial_password": "2008",
    "dao_name": "云锦心",
    "jianghu_name": "锦心",
    "real_name": "张梦溪",
    "gender": "女",
    "member_role": "烟雨行客",
    "public_region": "湖北",
    "raw_region": "湖北",
    "motto": "希望能一直和平相处",
    "public_story": "画画唱歌",
    "raw_story": "画画唱歌",
    "tags": "学生、自行登门、旧册迁移",
    "companion_expectation": "追剧",
    "legacy_contact": "woshiyixin0711 woshiyixin0711 3760485158 无",
    "joined_at": "2026-04-23T10:35:45.084495+00:00"
  },
  {
    "member_code": "问云-云-006",
    "generation_name": "云",
    "roster_serial": 6,
    "short_account": "006",
    "initial_password": "2006",
    "dao_name": "云晚禾",
    "jianghu_name": "晚禾",
    "real_name": "郭旭川",
    "gender": "女",
    "member_role": "烟雨行客",
    "public_region": "张家界",
    "raw_region": "张家界",
    "motto": "偏爱古风雅致氛围，喜文字与茶事，慕云栖风骨，愿结识同好同门，静享闲雅时光。",
    "public_story": "研茶静修、笔墨赏字、文案创作、意境审美",
    "raw_story": "研茶静修、笔墨赏字、文案创作、意境审美",
    "tags": "舞蹈、自行登门、旧册迁移",
    "companion_expectation": "闲煮清茶、诗词品读、墨香雅集、古风独静",
    "legacy_contact": "G2142794968 1001103769/55746798395 629826054 无",
    "joined_at": "2026-04-23T10:38:57.176905+00:00"
  },
  {
    "member_code": "问云-云-007",
    "generation_name": "云",
    "roster_serial": 7,
    "short_account": "007",
    "initial_password": "1990",
    "dao_name": "云怀明",
    "jianghu_name": "明",
    "real_name": "成继",
    "gender": "男",
    "member_role": "烟雨行客",
    "public_region": "佛山市",
    "raw_region": "佛山市",
    "motto": "老登想来，老登来了，老登开心。",
    "public_story": "玩水.",
    "raw_story": "玩水.",
    "tags": "老师、希为、旧册迁移",
    "companion_expectation": "摄影,寻鲸.",
    "legacy_contact": "MingFreedive MingFreedive 331918018 18588542888",
    "joined_at": "2026-04-23T10:57:09.666832+00:00"
  },
  {
    "member_code": "问云-云-008",
    "generation_name": "云",
    "roster_serial": 8,
    "short_account": "008",
    "initial_password": "2006",
    "dao_name": "云若初",
    "jianghu_name": "若初",
    "real_name": "陈敏",
    "gender": "女",
    "member_role": "烟雨行客",
    "public_region": "贵州毕节",
    "raw_region": "贵州毕节",
    "motto": "修仙问道",
    "public_story": "中医知识，文案",
    "raw_story": "中医知识，文案",
    "tags": "学生、希为、旧册迁移",
    "companion_expectation": "写小说",
    "legacy_contact": "wxid_v94lqq9if7mp22 5017427100 2491808139 无",
    "joined_at": "2026-04-23T11:02:51.925706+00:00"
  },
  {
    "member_code": "问云-云-009",
    "generation_name": "云",
    "roster_serial": 9,
    "short_account": "009",
    "initial_password": "2006",
    "dao_name": "云天工",
    "jianghu_name": "天工匠师肖泰",
    "real_name": "黄子",
    "gender": "男",
    "member_role": "烟雨行客",
    "public_region": "四川省资阳市",
    "raw_region": "四川省资阳市",
    "motto": "希望认识更多的朋友，增长见识，开阔眼界",
    "public_story": "播音主持，导游讲解",
    "raw_story": "播音主持，导游讲解",
    "tags": "学生、希为、旧册迁移",
    "companion_expectation": "听音乐，看书",
    "legacy_contact": "wxid_1ql1wefaoswr22 94155179868 无 无",
    "joined_at": "2026-04-23T11:06:32.946462+00:00"
  },
  {
    "member_code": "问云-云-010",
    "generation_name": "云",
    "roster_serial": 10,
    "short_account": "010",
    "initial_password": "2009",
    "dao_name": "云烟落",
    "jianghu_name": "烟落",
    "real_name": "刘慧甜",
    "gender": "女",
    "member_role": "烟雨行客",
    "public_region": "江苏徐州",
    "raw_region": "江苏徐州",
    "motto": "交志同道合之友",
    "public_story": "剪辑",
    "raw_story": "剪辑",
    "tags": "面点师、自行登门、旧册迁移",
    "companion_expectation": "听奇闻异事",
    "legacy_contact": "T0808_W0406_H0128 小红书9496566636 1978206477 快手3615533904",
    "joined_at": "2026-04-23T11:07:31.939307+00:00"
  },
  {
    "member_code": "问云-云-011",
    "generation_name": "云",
    "roster_serial": 11,
    "short_account": "011",
    "initial_password": "1999",
    "dao_name": "云知安",
    "jianghu_name": "喻安",
    "real_name": "李喻安",
    "gender": "男",
    "member_role": "烟雨行客",
    "public_region": "大理",
    "raw_region": "大理",
    "motto": "蜉蝣一世，不知所来，亦不知所往，愿寻一地，静归一处。",
    "public_story": "驾车，手工。",
    "raw_story": "驾车，手工。",
    "tags": "散人、希为、旧册迁移",
    "companion_expectation": "饮茶，露营，做饭",
    "legacy_contact": "biewutayong 隅生 无 无",
    "joined_at": "2026-04-23T11:47:25.418858+00:00"
  },
  {
    "member_code": "问云-云-012",
    "generation_name": "云",
    "roster_serial": 12,
    "short_account": "012",
    "initial_password": "2009",
    "dao_name": "云念澄",
    "jianghu_name": "沉念",
    "real_name": "游晓楹",
    "gender": "女",
    "member_role": "烟雨行客",
    "public_region": "湖北赤壁",
    "raw_region": "湖北赤壁",
    "motto": "圆我江湖一场梦，同众人结下一段江湖缘",
    "public_story": "写一些短打，会点舞蹈",
    "raw_story": "写一些短打，会点舞蹈",
    "tags": "学生、希为、旧册迁移",
    "companion_expectation": "汉服出行",
    "legacy_contact": "wxid_p7v6altc61y722 94152700237/无 2291358245 15671822198",
    "joined_at": "2026-04-23T13:13:56.724646+00:00"
  },
  {
    "member_code": "问云-云-013",
    "generation_name": "云",
    "roster_serial": 13,
    "short_account": "013",
    "initial_password": "1988",
    "dao_name": "云百川",
    "jianghu_name": "〖遁隐妖帝·白百川〗",
    "real_name": "白百川",
    "gender": "男",
    "member_role": "烟雨行客",
    "public_region": "金陵",
    "raw_region": "金陵",
    "motto": "山涧饮酒，清风徐来；\n闲云野鹤，朗呼快哉！",
    "public_story": "写作",
    "raw_story": "写作",
    "tags": "作家、希为、旧册迁移",
    "companion_expectation": "诗词唱和、茶会雅集",
    "legacy_contact": "15895927888 小红书157988068 286265975 15895927888",
    "joined_at": "2026-04-23T13:18:04.235917+00:00"
  },
  {
    "member_code": "问云-云-014",
    "generation_name": "云",
    "roster_serial": 14,
    "short_account": "014",
    "initial_password": "2003",
    "dao_name": "云岚照",
    "jianghu_name": "淳林",
    "real_name": "刘嘉辉",
    "gender": "女",
    "member_role": "烟雨行客",
    "public_region": "青岛",
    "raw_region": "青岛",
    "motto": "想在这喧嚣繁杂、步履匆匆的人间剧本里，\n悄悄喘口气，远离耳语与算计，只留简单、坦荡与真诚。",
    "public_story": "创作和协调能力",
    "raw_story": "创作和协调能力",
    "tags": "销售、自行登门、旧册迁移",
    "companion_expectation": "喜欢研究各种好玩的小物件，享受无事烦恼的惬意～",
    "legacy_contact": "H18561739386 951209955 1243404717 18954832637",
    "joined_at": "2026-04-23T23:24:53.386164+00:00"
  },
  {
    "member_code": "问云-云-015",
    "generation_name": "云",
    "roster_serial": 15,
    "short_account": "015",
    "initial_password": "2003",
    "dao_name": "云玄",
    "jianghu_name": "魔帝",
    "real_name": "王鑫",
    "gender": "男",
    "member_role": "烟雨行客",
    "public_region": "台州",
    "raw_region": "台州",
    "motto": "自由自在，无愧于心，法向天地",
    "public_story": "琴棋书画",
    "raw_story": "琴棋书画",
    "tags": "工程师、自行登门、旧册迁移",
    "companion_expectation": "诗歌雅颂",
    "legacy_contact": "J-ln123 63091318452 3578700993 13606887953",
    "joined_at": "2026-04-23T23:26:57.999444+00:00"
  },
  {
    "member_code": "问云-云-016",
    "generation_name": "云",
    "roster_serial": 16,
    "short_account": "016",
    "initial_password": "1999",
    "dao_name": "云松柏",
    "jianghu_name": "山间松柏",
    "real_name": "小林",
    "gender": "男",
    "member_role": "烟雨行客",
    "public_region": "武汉",
    "raw_region": "武汉",
    "motto": "希望可以和大家一起交流探讨。我自己也是道教的，然后也可以给大家分享传播一些道教的基础啊这些。",
    "public_story": "摄影剪辑",
    "raw_story": "摄影剪辑",
    "tags": "法律工作者、自行登门、旧册迁移",
    "companion_expectation": "爬山徒步，饮酒作诗，桌游交友",
    "legacy_contact": "18802726192 18802726192 无 无",
    "joined_at": "2026-04-23T23:28:46.250953+00:00"
  },
  {
    "member_code": "问云-云-017",
    "generation_name": "云",
    "roster_serial": 17,
    "short_account": "017",
    "initial_password": "1992",
    "dao_name": "云枢衡",
    "jianghu_name": "枢衡山人",
    "real_name": "孙伟航",
    "gender": "男",
    "member_role": "烟雨行客",
    "public_region": "上海",
    "raw_region": "上海",
    "motto": "随缘",
    "public_story": "武术技击，书法，编程",
    "raw_story": "武术技击，书法，编程",
    "tags": "算法工程师、自行登门",
    "companion_expectation": "武术交流，书法交流，骑行",
    "legacy_contact": "807655723 807655723 807655723 无",
    "joined_at": "2026-04-24T04:38:57.860846+00:00"
  },
  {
    "member_code": "问云-云-018",
    "generation_name": "云",
    "roster_serial": 18,
    "short_account": "018",
    "initial_password": "2009",
    "dao_name": "云玄守",
    "jianghu_name": "卫玄",
    "real_name": "刘季沣",
    "gender": "男",
    "member_role": "烟雨行客",
    "public_region": "韶关",
    "raw_region": "韶关",
    "motto": "避尘烦事，寻内心空明",
    "public_story": "无所长",
    "raw_story": "无所长",
    "tags": "学生、自行登门、旧册迁移",
    "companion_expectation": "诗歌",
    "legacy_contact": "lxr08110911 1008844061 1690931240 13640001916",
    "joined_at": "2026-04-24T12:36:52.375013+00:00"
  },
  {
    "member_code": "问云-云-019",
    "generation_name": "云",
    "roster_serial": 19,
    "short_account": "019",
    "initial_password": "2000",
    "dao_name": "云栖汐",
    "jianghu_name": "栖汐",
    "real_name": "王琳",
    "gender": "女",
    "member_role": "烟雨行客",
    "public_region": "成都",
    "raw_region": "成都",
    "motto": "心静安处，自在安宁",
    "public_story": "无",
    "raw_story": "无",
    "tags": "无业、希为、旧册迁移",
    "companion_expectation": "无",
    "legacy_contact": "w258963L741 5537975361 3451436636 16659673971",
    "joined_at": "2026-04-24T15:38:52.438815+00:00"
  },
  {
    "member_code": "问云-云-020",
    "generation_name": "云",
    "roster_serial": 20,
    "short_account": "020",
    "initial_password": "2013",
    "dao_name": "云宁柔",
    "jianghu_name": "宁稠",
    "real_name": "宁稠",
    "gender": "女",
    "member_role": "烟雨行客",
    "public_region": "上海",
    "raw_region": "上海",
    "motto": "怎么样都可以",
    "public_story": "书法",
    "raw_story": "书法",
    "tags": "学生、自行登门、旧册迁移",
    "companion_expectation": "汉服出行",
    "legacy_contact": "Liu_qinyue 17891982310 无 无",
    "joined_at": "2026-04-24T16:09:03.987531+00:00"
  },
  {
    "member_code": "问云-云-021",
    "generation_name": "云",
    "roster_serial": 21,
    "short_account": "021",
    "initial_password": "2010",
    "dao_name": "云漓谙",
    "jianghu_name": "白漓谙",
    "real_name": "谢怡然",
    "gender": "女",
    "member_role": "烟雨行客",
    "public_region": "河南",
    "raw_region": "河南",
    "motto": "相遇即是缘分",
    "public_story": "唱歌",
    "raw_story": "唱歌",
    "tags": "学生、自行登门、旧册迁移",
    "companion_expectation": "喜欢唐诗宋词",
    "legacy_contact": "wxid_cuc0iszn6y2o22 1112351972 317852609 无",
    "joined_at": "2026-04-25T02:38:12.967373+00:00"
  },
  {
    "member_code": "问云-云-022",
    "generation_name": "云",
    "roster_serial": 22,
    "short_account": "022",
    "initial_password": "022",
    "dao_name": "云静观",
    "jianghu_name": "静观",
    "real_name": "刘威",
    "gender": "男",
    "member_role": "烟雨行客",
    "public_region": "云深不知处",
    "raw_region": "云深不知处",
    "motto": "祸福无门，惟人自召； 善恶之报，如影随形。",
    "public_story": "一个爱好玄学研究命理学的爱好者，希望在此处找到一方净土。",
    "raw_story": "一个爱好玄学研究命理学的爱好者，希望在此处找到一方净土。",
    "tags": "命理爱好者、玄学",
    "companion_expectation": "真诚，友善，互爱。",
    "legacy_contact": "zwzxmxwq",
    "joined_at": "2026-04-25T04:25:36.739+00:00"
  },
  {
    "member_code": "问云-云-023",
    "generation_name": "云",
    "roster_serial": 23,
    "short_account": "023",
    "initial_password": "023",
    "dao_name": "云瑶",
    "jianghu_name": "瑶池仙",
    "real_name": "赵米瑤",
    "gender": "女",
    "member_role": "执剑游侠",
    "public_region": "山东菏泽",
    "raw_region": "山东菏泽",
    "motto": "被人坑过来的",
    "public_story": "性格开朗，但是有点社恐",
    "raw_story": "性格开朗，但是有点社恐",
    "tags": "绘图",
    "companion_expectation": "热情，能够陪我聊天玩",
    "legacy_contact": "Y18063299539",
    "joined_at": "2026-04-25T06:45:35.012+00:00"
  },
  {
    "member_code": "问云-云-024",
    "generation_name": "云",
    "roster_serial": 24,
    "short_account": "024",
    "initial_password": "024",
    "dao_name": "云砚秋",
    "jianghu_name": "砚秋禾",
    "real_name": "石沂泽",
    "gender": "男",
    "member_role": "烟雨行客",
    "public_region": "云深不知处",
    "raw_region": "河南平顶山",
    "motto": "言念君子，温其如玉",
    "public_story": "一个热爱东玄和武术的普通人",
    "raw_story": "一个热爱东玄和武术的普通人",
    "tags": "整活",
    "companion_expectation": "一起探讨爱好互相学习",
    "legacy_contact": "无",
    "joined_at": "2026-04-25T07:35:52.882+00:00"
  },
  {
    "member_code": "问云-云-025",
    "generation_name": "云",
    "roster_serial": 25,
    "short_account": "025",
    "initial_password": "025",
    "dao_name": "云白落",
    "jianghu_name": "白落",
    "real_name": "薛诗彤",
    "gender": "女",
    "member_role": "烟雨行客",
    "public_region": "云深不知处",
    "raw_region": "山西运城",
    "motto": "极尽逍遥之际，便是孤绝命定之时",
    "public_story": "此位同门选择把故事藏进云雾里。",
    "raw_story": "秘",
    "tags": "陪伴、配音、写文、整活、策划、算命",
    "companion_expectation": "所有不高兴的事情不要埋在心里，将痛苦都告诉我兴许你会高兴点",
    "legacy_contact": "tbmmlove",
    "joined_at": "2026-04-25T08:15:33.039+00:00"
  },
  {
    "member_code": "问云-云-026",
    "generation_name": "云",
    "roster_serial": 26,
    "short_account": "026",
    "initial_password": "026",
    "dao_name": "云无妄",
    "jianghu_name": "无妄",
    "real_name": "张健",
    "gender": "男",
    "member_role": "执剑游侠",
    "public_region": "四川",
    "raw_region": "四川",
    "motto": "一个话很多的高冷侠客",
    "public_story": "搞笑",
    "raw_story": "搞笑",
    "tags": "写文、整活、配音、陪伴",
    "companion_expectation": "唱歌，写小说，有点迷信",
    "legacy_contact": "17738993791",
    "joined_at": "2026-04-25T16:27:20.586+00:00"
  },
  {
    "member_code": "问云-云-027",
    "generation_name": "云",
    "roster_serial": 27,
    "short_account": "027",
    "initial_password": "027",
    "dao_name": "云修竹",
    "jianghu_name": "王修竹",
    "real_name": "王茂林",
    "gender": "男",
    "member_role": "执剑游侠",
    "public_region": "云深不知处",
    "raw_region": "山东聊城",
    "motto": "万人来朝",
    "public_story": "此位同门选择把故事藏进云雾里。",
    "raw_story": "我比较随和一些",
    "tags": "写文、剪辑、配音、策划",
    "companion_expectation": "愿在云海中多认几位同道，一起做些有趣之事。",
    "legacy_contact": "15063555984/2730501763",
    "joined_at": "2026-04-26T04:26:49.888+00:00"
  },
  {
    "member_code": "问云-云-028",
    "generation_name": "云",
    "roster_serial": 28,
    "short_account": "028",
    "initial_password": "028",
    "dao_name": "云秋白",
    "jianghu_name": "秋燕白",
    "real_name": "阿力牛子",
    "gender": "男",
    "member_role": "执剑游侠",
    "public_region": "四川凉山",
    "raw_region": "四川凉山",
    "motto": "静而不争远是非",
    "public_story": "性格活泼开朗，喜欢诗词歌赋",
    "raw_story": "性格活泼开朗，喜欢诗词歌赋",
    "tags": "写文、陪伴、摄影",
    "companion_expectation": "希望遇到志向相同，情趣相同的好友，爱好聊的来的",
    "legacy_contact": "17608343847",
    "joined_at": "2026-04-26T04:38:40.958+00:00"
  },
  {
    "member_code": "问云-云-029",
    "generation_name": "云",
    "roster_serial": 29,
    "short_account": "029",
    "initial_password": "029",
    "dao_name": "云清悦",
    "jianghu_name": "惊鸿影",
    "real_name": "廖崇郦",
    "gender": "女",
    "member_role": "烟雨行客",
    "public_region": "贵州贵阳",
    "raw_region": "贵州贵阳",
    "motto": "人间的一个过客",
    "public_story": "一个悲催的学生党啊，上线时间有点飘忽，三次比较幸福但有小烦恼，有些事情不能和家人或者朋友交流，来网上寻找伙伴，性格有点跳脱不稳定，可能有点中二，问题会有点多，喜欢搞oc",
    "raw_story": "一个悲催的学生党啊，上线时间有点飘忽，三次比较幸福但有小烦恼，有些事情不能和家人或者朋友交流，来网上寻找伙伴，性格有点跳脱不稳定，可能有点中二，问题会有点多，喜欢搞oc",
    "tags": "写文、陪伴、策划",
    "companion_expectation": "希望可以遇见志同道合的朋友，大家一起聊天，热热闹闹的，但话多话少不太稳定",
    "legacy_contact": "微信：wxid_5l6ag1cl7xam22 QQ：3840558400",
    "joined_at": "2026-04-27T15:30:30.759+00:00"
  }
]
$legacy$::jsonb) loop
    -- 这里准备编号账号，前端会把 001 转成 001@wenyun.local 登录。
    short_account := item->>'short_account';
    login_email := short_account || '@wenyun.local';
    login_password := coalesce(nullif(item->>'initial_password', ''), short_account);

    -- 这里优先复用已有账号，避免重复执行脚本时产生多个用户。
    select id into target_user_id
    from auth.users
    where email = login_email
    limit 1;

    if target_user_id is null then
      target_user_id := gen_random_uuid();

      insert into auth.users (
        id,
        instance_id,
        aud,
        role,
        email,
        encrypted_password,
        email_confirmed_at,
        last_sign_in_at,
        raw_app_meta_data,
        raw_user_meta_data,
        confirmation_token,
        recovery_token,
        email_change,
        email_change_token_new,
        email_change_token_current,
        phone_change,
        phone_change_token,
        reauthentication_token,
        created_at,
        updated_at
      )
      values (
        target_user_id,
        '00000000-0000-0000-0000-000000000000',
        'authenticated',
        'authenticated',
        login_email,
        crypt(login_password, gen_salt('bf')),
        now(),
        now(),
        jsonb_build_object('provider', 'email', 'providers', array['email']),
        jsonb_build_object(
          'nickname', item->>'dao_name',
          'short_account', short_account,
          'member_code', item->>'member_code',
          'imported_from', 'yunqi_roster'
        ),
        '',
        '',
        '',
        '',
        '',
        '',
        '',
        '',
        coalesce((item->>'joined_at')::timestamptz, now()),
        now()
      );
    else
      -- 这里重复执行时会刷新旧账号密码，保证年份和编号规则保持一致。
      update auth.users
      set encrypted_password = crypt(login_password, gen_salt('bf')),
          email_confirmed_at = coalesce(email_confirmed_at, now()),
          confirmation_token = coalesce(confirmation_token, ''),
          recovery_token = coalesce(recovery_token, ''),
          email_change = coalesce(email_change, ''),
          email_change_token_new = coalesce(email_change_token_new, ''),
          email_change_token_current = coalesce(email_change_token_current, ''),
          phone_change = coalesce(phone_change, ''),
          phone_change_token = coalesce(phone_change_token, ''),
          reauthentication_token = coalesce(reauthentication_token, ''),
          raw_user_meta_data = coalesce(raw_user_meta_data, '{}'::jsonb) || jsonb_build_object(
            'nickname', item->>'dao_name',
            'short_account', short_account,
            'member_code', item->>'member_code',
            'imported_from', 'yunqi_roster'
          ),
          updated_at = now()
      where id = target_user_id;
    end if;

    -- 这里补齐 email 身份记录，让 Supabase Auth 能识别密码登录。
    begin
      insert into auth.identities (
        id,
        user_id,
        identity_data,
        provider,
        provider_id,
        last_sign_in_at,
        created_at,
        updated_at
      )
      values (
        target_user_id,
        target_user_id,
        jsonb_build_object('sub', target_user_id::text, 'email', login_email, 'email_verified', true, 'phone_verified', false),
        'email',
        login_email,
        now(),
        now(),
        now()
      )
      on conflict (provider, provider_id) do update
      set user_id = excluded.user_id,
          identity_data = excluded.identity_data,
          updated_at = now();
    exception
      when undefined_column then
        -- 这里兼容少数旧版 Supabase 身份表没有 provider_id 字段的情况。
        insert into auth.identities (id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
        values (target_user_id, target_user_id, jsonb_build_object('sub', target_user_id::text, 'email', login_email), 'email', now(), now(), now())
        on conflict do nothing;
    end;

    -- 这里写入或更新用户资料，角色仍为普通成员，不会获得后台权限。
    insert into public.profiles (id, nickname, role, city, bio, is_public, created_at, updated_at)
    values (
      target_user_id,
      item->>'dao_name',
      'member',
      nullif(item->>'public_region', ''),
      nullif(item->>'motto', ''),
      true,
      coalesce((item->>'joined_at')::timestamptz, now()),
      now()
    )
    on conflict (id) do update
    set nickname = excluded.nickname,
        city = excluded.city,
        bio = excluded.bio,
        is_public = true,
        updated_at = now();

    -- 这里优先按旧入册编号复用已有名帖。
    select id into target_application_id
    from public.join_applications
    where member_code = item->>'member_code'
    limit 1;

    if target_application_id is null then
      insert into public.join_applications (
        user_id,
        nickname,
        jianghu_name,
        real_name,
        wechat_id,
        age_range,
        gender,
        city,
        reason,
        accept_rules,
        offline_interest,
        remark,
        member_role,
        generation_name,
        member_code,
        roster_serial,
        public_region,
        raw_region,
        motto,
        public_story,
        raw_story,
        tags,
        companion_expectation,
        legacy_contact,
        joined_at,
        status,
        admin_note,
        reviewed_at,
        created_at
      )
      values (
        target_user_id,
        item->>'dao_name',
        nullif(item->>'jianghu_name', ''),
        nullif(item->>'real_name', ''),
        coalesce(nullif(item->>'legacy_contact', ''), short_account),
        null,
        item->>'gender',
        nullif(item->>'public_region', ''),
        coalesce(nullif(item->>'motto', ''), '旧名册导入'),
        true,
        null,
        null,
        item->>'member_role',
        item->>'generation_name',
        item->>'member_code',
        (item->>'roster_serial')::integer,
        nullif(item->>'public_region', ''),
        nullif(item->>'raw_region', ''),
        nullif(item->>'motto', ''),
        nullif(item->>'public_story', ''),
        nullif(item->>'raw_story', ''),
        nullif(item->>'tags', ''),
        nullif(item->>'companion_expectation', ''),
        nullif(item->>'legacy_contact', ''),
        coalesce((item->>'joined_at')::timestamptz, now()),
        'approved',
        '旧名册导入，已绑定历史编号。',
        coalesce((item->>'joined_at')::timestamptz, now()),
        coalesce((item->>'joined_at')::timestamptz, now())
      );
    else
      update public.join_applications
      set user_id = target_user_id,
          nickname = item->>'dao_name',
          jianghu_name = nullif(item->>'jianghu_name', ''),
          real_name = nullif(item->>'real_name', ''),
          wechat_id = coalesce(nullif(item->>'legacy_contact', ''), short_account),
          age_range = null,
          gender = item->>'gender',
          city = nullif(item->>'public_region', ''),
          reason = coalesce(nullif(item->>'motto', ''), '旧名册导入'),
          accept_rules = true,
          offline_interest = null,
          remark = null,
          member_role = item->>'member_role',
          generation_name = item->>'generation_name',
          roster_serial = (item->>'roster_serial')::integer,
          public_region = nullif(item->>'public_region', ''),
          raw_region = nullif(item->>'raw_region', ''),
          motto = nullif(item->>'motto', ''),
          public_story = nullif(item->>'public_story', ''),
          raw_story = nullif(item->>'raw_story', ''),
          tags = nullif(item->>'tags', ''),
          companion_expectation = nullif(item->>'companion_expectation', ''),
          legacy_contact = nullif(item->>'legacy_contact', ''),
          joined_at = coalesce((item->>'joined_at')::timestamptz, now()),
          status = 'approved',
          admin_note = '旧名册导入，已绑定历史编号。',
          reviewed_at = coalesce((item->>'joined_at')::timestamptz, now())
      where id = target_application_id;
    end if;
  end loop;
end;
$$;

-- 校验导入结果：应返回 29。
select count(*) as imported_roster_count
from public.join_applications
where member_code like '问云-云-%';


