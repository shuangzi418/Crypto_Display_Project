# Cryptography Knowledge Quiz System

一个面向密码学科普与竞赛训练的在线答题系统，采用前后端分离架构，支持用户认证、题库管理、竞赛参与、排行榜和后台管理。

## 技术栈

### Frontend

- React 17
- Redux + redux-thunk
- Ant Design 4
- Axios
- react-router-dom 5

### Backend

- Node.js
- Express
- MySQL + Sequelize
- JWT
- express-validator
- Nodemailer

## 目录结构

```text
CryptoQuizSystem/
|-- backend/
|   |-- src/
|   |   |-- controllers/
|   |   |-- middleware/
|   |   |-- models/
|   |   `-- routes/
|   |-- tests/
|   |-- .env.example
|   `-- package.json
|-- frontend/
|   |-- public/
|   |-- src/
|   `-- package.json
|-- admin/
|   `-- ruoyi-vue/
|       |-- ruoyi-admin/
|       |-- ruoyi-system/
|       |-- ruoyi-ui/
|       `-- sql/
|-- scripts/
|   `-- deploy/
|-- .gitignore
|-- HTTPS_SETUP.md
|-- package.json
`-- README.md
```

## 核心功能

- 用户注册、登录、资料管理、密码找回与重置
- 题目新增、编辑、删除、分类与难度管理、批量导入
- 普通答题、竞赛参与、竞赛提交、排行榜展示
- H5 密码安全知识挑战：输入昵称一键进入、15 题闯关、金银奖牌与获奖记录查询
- 管理员后台：用户管理、题目管理、竞赛管理、昵称/头像审核

## 快速启动

### 1. 安装依赖

推荐直接在项目根目录执行一条命令安装全部依赖：

```bash
npm install
```

或使用等价脚本：

```bash
npm run install:all
```

该命令会自动安装根目录、`backend/` 和 `frontend/` 的全部依赖。

如果你想分别安装，也可以使用下面的方式：

```bash
cd backend
npm install

cd ../frontend
npm install
```

### 2. 配置后端环境变量

在 `backend/.env` 中至少配置以下内容：

```env
PORT=5000
DB_DIALECT=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_NAME=crypto_quiz
DB_USER=root
DB_PASSWORD=change_this_password
JWT_SECRET=replace_with_a_strong_secret
FRONTEND_URL=http://localhost:3001
CORS_ORIGIN=http://localhost:3001,http://127.0.0.1:3001,http://localhost:3000
COOKIE_SECURE=false
FORCE_HTTPS=false

# 可选：首次启动时自动创建管理员
ADMIN_USERNAME=admin
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=change_this_password

# 可选：密码重置邮件
EMAIL_USER=example@example.com
EMAIL_PASS=your_mail_password
```

说明：

- 本项目默认使用本机 MySQL：`127.0.0.1:3306`
- 默认数据库名为 `crypto_quiz`，程序启动时会自动创建数据库（前提是账号具备创建数据库权限）
- 请先确认本地 MySQL 服务已经启动，再执行 `npm run dev`
- `ADMIN_EMAIL` 和 `ADMIN_PASSWORD` 仅在需要自动初始化管理员时填写
- 如果未配置管理员环境变量，系统不会自动创建默认管理员账号
- 可直接复制 `backend/.env.example` 为 `backend/.env` 再按实际环境修改

### 3. 启动项目

推荐直接在项目根目录使用命令行一键启动：

```bash
npm run dev
```

常用命令：

```bash
npm run dev
npm run stop
npm run admin:init
```

说明：

- `npm run dev`：同时启动前后端；如果 `5000` 或 `3001` 已被占用，会自动切换到下一个可用端口
- `npm run stop`：关闭当前开发会话使用的端口；默认也会尝试关闭 `3001` 和 `5000`
- `npm run admin:init`：根据 `backend/.env` 中的管理员配置把管理员同步到数据库

后端：

```bash
cd backend
npm run dev
```

前端：

```bash
cd frontend
npm start
```

默认联调地址：

- 前端：`http://localhost:3001`
- H5 挑战：`http://localhost:3001/h5/national-security-challenge`
- 管理端（RuoYi）：`http://localhost:8081/login`
- 后端：`http://localhost:5000`
- 健康检查：`http://localhost:5000/health`

