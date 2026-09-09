# MJ Brasil

You are working in **MJ Brasil** — a client app built and maintained by Astralitics,
composed from the Astralitics catalog on the standard chassis (Supabase + Drizzle + tRPC +
Vite + shadcn + Vercel). This file is regenerated from `.astralitics/manifest.json`.

## Architecture in one paragraph
This app is composed of **Modules** (installed from the catalog into `apps/web/src/modules/`)
that operate on **Entities** (global data shapes), with `org_id` as the tenant boundary.
Resources are provisioned per stage; Connections wire them. Full design: `docs/ARCHITECTURE.md`.

## Where things go
| Concern | Path | Editable? |
|---|---|---|
| App-local features | `apps/web/src/app-local/` | ✅ Yes |
| App routes (compose modules into UX) | `apps/web/src/routes/` | ✅ Yes |
| App-local entities | `packages/db/src/app-local/` | ✅ Yes |
| **Installed module cells** | `apps/web/src/modules/<name>/` | ❌ **Managed — drift ejects** |
| `.astralitics/*` | bot/CLI-managed | ❌ Don't touch |

## Out of scope (these belong in Astralitics / the catalog)
- Installing/updating modules (run the `astralitics` CLI from Astralitics, not here)
- Adding global entities (those live in the catalog repo)
- Provisioning resources / rotating credentials

## Rules
- Don't hand-edit files under `apps/web/src/modules/*` — that's a managed cell; a local edit
  ejects the file from catalog updates (`pnpm drift:check` flags it).
- Reach a module's data by calling its exported functions; never write another module's tables.
- `org_id` is on every business table (soft, no cross-module FK); the resolver populates it.

## Read before acting
- `docs/ARCHITECTURE.md` · `docs/CONVENTIONS.md`
- Installed modules + versions: `.astralitics/manifest.json`
