# CBase - 开发日志

## 当前状态（每次更新覆盖）
- **当前版本**: V2.1（已部署上线）
- **核心定位**: 基础设施碳排放因子共享数据库，支持多课题组协作录入与查询
- **已完成**: 全功能上线 — 因子 CRUD 前端表单、权限审核流、注册管控、阿里云 ECS 部署
- **线上地址**: http://8.141.82.4:3001
- **服务器**: 阿里云 ECS（华北2），CentOS 7.9，4核8G，Node 16.20.2
- **账号**: admin/admin123（管理员）、dalianligong/123456（测试编辑）
- **进行中**: 无
- **待定/开放问题**:
  - 核算方法模块的具体需求还需细化
  - 是否需要域名 + HTTPS
  - 服务器重启后需手动启动 node 进程（可考虑 systemd 服务）

---
## 版本日志（追加，不删改）

### V1.0 - 2026-04（静态原型）
**设计决策**:
- 纯前端静态实现，数据存 localStorage + JSON 文件
- 单文件 index.html（HTML + CSS + JS 约1750行）
- 部署在 GitHub Pages

**功能清单**:
- [x] 因子库浏览（6 种分类：能源燃料/物质材料/运输/机械设备/工艺过程/废弃回收）
- [x] 因子详情页（边界说明、时空适用范围、应用示例、注意事项）
- [x] 因子包管理（创建/重命名/删除，使用项 CRUD）
- [x] 数据库搜索视图
- [x] 因子包 CSV 导出
- [x] 侧边栏收起/展开

**数据规模**: 8 条示例因子（data/factors.json）

### V2.0 - 2026-04-16（多人协作版 — 骨架完成）
**背景**:
- 项目组师兄提出需求：不同课题组能上传排放因子和核算方法，减少重复工作
- 王文渊老师希望建设一个课题组共享的因子数据库网站

**技术决策**:
- 后端：Node.js + Express + sql.js（纯 JS 的 SQLite，无需 C++ 编译环境）
- 数据库：SQLite（cbase.db 文件，轻量部署）
- 前端：Vite + React 组件化（从 1750 行单文件拆分为 9 个组件）
- 认证：用户名 + 密码 + session token，支持注册/登录/登出
- 原 better-sqlite3 因需要 Visual Studio Build Tools 编译，换为 sql.js

**已完成**:
- [x] 后端 API（因子 CRUD、因子包 CRUD、使用项 CRUD）
- [x] 用户系统（注册/登录/登出，session token 认证）
- [x] 前端 React 组件化重构（Sidebar、DatabaseView、LibraryView、PackagesView、4 个 Modal、LoginPage）
- [x] 数据库自动初始化 + 种子数据（8 条因子）
- [x] API 测试通过

**待做（2026-04-16 讨论确认）**:

权限与审核（已对齐方案）:
- [ ] 两级权限：admin（固定为项目负责人）+ editor（课题组成员，由 admin 发放）
- [ ] 审核流：新增因子直接进库；修改因子需 admin 审核通过后生效；删除仅 admin 可操作
- [ ] 因子显示提交来源标签（学校/课题组，取自用户 group_name）
- [ ] 因子引用次数统计：实时显示每个因子在所有因子包中被引用的次数（增删使用项后自动更新）

功能模块:
- [ ] 因子录入前端表单
- [ ] 核算方法模块（新模块，需求待细化）

开放问题:
- 部署方式：课题组内网服务器 vs 公网？

### V2.1 - 2026-04-17（功能完善 + 部署上线）
**设计决策**:
- 因子删除按钮从列表行移至因子详情弹窗底部（仅 admin 可见），防止误触
- 公开注册功能关闭，改为 admin 后台创建账号（/register 路由加 requireAdmin 中间件）
- LoginPage 简化为纯登录表单，移除注册 tab
- 生产部署采用单端口方案：Express 同时提供 API + 静态文件（dist/），端口 3001
- 因 CentOS 7 glibc 2.17 限制无法跑 Node 18+，服务器用 Node 16.20.2；Vite 构建在本地完成后 dist/ 提交到 git

**已完成**:
- [x] 因子新增/编辑表单（FactorFormModal 组件，匹配项目统一弹窗风格）
- [x] 因子删除功能（详情弹窗内 admin 专属按钮 + confirm 确认）
- [x] LibraryView 增加新增/编辑操作按钮
- [x] PackagesView 恢复"添加因子"功能（AddToPackageModal 增加全局因子选择模式）
- [x] 关闭公开注册，admin 创建账号
- [x] 创建测试账号 dalianligong/123456
- [x] 清理数据库中 curl 测试产生的乱码因子
- [x] .gitignore 移除 dist/，允许提交生产构建产物
- [x] 阿里云 ECS 部署（git clone → npm install → nohup 后台运行）
- [x] 安全组开放 TCP 3001 端口，外网可访问

**部署信息**:
- 服务器：阿里云 ECS 华北2，IP 8.141.82.4，CentOS 7.9
- 项目路径：/home/CBase
- 启动命令：`cd /home/CBase && nohup env NODE_ENV=production node server/index.js > cbase.log 2>&1 &`
- 重启命令：`kill $(pgrep -f "node server/index.js") && cd /home/CBase && nohup env NODE_ENV=production node server/index.js > cbase.log 2>&1 &`
- 更新流程：本地 `npm run build` → git push → 服务器 `git pull` → 重启
- 日志文件：/home/CBase/cbase.log