如果需要让普通前端中的 `/admin-login` 指向其他后台地址，可为前端额外配置：

```env
REACT_APP_ADMIN_PORTAL_URL=http://localhost:8081
```

RuoYi 本地启动脚本：

```bash
npm run ruoyi:admin
npm run ruoyi:ui
```

或一键同时启动：

```bash
npm run ruoyi:stack
```

说明：

- `ruoyi:admin` 与 `ruoyi:stack` 会先检查 `backend/.env` 中配置的 MySQL 是否可达
- `ruoyi:admin` 会检查 `8080`，`ruoyi:ui` 会检查 `8081`，`ruoyi:stack` 会同时检查两个端口是否被占用
- `ruoyi:admin` 与 `ruoyi:stack` 会优先检查本地 Redis；如果 `127.0.0.1:6379` 不可用且 Docker 可用，会自动拉起 `cryptoquiz-redis` 容器

### 4. H5 密码安全挑战

项目内置了一个独立的 H5 挑战页，适合移动端活动宣传、现场扫码答题和单独域名投放。

- 默认入口：`/h5/national-security-challenge`
- 默认题量：15 题
- 参与方式：输入昵称即可自动登录 / 注册
- 奖励机制：答对 10 题获银奖，答对 12 题获金奖，并支持查询历史获奖记录

如需准备示例题库，可执行：

```bash
cd backend
npm run seed:national-security
```

说明：

- 该脚本会把 `backend/data/passwordChallengeQuestions.json` 中的题目按标题和分类进行新增或更新
- H5 挑战会优先从密码安全相关简单题中抽取题目；若题库不足，接口会返回缺题提示
- 本地开发默认复用后端 `/api`，部署时也支持单独配置 H5 域名

## Docker 部署

项目已提供 `docker-compose.yml`，可直接在服务器上部署前端、后端和 MySQL。

### 1. 准备环境变量

复制一份 Docker 环境变量文件：

```bash
cp .env.docker.example .env
```

至少修改以下配置：

- `JWT_SECRET`
- `H5_JWT_SECRET`
- `ADMIN_EMAIL`
- `ADMIN_PASSWORD`
- `MYSQL_ROOT_PASSWORD`
- `MYSQL_PASSWORD`
- `H5_MYSQL_PASSWORD`

如果服务器已经配好域名和 HTTPS，可再把以下值改成正式地址：

- `FRONTEND_URL`
- `CORS_ORIGIN`
- `H5_DOMAIN`
- `REACT_APP_H5_HOSTS`
- `COOKIE_SECURE=true`
- `FORCE_HTTPS=true`

### 2. 启动服务

在项目根目录执行：

```bash
docker compose up -d --build
```

启动后默认端口：

- 前端：`http://服务器IP/`
- H5 挑战：`http://服务器IP/h5/national-security-challenge`
- 后端：`http://服务器IP:5000/health`
- MySQL：容器内 `mysql:3306`

### 3. 常用 Docker 命令

```bash
docker compose ps
docker compose logs -f backend
docker compose logs -f frontend
docker compose logs -f mysql
docker compose down
```

如果需要保留数据库数据，请不要删除 `mysql_data` 卷。

## 服务器一键部署

当前仓库已支持将普通前端、Node API、RuoYi 后台、MySQL、Redis 一起部署到同一台 Linux 服务器。

适用前提：

- Ubuntu / Debian / CentOS / Rocky 等常见 Linux 服务器
- 拥有 `sudo` 权限
- 服务器可以访问 Docker 官方安装源与 npm/maven 镜像源

一键部署命令：

```bash
bash scripts/deploy/install.sh
```

后续更新并自动重启容器：

```bash
bash scripts/deploy/update.sh
```

该脚本会自动完成：

