# 问云派官网

## 项目介绍

问云派官网是一座“线上山门”，用于展示问云派愿景、立派金典、问云名册、云灯留言、门派公告、问云雅集、联系山门、问云小院与后台管理。

网站核心气质是：清雅江湖、温暖港湾、来去自由、有界有礼。

## 环境要求

1. 操作系统：Windows 10 或 Windows 11。
2. Node.js：建议 `22.0.0` 或更高版本，本机已验证 `25.8.0` 可运行。
3. npm：建议 `10.0.0` 或更高版本，本机已验证 `11.11.0` 可运行。
4. 浏览器：最新版 Edge、Chrome 或其他现代浏览器。
5. 数据库：Supabase 项目一个，用于真实登录、问云小院、名册登记、云灯留言、公告、活动和后台管理。
6. 邮件提醒：Supabase Edge Function 一个，使用 SMTP 密钥发送小院状态提醒邮件。

本项目依赖已在 `package.json` 中锁定版本：

| 依赖 | 版本 | 用途 |
| --- | --- | --- |
| `react` | `19.2.5` | 页面组件 |
| `vite` | `8.0.10` | 本地开发与打包 |
| `typescript` | `6.0.3` | 类型检查 |
| `tailwindcss` | `4.2.4` | 页面样式 |
| `framer-motion` | `12.38.0` | 页面动效 |
| `lucide-react` | `1.11.0` | 图标 |
| `react-router-dom` | `7.14.2` | 页面路由 |
| `@supabase/supabase-js` | `2.105.0` | 连接 Supabase |
| `vitest` | `4.1.5` | 自动测试 |

Supabase Edge Function 内使用 `nodemailer@7.0.10` 发送 SMTP 邮件，该依赖写在函数文件的 `npm:` 导入中，不需要安装到前端依赖里。

## 安装部署教程

### 一、本地运行

1. 打开 PowerShell。
2. 进入项目目录：

```powershell
cd "C:\Users\lanshiy\Documents\小亦伟大工程\wypgw"
```

3. 安装依赖：

```powershell
npm install
```

4. 启动本地开发服务：

```powershell
npm run dev
```

5. 浏览器打开终端里显示的地址，当前固定为：

```text
http://localhost:5176/
```

未配置 Supabase 时，前台会显示演示数据，方便先看页面效果。

### 二、配置 Supabase 数据库

1. 打开 Supabase 官网并创建新项目。
2. 进入项目的 SQL 编辑器。
3. 先打开本项目初始化文件：

```text
supabase/migrations/20260428090000_init_wenyunpai.sql
```

4. 复制全部 SQL 内容到 Supabase SQL 编辑器。
5. 执行 SQL，创建数据表、索引、触发器和 RLS 权限。
6. 再打开名册升级文件：

```text
supabase/migrations/20260428110000_wenyun_roster.sql
```

7. 复制全部 SQL 内容到 Supabase SQL 编辑器并执行，创建性别、身份、辈分字、编号、公开名册视图和自动编号触发器。
8. 再打开名册字段升级文件：

```text
supabase/migrations/20260428125300_roster_names_and_review.sql
```

9. 复制全部 SQL 内容到 Supabase SQL 编辑器并执行，新增江湖名、真实姓名、暂存、已退派等名册字段与筛选状态，并移除性别里的“不公开”选项。
10. 再打开问云小院升级文件：

```text
supabase/migrations/20260428133000_wenyun_yard_and_notifications.sql
```

11. 复制全部 SQL 内容到 Supabase SQL 编辑器并执行，新增登录用户归属、站内提醒、活动报名状态提醒和问云小院 RLS 权限。
12. 再打开 SMTP 设置升级文件：

```text
supabase/migrations/20260428144500_admin_smtp_settings.sql
```

13. 复制全部 SQL 内容到 Supabase SQL 编辑器并执行，新增管理员专用 SMTP 设置表。
14. 如果你之前在没有登录系统时创建过名册或云灯测试数据，先打开清空脚本：

```text
supabase/clear_roster_lantern_test_data.sql
```

15. 复制全部 SQL 内容到 Supabase SQL 编辑器并执行，清空旧测试名册、旧测试云灯和对应站内提醒。这个脚本不会删除管理员账号、用户资料、公告、活动、站点设置和 SMTP 设置。
16. 如果需要同步旧名册，再打开旧名册导入文件：

```text
supabase/migrations/20260428173000_import_yunqi_legacy_roster.sql
```

