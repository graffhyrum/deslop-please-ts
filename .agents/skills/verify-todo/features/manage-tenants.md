# Manage tenants

Tenant management lets a user create a named tenant and switch the active tenant. A tenant with an empty name is rejected, and creating a tenant selects it.

## Sub-features

- `tenant-create` creates a tenant from a non-empty name.
- `tenant-create-empty` rejects an empty or whitespace-only name.
- `tenant-select` switches the active tenant via the dropdown.
- `tenant-list` shows all created tenants in the selector.

## How to get to it (user POV)

- Type a name into "New tenant name" and choose "Add tenant".
- Choose an existing tenant from the tenant dropdown.

## Driving it with agent-browser

Preconditions:

- Todo is healthy at `http://127.0.0.1:<port>`.
- The tenant list starts empty.
- Doctor reports HTTP 200 and `[]` from `/api/tenants`.

- **Create tenant.** Fill the name and submit. Run `agent-browser fill 'input#new-tenant' 'Acme'` then `agent-browser click 'button#add-tenant'`. The dropdown shows `Acme` selected and the input clears.
- **Reject empty name.** Submit an empty name. Run `agent-browser fill 'input#new-tenant' ''` then `agent-browser click 'button#add-tenant'`. No new option appears; `/api/tenants` is unchanged.
- **Create second tenant.** Run `agent-browser fill 'input#new-tenant' 'Globex'` then `agent-browser click 'button#add-tenant'`. The dropdown shows both `Acme` and `Globex`, with `Globex` selected.
- **Switch tenant.** Run `agent-browser select 'select#tenant' 'Acme'`. The dropdown reads `Acme` selected.
- **API check.** Run `curl -sS http://127.0.0.1:<port>/api/tenants`. The body contains both `Acme` and `Globex`.
- **Proof.** Capture the two-tenant state. Run `agent-browser snapshot > artifacts/verify-todo/<run-id>/manage-tenants.aria.txt` and `agent-browser screenshot artifacts/verify-todo/<run-id>/manage-tenants.png`.

## Gotchas

- `add-tenant` with an empty name returns 400 and changes nothing; the UI silently ignores it.
- Creating a tenant auto-selects it, so the previously selected tenant is no longer active.
- The dropdown option text is the tenant name, so select by visible label, not by UUID.
- Refs change after every render; re-snapshot or use the stable selectors above.