- 环境检查（Linux、磁盘、内存、端口、Docker）
- 缺失工具安装（curl、git、Docker）
- 生成或补齐 `.env`
- 启动 `mysql`、`redis`、`backend`、`frontend`、`ruoyi-admin`、`ruoyi-ui`
- 初始化或补齐 RuoYi 系统表、竞赛菜单、角色和清理脚本
- 执行健康检查

如果你希望接入宿主机 Nginx / 域名 / HTTPS，可在 `.env` 中配置：

```env
ENABLE_HOST_NGINX=true
APP_DOMAIN=quiz.example.com
ADMIN_DOMAIN=admin.example.com
H5_DOMAIN=h5.example.com
ENABLE_HTTPS=true
LETSENCRYPT_EMAIL=ops@example.com
```

说明：

- 开启 `ENABLE_HOST_NGINX=true` 后，安装脚本会自动把前台与后台容器改为仅监听 `127.0.0.1`
- 宿主机 Nginx 会反向代理到普通前台、独立 H5 域名和 RuoYi 后台
- 安装脚本会自动根据 `APP_DOMAIN` / `ADMIN_DOMAIN` / `H5_DOMAIN` 生成 `FRONTEND_URL`、`CORS_ORIGIN`、`REACT_APP_H5_HOSTS` 和前端后台入口地址
- 若同时设置 `ENABLE_HTTPS=true` 且域名已解析到服务器，会自动通过 Certbot 申请证书
- 未提供域名时，脚本会跳过 HTTPS 申请，保留当前端口访问方式

只做环境检查而不安装，可执行：

```bash
bash scripts/deploy/check-env.sh
```

部署后的默认访问地址：

- 用户前台：`http://服务器IP/`
- H5 挑战：`http://服务器IP/h5/national-security-challenge`
- Node API：`http://服务器IP:5000/health`
- RuoYi 后台：`http://服务器IP:8081/login`

说明：

- RuoYi 后台初始化账号仍为 `admin / admin123`
- 首次登录后会被强制要求修改密码
- Swagger / SpringDoc 在部署配置下默认关闭

## 批量导入题目

管理员进入后台 `题目管理` 页面后，可以点击 `批量导入`，支持两种方式：

- 粘贴内容自动识别导入
- 上传 Excel/CSV 文件导入

### 自动识别能力

系统会自动判断导入内容类型，并尽量识别字段：

- `JSON`：题目数组或 `{ questions: [...] }`
- `CSV/TSV/表格文本`：支持英文表头、中文表头，或无表头时按列顺序推断
- `题目块文本`：支持 `标题:`、`内容:`、`A:`、`B:`、`答案:`、`难度:`、`分类:`、`分值:` 这类结构化文本

现在还支持：

- 导入前点击 `预览识别`，先查看识别格式、成功题目预览、失败行列表
- 失败行在界面中单独高亮展示，并可一键 `导出失败行`
- 一键下载 `CSV 模板` 和 `Excel 模板`

无表头表格时，默认按以下顺序自动推断：

```text
标题,内容,选项A,选项B,...,正确答案,难度,类别,分值
```

导入格式示例：

```json
[
  {
    "title": "Caesar Cipher Basics",
    "content": "Caesar cipher belongs to which type of classical cipher?",
    "options": ["Substitution", "Transposition", "Hash", "Block cipher"],
    "correctAnswer": 0,
    "difficulty": "easy",
    "category": "classical-crypto",
    "points": 5
  }
]
```

字段说明：

- `title`：题目标题
- `content`：题目内容
- `options`：选项数组，至少 2 个
- `correctAnswer`：正确选项索引，从 `0` 开始
- `difficulty`：`easy`、`medium`、`hard`
- `category`：题目分类
- `points`：分值，正整数

### Excel/CSV 导入列说明

推荐表头如下：

```text
title,content,optionA,optionB,optionC,optionD,correctAnswer,difficulty,category,points
```

示例：

```text
title,content,optionA,optionB,optionC,optionD,correctAnswer,difficulty,category,points
凯撒密码基础题,凯撒密码属于哪种加密方式？,替换加密,置换加密,哈希算法,分组加密,A,easy,古典密码,5
RSA题,RSA常见安全基础依赖于什么问题？,离散对数,大整数分解,哈希碰撞,最短路径,1,medium,公钥密码,10
```