17. 复制全部 SQL 内容到 Supabase SQL 编辑器并执行，导入 29 条旧名册记录，并创建编号登录账号。导入不会包含“热度、推荐等级、更新时间、公开链接标识”。
18. 旧名册同门登录规则：账号为三位短编号，例如 `001`；密码优先使用出生年份，例如 `2003`；如果没有年份，密码就是编号本身，例如 `022`。其中 `001` 已绑定到 `3199912548@qq.com` 超级管理员账号，使用 `001` 登录时请输入该邮箱账号当前密码。
19. 如果你之前已经执行过旧名册导入脚本，并且编号登录时报 `Database error querying schema`，请再执行一次修复脚本：

```text
supabase/fix_legacy_roster_auth_accounts.sql
```

20. 如果你之前导入后页面仍显示“云栖”编号，或者数据库里还有“封面、羁绊状态”两个废弃字段，请执行名册清理脚本：

```text
supabase/remove_roster_cover_bond_and_rename_codes.sql
```

21. 如果需要修复旧编号账号绑定真实邮箱失败的问题，请执行邮箱直绑函数脚本：

```text
supabase/migrations/20260428230500_bind_legacy_account_email.sql
```

22. 如果需要启用执事管理，并把 `3199912548@qq.com` 设为超级管理员，请执行执事管理脚本：

```text
supabase/migrations/20260428231500_steward_management.sql
```

23. 如果需要把 `3199912548@qq.com` 绑定到 001 编号，请执行一次性绑定脚本：

```text
supabase/bind_admin_3199912548_to_001.sql
```

24. 如果执行后执事管理仍显示权限不足，请执行超级管理员权限修复脚本，然后退出网站账号并重新登录：

```text
supabase/fix_3199912548_founder_access.sql
```

25. 在 Supabase 项目设置中找到项目地址和公开匿名密钥。
26. 在项目根目录新建 `.env.local` 文件：

```env
VITE_SUPABASE_URL=你的 Supabase 项目地址
VITE_SUPABASE_ANON_KEY=你的 Supabase 公开匿名密钥
```

23. 重新启动本地服务：

```powershell
npm run dev
```

注意：不要把 `service_role` 密钥放进前端项目，也不要提交到 Git 仓库。

### 三、关闭 Supabase 邮箱确认和安全邮箱变更

1. 打开 Supabase 项目后台。
2. 进入 `Authentication` → `Sign In / Providers`。
3. 找到邮箱登录相关设置。
4. 关闭邮箱确认，让用户使用邮箱和密码注册后可以直接登录问云小院。
5. 关闭安全邮箱变更，让旧编号账号绑定真实邮箱时不需要旧内部邮箱确认。
6. 保存设置。

注意：本项目按“邮箱 + 密码直接注册登录”和“旧编号账号可绑定真实邮箱”设计。如果没有关闭邮箱确认，Supabase 仍会提示邮箱未确认，导致 `/login` 无法直接进入 `/yard`；如果没有关闭安全邮箱变更，旧编号账号绑定真实邮箱时可能会要求确认旧内部邮箱，用户无法收到这封邮件。

### 四、配置 Supabase 登录回跳地址

1. 打开 Supabase 项目后台。
2. 进入 `Authentication` → `URL Configuration`。
3. 把 `Site URL` 改成你的 GitHub Pages 真实首页地址。

如果你的地址栏显示的是：

```text
https://lsy5920.github.io/
```

就填写：

```text
https://lsy5920.github.io/
```

如果你的网站是仓库子路径，例如：

```text
https://你的用户名.github.io/仓库名/
```

就填写完整子路径地址。

4. 在 `Redirect URLs` 里添加你的线上地址，建议至少添加：

```text
https://lsy5920.github.io/*
```

如果你是仓库子路径部署，再额外添加：

```text
https://你的用户名.github.io/仓库名/*
```

5. 保存设置。虽然当前关闭了邮箱确认，但保留正确回跳地址可以方便后续扩展找回密码、邮箱变更等功能。

### 五、配置小院邮件提醒

1. 安装 Supabase CLI。
2. 在 PowerShell 中登录 Supabase：

```powershell
supabase login
```

3. 关联你的 Supabase 项目：

```powershell
supabase link --project-ref 你的项目引用
```

4. 首次部署函数时可以设置 SMTP 密钥作为兜底配置。下面示例使用 QQ 邮箱 SMTP，请把占位内容换成你自己的邮箱和授权码，不要写进代码仓库：

