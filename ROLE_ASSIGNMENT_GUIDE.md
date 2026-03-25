# RuoYi 角色分配与启动说明

## 当前已落地角色

- `platform_super_admin`: 竞赛业务全量权限
- `question_admin`: 题目管理 + Excel 批量导入
- `competition_admin`: 竞赛管理 + 排行榜查看
- `audit_admin`: 昵称/头像审核

对应 SQL 文件：

- `admin/ruoyi-vue/sql/crypto_quiz_roles.sql`
- `admin/ruoyi-vue/sql/crypto_quiz_menu.sql`

## 当前本地默认绑定

- `sys_user.user_id = 1`
- 用户名：`admin`
- 已额外绑定：`platform_super_admin`、`question_admin`、`competition_admin`、`audit_admin`

## 在后台页面中手工分配角色

1. 登录 `http://localhost:8081/login`
2. 进入 `系统管理 -> 用户管理`
3. 找到目标管理员账号
4. 点击“分配角色”
5. 勾选竞赛业务角色并保存

## 直接使用 SQL 绑定角色

```sql
insert ignore into sys_user_role (user_id, role_id) values (1, 200);
insert ignore into sys_user_role (user_id, role_id) values (1, 201);
insert ignore into sys_user_role (user_id, role_id) values (1, 202);
insert ignore into sys_user_role (user_id, role_id) values (1, 203);
```

## 本地启动脚本

在项目根目录执行：

```bash
npm run ruoyi:admin
npm run ruoyi:ui
```

或直接一起启动：

```bash
npm run ruoyi:stack
```

说明：

- `ruoyi:admin` 会读取 `backend/.env` 中的 MySQL 配置映射到 RuoYi 所需的 `MYSQL_*`
- `ruoyi:ui` 默认启动在 `http://localhost:8081`
- `ruoyi:admin` 会检查 `8080`，`ruoyi:ui` 会检查 `8081`，`ruoyi:stack` 会在启动前统一检查端口占用
- `ruoyi:admin` 与 `ruoyi:stack` 会先检查 `backend/.env` 中配置的 MySQL 地址是否可达
- `ruoyi:admin` 与 `ruoyi:stack` 会自动检查 `127.0.0.1:6379`；若本地 Redis 不可用且 Docker 可用，会自动拉起 `cryptoquiz-redis`

## 本轮后台裁剪与新增能力

- 已移除默认无关菜单：系统监控、系统工具、通知公告、部门、岗位、字典、参数、日志等
- 已清理默认 `sys_notice` 公告与 `ruoyi.vip` 官网导航
- 题目管理已支持 Excel 批量导入与模板下载
- 排行榜页已支持总榜与竞赛榜查询
