# RuoYi 迁移映射

## 当前结构

- `frontend/` 仍是普通用户站点，同时还保留了旧 React 管理页。
- `backend/` 仍是现网业务 API，业务表包括 `users`、`questions`、`competitions`、`competition_questions`、`competition_participants`、`submissions`、`messages`。
- `admin/ruoyi-vue/` 已接入 `crypto_quiz` 数据库，但此前只有 RuoYi 基础能力，没有竞赛业务模块。

## 业务表 -> RuoYi 模块映射

| 业务表 | RuoYi 后端模块 | 说明 |
| --- | --- | --- |
| `questions` | `quiz/question` | 题目 CRUD、题目下拉选择 |
| `questions`（Excel导入） | `quiz/question/import*` | Excel 模板下载、赛题批量导入 |
| `competitions` + `competition_questions` | `quiz/competition` | 竞赛 CRUD、题目关联、总分统计、状态同步 |
| `users` | `quiz/user` | 业务用户查询、业务角色调整 |
| `users.nicknameStatus` | `quiz/user/nickname/*` | 昵称待审列表、通过/拒绝 |
| `users.avatarStatus` | `quiz/user/avatar/*` | 头像待审列表、通过/拒绝 |
| `users` + `competition_participants` | `quiz/leaderboard/*` | 总排行榜、竞赛排行榜 |
| `messages` | `QuizBusinessUserMapper.insertReviewMessage` | 审核完成后给业务用户发站内消息 |

## 现有 Node API -> RuoYi API 对照

| 原 Node API | 新 RuoYi API |
| --- | --- |
| `GET /api/questions` | `GET /quiz/question/list` |
| `GET /api/questions/:id` | `GET /quiz/question/{id}` |
| `POST /api/questions` | `POST /quiz/question` |
| `PUT /api/questions/:id` | `PUT /quiz/question` |
| `DELETE /api/questions/:id` | `DELETE /quiz/question/{ids}` |
| 旧管理端批量导入 | `POST /quiz/question/importData` |
| `GET /api/competitions` | `GET /quiz/competition/list` |
| `GET /api/competitions/:id` | `GET /quiz/competition/{id}` |
| `POST /api/competitions` | `POST /quiz/competition` |
| `PUT /api/competitions/:id` | `PUT /quiz/competition` |
| `DELETE /api/competitions/:id` | `DELETE /quiz/competition/{ids}` |
| `PUT /api/competitions/status/update` | `PUT /quiz/competition/syncStatus` |
| `GET /api/users` | `GET /quiz/user/list` |
| `GET /api/users/ranking` | `GET /quiz/leaderboard/overall/list` |
| `GET /api/submissions/competition/:competitionId/ranking` | `GET /quiz/leaderboard/competition/list` |
| `PUT /api/users/:id/role` | `PUT /quiz/user/changeRole` |
| `GET /api/users/nickname/pending` | `GET /quiz/user/nickname/pending` |
| `POST /api/users/nickname/approve` | `PUT /quiz/user/nickname/review` |
| `GET /api/users/avatar/pending` | `GET /quiz/user/avatar/pending` |
| `POST /api/users/avatar/approve` | `PUT /quiz/user/avatar/review` |

## 本轮已落地的 RuoYi 后端文件

- 领域模型：
  - `ruoyi-system/src/main/java/com/ruoyi/system/domain/QuizQuestion.java`
  - `ruoyi-system/src/main/java/com/ruoyi/system/domain/QuizCompetition.java`
  - `ruoyi-system/src/main/java/com/ruoyi/system/domain/QuizBusinessUser.java`
- 控制层：
  - `ruoyi-admin/src/main/java/com/ruoyi/web/controller/quiz/QuizQuestionController.java`
  - `ruoyi-admin/src/main/java/com/ruoyi/web/controller/quiz/QuizCompetitionController.java`
  - `ruoyi-admin/src/main/java/com/ruoyi/web/controller/quiz/QuizBusinessUserController.java`
- Service / Mapper：
  - `ruoyi-system/src/main/java/com/ruoyi/system/service/impl/QuizQuestionServiceImpl.java`
  - `ruoyi-system/src/main/java/com/ruoyi/system/service/impl/QuizCompetitionServiceImpl.java`
  - `ruoyi-system/src/main/java/com/ruoyi/system/service/impl/QuizBusinessUserServiceImpl.java`
  - `ruoyi-system/src/main/resources/mapper/quiz/*.xml`

## 本轮已落地的 RuoYi 前端与菜单文件

- 页面：
  - `ruoyi-ui/src/views/quiz/question/index.vue`
  - `ruoyi-ui/src/views/quiz/competition/index.vue`
  - `ruoyi-ui/src/views/quiz/user/index.vue`
  - `ruoyi-ui/src/views/quiz/audit/nickname.vue`
  - `ruoyi-ui/src/views/quiz/audit/avatar.vue`
  - `ruoyi-ui/src/views/quiz/leaderboard/index.vue`
- API：
  - `ruoyi-ui/src/api/quiz/question.js`
  - `ruoyi-ui/src/api/quiz/competition.js`
  - `ruoyi-ui/src/api/quiz/user.js`
  - `ruoyi-ui/src/api/quiz/leaderboard.js`
- 菜单 SQL：
  - `sql/crypto_quiz_menu.sql`
- 品牌清理 SQL：
  - `sql/crypto_quiz_cleanup.sql`
- 角色 SQL：
  - `sql/crypto_quiz_roles.sql`
- 角色说明：
  - `ROLE_ASSIGNMENT_GUIDE.md`

## 角色分级方案

### 管理员侧

- 管理员账号统一放在 `sys_user`，由 RuoYi 登录控制。
- 建议角色拆分：
  - `platform_super_admin`：平台配置、菜单、角色、所有竞赛业务权限
  - `question_admin`：题目管理、Excel 赛题导入
  - `competition_admin`：竞赛创建、上下线、赛事配置、排行榜查看
  - `audit_admin`：昵称/头像审核、业务用户查看
- 权限颗粒度落到菜单/按钮权限：
  - `quiz:question:*`
  - `quiz:competition:*`
  - `quiz:leaderboard:list`
  - `quiz:user:list`
  - `quiz:user:edit`
  - `quiz:user:audit`

### 业务用户侧

- `users` 表继续保存参赛用户，不与 `sys_user` 混用。
- 当前 `users.role` 仍是旧系统的 `user/admin` 两级字段，短期内只作为兼容字段保留。
- 等 RuoYi 管理端完全替换旧 React Admin 后，再考虑把业务侧权限从 `users.role` 迁移成更清晰的状态位或独立授权表。

## 下一步建议

1. 清理更多无关系统能力时，优先通过 `sys_menu` 和导航栏裁剪，避免直接破坏 RuoYi 基础框架。
2. 题目批量导入当前走固定 Excel 模板，如需兼容更多列格式，可再扩展导入行映射。
3. 排行榜目前覆盖总榜与竞赛榜；如需增加按时间段或按分类统计，可继续扩展查询条件。
4. 普通前端的 `/admin-login` 已切到独立 RuoYi 地址，后续旧 React Admin 可继续逐步下线。