```powershell
supabase secrets set SMTP_HOST=smtp.qq.com
supabase secrets set SMTP_PORT=465
supabase secrets set SMTP_USER=你的邮箱
supabase secrets set SMTP_PASS=你的邮箱授权码
supabase secrets set SMTP_FROM=你的邮箱
```

5. 部署 Edge Function：

```powershell
supabase functions deploy send-user-notice
```

6. 邮件提醒触发位置：

```text
管理员审核名帖状态
管理员审核云灯状态
管理员调整活动报名状态
用户报名或取消雅集
```

注意：邮件发送失败不会影响审核或报名，失败原因会写入问云小院的消息提醒里。

也可以不使用 Supabase Secrets，在管理后台设置 SMTP 服务：

1. 登录掌门或执事账号。
2. 打开 `/admin/settings`。
3. 在“SMTP 邮件服务”里填写 SMTP 主机、端口、账号、授权码、发件人。
4. 勾选“启用后台 SMTP 配置”。
5. 保存后，`send-user-notice` 会优先使用后台 SMTP 设置；后台未启用时才使用 Supabase Secrets。

### 六、初始化管理员

1. 打开 `/login` 页面。
2. 使用邮箱和密码注册一个账号。
3. 回到 Supabase SQL 编辑器，把下面语句里的邮箱改成你的管理员邮箱：

```sql
update public.profiles
set role = 'founder'
where id = (select id from auth.users where email = '你的邮箱@example.com');
```

4. 回到官网 `/login` 登录。
5. 登录成功后所有账号都会进入 `/yard` 问云小院；掌门或执事会在小院里看到“进入管理后台”入口，也可以直接打开 `/admin`。

如果你之前已经开启邮箱确认并注册过账号，导致登录仍被拦住，可以执行项目里的 `supabase/admin_confirm_founder.sql` 手动确认管理员邮箱并提权。

角色说明：

| 角色 | 含义 |
| --- | --- |
| `founder` | 掌门，拥有后台管理权限 |
| `admin` | 执事，拥有后台管理权限 |
| `member` | 普通同门，可进入问云小院，不能进入管理后台 |

### 七、部署到 GitHub Pages

1. 把代码推送到 GitHub 的 `main` 分支。
2. 打开仓库设置里的 Pages 功能。
3. 部署来源选择 GitHub Actions。
4. 打开仓库的 `Settings` → `Secrets and variables` → `Actions`，在仓库密钥中添加：

```text
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
```

也兼容下面这组简短名称，但优先推荐上面的 `VITE_` 名称：

```text
SUPABASE_URL
SUPABASE_ANON_KEY
```

注意：电脑里的 `.env.local` 只对本地运行生效，不会自动上传到 GitHub。部署到 GitHub Pages 时，必须在 GitHub 仓库里单独添加上面的仓库密钥或仓库变量。

5. 推送代码后，`.github/workflows/deploy.yml` 会自动生成 `public/env.js` 线上配置，再构建并发布 `dist` 静态网站。
6. 如果刚添加密钥后页面仍提示未配置，请到 GitHub 的 `Actions` 页面重新运行最新一次部署。

部署后页面地址会使用 `/#/` 形式，例如：

```text
https://你的用户名.github.io/仓库名/#/
https://你的用户名.github.io/仓库名/#/canon
```

这样做是为了兼容 GitHub Pages 静态托管，避免刷新页面或打开子页面时误入 404。

## 使用教程

### 访问官网首页

打开 `/` 可以看到问云派山门首屏、门派精神、名册流程、云灯预览和公告入口。

### 阅读立派金典

打开 `/canon` 可以阅读完整《问云派立派金典》。页面左侧有章节目录，手机端可直接向下阅读。

### 使用问云名册

1. 打开 `/join`。
2. 在页面上方查看公开名册，名册展示道名、江湖名、编号、性别、身份、辈分字、公开地域、宣言、公开故事、标签、同行期待和入册时间。
3. 可用道名、江湖名或编号搜索，也可以按辈分字、性别和身份筛选名单。
4. 点击“问云小院”登录或注册账号。
5. 回到登记入口填写道名、江湖名、真实姓名、联系方式、公开地域、性别、身份、宣言、公开故事、标签和同行期待等内容。
6. 江湖名、公开地域、宣言和公开故事会进入公开名册；真实姓名和联系方式只给后台管理员核对。
7. 道名必须以“云”字开头，长度为 2 到 3 个字，例如“云初”“云灯”。
8. 勾选认同门规。
9. 点击“提交名册登记”。
10. 登记会进入后台待审核列表，系统会默认生成类似“问云-云-001”的编号。
11. 审核状态会回到你的问云小院消息提醒里。
12. 旧名册导入后，同门可用三位短编号登录；有出生年份时密码为年份，没有年份时密码为短编号本身。

