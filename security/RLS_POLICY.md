# Production RLS Contract

This file defines the contract for the future Supabase adapter.

Every user-owned table must include an owner/user reference and enforce:

- SELECT: authenticated user can read only their own rows.
- INSERT: authenticated user can create only rows owned by themselves.
- UPDATE: authenticated user can update only their own rows.
- DELETE: application uses soft delete; permanent deletion requires a separate protected workflow.

The browser must never receive a Supabase service-role key.
RLS is the authoritative boundary; UI checks are convenience only.
