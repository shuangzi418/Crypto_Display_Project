# 项目结构说明

## 概述

密码知识答题系统 (Cryptography Knowledge Quiz System) - 一个面向密码学科普、课堂训练与活动闯关的在线答题平台。

## 目录结构

```
crypto-quiz-system/
├── docs/                           # 项目文档
│   ├── api/                       # API 文档
│   ├── deploy/                    # 部署文档
│   └── screenshots/               # 界面截图
│
├── backend/                        # Node.js 后端服务
│   ├── src/                       # 源代码
│   │   ├── config/               # 配置文件
│   │   ├── controllers/          # 控制器
│   │   ├── middleware/           # 中间件
│   │   ├── models/               # 数据模型
│   │   ├── routes/               # 路由定义
│   │   ├── services/             # 业务逻辑层
│   │   ├── utils/                # 工具函数
│   │   └── h5/                   # H5 挑战模块
│   ├── scripts/                   # 脚本工具
│   ├── data/                      # 静态数据
│   ├── sql/                       # SQL 备份
│   └── package.json
│
├── frontend/                       # React 前端应用
│   ├── public/                    # 静态资源
│   ├── src/                       # 源代码
│   │   ├── actions/              # Redux actions
│   │   ├── reducers/             # Redux reducers
│   │   ├── components/           # React 组件
│   │   ├── assets/               # 资源文件
│   │   └── utils/                # 工具函数
│   └── package.json
│
├── admin/                          # 管理后台
│   └── cryptoquiz-admin/          # 本地化管理系统
│       ├── cryptoquiz-admin/     # Web 入口模块
│       ├── cryptoquiz-system/    # 系统管理模块
│       ├── cryptoquiz-framework/ # 框架核心
│       ├── cryptoquiz-common/    # 通用工具
│       ├── cryptoquiz-generator/ # 代码生成器
│       ├── cryptoquiz-quartz/    # 定时任务
│       ├── cryptoquiz-ui/        # Vue 前端
│       └── pom.xml
│
├── scripts/                        # 项目脚本
│   ├── deploy/                    # 部署脚本
│   ├── dev.js                     # 开发启动
│   └── stop.js                    # 停止服务
│
├── docker-compose.yml             # Docker 编排
├── .env.docker.example            # Docker 环境变量模板
├── package.json                   # 根项目配置
└── README.md                      # 项目说明
```

## 技术栈

### 前端应用
- React 17 + Redux
- Ant Design 4
- Axios + JWT

### 后端服务
- Node.js + Express
- MySQL + Sequelize
- JWT 认证

### 管理后台
- Spring Boot 4.0.3
- MyBatis + Druid
- Spring Security
- Vue 2 + Element UI

## 模块说明

### backend - Node.js 后端
提供 RESTful API 服务，处理用户认证、题库管理、竞赛逻辑、H5 挑战等业务。

### frontend - React 前端
用户端界面，包括答题、竞赛、排行榜、个人设置等功能。

### admin - 管理后台
基于开源框架的管理系统，提供题库管理、用户管理、竞赛管理、数据统计等后台功能。

包结构：`com.cryptoquiz.*`

## 端口分配

- **3001**: React 前端（开发）
- **5000**: Node.js 后端 API
- **8080**: Spring Boot 后端
- **8081**: Vue 管理前端（开发）
- **3306**: MySQL 数据库
- **6379**: Redis 缓存

## 开发命令

```bash
# 安装所有依赖
npm install

# 启动开发环境
npm run dev

# 停止服务
npm run stop

# Docker 部署
docker compose up -d --build
```