注意：当前名册表单以旧名册字段为准，出生月份、线下雅集意愿、普通备注、封面和羁绊状态不会在前台登记入口或公开名册中展示。

### 点亮云灯

1. 打开 `/cloud-lantern`。
2. 先登录问云小院。
3. 填写留言内容。
4. 可选择匿名展示。
5. 提交后默认进入待审核状态。
6. 管理员审核通过后，留言会在前台公开展示。
7. 审核状态会回到你的问云小院消息提醒里。

### 进入问云小院

1. 打开 `/login`。
2. 使用邮箱和密码注册账号。
3. 注册或登录成功后会进入 `/yard` 问云小院，管理员账号也会保留自己的小院。
4. 问云小院包含小院总览、我的资料、我的名帖、我的云灯、我的雅集和消息提醒；掌门或执事还会看到进入管理后台的快捷入口。
5. 我的资料可以编辑昵称、城市、简介、头像地址和是否公开资料。
6. 我的资料里的“账号安全”可以绑定或更换真实邮箱，也可以修改登录密码。
7. 旧编号账号绑定邮箱后，可用真实邮箱和当前密码登录；修改密码后，下次登录使用新密码。
8. 我的名帖、我的云灯只展示状态和备注，不能直接修改审核结果。
9. 我的雅集可以报名或取消报名。
10. 消息提醒会展示站内通知和邮件发送状态。

### 报名问云雅集

1. 打开 `/events` 或 `/yard/events`。
2. 先登录问云小院。
3. 找到想参加的活动，填写报名备注。
4. 点击“报名雅集”。
5. 报名后可在问云小院查看状态，也可以取消报名。

### 管理后台

后台地址为 `/admin`，必须先通过 `/login` 登录管理员账号。普通用户访问 `/admin` 会自动回到 `/yard`，管理员也可以从问云小院一键进入后台。

后台包含：

1. 后台总览：查看待审核数量。
2. 名册管理：默认展示未审核名帖，可按道名、真实姓名、微信号搜索，可按未审核、已审核、全部、暂存、已退派筛选；列表先显示道名、申请时间、申请理由和当前状态，点击卡片后再展开详情编辑审核。
3. 云灯审核：通过或拒绝留言。
4. 公告管理：创建草稿或发布公告。
5. 活动管理：创建线上或线下雅集，查看活动报名并调整报名状态。
6. 执事管理：超级管理员可搜索成员，并将成员设置为执事或撤回普通成员；被设为执事后可以登录管理后台。
7. 站点设置：修改联系山门说明文字，维护 SMTP 邮件服务设置。

## 项目目录结构

