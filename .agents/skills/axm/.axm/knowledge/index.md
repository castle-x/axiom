<!-- axm-meta
status: active
last-reviewed: 2026-05-07
owner: axm-skill
entries:
  - path: scripts/
    title: 脚本子系统
    when-to-read: 修改 scaffold/validate/reindex 或 _lib 共享模块时
-->

# knowledge/ — 知识库

描述 axm skill 各子系统"是什么"和"为什么这么设计"。

## 子系统

| 目录 | 覆盖范围 |
|---|---|
| `scripts/` | 三个主入口脚本（scaffold / validate / reindex）与共享 `_lib/`（frontmatter 解析器、walker、logger） |
