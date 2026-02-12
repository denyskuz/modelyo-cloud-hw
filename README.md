# Modelyo – Secured & Managed Service Cloud Portal (Homework)

Simplified Modelyo-style multi-tenant cloud portal for managing **Kubernetes clusters**, **API Gateways**, and **PostgreSQL** databases.

## Project overview

The app is built around a few core ideas from the spec:

- **Tenants** (e.g. Acme Corp, Globex Industries) each have an isolated workspace. Data and actions are strictly scoped by tenant; there is no cross-tenant data leakage.
- **Service types**: Kubernetes clusters, API Gateways, and PostgreSQL databases. Each type has its own detail pages, actions (restart, scale, add rule, backup, etc.), and a **Delete** action (Admin only).
- **Roles**: **Admin** can provision, mutate (including delete) services, and edit gateway rules. **Viewer** has read-only access; protected routes show Access Denied.
- **Dashboard**: grouped service cards + filters (service type + health), spend/health summaries, and an Activity & Audit panel.

Spec file used for the implementation is kept in the repo for reference and is intentionally **not committed to git**:

- `docs/Modelyo_Homework_DenysK.docx` (gitignored)

## Architecture decisions

- **Framework**: Next.js 16 (App Router) for server components + route handlers, with client components where interaction is needed.
- **State management**: no global store. Tenant is derived from the request host (subdomain) and is represented via the `[tenant]` route segment; role is stored in a demo cookie and exposed via `RoleContext`.
- **Updates after mutations**: service detail pages keep local component state and update it from the mutation response (instead of calling `router.refresh()` everywhere).
- **Folder structure**:
  - `src/app/s/[tenant]/(app)/` – tenant-scoped routes (dashboard, provision, services/…).
  - `src/auth/` – permissions, ability matrix, role/tenant context.
  - `src/components/` – UI (dashboard, provisioning wizard, service details, sidebar, shared UI).
  - `src/domain/` – service types (kubernetes, gateway, postgres), provisioning schema, cost, validation.
  - `src/services/mock-api/` – mock API (listAll, getOne, mutate, provision, deleteService, listAuditLog). Mutations only touch `DB[tenant]`.
  - `src/mocks/db.ts` – in-memory DB per tenant (services + auditLog).
- **Modeling of 3 service types**: Unified `Service` union and `ServiceType`; each type has its own domain types and detail pages; mock API and API routes validate type and tenant on every call.

## Setup

### Install

```bash
npm install
```

### Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000); you are redirected to the default tenant (e.g. `acme.localhost:3000` if using subdomains).

### Build

```bash
npm run build
```

Notes:

- This repo uses webpack for `dev` and `build` (`next dev --webpack`, `next build --webpack`) to avoid Turbopack-specific issues in restricted environments.

### Test

```bash
npm test
```

Runs unit tests (ability, validation, provisioning schema, mock-api tenant isolation, delete isolation, audit log).

### Lint / format

```bash
npm run lint
npm run format:check
```

## Multi-tenant routing (subdomain)

- **Tenant** is derived from the **Host** header in the edge `proxy` (e.g. `acme.localhost:3000` → tenant `acme`). The client never supplies a trusted tenant id.
- **No subdomain** → redirect to the default tenant (acme).
- **Proxy** rewrites to `/s/{tenant}{pathname}` so all app routes live under `src/app/s/[tenant]/(app)/`.
- **Tenant switcher** uses full navigation to the new subdomain so there is no shared in-memory or cached data across tenants.

**Local dev with subdomains** — add to `/etc/hosts` (macOS/Linux) or `C:\Windows\System32\drivers\etc\hosts` (Windows):

```text
127.0.0.1   acme.localhost
127.0.0.1   globex.localhost
```

Then use [http://acme.localhost:3000](http://acme.localhost:3000) and [http://globex.localhost:3000](http://globex.localhost:3000).

## Screenshots

Place screenshots here and reference them in this section (or add a short recording link):

- `docs/screenshots/dashboard.png`
- `docs/screenshots/provision.png`
- `docs/screenshots/k8s-detail.png`

Quick walkthrough I used while testing:

1. Tenant switching: `acme.localhost:3000` → `globex.localhost:3000`.
2. Role switching: Admin → Viewer (mutating actions disappear; `/provision` shows Access Denied).
3. Provision as Admin (validation + progress) and confirm the new service appears on dashboard.
4. Open a service card, run an action, and see the timeline update.

## Known limitations

- **Mock layer**: Data is in-memory; restart clears changes. The mock is designed to be swapped for a real backend by implementing the same surface in `src/services/` and wiring API routes to it.
- **RBAC (demo-only)**: Role switching is implemented via a cookie to keep the Admin/Viewer demo simple. In a real system the role/permissions must come from a trusted identity (session/JWT) and be enforced server-side.
- **Audit log UI**: audit entries are appended on the server. The dashboard fetches the audit log server-side, so it updates on navigation; with more time I'd make it reactive without needing a navigation.

## Next steps

- Replace mock API with real backend (REST or tRPC) behind the same interface.
- Add auth (e.g. NextAuth) and resolve role/server-side.
- Persist audit log (DB or external) and add retention/pagination.
- Add E2E tests for critical flows (provision, delete, tenant switch).

## Live deployment

Not deployed.

## Deploy on Vercel

See [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying). Ensure tenant subdomains (e.g. `acme.yourdomain.com`) are configured and the proxy has access to the Host header.
