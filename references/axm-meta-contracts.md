# axm-meta 契约速查

> 本文是 `.axm/universal/docs.md` §二的**精简速查版**，供 AI 在 Phase 3 写新文档时快速对齐字段。遇到边界情况回到 docs.md 查全文。

## 三套骨架一览

| 骨架 | 用在哪 | 必填字段 | 识别标志 |
|---|---|---|---|
| **A 规范** | `universal/*.md` · `project/*.md`（不含 index） | `status` · `last-reviewed` · `owner` · `applies-to` | 有 `applies-to` |
| **B 知识** | `knowledge/**/*.md`（不含 index） | `status` · `last-reviewed` · `owner` · `depth` · `code-refs` | 有 `depth` + `code-refs` |
| **C 索引** | 所有 `index.md` | `status` · `last-reviewed` · `owner` · `entries` | 文件名为 `index.md`，有 `entries` |

## 骨架 A（规范）模板

```yaml
<!-- axm-meta
status: active
last-reviewed: 2026-05-07
owner: your-team
applies-to: [project:<name>]     # 或 [universal] / [project:<name>, frontend]
related:                          # 可选
  - ../knowledge/frontend/overview.md
-->
```

## 骨架 B（知识）模板

```yaml
<!-- axm-meta
status: active
last-reviewed: 2026-05-07
owner: your-team
depth: overview                   # 或 deep
code-refs:
  - src/components/Editor.tsx
  - src/lib/storage.ts
related:                          # 可选
  - ../../project/architecture.md
-->
```

**关键规则**：`code-refs` 列出的**每个路径必须在仓库中真实存在**。`validate.mjs` 会对此做硬校验。

## 骨架 C（索引）模板

```yaml
<!-- axm-meta
status: active
last-reviewed: 2026-05-07
owner: your-team
entries:
  - path: overview.md           # 文件：*.md；子目录：<name>/
    title: 子系统速查
    when-to-read: 了解子系统整体架构
  - path: architecture.md
    title: 子系统详细设计
    when-to-read: 需要深度设计细节时
-->
```

**关键规则**：`entries[].path` 要与同目录实际子项**双向一致**（不缺、不冗）。可用 `reindex.mjs` 自动同步。

## 字段速查

| 字段 | 类型 | 约束 |
|---|---|---|
| `status` | enum | `active` / `draft` / `deprecated` |
| `last-reviewed` | date | `YYYY-MM-DD`；人工核对过才更新 |
| `owner` | string | 团队或人员标识 |
| `applies-to` | list | 非空；`universal` 或 `project:<name>` 或其叠加 |
| `depth` | enum | `overview`（≤150 行）/ `deep`（无行数限制） |
| `code-refs` | list<string> | 非空；**每条路径必须真实存在** |
| `entries[].path` | string | 文件 `*.md` 或子目录 `<name>/` |
| `entries[].title` | string | 简短标题 |
| `entries[].when-to-read` | string | 触发条件一句话 |
| `related` | list<string>（可选） | 相对本文件的 `.axm/` 内路径 |

## 命名与格式

- 文件名 **kebab-case**（`editor-layout.md`）
- **禁止** 日期/版本号前缀（`2026-04-22-plan.md` ✗，`v2-design.md` ✗）
- 日期严格 `YYYY-MM-DD`
- 路径统一 `/`
- 长列表用多行 `-` 缩进；短列表（≤2 项）可 `[a, b]`
- axm-meta 内不写 `#` 注释
- 字段顺序按本文列表顺序
- **扩展名必须 `.md`**（不是 `.mdc`）

## 最常见错误 Top 5

1. knowledge 文档的 `code-refs` 填了不存在的路径 → 被 validate 抓住
2. index.md 的 `entries` 忘了加新文件（孤儿警告）
3. `last-reviewed` 随手写成 `2026/05/07`（应 `-`）
4. `applies-to` 漏写（规范文档）
5. 把 index.md 写成骨架 A（`applies-to` 代替了 `entries`）

## 什么时候更新 last-reviewed

| 变更类型 | 更新 last-reviewed？ |
|---|---|
| 新建文档 | ✅ 填今天 |
| 规范内容变更并核对过实施现状 | ✅ |
| 知识文档：`code-refs` 指向的源码被读过、正文与代码一致 | ✅ |
| 索引：entries 被重新核对 | ✅ |
| 仅修 typo / 调整格式 | ❌ |
