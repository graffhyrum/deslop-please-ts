---
name: verify-todo
description: Verify the multi-tenant Todo web app (Bun + vanilla TS) end to end with agent-browser. Use when proving a Todo feature works, smoke-testing the UI after a change, capturing evidence for a PR, or reproducing a bug in the running app.
---

# Verify: Multi-tenant Todo

A small multi-tenant web todo app served by Bun on one port. State is in-memory per process, so every launch starts empty: that is the isolation guarantee. Never drive an instance this run did not start.

## Launch

Start the app from the repo root on a port this run owns:

```bash
PORT=<port> bun src/index.ts > /tmp/opencode/todo-<run-id>.log 2>&1 &
echo $! > /tmp/opencode/todo-<run-id>.pid
```

- Default port is 3000 (from `config.ts`); pick a free port per run, e.g. 3100, to avoid colliding with a dev server.
- Ready signal: the log line `Todo app listening on http://localhost:<port>`. Wait for that exact line, not just a listening socket.
- There are no migrations or seed data; an empty tenant list is the correct starting state.
- Teardown is mandatory; see Cleanup.

## Doctor

Run before driving, and whenever anything looks off. All checks are read-only.

```bash
# 1. HTTP root answers
curl -sS -o /dev/null -w "%{http_code}\n" http://127.0.0.1:<port>/
# expect: 200

# 2. API responds with a tenant array
curl -sS http://127.0.0.1:<port>/api/tenants
# expect: [] or a JSON array

# 3. Page title
curl -sS http://127.0.0.1:<port>/ | grep -o '<title>[^<]*</title>'
# expect: <title>Multi-tenant Todo</title>

# 4. The port is owned by a bun process we started
ss -ltnp | grep ":<port> "
```

A doctor pass requires 200, a JSON array, the title, and a bun listener on the port. If any fails, do not drive; relaunch.

## Drive

Harness: `agent-browser`. Open once per run:

```bash
agent-browser open http://127.0.0.1:<port>
```

Stable handles (prefer these over refs, which change after every render):

- Tenant name input: `input#new-tenant` (ARIA textbox "New tenant name")
- Add tenant button: `button#add-tenant` (ARIA button "Add tenant")
- Tenant selector: `select#tenant` (combobox; option text is the tenant name)
- Todo title input: `input#new-todo` (ARIA textbox "New todo")
- Add todo button: `button#add-todo` (ARIA button "Add todo")
- Todo list container: `div#todos`
- A todo checkbox: `input[data-id="<todo-id>"]`
- A todo delete button: `button[data-delete="<todo-id>"]`

Recipes:

- **Add tenant:** fill `input#new-tenant`, click `button#add-tenant`. The new tenant is created and selected; the input clears.
- **Switch tenant:** `agent-browser select 'select#tenant' '<tenant name>'`.
- **Add todo:** fill `input#new-todo`, click `button#add-todo`. Requires a selected tenant; otherwise the request is silently skipped.
- **Toggle done:** click `input[data-id="<id>"]`. The checkbox reflects `checked`.
- **Delete todo:** click `button[data-delete="<id>"]`. The row disappears.

IDs are UUIDs generated server-side; capture them from an ARIA snapshot or `/api/todos?tenantId=...` rather than guessing.

## Evidence

Capture under `artifacts/verify-todo/<run-id>/` (repo-local, gitignored). Every proof needs at least one screenshot and one ARIA snapshot, plus API evidence where the feature is data-backed.

```bash
RUN_ID=$(date +%s)
EVIDENCE=artifacts/verify-todo/$RUN_ID
mkdir -p "$EVIDENCE"
agent-browser snapshot > "$EVIDENCE/<feature>.aria.txt"
agent-browser screenshot "$EVIDENCE/<feature>.png"
curl -sS http://127.0.0.1:<port>/api/tenants > "$EVIDENCE/tenants.json"
```

Proof standards:

- Exercise the real user path (clicks, inputs, navigation), never internal setters or test-only endpoints.
- Capture the action and the resulting state, not only the final screen.
- Verify side effects: after a mutation, re-read via a second view (switch tenants and back, or re-query `/api/...`) and confirm the stored value.
- Mocks only where a production boundary already isolates the external system; this app has none, so none are used.
- Tenant isolation must be proven by showing tenant A's todos absent from tenant B's view, not by trusting the server.

## Cleanup

Teardown removes instances and scratch state, never the evidence.

```bash
# kill only the process this run started
kill "$(cat /tmp/opencode/todo-<run-id>.pid)" 2>/dev/null
rm -f /tmp/opencode/todo-<run-id>.pid /tmp/opencode/todo-<run-id>.log
agent-browser close --all
```

- Never kill by process name or port-wide sweep during cleanup of a run; kill the captured PID only.
- Leave `artifacts/verify-todo/<run-id>/` in place. Confirm it still exists after teardown.
- If a run failed, still run cleanup before retrying, so ports and browsers are not stranded.

## Helpers

None shipped. Drive via `agent-browser` and `curl` as shown above.

## Feature map

See `features/README.md` for the index, then one file per feature. Start every proof from the baseline preconditions in that index.