```text
wypgw/
├─ public/
│  ├─ env.js                       # 线上 Supabase 公开配置占位文件，部署时会自动改写
│  ├─ wenyun-logo.png              # 门派正式 Logo
│  └─ wenyun-hero.png              # 首页山门主视觉
├─ src/
│  ├─ components/                  # 通用组件，如按钮、标题、导航、提示条
│  ├─ data/                        # 金典原文入口、导航配置、演示数据
│  ├─ hooks/                       # 登录状态和权限判断
│  ├─ layouts/                     # 前台布局、问云小院布局和后台布局
│  ├─ lib/                         # Supabase 客户端、类型、服务函数、校验函数
│  ├─ pages/                       # 前台页面
│  │  └─ admin/                    # 后台管理页面
│  │  └─ yard/                     # 问云小院用户后台页面
│  ├─ styles/                      # 全局样式和动画
│  ├─ tests/                       # 自动测试
│  ├─ App.tsx                      # 全站路由入口
│  └─ main.tsx                     # React 挂载入口
├─ supabase/
│  ├─ admin_confirm_founder.sql     # 收不到确认邮件时手动确认邮箱并提权
│  ├─ bind_admin_3199912548_to_001.sql # 将管理员邮箱绑定到 001 编号
│  ├─ clear_roster_lantern_test_data.sql # 清空旧测试名册、云灯和相关提醒
│  ├─ fix_3199912548_founder_access.sql # 修复超级管理员权限不足
│  ├─ fix_legacy_roster_auth_accounts.sql # 修复旧编号账号认证字段
│  ├─ remove_roster_cover_bond_and_rename_codes.sql # 移除名册废弃字段并统一问云编号
│  └─ migrations/                  # Supabase 初始化、升级和导入 SQL
│     ├─ 20260428090000_init_wenyunpai.sql          # 初始化基础表、权限和演示数据
│     ├─ 20260428110000_wenyun_roster.sql           # 升级问云名册、编号和公开视图
│     ├─ 20260428125300_roster_names_and_review.sql # 升级江湖名、真实姓名和名帖审核状态
│     ├─ 20260428133000_wenyun_yard_and_notifications.sql # 升级问云小院、用户归属和消息提醒
│     ├─ 20260428144500_admin_smtp_settings.sql     # 升级管理员 SMTP 邮件服务设置
│     ├─ 20260428173000_import_yunqi_legacy_roster.sql # 导入旧名册并创建编号账号
│     ├─ 20260428230500_bind_legacy_account_email.sql # 修复旧编号账号绑定真实邮箱
│     └─ 20260428231500_steward_management.sql # 新增超级管理员和执事管理函数
├─ supabase/functions/
│  └─ send-user-notice/             # 发送小院状态提醒邮件的 Edge Function
├─ 网站开发资料/
│  ├─ 立派金典.txt                 # 金典原文资料
│  └─ 网站设计文档.txt             # 设计需求资料
├─ .github/
│  └─ workflows/
│     └─ deploy.yml                # GitHub Pages 自动部署
├─ .env.example                    # 环境变量示例
├─ package.json                    # 依赖版本与脚本
├─ package-lock.json               # 依赖锁定文件
├─ vite.config.ts                  # Vite 配置
└─ README.md                       # 项目说明文档
```

## 常见问题排查

### 页面显示演示数据

原因：没有配置 `.env.local`，或 Supabase 地址、公开匿名密钥不正确。

解决方法：

1. 检查 `.env.local` 是否在项目根目录。
2. 检查 `VITE_SUPABASE_URL` 是否以 `https://` 开头。
3. 检查 `VITE_SUPABASE_ANON_KEY` 是否为 Supabase 的公开匿名密钥。
4. 修改后重新运行 `npm run dev`。

### GitHub Pages 部署后仍显示未配置 Supabase

原因：本地 `.env.local` 不会跟随代码部署，GitHub Actions 没有读取到仓库密钥或仓库变量。

解决方法：

1. 打开 GitHub 仓库的 `Settings` → `Secrets and variables` → `Actions`。
2. 在 `Repository secrets` 中添加 `VITE_SUPABASE_URL` 和 `VITE_SUPABASE_ANON_KEY`。
3. 如果你已经用了 `SUPABASE_URL` 和 `SUPABASE_ANON_KEY`，当前工作流也会兼容读取。
4. 回到 `Actions` 页面，重新运行最新部署。
5. 部署日志里看到“已写入线上 Supabase 公开配置。”就表示线上已拿到配置。
6. 浏览器强制刷新页面，地址建议使用 `https://你的用户名.github.io/仓库名/#/`。

### 后台提示没有权限

原因：账号已登录，但 `profiles.role` 不是 `admin` 或 `founder`。

解决方法：在 Supabase SQL 编辑器执行管理员初始化语句，把对应邮箱改为 `founder`。

### 登录提示邮箱还没有确认

原因：Supabase 开启了邮箱确认。本项目要求邮箱和密码直接注册登录，不走确认邮件流程，所以需要关闭邮箱确认。

解决方法：

1. 打开 Supabase 后台。
2. 进入 `Authentication` → `Sign In / Providers`。
3. 关闭邮箱确认。
4. 同时关闭安全邮箱变更，方便旧编号账号后续绑定真实邮箱。
5. 回到 `/login` 重新注册或登录。
6. 如果旧账号已经被确认流程卡住，可以在 Supabase SQL 编辑器执行：

```sql
update auth.users
set email_confirmed_at = now()
where email = '你的邮箱@example.com'
  and email_confirmed_at is null;
```

7. 管理员账号还需要检查 `public.profiles` 表里该用户的 `role` 是否为 `founder` 或 `admin`。

### 绑定邮箱后没有立即生效

