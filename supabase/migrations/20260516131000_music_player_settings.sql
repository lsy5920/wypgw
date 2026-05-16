-- 这个脚本确保前台音乐播放器设置保存到数据库的 site_settings 表中。
-- 执行后，后台“前台音乐”保存的歌单编号、链接、标题、歌词兜底文本和自动播放开关都会写入同一条 music_player 记录。

-- 这里确保站点设置表存在，旧项目漏执行初始化脚本时也能补齐基础结构。
create table if not exists public.site_settings (
  key text primary key,
  value jsonb not null,
  updated_by uuid references public.profiles(id),
  updated_at timestamptz not null default now()
);

-- 这里开启行级安全，避免匿名用户越权修改站点设置。
alter table public.site_settings enable row level security;

-- 这里补齐公开读取策略，让公开官网可以读取已保存的音乐设置。
drop policy if exists "公开可读站点设置" on public.site_settings;
create policy "公开可读站点设置"
on public.site_settings
for select
using (true);

-- 这里补齐管理员管理策略，让掌门和执事可以在后台保存音乐设置。
drop policy if exists "管理员可管理站点设置" on public.site_settings;
create policy "管理员可管理站点设置"
on public.site_settings
for all
using (public.is_wenyun_admin())
with check (public.is_wenyun_admin());

-- 这里新增默认音乐设置记录；如果已经保存过真实歌单，就不会覆盖现有内容。
insert into public.site_settings (key, value, updated_at)
values (
  'music_player',
  jsonb_build_object(
    'enabled', false,
    'playlist_id', '',
    'playlist_url', '',
    'title', '问云派山门歌单',
    'lyric_lines', '云水之间，愿心慢慢安定' || E'\n' || '灯火初上，照见归来的路' || E'\n' || '山门不急，风也不催人',
    'autoplay', false
  ),
  now()
)
on conflict (key) do nothing;
