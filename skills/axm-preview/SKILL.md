---
name: axm-preview
description: |
  Start, download, build, package, or troubleshoot Axiom Preview, the read-only localhost viewer for `.axm/` projects. Use this whenever the user asks to view axm, open the previewer, launch Axiom Preview, install or download the preview binary, use npx/npm for axm-preview, package preview releases, or debug preview startup.
---

# axm-preview

Axiom Preview is a read-only local viewer for `AGENTS.md` and `.axm/`.

Use the easiest available startup path for the user's environment.

## Start Existing Install

If `axiom-preview` is already on `PATH`:

```bash
axiom-preview --target=<repo-root> --port=8765
```

Report the localhost URL printed by the command.

## Download Or Run With npm

For users who do not have the binary installed, prefer npm because it selects the right bundled binary:

```bash
npx @castle-xx/axm-preview --target=<repo-root> --port=8765
```

Persistent install:

```bash
npm install -g @castle-xx/axm-preview
axiom-preview --target=<repo-root> --port=8765
```

If network access is restricted, ask for approval before running `npx` or `npm install`.

## Build From This Repository

When working in the Axiom repository:

```bash
cd apps/axm-preview
pnpm --dir site install
make build
./bin/axiom-preview --target=<repo-root> --port=8765
```

For release packaging:

```bash
cd apps/axm-preview
make release VERSION=<semver>
```

This creates GitHub Release archives under `apps/axm-preview/dist/release/` and an npm staging package under `apps/axm-preview/dist/npm/`.

## Guarantees

- Bind only to `127.0.0.1`.
- Do not run scaffold, validate, or reindex from the UI.
- Do not write to the target repository.
- Allow project switching only inside the running preview process.

Read `references/preview-app.md` for local development and release details.
