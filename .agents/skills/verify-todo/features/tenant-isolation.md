# Tenant isolation

Tenant isolation guarantees that todos created under one tenant are never visible or mutable from another tenant. Switching tenants changes the todo list without affecting stored data.

## Sub-features

- `iso-list-scoping` lists only the selected tenant's todos.
- `iso-toggle-scoping` rejects toggling a todo from another tenant.
- `iso-delete-scoping` rejects deleting a todo from another tenant.
- `iso-create-scoping` attributes new todos to the selected tenant.

## How to get to it (user POV)

- Create todos under two different tenants and switch between them.
- Observe that each tenant shows only its own todos.

## Driving it with agent-browser

Preconditions:

- Todo is healthy at `http://127.0.0.1:<port>`.
- Two tenants, `Acme` and `Globex`, exist.
- Neither tenant has any todos.

- **Create under Acme.** Select `Acme`. Run `agent-browser select 'select#tenant' 'Acme'`, then `agent-browser fill 'input#new-todo' 'Acme secret'` and `agent-browser click 'button#add-todo'`. `Acme secret` appears.
- **Create under Globex.** Select `Globex`. Run `agent-browser select 'select#tenant' 'Globex'`, then `agent-browser fill 'input#new-todo' 'Globex item'` and `agent-browser click 'button#add-todo'`. Only `Globex item` appears; `Acme secret` is absent.
- **Switch back to Acme.** Run `agent-browser select 'select#tenant' 'Acme'`. Only `Acme secret` appears; `Globex item` is absent.
- **API cross-check.** Fetch each tenant's todos. Run `curl -sS "http://127.0.0.1:<port>/api/todos?tenantId=<acme-id>"` and `.../<globex-id>`. Each response contains only its own todo.
- **Proof.** Capture both views. Run `agent-browser snapshot > artifacts/verify-todo/<run-id>/tenant-isolation.aria.txt` and `agent-browser screenshot artifacts/verify-todo/<run-id>/tenant-isolation.png` for each tenant, naming files per tenant.

## Gotchas

- The UI silently skips `add-todo` when no tenant is selected; always confirm the selector shows a tenant.
- Isolation is per process: a fresh launch resets all data, so capture evidence before teardown.
- Cross-tenant toggle or delete returns 404, but the UI may still refresh the list; verify via the API.
- Do not rely on todo titles alone to prove isolation; pair with the API response.
