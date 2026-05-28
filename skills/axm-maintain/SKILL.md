---
name: axm-maintain
description: |
  Maintain an existing Axiom `.axm/` knowledge base. Use this whenever the user asks to validate axm, check axm-meta, run validate.mjs, sync or repair index.md entries, run reindex.mjs, explain validation errors, or fix broken `.axm` document contracts.

  This skill owns the zero-dependency validation and reindex scripts.
---

# axm-maintain

Use this skill for mechanical `.axm/` maintenance: validate contracts, sync indexes, and repair issues reported by the scripts.

## Commands

Validate a target repository:

```bash
node <skill-path>/scripts/validate.mjs --target=<repo-root>
```

Reindex without writing:

```bash
node <skill-path>/scripts/reindex.mjs --target=<repo-root> --dry-run
```

Reindex and write:

```bash
node <skill-path>/scripts/reindex.mjs --target=<repo-root>
```

## Validate Workflow

1. Run `validate.mjs --target=<repo-root>`.
2. Treat exit code `1` as a required fix.
3. Treat exit code `2` as warnings only; explain each warning before handoff.
4. Rerun validation after changes.

Validation checks:

- required axm-meta fields and date formats
- old `status:` metadata that should be `doc-state:`
- index `entries` versus actual files and directories
- `knowledge/**` `code-refs` paths
- `AGENTS.md` Knowledge Index `.axm` links
- progress and BUG placement/state contracts

Read `references/axm-meta-contracts.md` when repairing metadata shape. Read `references/bug-doc-guide.md` when validation points at BUG contracts.

## Reindex Workflow

1. Run `reindex.mjs --dry-run`.
2. Review the diff preview.
3. If it only adds missing entries or removes dead entries, run without `--dry-run`.
4. Run `validate.mjs` afterward; reindex is not a substitute for validation.

`reindex.mjs` only rewrites `entries`; it intentionally preserves titles, `when-to-read`, other metadata, and body text.
