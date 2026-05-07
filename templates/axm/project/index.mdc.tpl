---
status: active
last-reviewed: {{date}}
owner: {{owner}}
entries: []
---

# project/ — 项目规范

绑定本项目的具体工程规范。所有文件使用 Frontmatter 骨架 A（`applies-to: [project:<name>, ...]`）。

> **本 index 的 `entries` 由 AI 在 Phase 3 Author 阶段按项目实际情况填充**，填充后可运行 `node scripts/reindex.mjs` 自动同步。

## 建议包含的规范文件

按项目实际需要选择性创建：

| 文件 | 内容 | 何时读取 |
|---|---|---|
| `architecture.mdc` | 模块划分、依赖方向、IPC/API 契约、数据库 Schema | 涉及模块间交互或新增模块时 |
| `coding.mdc` | 语言风格、lint 规则、命名约定、路径别名 | 编写或修改代码时 |
| `design.mdc` | 设计系统（配色、字体、组件规范） | UI 项目需要时 |

参考 `references/project-spec-guide.md` 获取各技术栈的 project 规范写作要点。
