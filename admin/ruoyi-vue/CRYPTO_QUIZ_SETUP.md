# Crypto Quiz + RuoYi-Vue

This workspace vendors `RuoYi-Vue` to replace the hand-built admin system with a mature admin framework.

## Recommended integration path

- Keep the current public quiz app as-is for now.
- Use `RuoYi-Vue` only for the admin side.
- Point `RuoYi-Vue` to the existing `crypto_quiz` MySQL database.
- Import RuoYi system tables into the same database, then generate business CRUD for quiz tables.

## Current quiz business tables

- `users`
- `questions`
- `competitions`
- `competition_questions`
- `competition_participants`
- `submissions`
- `messages`

## Admin modules to replace first

1. Question management
2. Competition management
3. User management
4. Avatar/nickname audit
5. Import/export operations

## Prerequisites

- JDK 17+
- Maven 3.9+
- Redis 6+
- MySQL 8+

Your machine already has Java, but Maven is not installed yet.

## Database strategy

Use the existing `crypto_quiz` database as the RuoYi primary datasource.

1. Import RuoYi system SQL from `admin/ruoyi-vue/sql/`
2. Keep quiz business tables already managed by the existing app
3. Use RuoYi code generator against `questions`, `competitions`, `submissions`, `messages`

## Config files already adjusted

- `ruoyi-admin/src/main/resources/application-druid.yml`
- `ruoyi-admin/src/main/resources/application.yml`

They now prefer environment variables:

- `MYSQL_HOST`
- `MYSQL_PORT`
- `MYSQL_DB`
- `MYSQL_USER`
- `MYSQL_PASSWORD`
- `REDIS_HOST`
- `REDIS_PORT`
- `REDIS_PASSWORD`
- `RUOYI_TOKEN_SECRET`
- `RUOYI_UPLOAD_PATH`

## Suggested next commands

Backend admin:

```bash
cd admin/ruoyi-vue
mvn clean package
```

Frontend admin:

```bash
cd admin/ruoyi-vue/ruoyi-ui
npm install
npm run dev
```

## Notes

- RuoYi-Vue is not a drop-in replacement for the current Node admin API.
- The practical path is parallel migration: first stand up RuoYi-Vue, then move admin CRUD one module at a time.
- Once the RuoYi admin covers all business modules, the old React admin pages can be removed.
