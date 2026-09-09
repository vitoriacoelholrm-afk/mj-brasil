# Architecture

This app was built and is maintained by **Astralitics**, composed from the Astralitics catalog on
the standard chassis (Supabase + Drizzle + tRPC + Vite + shadcn + Vercel).

This is a deliberately **thin per-app stub**: it does **not** restate the model. The model is one
canonical document — re-typing it here is exactly what let it drift (this file once read
"7 primitives" while canonical said 9). For *what the primitives are, how they compose, when to
develop each, and the invariants*, read the source of truth:

> **Canonical architecture → `ARCHITECTURE.md` in the control-plane (`astralitics-app`).**
> §3 is the primitive reference — mirrored on the `/architecture` page and in `architecture.json`.
> If anything here disagrees with that doc, **the canonical doc wins.**

## The model, in one line
Everything is one of **9 primitives** in four groups (full spec → canonical §3):
**data** — Definition · Entity · **infra** — Resource · Connection · **behavior** — Tool · Function · Workflow · **composition** — Module · Chassis.
The names are **reserved words**: Capitalized = the primitive, lowercase = the plain word (a Function is not a Workflow).

## This app — where things go
The one genuinely app-specific thing worth stating here:

| Concern | Path | Editable? |
|---|---|---|
| App-local features | `apps/web/src/app-local/` | ✅ Yes |
| App routes | `apps/web/src/routes/` | ✅ Yes |
| App-local entities | `packages/db/src/app-local/` | ✅ Yes |
| App-local Definitions / vocabulary | `packages/db/src/_vocabulary.ts` | ✅ Yes |
| Installed module cells | `apps/web/src/modules/<name>/` | ❌ Managed — drift ejects |
| `.astralitics/*` (manifest + realized Chassis) | bot/CLI-managed | ❌ Don't touch |

What this app is actually composed of — its installed Modules, Resources, Connections, and versions —
is its realized **Chassis**, recorded in **`.astralitics/manifest.json`** + **`app.config.json`**,
never duplicated in prose here.

<!--
  TODO(create_new_app): this file should be GENERATED, not seeded. The table above is static chassis
  layout; the "model in one line" should be rendered from canonical §3 + this app's manifest at
  app-creation time, so a forked app's summary can never drift from canonical again — the same
  "one source → rendered surfaces" rule as architecture.json and the /architecture page.
  Owner: the control-plane create_new_app workflow (a future render-docs step). See
  packages/modules/control-plane/src/workflows/createNewApp.ts.
-->
