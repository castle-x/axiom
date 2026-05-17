# axm-meta 契约速查

> 本文是 `.axm/universal/docs.md` §二的**精简速查版**，供 AI 在 Phase 3 写新文档时快速对齐字段。遇到边界情况回到 docs.md 查全文。

## 四套骨架一览

| 骨架 | 用在哪 | 必填字段 | 识别标志 |
|---|---|---|---|
| **A 规范** | `universal/*.md` · `project/*.md`（不含 index） | `doc-state` · `last-reviewed` · `owner` · `applies-to` | 有 `applies-to` |
| **B 知识** | `knowledge/**/*.md`（不含 index） | `doc-state` · `last-reviewed` · `owner` · `depth` · `code-refs` | 有 `depth` + `code-refs` |
| **C 索引** | 所有 `index.md`，包括 `progress/<initiative>/index.md`、`progress/<initiative>/specs/index.md`、`progress/<initiative>/bugs/index.md` | `doc-state` · `last-reviewed` · `owner` · `entries` | 文件名为 `index.md`，有 `entries` |
| **D 进度** | `progress/**/*.md`（不含 index） | `doc-state` · `last-reviewed` · `owner` · `progress-type` · `initiative` · `workflow-state` · `state-updated` | 有 `progress-type` + `initiative` |

## 骨架 A（规范）模板

```yaml
<!-- axm-meta
doc-state: current
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
doc-state: current
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
doc-state: current
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

**优先级规则**：只要文件名是 `index.md` 就一定使用骨架 C，即使位于 `progress/` 下也不需要 `progress-type` 或 `initiative`；这些字段只属于非 index 的骨架 D 文档。

## 骨架 D（进度）模板

```yaml
<!-- axm-meta
doc-state: current
last-reviewed: 2026-05-07
owner: your-team
progress-type: roadmap            # roadmap / spec / decision / bug
initiative: editor-redesign
workflow-state: in-progress        # 取值按 progress-type 使用对应枚举
state-updated: 2026-05-07          # workflow-state 最后确认日期
related:                          # 可选
  - ../knowledge/frontend/overview.md
-->
```

**关键规则**：进度文档只描述计划、业务状态、验收与阶段性决策。axm-meta `doc-state` 表示 AI 是否应继续把文档当上下文读，不表示业务或任务进度；progress 非 index 文档的当前业务/流程状态只写 `workflow-state`，正文只保留时间线、验收证据与必要说明。已经落地的系统事实应同步写入 `knowledge/`。

**BUG 特例**：BUG 文档只能作为直接子文件放在 `progress/<initiative>/bugs/` 下，禁止 `progress/bugs/` 顶层目录，也禁止 `bugs/` 下再建嵌套目录；单条 BUG 文件名必须是 `bug-YYYY-MM-DD-<slug>.md`，`progress-type: bug`，`initiative` 必须填路径里的真实主题且不得为 `bugs`；`bugs/log.md` 是看板，使用 `progress-type: roadmap`；`bugs/index.md` 仍是骨架 C。

## 字段速查

| 字段 | 类型 | 约束 |
|---|---|---|
| `doc-state` | enum | `current` / `draft` / `deprecated`；表示 AI 是否应继续把文档当上下文读，不表示业务状态、任务进度或 BUG 生命周期 |
| `last-reviewed` | date | `YYYY-MM-DD`；人工核对过才更新 |
| `owner` | string | 团队或人员标识 |
| `applies-to` | list | 非空；`universal` 或 `project:<name>` 或其叠加 |
| `depth` | enum | `overview`（≤150 行）/ `deep`（无行数限制） |
| `code-refs` | list<string> | 非空；**每条路径必须真实存在** |
| `progress-type` | enum | `roadmap` / `spec` / `decision` / `bug` |
| `initiative` | string | 所属模块、子系统或较大开发主题 |
| `workflow-state` | enum | roadmap/spec: `proposed` / `ready` / `in-progress` / `blocked` / `implemented` / `verified` / `closed` / `deferred` / `superseded`；decision: `proposed` / `accepted` / `rejected` / `superseded`；bug: `open` / `in-progress` / `fixed` / `verified` / `closed` / `reopened` / `wont-fix` / `duplicate` |
| `state-updated` | date | `YYYY-MM-DD`；`workflow-state` 最后确认日期 |
| `entries[].path` | string | 文件 `*.md` 或子目录 `<name>/` |
| `entries[].title` | string | 简短标题 |
| `entries[].when-to-read` | string | 触发条件一句话 |
| `related` | list<string>（可选） | 相对本文件的 `.axm/` 内路径 |

## 命名与格式

- 文件名 **kebab-case**（`editor-layout.md`）
- **禁止** 日期/版本号前缀（`2026-04-22-plan.md` ✗，`v2-design.md` ✗）；唯一允许的日期前缀例外是 `progress/<initiative>/bugs/bug-YYYY-MM-DD-<slug>.md`
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
6. 把计划中的能力写成 knowledge 事实（应先放 progress，落地后再同步 knowledge）
7. 把 `progress/<initiative>/index.md`、`specs/index.md` 或 `bugs/index.md` 写成骨架 D（index 永远是骨架 C）

## 什么时候更新 last-reviewed

| 变更类型 | 更新 last-reviewed？ |
|---|---|
| 新建文档 | ✅ 填今天 |
| 规范内容变更并核对过实施现状 | ✅ |
| 知识文档：`code-refs` 指向的源码被读过、正文与代码一致 | ✅ |
| 索引：entries 被重新核对 | ✅ |
| 进度文档：状态、验收结果或事实进度被核对 | ✅ |
| 仅修 typo / 调整格式 | ❌ |
