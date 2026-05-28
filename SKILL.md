---
name: axm
description: |
  A compatibility router for the Axiom skill family. Use this when the user mentions axm, .axm, AGENTS.md, Axiom Preview, axm validation, reindexing, roadmap/spec/BUG management, or axm health checks and the more specific axm-* skills are not directly available.

  Route initialization to axm-init, validation/reindexing to axm-maintain, roadmap/spec/BUG work to axm-progress, document drift audits to axm-health-check, and local preview/download/startup tasks to axm-preview.
---

# axm Compatibility Router

Axiom is now a skill family. Prefer the most specific skill:

| User intent | Use |
| --- | --- |
| Initialize `.axm/` and `AGENTS.md` for a project | `skills/axm-init/SKILL.md` |
| Run `validate.mjs`, run `reindex.mjs`, or repair axm-meta/index contracts | `skills/axm-maintain/SKILL.md` |
| Manage roadmap/spec/progress/BUG documents | `skills/axm-progress/SKILL.md` |
| Audit an existing `.axm/` for drift, stale docs, closed specs, or AGENTS routing issues | `skills/axm-health-check/SKILL.md` |
| Start, download, package, or troubleshoot Axiom Preview | `skills/axm-preview/SKILL.md` |

When this compatibility skill triggers, open the matching `skills/axm-*/SKILL.md` file and follow that workflow. If more than one applies, use them in this order:

1. `axm-init` for project setup.
2. `axm-progress` for progress/spec/BUG authoring.
3. `axm-maintain` for `reindex` and `validate`.
4. `axm-health-check` for deeper drift audits.
5. `axm-preview` for viewing or packaging.

The root scripts remain as compatibility wrappers:

```bash
node scripts/scaffold.mjs --owner=<owner> --date=<YYYY-MM-DD> --project-name=<name> --target=<repo>
node scripts/validate.mjs --target=<repo>
node scripts/reindex.mjs --target=<repo> --dry-run
```

For new installs, install the whole family with:

```bash
node scripts/install-skills.mjs --target=~/.claude/skills
```
