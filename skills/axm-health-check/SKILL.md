---
name: axm-health-check
description: |
  Audit an existing Axiom `.axm/` knowledge base for drift against the current codebase. Use this whenever the user asks for an axm health check, document audit, fact drift review, stale docs cleanup, AGENTS Knowledge Index audit, progress/spec/BUG closure review, or deprecated document sweep.
---

# axm-health-check

Use this skill for deep review of an existing `.axm/` tree. It is broader than `validate.mjs`: validation checks contracts; health check checks whether the documents still match reality.

## Required Reading

Start with `references/axm-health-check-guide.md`.

Load these only when the audit touches the area:

- `references/agents-md-guide.md` for AGENTS routing
- `references/progress-doc-guide.md` for roadmap/spec closure
- `references/bug-doc-guide.md` for BUG state cleanup
- `references/axm-meta-contracts.md` for metadata repairs

## Workflow

1. Run `axm-maintain` validation and, when useful, `reindex.mjs --dry-run`.
2. Build a document inventory: project, knowledge, progress, BUG, AGENTS routes.
3. Compare docs to current source files and commands.
4. Mark stale long-lived docs with `doc-state: deprecated` only when they are no longer valid context.
5. Close or update progress/BUG documents through `workflow-state`, not by moving files into an archive directory.
6. Sync indexes.
7. Rerun validation.

If parallel agents are available, split the audit into independent passes: document inventory, code fact check, progress/BUG closure, AGENTS routing, and final arbitration. If not, do the same passes sequentially and say so.
