# Migration Rules

- No migration may clear all user data.
- Prefer additive schema changes.
- Validate before and after each migration.
- Production backup must exist before any destructive migration.
- Migrations are sequential and versioned.
- The app version and data schema version are separate concepts.
- Recovery must be possible before a migration is considered production-ready.
