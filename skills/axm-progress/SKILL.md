---
name: axm-progress
description: |
  Manage Axiom progress documents: roadmap, spec, decision, and BUG records under `.axm/progress/`. Use this whenever the user asks to create or close a roadmap/spec, track implementation progress, file a BUG in axm, triage BUG priority/severity, update workflow-state, verify fixes, close or reopen BUGs, or move completed progress facts into long-lived knowledge docs.
---

# axm-progress

Use this skill for work that changes `.axm/progress/`.

Progress documents record temporary workflow state. Long-lived facts discovered while closing progress must be copied into `.axm/project/` or `.axm/knowledge/` before the progress item is closed.

## References

- Read `references/progress-doc-guide.md` before creating or closing roadmap/spec/decision docs.
- Read `references/bug-doc-guide.md` before creating, triaging, verifying, closing, or reopening BUG docs.

## Placement Rules

- Initiatives live under `.axm/progress/<initiative>/`.
- Specs live under `.axm/progress/<initiative>/specs/`.
- BUG docs live under `.axm/progress/<initiative>/bugs/`.
- Never create `.axm/progress/bugs/` at the top level.
- Do not use `initiative: bugs`.

## Typical Workflows

Create an initiative:

1. Create `.axm/progress/<initiative>/index.md`.
2. Create `roadmap.md` or `specs/<spec>.md` only when the user needs it.
3. Include AI-verifiable and human-verifiable acceptance criteria for specs.

File a BUG:

1. Choose or create the owning initiative.
2. Create `.axm/progress/<initiative>/bugs/bug-YYYY-MM-DD-<slug>.md`.
3. Set priority, severity, reproduction, acceptance, and `workflow-state: open`.
4. Update the nearest index.

Close progress or BUG work:

1. Confirm the final code or process evidence.
2. Move durable facts into `.axm/project/` or `.axm/knowledge/`.
3. Update `workflow-state` and `state-updated`.
4. Run `axm-maintain` reindex dry-run and validation.
