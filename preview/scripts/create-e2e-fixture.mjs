import fs from "node:fs"
import os from "node:os"
import path from "node:path"

const root = fs.mkdtempSync(path.join(os.tmpdir(), "axiom-preview-e2e-"))

write("AGENTS.md", "# AGENTS.md\n\n## Knowledge Index\n\n| Task | Read |\n| --- | --- |\n| Docs | `.axm/universal/docs.md` |\n| Bugs | `.axm/progress/core/bugs/bug-2026-05-25-e2e.md` |\n")
write("README.md", "# E2E\n")
write(".axm/index.md", meta(`doc-state: current
last-reviewed: 2026-05-25
owner: e2e
entries:
  - path: universal/
    title: Universal
    when-to-read: Universal docs
  - path: progress/
    title: Progress
    when-to-read: Progress docs`)+"\n# Root\n")
write(".axm/universal/index.md", meta(`doc-state: current
last-reviewed: 2026-05-25
owner: e2e
entries:
  - path: docs.md
    title: Docs
    when-to-read: Docs`)+"\n# Universal\n")
write(".axm/universal/deprecated.md", meta(`doc-state: deprecated
last-reviewed: 2026-05-25
owner: e2e
applies-to: [universal]`)+"\n# Deprecated Doc\n\nThis document is hidden unless deprecated docs are enabled.\n")
write(".axm/universal/docs.md", meta(`doc-state: current
last-reviewed: 2026-05-25
owner: e2e
applies-to: [universal]
code-refs:
  - README.md
  - src/super-long-directory-name/another-long-segment/preview-fixture-reference-with-a-very-long-name.ts`)+"\n# Docs\n\nMarkdown body for e2e search with `inline-code`.\n\n```ts\nconst previewFixture = true\n```\n\n| Field | Value |\n| --- | --- |\n| status | current |\n")
write("src/super-long-directory-name/another-long-segment/preview-fixture-reference-with-a-very-long-name.ts", "export const previewFixtureReference = true\n")
write(".axm/progress/index.md", meta(`doc-state: current
last-reviewed: 2026-05-25
owner: e2e
entries:
  - path: core/
    title: Core
    when-to-read: Core progress`)+"\n# Progress\n")
write(".axm/progress/core/index.md", meta(`doc-state: current
last-reviewed: 2026-05-25
owner: e2e
entries:
  - path: bugs/
    title: Bugs
    when-to-read: Bugs`)+"\n# Core\n")
write(".axm/progress/core/bugs/index.md", meta(`doc-state: current
last-reviewed: 2026-05-25
owner: e2e
entries:
  - path: bug-2026-05-25-e2e.md
    title: E2E Bug
    when-to-read: Bug
  - path: bug-2026-05-25-closed.md
    title: Closed Bug
    when-to-read: Closed bug`)+"\n# Bugs\n")
write(".axm/progress/core/bugs/bug-2026-05-25-e2e.md", meta(`doc-state: current
last-reviewed: 2026-05-25
owner: e2e
progress-type: bug
initiative: core
workflow-state: open
state-updated: 2026-05-25
priority: P1
severity: high
related:
  - ../roadmap.md
  - ../specs/process-lifecycle.md
entities:
  - PreviewShell
  - BugInventory`)+"\n# E2E Bug\n\nVisible bug excerpt.\n")
write(".axm/progress/core/bugs/bug-2026-05-25-closed.md", meta(`doc-state: deprecated
last-reviewed: 2026-05-25
owner: e2e
progress-type: bug
initiative: core
workflow-state: closed
state-updated: 2026-05-25`)+"\n# Closed Bug\n\nDeprecated closed bug.\n")

process.stdout.write(root + "\n")

function meta(body) {
  return "<!-- axm-meta\n" + body + "\n-->\n"
}

function write(rel, content) {
  const abs = path.join(root, rel)
  fs.mkdirSync(path.dirname(abs), { recursive: true })
  fs.writeFileSync(abs, content, "utf8")
}
