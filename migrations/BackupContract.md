# Backup / Recovery Contract

Before production schema migrations:

1. Create a verified database backup.
2. Record current schema version.
3. Run migration in a staging environment.
4. Validate row counts, foreign-key references, ownership boundaries, and financial totals.
5. Apply to production.
6. Re-run validation.
7. Keep the pre-migration backup until verification passes.

A migration is not production-ready if recovery has not been tested.
