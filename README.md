# 问云派官网

## 项目介绍

问云派官网是一座“线上山门”，用于展示问云派愿景、立派金典、入派申请、云灯留言、门派公告、问云雅集、联系山门与后台管理。

网站核心气质是：清雅江湖、温暖港湾、来去自由、有界有礼。

## 环境要求

1. 操作系统：Windows 10 或 Windows 11。
2. Node.js：建议 `22.0.0` 或更高版本，本机已验证 `25.8.0` 可运行。
3. npm：建议 `10.0.0` 或更高版本，本机已验证 `11.11.0` 可运行。
4. 浏览器：最新版 Edge、Chrome 或其他现代浏览器。
5. 数据库：Supabase 项目一个，用于真实入派申请、云灯留言、公告、活动和后台管理。

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
3. 打开本项目文件：

```text
supabase/migrations/20260428090000_init_wenyunpai.sql
```

4. 复制全部 SQL 内容到 Supabase SQL 编辑器。
5. 执行 SQL，创建数据表、索引、触发器和 RLS 权限。
6. 在 Supabase 项目设置中找到项目地址和公开匿名密钥。
7. 在项目根目录新建 `.env.local` 文件：

```env
VITE_SUPABASE_URL=你的 Supabase 项目地址
VITE_SUPABASE_ANON_KEY=你的 Supabase 公开匿名密钥
```

8. 重新启动本地服务：

```powershell
npm run dev
```

注意：不要把 `service_role` 密钥放进前端项目，也不要提交到 Git 仓库。

### 三、初始化管理员

1. 打开 `/login` 页面。
2. 使用邮箱和密码注册一个账号。
3. 如果 Supabase 要求邮箱验证，请先打开注册邮箱，点击 Supabase 发来的确认链接。
4. 如果页面提示“邮箱还没有确认”，可以在登录页点击“重发确认邮件”。
5. 回到 Supabase SQL 编辑器，把下面语句里的邮箱改成你的管理员邮箱：

```sql
update public.profiles
set role = 'founder'
where id = (select id from auth.users where email = '你的邮箱@example.com');
```

6. 回到官网 `/login` 登录。
7. 登录成功后进入 `/admin` 后台。

如果你只是测试后台，不想处理邮箱确认，可以二选一：

1. 在 Supabase 控制台的 Authentication 邮箱登录设置中关闭邮箱确认。
2. 在 Supabase SQL 编辑器中临时确认指定邮箱：

```sql
update auth.users
set email_confirmed_at = now()
where email = '你的邮箱@example.com'
  and email_confirmed_at is null;
```

注意：正式公开使用时，建议保留邮箱确认，避免别人用不存在或不属于自己的邮箱注册。

角色说明：

| 角色 | 含义 |
| --- | --- |
| `founder` | 掌门，拥有后台管理权限 |
| `admin` | 执事，拥有后台管理权限 |
| `member` | 普通同门，不能进入后台 |

### 四、部署到 GitHub Pages

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

打开 `/` 可以看到问云派山门首屏、门派精神、入派流程、云灯预览和公告入口。

### 阅读立派金典

打开 `/canon` 可以阅读完整《问云派立派金典》。页面左侧有章节目录，手机端可直接向下阅读。

### 提交入派申请

1. 打开 `/join`。
2. 填写昵称、微信号、申请理由。
3. 勾选认同门规。
4. 点击“送出入派帖”。
5. 申请会进入后台待审核列表。

### 点亮云灯

1. 打开 `/cloud-lantern`。
2. 填写留言内容。
3. 可选择匿名展示。
4. 提交后默认进入待审核状态。
5. 管理员审核通过后，留言会在前台公开展示。

### 管理后台

后台地址为 `/admin`，必须先通过 `/login` 登录管理员账号。

后台包含：

1. 后台总览：查看待审核数量。
2. 入派审核：查看微信号、申请理由，修改审核状态。
3. 云灯审核：通过或拒绝留言。
4. 公告管理：创建草稿或发布公告。
5. 活动管理：创建线上或线下雅集。
6. 站点设置：修改联系山门说明文字。

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
│  ├─ layouts/                     # 前台布局和后台布局
│  ├─ lib/                         # Supabase 客户端、类型、服务函数、校验函数
│  ├─ pages/                       # 前台页面
│  │  └─ admin/                    # 后台管理页面
│  ├─ styles/                      # 全局样式和动画
│  ├─ tests/                       # 自动测试
│  ├─ App.tsx                      # 全站路由入口
│  └─ main.tsx                     # React 挂载入口
├─ supabase/
│  └─ migrations/                  # Supabase 初始化 SQL
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

原因：Supabase 开启了邮箱确认。即使已经把 `profiles.role` 改成 `founder` 或 `admin`，只要 `auth.users.email_confirmed_at` 还是空，Supabase 仍然会拒绝登录。

解决方法：

1. 打开注册邮箱，找到 Supabase 确认邮件并点击确认链接。
2. 如果没有收到邮件，在 `/login` 页面填写邮箱后点击“重发确认邮件”。
3. 如果只是本地或内部测试，可以在 Supabase SQL 编辑器执行：

```sql
update auth.users
set email_confirmed_at = now()
where email = '你的邮箱@example.com'
  and email_confirmed_at is null;
```

4. 确认邮箱后，再检查 `public.profiles` 表里该用户的 `role` 是否为 `founder` 或 `admin`。

### 入派申请提交失败

可能原因：

1. Supabase SQL 没有执行完整。
2. RLS 策略没有创建成功。
3. 表单没有勾选认同门规。

解决方法：

1. 重新执行 `supabase/migrations/20260428090000_init_wenyunpai.sql`。
2. 确认 `join_applications` 表存在。
3. 确认申请表单已勾选门规确认。

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
