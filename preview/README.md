# Axiom Preview

Standalone Go embedded SPA previewer for `.axm/` knowledge bases.

Development:

```bash
cd preview
pnpm --dir site install
make dev
```

Production build:

```bash
cd preview
make build
./bin/axiom-preview --target=/path/to/project --port=8765
```

Cross-platform builds:

```bash
cd preview
make build-all
```

Release packaging:

```bash
cd preview
make release VERSION=0.1.0
```

This creates:

- `dist/release/*.tar.gz` GitHub Release archives for macOS, Linux, and Windows
- `dist/npm/` staging package for `@castle-xx/axm-preview`

Publish flow:

- Push a tag named `preview-v0.1.0`, or run the `Preview Release` GitHub Actions workflow manually.
- Add `NPM_TOKEN` as a GitHub repository secret before enabling npm publish.

Install:

```bash
npm install -g @castle-xx/axm-preview
axiom-preview --target=/path/to/project

npx @castle-xx/axm-preview --target=/path/to/project
```