可能原因：Supabase 仍然开启了邮箱确认或安全邮箱变更，系统需要确认新邮箱，甚至会要求确认旧邮箱。旧编号账号的旧邮箱是内部邮箱，用户无法收到旧邮箱确认邮件。也可能是没有执行邮箱直绑函数脚本。

解决方法：

1. 打开 Supabase 后台。
2. 进入 `Authentication` → `Sign In / Providers`。
3. 关闭邮箱确认。
4. 关闭安全邮箱变更。
5. 执行 `supabase/migrations/20260428230500_bind_legacy_account_email.sql`。
6. 回到 `/yard/profile` 重新绑定真实邮箱。

### 3199912548@qq.com 需要绑定 001 编号

原因：`3199912548@qq.com` 已经是独立管理员账号，不能再直接把 001 内部账号改成这个邮箱，否则会出现“邮箱已注册”的冲突。

解决方法：

1. 先确认旧名册已导入，数据库里存在 `问云-云-001`。
2. 执行 `supabase/migrations/20260428231500_steward_management.sql`，把 `3199912548@qq.com` 设为超级管理员。
3. 执行 `supabase/bind_admin_3199912548_to_001.sql`，把 001 名册归属转移到这个管理员账号。
4. 重新登录 `3199912548@qq.com`，进入问云小院和管理后台。

### 执事管理页面提示权限不足

可能原因：当前账号不是 `founder` 超级管理员，或者浏览器还停留在旧登录会话里，或者没有执行执事管理 SQL。

解决方法：

1. 执行 `supabase/migrations/20260428231500_steward_management.sql`。
2. 执行 `supabase/fix_3199912548_founder_access.sql`。
3. 确认执行结果里 `后台角色` 是 `founder`。
4. 在网站里退出后台。
5. 使用 `3199912548@qq.com` 或 `001` 重新登录后台。

### 问云小院进不去

可能原因：

1. 没有配置 Supabase。
2. 没有关闭邮箱确认。
3. 没有执行 `20260428133000_wenyun_yard_and_notifications.sql`。
4. `profiles` 表没有自动生成当前用户资料。

解决方法：

1. 确认 `.env.local` 或 GitHub Actions 密钥已经配置。
2. 确认 Supabase 已关闭邮箱确认。
3. 执行 `supabase/migrations/20260428133000_wenyun_yard_and_notifications.sql`。
4. 重新打开 `/login` 注册并登录。

### 旧编号账号登录失败

可能原因：

1. 没有执行旧名册导入脚本。
2. 输入的是完整编号但末尾数字不对，例如编号不是 `001` 到 `029`。
3. 密码填错：有出生年份的同门密码是年份，没有年份的同门密码是三位编号。
4. 前面没有先清空测试名册，导致旧编号或名册数据冲突。
5. 已经执行过旧版导入脚本，但旧编号账号的 Auth 令牌字段还是空值，Supabase 会报 `Database error querying schema`。

解决方法：

1. 先执行 `supabase/clear_roster_lantern_test_data.sql`。
2. 再执行 `supabase/migrations/20260428173000_import_yunqi_legacy_roster.sql`。
3. 如果之前已经导入过旧名册，直接执行 `supabase/fix_legacy_roster_auth_accounts.sql` 修复旧编号账号。
4. 登录时账号填写短编号，例如 `001`。
5. 密码优先填写出生年份；如果该同门没有年份，就填写短编号本身，例如 `022`。

### 小院邮件提醒发送失败

可能原因：

1. 没有部署 `send-user-notice` Edge Function。
2. 没有执行 `20260428144500_admin_smtp_settings.sql`。
3. 后台 SMTP 设置未启用，且没有配置 Supabase SMTP 密钥。
4. SMTP 授权码错误。
5. 邮箱服务商限制登录或发信。

解决方法：

1. 执行 `supabase functions deploy send-user-notice`。
2. 执行 `supabase/migrations/20260428144500_admin_smtp_settings.sql`。
3. 登录 `/admin/settings`，在“SMTP 邮件服务”里填写配置并启用。
4. 如果不想用后台配置，也可以在 Supabase Secrets 中配置 `SMTP_HOST`、`SMTP_PORT`、`SMTP_USER`、`SMTP_PASS`、`SMTP_FROM`。
5. QQ 邮箱通常使用 `SMTP_HOST=smtp.qq.com` 和 `SMTP_PORT=465`。
6. 不要把 SMTP 授权码写进前端代码、README 或 Git 仓库。
7. 到问云小院消息提醒里查看 `邮件状态` 和失败原因。

