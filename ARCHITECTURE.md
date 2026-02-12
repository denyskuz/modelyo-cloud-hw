# Architecture

This doc is intentionally short and focused on the parts that matter for the homework: tenant isolation, RBAC, and how data flows through the mock API.

## High-level structure

- Routes live under `src/app/s/[tenant]/(app)/...` (dashboard, provision wizard, service details).
- `src/proxy.ts` rewrites public paths to `/s/{tenant}{pathname}` based on the request `Host`.
- Domain types live in `src/domain/*` and the in-memory DB lives in `src/mocks/db.ts`.
- The mock API is in `src/services/mock-api/index.ts` and is called from route handlers in `src/app/api/...`.

## Multi-tenancy flow

1. **Tenant selection**: `src/proxy.ts` reads `Host` (e.g. `acme.localhost:3000`), maps to tenant slug `acme`, rewrites to `/s/acme/...`. No client-supplied tenant is trusted.
2. **Isolation rules**:
   - All server data calls pass `tenant` from the route params. `listAll(tenant)`, `getOne(tenant, type, id)`, `listAuditLog(tenant)` read only from `DB[tenant]`.
   - Mutations (mutate, provision, deleteService) are invoked via API routes with `tenant` in the body; the API validates `tenant` with `isTenantSlug()` and calls the mock layer with that tenant only. The mock layer indexes by `tenant` and never touches another tenant’s data.
   - Deleting or mutating in tenant A never affects tenant B; unknown or wrong-tenant ids result in “Service not found”.
3. **Switching tenant**: User picks another tenant in the header; the app performs full navigation to the other subdomain (e.g. `globex.localhost:3000`). The new request gets a new tenant from Host; no shared state or cache between tenants.

## RBAC flow

1. **Role**: Stored in a cookie (demo); read by server and provided via `RoleProvider` / `useRole()`. Values: `admin` | `viewer`.
2. **Ability**: `can(role, action)` in `auth/ability.ts` implements a fixed matrix (Admin: all; Viewer: none for provision/mutate/rule actions).
3. **Route guards**: Provision layout checks `can(role, ACTIONS.SERVICE_PROVISION)`; if false, redirects to access-denied. Viewer never reaches the provision page.
4. **UI guards**: Buttons and links for mutate/delete/provision are wrapped in `<Can action={ACTIONS.SERVICE_MUTATE}>` or `<Can action={ACTIONS.SERVICE_PROVISION}>`. Viewer does not see Delete or other mutating actions; attempting to call the API without the role would still require knowing the URL and would be blocked by the same ability checks if enforced server-side (API routes can be extended to verify role).
5. **Destructive actions**: Delete (and other destructive operations) use a confirmation dialog (`ActionDialog` with `variant="destructive"`) before calling the API.
6. **API enforcement**: Mutating API routes also enforce RBAC by reading the role cookie and returning `403` when a Viewer tries to provision/mutate/delete.

If this was production, I would not store role/permissions as a client-controlled value. The usual approach would be: real authentication (OIDC/SSO), server-trusted session/JWT, server-side permission resolution (DB/IAM), and deny-by-default authorization in a shared guard.

## Service type abstraction and mock API layer

- **Abstraction**: The app works with a single `Service` union (`KubernetesCluster | ApiGateway | PostgresDb`) and `ServiceType`. Detail pages and actions are per type, but the list and routing use the same patterns.
- **Mock API** (`src/services/mock-api/index.ts`):
  - **Read**: `listAll(tenant)`, `getOne(tenant, type, id)`, `listAuditLog(tenant)` – return data only for the given tenant.
  - **Write**: `mutate(tenant, type, id, action, payload?)`, `provision(tenant, payload)`, `deleteService(tenant, type, id)`. Each validates tenant and type; operates only on `DB[tenant]`; appends to `DB[tenant].auditLog` where required.
- **Replacement**: To swap the mock for a real backend, implement the same function signatures (or equivalent HTTP contracts) in a new module and point the server components and API routes to that module. The UI and auth/tenant logic remain unchanged; only the data source changes.

## API routes (mutations)

- **POST /api/services/mutate** – body: `{ tenant, type, id, action, payload? }`. Calls `mutate(tenant, type, id, action, payload)`; returns updated service or 404.
- **POST /api/services/delete** – body: `{ tenant, type, id }`. Calls `deleteService(tenant, type, id)`; returns `{ ok: true }` or 404.
- **POST /api/services/provision** – body: `{ tenant, payload }`. Validates and calls `provision(tenant, payload)`; returns `{ progress, createdId }` or 400.

All routes validate `tenant` with `isTenantSlug()`. The mock layer guarantees tenant isolation and audit log entries for the acting tenant only.
