# Manage todos

Todo management lets a user create, complete, and remove todos for the currently selected tenant. Adding a todo with no selected tenant is a no-op.

## Sub-features

- `todo-create` creates a todo from a non-empty title.
- `todo-create-empty` rejects an empty or whitespace-only title.
- `todo-create-no-tenant` does nothing when no tenant is selected.
- `todo-toggle` flips a todo between done and not done.
- `todo-delete` removes a todo.

## How to get to it (user POV)

- Select a tenant, type a title into "New todo", and choose "Add todo".
- Click a todo's checkbox to toggle it.
- Click a todo's "x" button to delete it.

## Driving it with agent-browser

Preconditions:

- Todo is healthy at `http://127.0.0.1:<port>`.
- One tenant named `Acme` exists and is selected.
- No todos exist for `Acme`.

- **Create todo.** Run `agent-browser fill 'input#new-todo' 'Buy milk'` then `agent-browser click 'button#add-todo'`. A checkbox and `Buy milk` text appear; the input clears.
- **Reject empty title.** Run `agent-browser fill 'input#new-todo' ''` then `agent-browser click 'button#add-todo'`. No new row appears.
- **Toggle done.** Run `agent-browser click 'input[data-id]'` (the checkbox for `Buy milk`). The checkbox becomes checked and the title gets the `done` styling.
- **Toggle back.** Run `agent-browser click 'input[data-id]'` again. The checkbox becomes unchecked.
- **Delete todo.** Run `agent-browser click 'button[data-delete]'`. The row disappears; the list is empty.
- **API check.** After creating `Buy milk`, run `curl -sS "http://127.0.0.1:<port>/api/todos?tenantId=<acme-id>"`. The body contains `Buy milk` with `done: false`.
- **Proof.** Capture the created state. Run `agent-browser snapshot > artifacts/verify-todo/<run-id>/manage-todos.aria.txt` and `agent-browser screenshot artifacts/verify-todo/<run-id>/manage-todos.png`.

## Gotchas

- `add-todo` is silently ignored when no tenant is selected; the button still appears clickable.
- Todo IDs are UUIDs; capture them from a snapshot or `/api/todos` before targeting a specific row.
- The delete button's accessible name is `x`, so prefer the `button[data-delete]` selector.
- Toggling requires the todo to belong to the selected tenant; cross-tenant toggles return 404.
