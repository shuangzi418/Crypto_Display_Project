# SQL Storage

Use this directory for database dump files stored alongside the backend.

- Split files:
  - `schema.sql`
  - `users.sql`
  - `questions.sql`
  - `app_data.sql`
  - `crypto_quiz.sql` (full dump)
  - `manifest.json`
- Export current database: `npm run sql:export`
- Import split dump back into MySQL: `npm run sql:import`

Do not commit real production data unless you explicitly want it in version control.
