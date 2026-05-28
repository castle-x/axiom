# Axiom Skill Family

Install every `axm-*` directory into your Agent Skills directory:

```bash
node ../scripts/install-skills.mjs --target=~/.claude/skills
```

Skills:

- `axm-init` initializes `.axm/` and `AGENTS.md`.
- `axm-maintain` validates contracts and syncs indexes.
- `axm-progress` manages roadmap, spec, decision, and BUG documents.
- `axm-health-check` audits existing `.axm` docs against current code.
- `axm-preview` starts, downloads, builds, and packages Axiom Preview.
