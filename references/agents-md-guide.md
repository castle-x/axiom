# AGENTS.md 定制指南

> 本文指导 AI 在 Phase 3 Author 阶段，把 `AGENTS.md` 从骨架补全为项目特有的根入口。scaffold 已释放的 AGENTS.md 含以下段：`.axm 召回声明`、`Coding Rules`、最小 `Knowledge Index`（占位 4 条）。需要 AI 补全的是 **Architecture** 段 和 **Knowledge Index 路由表**。

## AGENTS.md 的定位

- 是给 **AI** 读的**唯一入口**，其他工具文件（CLAUDE.md / CODEBUDDY.md / …）仅作摘要
- 必须在**根目录**（所有 AI 客户端默认从这里找）
- **简短**：控制在 150 行以内。深入内容走 `.axm/` 子路径

## 已由 scaffold 生成的段（不要动）

### `.axm 召回声明`

强制 AI 每轮回答开头输出"读了哪些 .axm 文件"。这是全 axm 体系最核心的特色之一，**不要删**。

### `Coding Rules`（四段通用规则）

1. 先思考，再动手
2. 简单优先
3. 外科手术式修改
4. 目标驱动执行

这四段跨项目通用，保留即可。

## 需要 AI 补全的两段

### 1. Architecture 段

**职责**：1-2 屏讲清本项目的**技术栈、模块划分、依赖方向、核心约束**。要够 AI 接手任何任务前能快速定位"这是个什么项目"。

**写作模板**（按 Phase 1 项目画像套下面的模式）：

```md
## Architecture

<一句话定位>：<项目名> 是 <类型>，基于 <核心技术栈> 构建。

### 模块划分

- `<dir1>/` — <职责一句话>
- `<dir2>/` — <职责一句话>
- `<dir3>/` — <职责一句话>

### 依赖方向

`A → B + C`。`B → C`。`C` 无上游。

### 核心约束（可选）

- **硬约束 1**：<如包边界、禁止直接访问 X>
- **硬约束 2**：<如所有 IPC 必须经 Y 层>
```

**各类项目的 Architecture 要点**：

| 项目类型 | 必须说清 |
|---|---|
| **Monorepo** | 每个 `apps/*` `packages/*` 职责、依赖方向、包边界规则 |
| **Tauri / Electron** | 前端壳 + 后端 IPC 层 + 数据层的三层切分 |
| **前后端分离** | API 契约位置（OpenAPI/tRPC）、认证流程、数据库层 |
| **单体应用** | 分层结构（如 MVC）、依赖注入点、横切关注点 |
| **库项目** | 公开 API 入口、内部模块结构、测试策略 |

### 2. Knowledge Index 路由表

**职责**：把"**任务类型 → 读哪些文档**"的映射硬编码。这是整个 `.axm/` 体系的**核心价值**——AI 不用盲目全扫，按任务直接定位需读文档。

生成到 `AGENTS.md` 时，章节标题必须保持为 `## Knowledge Index`；可在标题下说明它是"任务路由表"，不要把标题改名。

**scaffold 已给出最小 5 条**（universal + progress 入口）：

```md
| 每次任务开始 / 分级与流程   | `.axm/universal/devloop.md` |
| 编码完成 / 提交前质量门禁   | `.axm/universal/quality.md` |
| 提交 / 分支操作        | `.axm/universal/vcs.md`     |
| 写 `.axm` 文档       | `.axm/universal/docs.md`    |
| roadmap / spec / 开发进度 | `.axm/progress/index.md`    |
```

**AI 需要追加的项目特有条目**（示例）：

```md
| UI / 样式 / 交互            | `.axm/project/design.md` + `.axm/knowledge/frontend/overview.md` |
| 前端重构 / 新增组件         | `.axm/project/architecture.md` + `.axm/project/coding.md`          |
| 后端 API / 数据库           | `.axm/project/architecture.md` + `.axm/knowledge/backend/overview.md` |
| Bug 修复                   | `.axm/universal/devloop.md` + `.axm/knowledge/<相关子系统>/overview.md` |
| 阶段计划 / 验收标准        | `.axm/progress/<initiative>/roadmap.md` + `.axm/progress/<initiative>/specs/<spec>.md` |
```

**路由条目的写法**：

- 左栏：**任务类型**（动宾短语，一眼看出场景），不要抽象词（❌"开发"、✅"新增组件"）
- 右栏：**具体 `.md` 路径**，用 `+` 串多个
- 粒度：5-15 条刚好。<5 条太泛，>15 条 AI 扫不过来

**按项目类型推荐的最小路由集**：

### Monorepo 前端项目

```
UI / 样式 / 组件         | project/design.md + knowledge/frontend/overview.md
跨包 API / 新增包        | project/architecture.md（包边界部分）
状态管理 / store         | knowledge/frontend/state.md
路由                    | knowledge/frontend/overview.md
Bug 修复                | universal/devloop.md
```

### Tauri / Electron

```
前端 UI                 | project/design.md + knowledge/frontend/overview.md
Tauri IPC 命令          | project/architecture.md + knowledge/backend/overview.md
Rust 后端 / 数据库      | knowledge/backend/overview.md
新增 IPC 能力           | project/architecture.md（IPC 契约部分）
Bug 修复                | universal/devloop.md
```

### 后端 API 服务

```
新增 API endpoint       | project/architecture.md + knowledge/api/overview.md
数据库 Schema / 迁移    | knowledge/db/overview.md
认证 / 鉴权             | knowledge/auth/overview.md
第三方集成              | knowledge/integrations/overview.md
Bug 修复                | universal/devloop.md
```

### Python / 数据项目

```
新增数据管道            | project/architecture.md + knowledge/pipelines/overview.md
模型训练                | knowledge/ml/overview.md
数据 Schema 变更        | knowledge/data-schema.md
Bug 修复                | universal/devloop.md
```

## 写 Knowledge Index 前的最后一问

每新增一条路由，自问：
1. **这条任务真的会反复出现吗？** 如果一个项目生命周期里只发生 1-2 次，不值得硬编码
2. **引用的 `.md` 真的写了吗？** 引用不存在的路径会被 validate.mjs 抓住
3. **AI 顺着路由读完，能动手开工吗？** 如果读完还缺信息，补齐目标 `.md`

## 检查清单

- [ ] Architecture 段 ≤ 60 行
- [ ] 依赖方向用箭头明确画出
- [ ] Knowledge Index 5-15 条
- [ ] 每条路由引用的 `.md` 都已创建（validate.mjs 会验）
- [ ] `.axm 召回声明` 和 `Coding Rules` 四段保持不动
- [ ] 整个 AGENTS.md 不超过 200 行
