# 宛瑜的记录本 · 第一版

制作日期：2026-10-26。基于本机 wanyu-home 项目的独立副本。未修改原目录、远端仓库和线上 Worker；尚未上线。

## 现在可以看什么

本地运行中的预览： http://127.0.0.1:4323/write/

试写编辑器： http://127.0.0.1:4323/admin/?demo=1#/collections/blog/new

试写模式只在 localhost / 127.0.0.1 / ::1 启用，使用 Decap 的内存测试后端。点击“登录”进入演示；演示中不需要账号、不会连接 GitHub。试写内容刷新即消失，不能作为草稿备份。

若本地服务已停止，将本增量包的 src、public、workers、tests 合入项目工作副本后，在项目中运行 npm ci 和 npm run dev -- --host 127.0.0.1 --port 4323。

## 日常使用方式（授权上线后）

博客首页和导航栏不添加写作入口。站长自行收藏 https://linwanyu.top/write/；该页面与 /admin/ 均设置为 noindex、nofollow，避免被搜索引擎收录。隐藏地址只负责保持访客界面干净，不承担身份验证。

1. 在手机或电脑打开 /write/，选择日记、随手记或相册。
2. 新设备首次使用时，用 GitHub 站长账号完成身份确认；同一浏览器会尽量保留会话，但授权过期、清除浏览器数据或无痕模式下需要重新确认。
3. 写标题、正文或添加照片。日期默认今天；日记简介留空会从正文摘取。
4. 保存草稿，写完后通过编辑器的审核/发布操作发布。后台会提交到 GitHub，现有 Actions 自动更新博客。

当前仓库是公开仓库，云端草稿分支和上传的照片也可以被查看。这里适合写准备公开的博客内容，不是保密日记。界面中已有相应说明。保存草稿不等于网站发布；发布提交也不等于构建已经成功。

## 已实现

- 独立 /write/ 入口：奶油白纸张、暖棕文字、记录本布局，含窄屏样式及键盘焦点样式。
- Decap CMS 3.17.1 本地托管，中文界面，默认关闭分屏预览以集中写作。
- 日记、随手记、相册三组配置；无需手写 Markdown 文件头。
- 日记正文支持富文本及图片，自动简介，原有三个封面可选。
- 相册支持照片列表、照片说明、日期、封面；新图片与相册 index.md 放在一起，路径由后台维护。现有旧相册引用不迁移。
- editorial_workflow 草稿/发布流程；禁用编辑器的删除入口。
- 独立 wanyu-diary-auth 登录 Worker 源码：随机 state + HttpOnly/Secure Cookie 校验、指定站点消息传递、站长账号和仓库写权限检查；密钥留在 Cloudflare。
- 认证服务固定指向独立的 wanyu-diary-auth Worker，不会误用第三方默认认证服务。

## 正式上线还差的步骤

需用户完成 GitHub 登录授权及新密钥录入，不能直接沿用博客聊天密钥或留言读取 Token。

1. 创建独立 Cloudflare Worker：wanyu-diary-auth，使用 workers/diary-auth 目录。不要覆盖 wanyu-ai-chat、guestbook-api 或 thoughts-likes-api。
2. 记录实际 Worker 的 HTTPS 地址，再注册专用 GitHub OAuth App：Homepage URL 为 https://linwanyu.top/write/，Authorization callback URL 为该 Worker 的 /callback。
3. 把 Client ID 与 Client Secret 设置为 Worker 的 GITHUB_CLIENT_ID、GITHUB_CLIENT_SECRET Secret；真实值不要写进源码、聊天或公开仓库。
4. public/admin/config.js 已配置预期的 Worker origin；若部署名称或账号变化，需要同步更新。
5. 验证登录后确认 Actions 成功，并用一篇明确可公开的测试内容验证草稿、发布、图片和构建状态。

授权范围说明：当前标准 OAuth 方案请求 public_repo，并非仅对一个仓库的精细授权，它涵盖该 GitHub 账号可访问的公开仓库相关权限。虽然此编辑器配置和登录 Worker 只接受当前站长/博客，Token 的上游权限范围仍较宽。正式创建和授权时必须向用户说明并取得确认；如要求只授权单一仓库，应改用 GitHub App 或其他精细授权方案并补做验证。当前未创建任何应用或凭据，也未授予这些权限。

## 已验证与未验证

- 原博客及新增页面 Astro 构建成功。
- 使用临时相册样例，验证同目录图片路径及带引号日期能被 Astro image() 和 schema 接受；样例已移除。
- 3 组 Node 自动测试通过：配置约束、摘要生成、OAuth 错误拒绝、state、站长身份、仓库权限和成功回传。GitHub 请求全部使用模拟数据，未访问真实凭据。
- 在独立 JSDOM 环境加载实际 Decap 3.17.1，分别初始化日记/随手记/相册新建页，均无初始化错误。这是 DOM 逻辑检查，不是浏览器视觉验收。
- 本地 /write/ 与 /admin/?demo=1 请求均返回 HTTP 200。
- 当前会话没有可用的可控浏览器，尚未完成截图、手机视口、富文本交互和图片上传的真实浏览器验收；不能将本版称为已完成上线验收。
- 真实 OAuth、GitHub 写入/草稿分支/合并发布及在线构建状态尚待授权后的端到端验证。

## 已知范围

原有 taipei-coffee-shops.mdx 含自定义组件，未纳入普通 Markdown 日记集合，避免富文本编辑器破坏组件。它仍保留在网站中；继续修改特殊排版暂用原方式。

相册需要选封面并添加至少一张照片；第一版是逐项添加照片，不宣称已经实现批量拖入。日记封面暂用既有预设，正文可以插图。

访客页面、网页聊天、QQ 机器人和旧内容未改动。

参考：[Decap GitHub 后端](https://decapcms.org/docs/github-backend/)、[集合与图片路径](https://decapcms.org/docs/collection-folder/)、[测试后端](https://decapcms.org/docs/test-backend/)。
