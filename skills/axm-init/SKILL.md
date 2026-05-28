---
name: axm-init
description: |
  Initialize Axiom context for a project by creating `.axm/` plus a root `AGENTS.md` Knowledge Index. Use this whenever the user asks to initialize axm, create .axm, establish an AI-readable project knowledge base, create or complete AGENTS.md for axm, or says agents keep needing to rediscover the project architecture.

  This skill owns scaffold templates and the 5-phase init workflow: discover project facts, run scaffold, author project-specific docs, validate with axm-maintain, and hand off.
---

# axm-init

Use this skill to initialize `.axm/` and `AGENTS.md` for a target repository.

The division of labor is deliberate:

- Scripts release cross-project templates byte-for-byte.
- The agent reads the target codebase and writes project-specific architecture, coding, knowledge, and AGENTS routing content.
- Validation is mechanical and must run before handoff.

## Bundled Layout

```text
axm-init/
├── SKILL.md
├── references/
│   ├── agents-md-guide.md
│   ├── axm-meta-contracts.md
│   ├── knowledge-doc-guide.md
│   └── project-spec-guide.md
├── scripts/
│   └── scaffold.mjs
└── templates/
    ├── AGENTS.md.tpl
    └── axm/
```

## Phase 1: Discover

Read the target repository before writing anything. Inspect the files that exist:

- `package.json`, `pnpm-workspace.yaml`, `turbo.json`
- `go.mod`
- `Cargo.toml`
- `pyproject.toml`, `requirements.txt`
- `README.md`
- top-level directories and one layer under obvious source roots

Return a short project profile for user confirmation:

```md
## 项目画像（待确认）

- **项目名**：
- **技术栈**：
- **结构**：
- **核心模块**：
- **依赖方向**：
- **技术特色**：
```

Proceed after the user confirms or corrects the profile.

## Phase 2: Scaffold

Ask only for values that cannot be inferred:

- `owner`: team or maintainer id.
- `date`: use the current date in `YYYY-MM-DD`.
- `project-name`: default to the target directory name.

Run:

```bash
node <skill-path>/scripts/scaffold.mjs \
  --owner=<owner> \
  --date=<YYYY-MM-DD> \
  --project-name=<name> \
  --target=<repo-root>
```

Default behavior refuses to overwrite existing files. Add `--force` only after the user confirms.

Read the scaffold manifest and report created, skipped, and overwritten files.

## Phase 3: Author Project-Specific Docs

Before editing each document type, read the matching local reference.

1. Read `references/project-spec-guide.md`, then create `.axm/project/architecture.md`.
2. Reuse `references/project-spec-guide.md`, then create `.axm/project/coding.md` if the project has concrete coding or command standards.
3. Read `references/knowledge-doc-guide.md`, then create one or two high-value `knowledge/<system>/overview.md` docs with real `code-refs`.
4. Read `references/agents-md-guide.md`, then fill the `AGENTS.md` Architecture section and Knowledge Index.
5. Update indexes manually or leave them for `axm-maintain` reindex.

Do not write deep knowledge docs during initialization unless the user explicitly asks.

## Phase 4: Validate

Use `axm-maintain` if it is installed. From this repository layout, the command is:

```bash
node <repo-containing-this-skill>/skills/axm-maintain/scripts/validate.mjs --target=<repo-root>
```

If validation reports errors, fix the authored docs and rerun validation. Warnings may be handed off only when explained.

## Phase 5: Handoff

Summarize:

- files scaffolded mechanically
- project-specific docs authored
- validation result
- remaining human TODOs, especially placeholder commands in `.axm/universal/quality.md`
