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
- MongoDB + Mongoose
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
|-- .gitignore
|-- HTTPS_SETUP.md
|-- package.json
`-- README.md
```

## 核心功能

- 用户注册、登录、资料管理、密码找回与重置
- 题目新增、编辑、删除、分类与难度管理
- 普通答题、竞赛参与、竞赛提交、排行榜展示
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
MONGO_URI=mongodb://localhost:27017/crypto_quiz
JWT_SECRET=replace_with_a_strong_secret
FRONTEND_URL=http://localhost:3001
CORS_ORIGIN=http://localhost:3001

# 可选：首次启动时自动创建管理员
ADMIN_USERNAME=admin
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=change_this_password

# 可选：密码重置邮件
EMAIL_USER=example@example.com
EMAIL_PASS=your_mail_password
```

说明：

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

- `npm run dev`：同时启动前后端
- `npm run stop`：关闭 `3001` 和 `5000` 端口上的开发服务
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
- 后端：`http://localhost:5000`
- 健康检查：`http://localhost:5000/health`

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
```

## 接口与认证说明

- 前端通过 `frontend/src/axios.js` 统一访问 `/api`
- 登录、注册、刷新令牌成功后会同时更新 HttpOnly Cookie 与本地 `token`
- 受保护接口优先读取 `Authorization: Bearer <token>`，并兼容 Cookie 回退
- 刷新令牌接口 `POST /api/users/refresh-token` 现在会返回完整用户信息和新 `token`
- 受保护页面由 `frontend/src/App.js` 中的 `PrivateRoute` / `AdminRoute` 控制，避免未授权组件先渲染再跳转
- 密码修改接口 `PUT /api/users/profile` 需要同时提交 `currentPassword` 与新密码

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
