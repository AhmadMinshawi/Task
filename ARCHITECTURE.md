# TaskV Foundation V1

This is a clean rebuild foundation, not a migration of the old monolith.

## Rules
- One source of truth: AppState.
- Domain logic belongs to domain managers.
- UI never performs business calculations.
- Cross-domain communication uses EventBus or explicit manager contracts.
- Data persistence will be isolated behind repositories.
- Search is a service and is prefix-first.
- Finance is independent from the UI and can be tested before UI integration.
- New modules must not mutate another module's internal state directly.
- Version changes only when a build is approved for use.

## Planned domains
Projects, Clients, Finance, Expenses, Tasks, Deliveries, Reports, Auth.

## Planned infrastructure
Repository layer, Supabase adapter, Auth/RLS integration, MigrationManager,
Backup/Recovery procedures, validation, audit/activity log, component system,
routing/navigation, and production build pipeline.
