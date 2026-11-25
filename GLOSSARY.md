# deslop-please-ts

A linter that finds architectural sloppiness in TypeScript projects, following Ousterhout's "deep modules, narrow interfaces".

## Language

**Module**:
A source file. A directory only groups modules and is never a module.
_Avoid_: package, component

**Declaration**:
A top-level function, class, interface, type alias, enum or constant of a module. Members and nested functions belong to their enclosing declaration.
_Avoid_: item (in user-facing text), symbol

**Knows**:
Declaration A knows declaration B when code inside A refers to B, in a value position or a type position.
_Avoid_: depends on, uses

**Held in mind**:
The number of things a reader can keep in view at once. The default is 7.

**Module cycle**:
Modules that import each other in a circle. Every import form counts: static imports, `import type`, dynamic `import()`, re-exports, and `require()`. Self-loops count. Test files are excluded.

**Tangle**:
More than the held-in-mind number of top-level declarations that all know each other in a circle and sit in at least two modules. Edges that close through a same-file link are kept, provided the group spans at least two files. Members (methods, fields) map to their enclosing declaration; self-edges are dropped.
_Avoid_: cycle (a cycle is the module-level finding)

**Field leak**:
A field of a type that is known outside its owner module: other modules read or write it directly (or via trivial accessors), instead of going through the owner's narrow interface.

**Shallow module**:
A module whose interface (exported declarations) is wider than its use: callers learn more exports than they need. Should be deepened by hiding the unused surface behind a narrow interface.

**Test file**:
A file whose name ends in `.test.*` or `.spec.*` (and files under `__tests__/`). Test files are excluded from module-cycle, tangle, field-leak, shallow-module, and long-file checks. Recognized by `isTestFile()` in `test-file.ts`.
