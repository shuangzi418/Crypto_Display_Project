# Cryptography Knowledge Quiz System

一个面向密码学科普与竞赛训练的在线答题系统，采用前后端分离架构，支持用户认证、题库管理、竞赛参与、排行榜和后台管理。

## 本次优化

- 增加前端路由守卫：`/quiz`、`/settings`、`/admin` 现在会在路由层完成权限校验，减少未授权页面闪烁和无效请求
- 修复登录/注册错误提示吞掉服务端返回信息的问题，失败原因会更准确地反馈到界面
- 强化个人设置页校验：头像文件类型/大小、用户名与邮箱空值、密码长度与确认逻辑现在会在前端先校验
- 强化后端资料更新逻辑：修改密码必须提供当前密码，更新用户名/邮箱时会校验格式与唯一性
- 为配置新增 `backend/.env.example`，降低首次部署和协作时的环境配置成本
- 补充认证更新相关测试，覆盖“必须验证当前密码后才能改密”的关键场景
- 修复前端认证状态不同步问题：登录、注册、刷新令牌后会正确持久化 `token`
- 修复刷新令牌接口返回数据不完整的问题，避免前端刷新后用户信息丢失
- 调整 Axios 401/403 处理逻辑，避免访客访问公开页面时被强制跳转
- 仅在已登录状态下启动自动刷新任务，减少无效请求
- 移除后端认证链路中的敏感调试日志，避免输出令牌、Cookie 和数据库连接信息
- 收紧 CORS 与响应头配置，新增 `/health` 健康检查接口
- 移除“通过特定邮箱自动升级管理员”的高风险逻辑，改为通过环境变量显式初始化管理员
- 新增 `.gitignore`，避免上传 `node_modules`、构建产物与 `.env`

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
`-- README.md
```

## 核心功能

- 用户注册、登录、资料管理、密码找回与重置
- 题目新增、编辑、删除、分类与难度管理
- 普通答题、竞赛参与、竞赛提交、排行榜展示
- 管理员后台：用户管理、题目管理、竞赛管理、昵称/头像审核

## 快速启动

### 1. 安装依赖

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

也可以直接在项目根目录使用一键启动脚本：

```bat
start-all.bat
```

该脚本会自动打开两个终端窗口，分别启动前后端服务。

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
cd frontend
npm start
npm run build
```

### Backend

```bash
cd backend
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

## 主要优化文件

- `frontend/src/actions/userActions.js`
- `frontend/src/reducers/userReducer.js`
- `frontend/src/axios.js`
- `frontend/src/App.js`
- `frontend/src/components/Login.js`
- `frontend/src/components/Register.js`
- `frontend/src/components/UserSettings.js`
- `backend/src/controllers/userController.js`
- `backend/src/middleware/auth.js`
- `backend/src/index.js`
- `backend/tests/user.test.js`
- `backend/.env.example`
- `.gitignore`

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