### 名册登记提交失败

可能原因：

1. Supabase SQL 没有执行完整。
2. RLS 策略没有创建成功。
3. 表单没有勾选认同门规。
4. 没有执行 `20260428110000_wenyun_roster.sql`，导致数据库缺少性别、身份、辈分字或编号字段。
5. 没有执行 `20260428125300_roster_names_and_review.sql`，导致数据库缺少江湖名、真实姓名、暂存或已退派字段规则。
6. 没有执行 `20260428133000_wenyun_yard_and_notifications.sql`，导致数据库缺少 `user_id` 或登录用户提交策略。
7. 没有先登录问云小院。
8. 道名没有以“云”字开头，或长度不是 2 到 3 个字。

解决方法：

1. 先执行 `supabase/migrations/20260428090000_init_wenyunpai.sql`。
2. 再执行 `supabase/migrations/20260428110000_wenyun_roster.sql`。
3. 再执行 `supabase/migrations/20260428125300_roster_names_and_review.sql`。
4. 最后执行 `supabase/migrations/20260428133000_wenyun_yard_and_notifications.sql`。
5. 确认 `join_applications` 表存在，并且有 `jianghu_name`、`real_name` 和 `user_id` 字段。
6. 确认 `roster_entries` 公开视图存在，并且公开字段里有 `jianghu_name`。
7. 确认已经登录问云小院。
8. 确认登记表单已勾选门规确认，且道名符合“云”字开头的规则。

### 执行名册升级脚本时报 member_code 改名失败

原因：旧版 `roster_entries` 公开视图里第三列是 `member_code`，新版需要新增 `jianghu_name`。PostgreSQL 不允许直接用 `create or replace view` 改变已有视图的列顺序，所以会提示无法把 `member_code` 改成 `jianghu_name`。

解决方法：

1. 使用最新的 `supabase/migrations/20260428125300_roster_names_and_review.sql`。
2. 重新复制整段脚本到 Supabase SQL 编辑器执行。
3. 最新脚本会先删除旧的 `roster_entries` 公开视图，再按新字段重建视图。
4. 如果之前执行到一半失败，直接重新执行最新脚本即可，前面的字段和约束语句都是可重复执行的。

### 云灯提交后前台看不到

这是正常设计。云灯默认是 `pending` 待审核，管理员在后台通过后才会公开。

### GitHub Pages 部署后页面资源丢失

本项目已把 Vite 的 `base` 设置为相对路径，一般不会丢资源。

如果仍然出错，请确认：

1. GitHub Pages 使用的是 GitHub Actions 部署。
2. Actions 已成功生成 `dist`。
3. 仓库密钥名称与文档一致。

### 运行构建时出现体积提醒

当前构建会生成完整前台和后台脚本，体积提醒不影响运行。

后续如果访问量变大，可以把后台页面改成按需加载，减少首屏脚本大小。

## 常用命令

```powershell
npm install
npm run dev
npm run lint
npm run test
npm run build
npm run preview
```

## 更新日志

