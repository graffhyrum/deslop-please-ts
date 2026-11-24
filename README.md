# deslop-please-ts

[![CI](https://github.com/graffhyrum/deslop-please-ts/actions/workflows/ci.yml/badge.svg)](https://github.com/graffhyrum/deslop-please-ts/actions/workflows/ci.yml)
[![Bun](https://img.shields.io/badge/Bun-1.4.4-f9f1e1?logo=bun)](https://bun.sh)

> A TypeScript project template with a quiet, fail-fast quality gate. Clone it, run `bun run vet`, and start building — the gate stays green while you replace the sample app with your own code.

---

## TL;DR

### The Problem

Starting a TypeScript project means wiring up a dozen tools before writing a line of real code: a runtime, a linter, a type-checker, a formatter, a test runner, coverage thresholds, dependency audits, and CI. Most templates either ship too little (bare `tsconfig`) or too much (a framework you didn't ask for), and none of them enforce anything — you discover the gaps in production.

### The Solution

`deslop-please-ts` is a **clone-and-vet** template: a Bun-based TypeScript project with a single quiet quality gate (`bun run vet`) that runs every check in order and prints nothing when they pass. It ships a working multi-tenant todo app as the sample, so `bun run dev` gives you a real server on day one, and every check is already green.

### Why Use This Template?

| Feature | deslop-please-ts | Typical TS template |
|---|---|---|
| Single quiet gate (`bun run vet`) | ✅ | ❌ (separate scripts) |
| Type-aware linting (oxlint) | ✅ | ⚠️ (eslint, slow) |
| Mutation testing in the gate | ✅ | ❌ |
| Coverage threshold enforcement | ✅ (100% gated) | ⚠️ (advisory) |
| Dependency audit in the gate | ✅ | ❌ |
| Architecture boundary check | ✅ (depcruise) | ❌ |
| Deep-module package layout | ✅ | ❌ |
| Sample running app | ✅ (Bun + vanilla TS) | ⚠️ (hello world) |
| CI workflow included | ✅ | ⚠️ |

---

## Quick Example

```bash
# Clone and enter
git clone https://github.com/graffhyrum/deslop-please-ts.git my-app
cd my-app

# Install (Bun 1.4.4)
bun install

# Run the full quality gate (should print nothing)
bun run vet

# Start the sample app
bun run dev
# → Todo app listening on http://localhost:3000
```

Then open `http://localhost:3000`, add a tenant, add a todo, toggle it. When you're ready, delete `src/store.ts`, `src/routes.ts`, `src/client.ts`, and `src/index.html`, and replace them with your own code — keeping `bun run vet` green.

---

## Design Philosophy

1. **One gate, zero noise.** `bun run vet` runs every check in a fixed order and prints only the first failing step. Green is silent. You never wonder "did I run the right command?"
2. **Deep modules, narrow interfaces.** Code in `src/packages/` is organized as deep modules: lots of behavior behind a small entry-point surface. `bun run lint:boundaries` enforces the import boundary.
3. **No classes for services.** Factory functions (`createStore()`, `createApiHandler()`) keep state explicit and testable. No `this` surprises.
4. **Types at the boundary, ArkType inside.** Environment variables are validated with `@arkenv/core` in `config.ts`; runtime values are validated with `ArkType`. No `any`, no unchecked casts.
5. **Template literals only.** Strings are built with `${}` interpolation. No `+` concatenation, ever.
6. **Direct imports, no barrels.** Import from the source file (`./store.ts`), never from an `index.ts` re-export.

---

## Comparison vs Alternatives

| | deslop-please-ts | create-t3-app | Vite + TS | Bun init |
|---|---|---|---|---|
| Runtime | Bun | Node (Next) | Vite/Node | Bun |
| Quality gate | ✅ single quiet gate | ❌ | ❌ | ❌ |
| Mutation testing | ✅ | ❌ | ❌ | ❌ |
| Coverage threshold | ✅ enforced | ❌ | ❌ | ❌ |
| Architecture lint | ✅ depcruise | ❌ | ❌ | ❌ |
| Sample app | ✅ multi-tenant todo | ✅ (Next) | ❌ (blank) | ❌ (hello world) |
| Frontend | Vanilla TS + HTML imports | React/Next | Your choice | None |
| Opinionated framework | ❌ (bring your own) | ✅ (Next/tRPC) | ❌ | ❌ |

Use `create-t3-app` if you want a full-stack React/Next framework. Use this template if you want a quiet, enforced quality gate and the freedom to choose your own stack.

---

## Installation

### Clone (recommended)

```bash
git clone https://github.com/graffhyrum/deslop-please-ts.git my-app
cd my-app
bun install
```

### From a specific tag

```bash
git clone --branch v0.3.0 https://github.com/graffhyrum/deslop-please-ts.git my-app
cd my-app
bun install
```

### Prerequisites

- [Bun](https://bun.sh) `1.4.4` (CI pins `1.4.4`; `packageManager` is `bun@1.4.5`)
- Network access for `bun run vet` (the `audit` step queries the npm advisory registry)

---

## Quick Start

1. **Clone and install.**
   ```bash
   git clone https://github.com/graffhyrum/deslop-please-ts.git my-app
   cd my-app
   bun install
   ```
2. **Run the quality gate.** It should print nothing.
   ```bash
   bun run vet
   ```
3. **Start the sample app.**
   ```bash
   bun run dev
   ```
4. **Open** `http://localhost:3000` and try adding a tenant and a todo.
5. **Replace the sample.** Delete `src/store.ts`, `src/routes.ts`, `src/client.ts`, and `src/index.html`; add your own modules under `src/` and `src/packages/`. Keep `bun run vet` green.

---

## Command Reference

| Command | Description |
|---|---|
| `bun run dev` | Run `src/index.ts` with hot reload |
| `bun run build` | Build for production to `./dist` |
| `bun run start` | Run `src/index.ts` |
| `bun run test` | Run tests |
| `bun run test:coverage` | Run tests and enforce the coverage threshold |
| `bun run typecheck` | Type-check with `bun check` |
| `bun run lint` | Lint with oxlint (type-aware) |
| `bun run lint:fix` | Apply lint fixes |
| `bun run lint:boundaries` | Check deep-module import boundaries (depcruise) |
| `bun run fmt` | Format with `bun fmt` |
| `bun run fmt:check` | Check formatting |
| `bun run rule-validator` | Run the custom rule validator |
| `bun run stepdown` | Check stepdown rule on `src/**/*.ts` |
| `bun run crap4ts` | Coverage + CRAP score gate |
| `bun run mutate4ts` | Mutation testing on `src/store.ts` |
| `bun run mutate4ts:scan` | Scan for mutation-testing targets |
| `bun run vet` | Run the full quality gate |
| `bun run version-packages` | Bump versions via changesets |
| `bun run release` | Publish via changesets |

### Quality Gate Steps (`bun run vet`)

The gate runs these in order and stops at the first failure:

| # | Step | Command |
|---|---|---|
| 1 | fmt | `bun fmt --check` |
| 2 | audit | `bun audit` |
| 3 | typecheck | `bun check` |
| 4 | lint | `oxlint --type-aware` |
| 5 | lint:boundaries | `depcruise src/packages` |
| 6 | rule-validator | `rule-validator` |
| 7 | stepdown | `stepdown-rule` |
| 8 | crap4ts | coverage, then `crap4ts` |
| 9 | mutate4ts | mutation testing on `src/store.ts` |
| 10 | test | `bun test` with the sample coverage threshold (100% gated) |

> The `audit` step queries the npm advisory registry, so `vet` needs network access. A new advisory against any dependency — even a transitive one your change didn't touch — fails `vet` until you update that dependency and commit the new lockfile.

The sample coverage baseline is 100% functions and 100% lines for gated files; `scripts/coverage-threshold.ts` holds that threshold.

---

## Configuration

Environment variables are validated with `@arkenv/core` in `config.ts`:

```ts
// config.ts
import arkenv from "@arkenv/core";

const env = arkenv({
  NODE_ENV: "'development' | 'production' | 'test' = 'development'",
  PORT: "number = 3000",
});

export const CONFIG = {
  nodeEnv: env.NODE_ENV,
  isDevelopment: env.NODE_ENV === "development",
  isProduction: env.NODE_ENV === "production",
  isTest: env.NODE_ENV === "test",
  port: env.PORT,
} as const;
```

| Variable | Type | Default | Description |
|---|---|---|---|
| `NODE_ENV` | `development \| production \| test` | `development` | Runtime environment |
| `PORT` | number | `3000` | HTTP server port |

Access via `CONFIG.isDevelopment`, `CONFIG.isProduction`, `CONFIG.port`, etc. Never read `process.env` directly.

---

## Architecture

```
.
├── src/
│   ├── index.ts          # Bun.serve entry point
│   ├── index.html        # Sample UI (HTML imports TS/CSS)
│   ├── client.ts         # Browser-side todo client
│   ├── store.ts          # In-memory multi-tenant todo store
│   ├── routes.ts         # API route handler
│   ├── validation.ts     # ArkType parsers + branded IDs
│   └── packages/         # Deep modules (entry-point boundary enforced)
│       └── example/
├── scripts/              # vet, crap4ts, coverage threshold
├── config.ts             # @arkenv/core environment config
├── tsconfig.json
├── .github/workflows/    # CI runs bun install + bun run vet
└── package.json
```

### Data Flow (sample app)

```
Browser (client.ts)
   │  fetch /api/*
   ▼
Bun.serve (index.ts) ──► createApiHandler (routes.ts)
                              │
                              ▼
                       createStore (store.ts)
                              │
                              ▼
                    Map<TenantId, Tenant>
                    Map<TodoId, Todo>
```

---

## Troubleshooting

### `bun run vet` fails on `audit`

A new advisory was published against a dependency (even a transitive one). Update and re-lock:

```bash
bun update
bun install
bun run vet
```

### `bun run vet` fails on `fmt` or `lint`

Auto-fix then re-run:

```bash
bun run fmt
bun run lint:fix
bun run vet
```

### `bun check` reports type errors after editing

Run the type-checker directly to see all errors:

```bash
bun run typecheck
```

Fix errors before running the full gate.

### `bun run mutate4ts` fails or times out

Mutation testing is heavy. Run it in isolation:

```bash
bun run mutate4ts:scan
bun run mutate4ts
```

### Port already in use

`PORT` defaults to `3000`. Override it:

```bash
PORT=4000 bun run dev
```

### Coverage threshold failures

The baseline is 100% functions and 100% lines for gated files. Check which file dropped:

```bash
bun run test:coverage
```

---

## Limitations

- **Sample app only.** `src/store.ts`, `src/routes.ts`, `src/client.ts`, and `src/index.html` are a throwaway multi-tenant todo app. They exist to keep the gate green; replace them.
- **No production database.** The sample store is in-memory. There is no persistence, auth, or multi-user session handling.
- **Bun-only dev.** Development and the quality gate assume Bun. The published artifact can run on Node, but dev tooling is Bun-first.
- **Network required for `vet`.** The `audit` step needs network access to the npm advisory registry.
- **No built-in allow file.** There is no suppression mechanism for lint findings; use external baselines (e.g., compliance-ratchet).
- **Single-tenant dev server.** The sample app has no auth; do not expose it publicly.

---

## FAQ

**Q: Is this a framework?**
No. It's a template with a quality gate. You bring your own framework, ORM, and frontend.

**Q: Can I use npm or pnpm instead of Bun?**
Dev tooling is Bun-first. You can adapt scripts to npm, but `bun run vet` and the Bun APIs (`Bun.serve`, etc.) assume Bun.

**Q: Why oxlint instead of ESLint?**
oxlint is faster and type-aware via `oxlint-tsgolint`. The template prioritizes gate speed.

**Q: Why mutation testing in a template?**
To prove the sample tests actually catch regressions, not just execute code. Remove `mutate4ts` from `scripts/vet.ts` if it's too heavy for your project.

**Q: How do I change the coverage threshold?**
Edit `scripts/coverage-threshold.ts`.

**Q: Where should new packages go?**
Under `src/packages/<name>/`, following the deep-module layout in `src/packages/README.md`. Run `bun run lint:boundaries` to verify.

**Q: Is there a database?**
No. The sample uses in-memory `Map`s. Add `bun:sqlite` or `Bun.sql` yourself.

**Q: What's the `deslop-please-ts` name about?**
This repository is seeded from `ts-template` and is being developed into `deslop-please-ts`, a TypeScript architectural linter based on Ousterhout's "deep modules, narrow interfaces" philosophy. The template is the starting point; the linter is not implemented yet. See the open issues for the roadmap.

---

## About Contributions

Issues and pull requests are welcome. Please open an issue first to discuss significant changes, and keep pull requests focused on a single concern. There is no `CONTRIBUTING.md` yet; this section will be expanded as the project matures.

---

## License

No license file is present yet. Add a `LICENSE` file (e.g., MIT) before publishing.