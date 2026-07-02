# 🚀 Docker 启动指南与测试账号

## 快速启动

### 1. 启动 Docker Desktop
确保 Docker Desktop 正在运行（图标为绿色）

### 2. 启动项目
```bash
# 在项目根目录执行
docker compose up -d --build
```

### 3. 查看状态
```bash
# 查看服务状态
docker compose ps

# 查看日志
docker compose logs -f
```

---

## 🔑 测试账号

### 管理后台
- **URL**: http://localhost:8081
- **用户名**: `admin`
- **密码**: `Admin@123456`
- **权限**: 超级管理员

### 用户前端
- **URL**: http://localhost
- **说明**: 点击注册创建新账号

### H5 挑战
- **URL**: http://localhost/h5/national-security-challenge
- **说明**: 输入任意昵称（如：测试用户001）

---

## 📊 访问地址

| 服务 | 地址 | 端口 |
|------|------|------|
| 用户前端 | http://localhost | 80 |
| 管理后台 | http://localhost:8081 | 8081 |
| 后端 API | http://localhost:5300 | 5300（当前示例，可配置） |
| 健康检查 | http://localhost:5300/health | 5300（当前示例，可配置） |

---

## 💾 数据库信息

### MySQL
- **Root 密码**: root123456
- **主数据库**: crypto_quiz / crypto_user / crypto_pass123
- **H5 数据库**: crypto_quiz_h5 / crypto_h5_user / h5_crypto_pass123

### Redis
- **端口**: 6379（容器内部）
- **密码**: 无

---

## 🛠️ 常用命令

### 查看日志
```bash
# 所有服务
docker compose logs -f

# 特定服务
docker compose logs -f backend
docker compose logs -f mysql
docker compose logs -f cryptoquiz-admin
```

### 服务管理
```bash
# 停止服务
docker compose down

# 重启服务
docker compose restart

# 重建并启动
docker compose up -d --build

# 停止并删除数据（重置）
docker compose down -v
```

### 健康检查
```bash
# 后端 API
curl http://localhost:5300/health

# 查看服务状态
docker compose ps
```

---

## 📝 测试流程

1. **启动服务**（首次 5-10 分钟）
   ```bash
   docker compose up -d --build
   ```

2. **等待启动完成**
   ```bash
   docker compose ps
   # 等待所有服务状态为 running
   ```

3. **访问管理后台**
   - 打开: http://localhost:8081
   - 登录: admin / Admin@123456
   - 测试题库管理功能

4. **访问用户前端**
   - 打开: http://localhost
   - 注册新用户
   - 测试答题功能

5. **测试 H5 挑战**
   - 打开: http://localhost/h5/national-security-challenge
   - 输入昵称开始挑战

---

## ❌ 常见问题

### Docker Desktop 未运行
**错误**: `The system cannot find the file specified`  
**解决**: 启动 Docker Desktop，等待图标变绿

### 端口被占用
**错误**: `port is already allocated`  
**解决**: 修改 `.env` 文件中的端口
```env
FRONTEND_PORT=3001
BACKEND_PORT=5300
CRYPTOQUIZ_UI_PORT=8082
```

### 构建失败
```bash
# 清理缓存重新构建
docker compose build --no-cache
docker compose up -d
```

### 数据库初始化失败
```bash
# 删除数据卷重新初始化
docker compose down -v
docker compose up -d
```

---

## 💡 提示

- 首次启动需要下载镜像和构建，约 **5-10 分钟**
- 数据存储在 Docker volumes 中，重启不会丢失
- 如需重置数据，使用 `docker compose down -v`
- 环境配置详见 `.env` 文件

---

**启动成功后即可开始测试！** 🎉
