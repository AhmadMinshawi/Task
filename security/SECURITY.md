# TaskV Security Foundation

Principles:
- Authentication and authorization belong to the backend/database, not UI code.
- Row Level Security (RLS) must scope every user-owned table to the authenticated user.
- No application initialization may clear production data.
- Deletions use soft-delete first; permanent deletion requires an explicit protected flow.
- Migrations are versioned, reversible where possible, and must validate before/after changes.
- Never ship service-role credentials to the browser.
- Backups and restore procedures are required before production migrations.
