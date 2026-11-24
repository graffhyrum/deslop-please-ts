# Todo verification map

This directory is the maintained source for verifying the user-facing behavior of the multi-tenant Todo app. Read the index before driving the app, then use the matching feature file as the recipe.

## Baseline preconditions

- Launch Todo on `http://127.0.0.1:<port>` with a fresh process (empty tenant list).
- Run `agent-browser open http://127.0.0.1:<port>` and confirm the page title is `Multi-tenant Todo`.
- Run the Doctor checks and require HTTP 200, a JSON tenant array, and the title.
- Never drive an instance that was not started by this verification run.

## Driving conventions

- Start every recipe from the baseline state unless its preconditions say otherwise.
- Prefer stable selectors (`input#new-tenant`, `button#add-tenant`, `select#tenant`, `input#new-todo`, `button#add-todo`, `input[data-id]`, `button[data-delete]`) over refs.
- Capture the feature ID with every artifact filename.
- Restore is automatic: a fresh process has no data, so re-launch to reset.
- Do not report a skipped entry point as verified through a different path.

## Proof and skip reporting

- Capture the user action and the resulting state, not only the final screen.
- UI proof includes an ARIA snapshot and a screenshot with the app title visible.
- API proof includes the response body and HTTP status.
- Mutation proof includes a read-only second view of the stored value.
- Report an unreachable path with the attempted command and the unmet precondition.

## Feature entry contract

Each feature file starts with an H1 title and one paragraph describing the user-visible behavior. It then uses exactly four H2 sections in this order: `Sub-features`, `How to get to it (user POV)`, `Driving it with agent-browser`, and `Gotchas`.

## Features

- [Manage tenants](./manage-tenants.md) covers creating tenants, selecting them, and the empty-name rejection.
- [Manage todos](./manage-todos.md) covers creating, toggling, and deleting todos for a selected tenant.
- [Tenant isolation](./tenant-isolation.md) covers todos staying scoped to their tenant across switches.