兼容规则：

- 支持 `.xlsx`、`.xls`、`.csv`
- 表头支持英文，也兼容常见中文列名，如 `标题`、`内容`、`选项A`、`正确答案`、`难度`、`类别`、`分值`
- 粘贴内容时支持自动识别 `JSON`、`CSV`、`TSV`、题目块文本
- `correctAnswer` 支持填 `0/1/2...`、`A/B/C/D`，也支持直接填写正确选项文本
- 也可以用单列 `options`，并在单元格中用换行、`|`、`；` 分隔多个选项

题目块文本示例：

```text
标题: 凯撒密码基础题
内容: 凯撒密码本质上属于哪一种加密方式？
A: 替换加密
B: 置换加密
C: 哈希算法
D: 分组加密
答案: A
难度: 简单
分类: 古典密码
分值: 5
```

## 常用脚本

### Frontend

```bash
cd ./frontend
npm start
npm run build
```

### Backend

```bash
cd ./backend
npm run dev
npm start
npm test
npm run seed:national-security
npm run sql:export
npm run sql:import
```

说明：`npm test` 需要可用的 MySQL 实例；如果你使用 Docker，可先执行 `docker compose up -d mysql`。

## 把 SQL 数据放在后端

现在项目支持把当前 MySQL 数据库导出到后端目录 `backend/sql/`，并按用途拆分保存。

- 导出当前数据库到 `backend/sql/`：`cd backend && npm run sql:export`
- 从 `backend/sql/` 重新导入到当前 `backend/.env` 指定数据库：`cd backend && npm run sql:import`
- 如需自定义导出目录，也可以追加路径参数，例如：`node scripts/exportSql.js sql/backup-2026-03-23`

默认会生成这些文件：

- `backend/sql/schema.sql`：表结构
- `backend/sql/users.sql`：用户数据
- `backend/sql/questions.sql`：题库数据
- `backend/sql/app_data.sql`：竞赛、提交、消息等业务数据
- `backend/sql/crypto_quiz.sql`：完整单文件备份
- `backend/sql/manifest.json`：导入顺序清单

注意：

- 导出的 `.sql` 文件会包含真实业务数据
- 如果这是生产或敏感数据，不建议直接提交到代码仓库
- MySQL 的“运行中真实数据”仍然在 MySQL 自己的数据目录里；`backend/sql/` 保存的是可上传、可恢复的 SQL 备份
- 如果你真的想把“运行数据库本体”也放进源码目录，那就不建议继续用 MySQL，应该改为 SQLite，或者单独迁移 MySQL `datadir`

## 接口与认证说明

- 前端通过 `frontend/src/axios.js` 统一访问 `/api`
- H5 挑战通过 `frontend/src/h5Api.js` 访问 `/api/h5-auth` 与 `/api/challenges`
- 登录、注册、刷新令牌成功后会同时更新 HttpOnly Cookie 与本地 `token`
- 受保护接口优先读取 `Authorization: Bearer <token>`，并兼容 Cookie 回退
- 刷新令牌接口 `POST /api/users/refresh-token` 现在会返回完整用户信息和新 `token`
- 受保护页面由 `frontend/src/App.js` 中的 `PrivateRoute` / `AdminRoute` 控制，避免未授权组件先渲染再跳转
- 密码修改接口 `PUT /api/users/profile` 需要同时提交 `currentPassword` 与新密码
- H5 登录态使用独立的 `h5Token` Cookie，可与主站用户会话并存

## 上传仓库建议

首次上传前建议确认以下文件不会进入仓库：

- `backend/.env`
- `frontend/.env`
- `frontend/node_modules/`
- `backend/node_modules/`
- `frontend/build/`

## 后续可继续优化的方向

- 为前后端补充更多自动化测试，覆盖认证刷新与权限边界
- 引入更完整的安全中间件，如请求限流和 Helmet
- 将邮件、认证、配置逻辑进一步拆分为独立 service 层
- 逐步减少 `localStorage` 中的令牌依赖，进一步向 Cookie-first 方案收敛