2026-04-28 02:06 【初次发布】完成问云派官网第一版开发，包含多页面前台、入派申请、云灯留言、公告活动、后台管理、Supabase 初始化脚本、GitHub Pages 部署配置、门派 Logo 接入、完整中文 README 与基础测试。
2026-04-28 02:12 【优化】优化门派 Logo 与首页主视觉的资源路径，兼容 GitHub Pages 仓库子路径部署；补充本地开发日志忽略规则，不影响项目运行。
2026-04-28 02:14 【优化】将本地开发服务端口固定为 5176，更新 README 中的访问地址说明；已重新通过类型检查、自动测试和生产构建验证。
2026-04-28 02:22 【优化】将前台顶部导航调整为悬浮圆角导航栏，补充页面顶部间距与手机端悬浮菜单效果，避免导航与页面内容连在一起。
2026-04-28 08:21 【修复】修复 GitHub Pages 部署后因子路径路由被识别为未知页面而显示 404 的问题，将前端路由切换为静态托管更稳定的哈希路由，并补充部署访问说明。
2026-04-28 08:44 【修复】修复 GitHub Pages 部署后 Supabase 配置未被前端识别的问题，新增线上运行时配置文件生成流程，兼容仓库密钥与仓库变量，并补充线上未配置排查教程。
2026-04-28 09:34 【修复】修复管理员登录遇到 Supabase 邮箱未确认时只显示英文错误的问题，新增中文原因说明、确认邮件重发入口、邮箱确认回跳地址和相关自动测试，并补充 README 中的邮箱确认排查步骤。
2026-04-28 09:45 【修复】修复 Supabase 邮箱确认链接跳转到 localhost 导致手机无法打开的问题，将确认邮件回跳地址调整为线上站点根地址，并补充 Supabase URL Configuration 设置教程与旧邮件失效说明。
2026-04-28 10:48 【修复】补充 Supabase 确认邮件收不到时的手动处理方案，新增 admin_confirm_founder.sql 脚本用于确认管理员邮箱、补建资料并授予掌门权限，同时更新登录页提示和 README 排查说明。
2026-04-28 12:24 【优化】将入派页面升级为问云名册，新增公开名册展示、名册登记入口、道名校验、性别和出生月份字段、系统自动编号、后台名册直接编辑、Supabase 名册升级脚本和相关 README 说明。
2026-04-28 13:00 【优化】优化问云名册登记与审核流程，新增江湖名和真实姓名字段，移除性别“不公开”选项，前台支持按道名或江湖名搜索并按辈分字、性别筛选，后台名帖审核支持搜索筛选、小卡片展开编辑、暂存和已退派状态，并补充 Supabase 升级脚本与文档说明。
2026-04-28 13:08 【修复】修复 Supabase 名册升级脚本重建公开名册视图时报 member_code 改名失败的问题，改为先删除旧视图再创建新视图，并补充 README 排查说明。
2026-04-28 14:27 【新增】新增问云小院登录系统与用户后台，支持邮箱密码直接注册登录、普通用户进入小院、管理员进入后台；新增我的资料、我的名帖、我的云灯、我的雅集、消息提醒页面，名帖、云灯、活动报名改为登录后归属当前账号，并新增 Supabase 小院迁移脚本、SMTP 邮件提醒 Edge Function 和 README 配置教程。
2026-04-28 14:55 【新增】管理员后台站点设置新增 SMTP 邮件服务配置，可维护主机、端口、账号、发件人、授权码和启用状态；新增管理员专用 SMTP 设置表与 RLS 权限，邮件 Edge Function 优先读取后台配置，未启用时回退 Supabase Secrets，并同步更新 README 配置和排查说明。
2026-04-28 15:22 【优化】调整登录和小院权限流转，管理员登录后也会进入问云小院并保留个人用户后台，同时在问云小院和管理后台之间新增双向快捷入口，普通用户仍无法访问管理后台。
2026-04-28 18:30 【新增】新增旧测试名册和云灯清空 SQL，补充旧名册导入脚本、旧编号登录说明和 README 操作顺序；同步修复三位旧编号密码登录被前端拦截的问题，名册展示和登记说明改为以旧名册字段为准。
2026-04-28 18:39 【修复】修复旧编号账号登录时报 Supabase 认证库查询失败的问题，旧名册导入脚本补齐 Auth 令牌字段，并新增 fix_legacy_roster_auth_accounts.sql 用于修复已经导入过的编号账号；登录页同步改为中文可操作提示。
2026-04-28 21:01 【优化】移除名册前台、后台和小院里的封面与羁绊状态字段，不再公开展示登录短号；旧名册导入编号统一改为问云前缀，并新增 remove_roster_cover_bond_and_rename_codes.sql 用于修复线上已有数据。
2026-04-28 22:36 【修复】修复首页深色“门派精神”区块标题对比度不足、文字看不清的问题，区块标题组件新增深色背景显示模式，保证手机和桌面端都能清楚阅读。
2026-04-28 22:46 【新增】问云小院“我的资料”新增账号安全功能，支持用户绑定或更换真实邮箱、修改登录密码；补充 Supabase 关闭安全邮箱变更说明和绑定邮箱排查教程。
2026-04-28 23:10 【新增】删除前台手机端底部悬浮导航，修复旧编号账号绑定真实邮箱被 Supabase 内部邮箱拦截的问题；新增超级管理员和执事管理功能，支持将成员设为执事并进入管理后台，同时提供 3199912548@qq.com 绑定 001 编号的 SQL 脚本。
2026-04-28 23:35 【修复】修复执行执事管理 SQL 后仍提示权限不足时难以排查的问题，新增 Supabase 真实错误展示和 fix_3199912548_founder_access.sql 超级管理员权限修复脚本，并补充退出后重新登录说明。
