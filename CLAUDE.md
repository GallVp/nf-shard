# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

nf-shard is a self-hosted, open source UI for monitoring Nextflow pipeline runs — a drop-in replacement for
community `nf-tower`. It implements the `nf-tower` plugin-compatible trace API so Nextflow's `tower {}` block can
report run/task progress to it, and it provides a searchable UI over historical runs, workspaces, and metrics.

Stack: Next.js 14 (App Router) / React / TypeScript, PostgreSQL via Prisma ORM, Tailwind + shadcn/ui + Ant
Design/MUI components, Cypress for E2E tests. There is also a GraphQL client (urql + graphql-codegen) that talks to
a separate, external "nf-shard-orchestrator" service (not in this repo) for launching/streaming/terminating
pipeline jobs — that schema lives outside this repo, so `yarn codegen` only works against a local checkout of it.

## Commands

Local Postgres must be running for most dev/test flows: `docker compose --profile db up --detach` (exposes
Postgres on `localhost:5435`, matching `POSTGRES_URI` in `.env`).

```bash
yarn                 # install deps
yarn migrate         # prisma migrate dev (create/apply migrations against .env's POSTGRES_URI)
yarn generate        # prisma generate (regenerate the Prisma client after schema changes)
yarn dev             # next dev --turbo
yarn build           # next build (outputs to build/, see distDir in next.config.js)
yarn lint            # next lint
yarn studio          # prisma studio
```

E2E tests (Cypress) run against a dedicated `.env.test` / test database, never against dev data:

```bash
yarn test:env               # generate .env.test with fresh secrets + test DB URI (localhost:5435/postgres_test)
docker compose --env-file .env.test --profile db up --detach
yarn test:db                # apply migrations to the test DB
yarn test:build             # NODE_ENV=test next build
yarn test:start             # start the built app against .env.test
yarn test:cypress:open      # interactive runner
yarn test:cypress:run       # headless run
yarn test:cypress:all       # bash test/scripts/test_cypress_all.sh — runs the full flow above end-to-end
```

To run a single Cypress spec against an already-running app: `dotenv -e .env.test npx cypress run --spec cypress/e2e/signin/signin.cy.ts`.

CI (`.github/workflows/ci.yml`) runs `yarn test:cypress:all` on every PR against the `dev` branch; this is the
canonical way the full test suite is expected to be invoked. See `test/scripts/wf_cypress_e2e.sh` for the exact
sequence CI runs.

## Git workflow

Feature branches merge into `dev` (PRs target `dev`, similar to nf-core pipelines — see `README.md`'s
Contribution Workflow). `dev` is periodically merged into `main`, tagged with a new version, and released; a
published GitHub release triggers `.github/workflows/release.yml`, which builds and pushes the Docker image to
GHCR (`ghcr.io/GallVp/nf-shard`). Don't push directly to `main` or create tags/releases without being asked.

## Architecture

### Auth model (`src/middleware.ts`, `src/lib/secrets.ts`)

All routes except `/signin`, `/api/signin`, `/api/auth` go through `middleware.ts`. Two independent credential
types are accepted, and each is scoped to a different kind of path:

- **API token** (`Authorization: Bearer <base64>`) — only valid on `/api/*` paths; a request with an API token on a
  non-API path is rejected outright. The token is base64-encoded, prefixed with `@token:`, and verified by SHA-256
  comparison against either the workspace's stored `accessToken` (when a `workspaceId` query param is present — see
  `/api/auth`) or `DEFAULT_ACCESS_TOKEN` (when it isn't). This is the credential Nextflow's `tower {}` plugin sends.
- **Session token** (`token` cookie, a JWT signed with `APP_SECRET_KEY`, 1h expiry) — used by the browser UI after
  signing in via username/password (`APP_USERNAME`/`APP_PASSWORD`, password compared as SHA-256).

When adding a new route under `src/app/api/`, decide up front whether it's meant to be hit by Nextflow (API token)
or only by the browser (session token) — the middleware enforces the split, it isn't opt-in per-route.

### nf-tower-compatible trace API (`src/app/api/trace/`, `src/app/api/runs/`, `src/app/api/search/`)

This is the surface Nextflow talks to via its `tower` config block. The lifecycle for one workflow run is:
`trace/create` (mint a `workflowId`) → `trace/[id]/begin` (workflow started, writes the `Workflow` row and computes
the `searchable` text column) → `trace/[id]/progress` (repeated task/progress upserts while running) →
`trace/[id]/heartbeat` (keep-alive, bumps `updatedAt`) → `trace/[id]/complete` (final workflow + metrics, fires
Slack webhooks via `src/services/slack`). `src/app/api/runs/[id]` and `src/app/api/search` serve the UI's read side
over the same `Workflow`/`Task`/`Progress` tables. Request/response shapes for each trace endpoint are defined
per-route in a local `types.ts` — check that file before changing a payload shape.

### Data layer (`prisma/schema.prisma`, `src/services/prisma/`)

Core models: `Workflow` (one row per run, includes nf-tower's full metadata plus nf-shard additions — `tags`,
`searchable` (trigram-indexed via a raw `Gin` index for free-text search), `workspaceId`), `Workspace` (scopes
workflows and holds a per-workspace `accessToken`), plus `Task`/`Progress`/`Metric`-shaped JSON columns (see
`prisma-json-types-generator` annotations like `/// [Nextflow]` above JSON fields in the schema — these give
generated JSON columns real TypeScript types instead of `any`). All DB access goes through functions in
`src/services/prisma/*.ts` (`workflow.ts`, `workspace.ts`, `search.ts`, `appSettings.ts`) re-exported from
`src/services/prisma/index.ts` — routes should call these rather than using `prisma` directly where an equivalent
already exists.

### Path aliases (`tsconfig.json`)

`@/*` → `src/*`, `@components/*` → `src/app/components/*`, `@services/*` → `src/services/*`, `@common/*` →
`src/common/*`. Prefer these over relative imports for anything outside the current feature folder.

### GraphQL client (`src/graphql/`, `src/generated/graphql/`, `src/lib/clients/urqlClient.tsx`)

Separate from the trace/REST API above: this is a urql client used by the UI to launch/stream/terminate jobs on an
external orchestrator service over HTTP (`:4002/query`) and WebSocket subscriptions (`:4001/query`). `.graphql`
documents under `src/graphql/` are compiled by `yarn codegen` (`codegen.ts`) into `src/generated/graphql/` against
that orchestrator's schema — codegen requires a local path to that schema and generally won't run outside a dev
environment that has it checked out; don't try to regenerate this unless you actually have that schema available.

### UI structure (`src/app/`)

Standard Next.js App Router: each top-level feature (`runs`, `pipeline`, `workspaces`, `compute`, `launch`,
`settings`, `signin`, `guide`) is a route folder with its own `components/` and, where present, `actions/` (Next.js
server actions) subfolders. Shared primitives live in `src/components/ui` (shadcn/ui, configured via
`components.json`); cross-feature helpers live in `src/common/` and `src/lib/`.
