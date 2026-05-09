# 古风国风 UI 素材包

本目录存放内置生图模型生成并裁切好的页面插图、装饰纹样和白底功能图标，供后续重做页面 UI 时直接引用。

## 目录说明

```text
guofeng-ui-20260509/
├─ source-boards/          原始素材板，便于后续重新裁切或核对来源
├─ illustrations/public/   前台展示页插图
├─ illustrations/interaction/ 前台互动页插图
├─ illustrations/yard/     问云小院页面插图
├─ illustrations/admin/    后台管理页面插图
├─ ornaments/              宣纸、云山、金线、印章、竹叶等装饰纹样
└─ icons/                  白色底国风线描功能图标
```

## 原始素材板

1. `source-boards/public-display-board.png`：前台展示类页面插图总板。
2. `source-boards/public-interaction-board.png`：前台互动类页面插图总板。
3. `source-boards/yard-board.png`：问云小院页面插图总板。
4. `source-boards/admin-board.png`：后台管理页面插图总板。
5. `source-boards/ornament-board.png`：装饰纹样总板。
6. `source-boards/icon-board-white.png`：白色底功能图标总板。
7. `source-boards/redraw-public-display-board.png`：按前台展示设计稿重新生成的页面插图总板。
8. `source-boards/redraw-public-interaction-board.png`：按前台互动设计稿重新生成的页面插图总板。
9. `source-boards/redraw-yard-board.png`：按问云小院设计稿重新生成的页面插图总板。
10. `source-boards/redraw-admin-board.png`：按后台管理设计稿重新生成的页面插图总板。

## 当前应用情况

当前网站页面通过 `src/data/visualAssets.ts` 统一读取本素材包，前台展示、前台互动、问云小院和后台管理页面的标题背景、首页山门背景与白底功能图标均优先使用本目录下裁切后的单张图片。

公告页、问云雅集页、山门介绍页、问云小院和后台工作台已经按 `design-drafts/guofeng-ui-20260508/` 参考稿继续复刻布局：复杂插画由本目录图片承载，榜文、表单、列表、卡片、按钮和工作台结构由前端代码还原。

## 页面插图分类

前台展示页插图位于 `illustrations/public/`，包含首页山门、立派金典、山门介绍、门派公告、问云雅集、联系山门和 404 页面插图。

前台互动页插图位于 `illustrations/interaction/`，包含问云名册、问心考核、云灯留言和问云小院登录插图。

问云小院插图位于 `illustrations/yard/`，包含小院总览、我的资料、我的名帖、我的云灯、我的雅集和消息提醒插图。

后台管理插图位于 `illustrations/admin/`，包含后台总览、名册管理、云灯审核、公告管理、活动管理、执事管理和站点设置插图。

## 装饰纹样

`ornaments/` 中包含宣纸纹理、云山横幅、金线分隔、朱砂印章纹样、墨青云纹丝带、金色角花、竹叶边饰和卡片底纹，适合用于页面标题、卡片底纹、分隔线和局部点缀。

## 白底图标

`icons/` 中共 36 个白色底国风线描图标，适合用于导航、按钮、表单状态、后台操作和快捷入口。图标文件包括：书卷、盾牌勾、莲灯、山门、公告纸、日历、名册、用户、设置、首页、邮件、搜索、铃铛、文件、柱状图、扩音公告、多人、皇冠、钥匙、地图针、保存、发送、对勾、提醒、删除、眼睛、闭眼、二维码、登出、登录、左箭头、右箭头、上箭头、刷新、筛选和茶席活动。

## 使用建议

1. 页面首屏和标题区优先使用 `illustrations/` 下的单张插图，避免在运行时裁切大图。
2. 小面积按钮和导航优先使用 `icons/` 下的白底图标，保证不同页面背景上都清楚可见。
3. 装饰纹样只用于辅助氛围，不要覆盖正文，避免影响移动端阅读。
4. 原始素材板只作为归档和二次裁切来源，正式页面不要直接引用总板。
