# knowledge/ 知识文档写作指南

> 本文指导 AI 在 Phase 3 Author 阶段，根据项目源码现状，撰写 `.axm/knowledge/**/*.mdc` 知识文档。

## 核心定位

| 维度 | 规范（`project/`） | 知识（`knowledge/`） |
|---|---|---|
| 内容 | "应该怎么做" | "**是什么**、**为什么**这么设计" |
| 时效 | 长期稳态 | 随代码演进 |
| 锚点 | 规则本身 | **`code-refs` 指向的源码** |
| 变更触发 | 规则被重写时 | 代码影响设计时 |

**核心心法**：知识文档是**源码的导航与概括**。永远与代码绑定（`code-refs`），不凭空写。

## 目录结构

```
knowledge/
├── index.mdc                    # 骨架 C，列出所有子系统
└── <system>/                    # 按子系统分目录
    ├── index.mdc                # 骨架 C
    ├── overview.mdc             # 骨架 B, depth=overview，≤150 行速查
    └── <topic>.mdc              # 骨架 B, depth=deep，详细设计
```

## 子系统（`<system>/`）怎么切

**按"内聚的源码模块"切，不按"技术层"切**。

**好的切法（NanoMind 示例）**：
- `agent/` — Agent 引擎（对应 `packages/agent/`）
- `wiki/` — Wiki 编译系统
- `frontend/` — 前端 UI
- `backend/` — Rust 后端

**坏的切法**：
- `types/` — 按"类型定义"切（横切多个领域）
- `utils/` — 按"工具函数"切（没有内聚逻辑）
- `v1/` · `v2/` — 按版本切（规范不该有版本）

## overview.mdc 写作模板

**目标**：≤150 行，让 AI 读完能回答"这个子系统大概长啥样"。

```md
---
status: active
last-reviewed: 2026-05-07
owner: your-team
depth: overview
code-refs:
  - src/<module>/index.ts
  - src/<module>/types.ts
related:
  - ../../project/architecture.mdc
---

# <子系统名> — 速查

## 定位

一两句话说清：这个子系统做什么、归属谁、上下游是谁。

## 模块清单

| 模块 | 路径 | 职责 |
|---|---|---|
| X | `src/x/` | ... |
| Y | `src/y/` | ... |

## 关键概念

- **概念 A**：定义...
- **概念 B**：定义...

## 对外契约（按需）

如果是被其他模块调用的子系统：列 IPC 命令 / 函数签名 / 事件清单。

## 相关知识

- [深度话题 1](./topic-a.mdc) — 何时读它
- [深度话题 2](./topic-b.mdc) — 何时读它
```

**千万不要**：
- 抄源码注释
- 列每个函数（overview 的粒度是"模块"，不是"函数"）
- 写超过 150 行——超就拆 deep 文档

## deep 文档写作模板

**目标**：无行数限制，讲清一个**具体设计决策**的背景、方案、权衡。

```md
---
status: active
last-reviewed: 2026-05-07
owner: your-team
depth: deep
code-refs:
  - src/<module>/specific-file.ts
  - src/<module>/related-file.ts
related:
  - ./overview.mdc
---

# <具体话题>

## 解决什么问题

场景描述 + 旧方案的痛点。

## 方案

核心设计 + 关键数据结构 + 流程图（mermaid）。

## 权衡

为什么选 A 不选 B。

## 变更历史（可选）

重大设计变更的锚点。
```

## code-refs 填写要点

`code-refs` 是知识文档的**事实锚点**，validate.mjs 会校验每条路径真实存在。

**好的 code-refs**：
- 明确到具体文件：`packages/agent/src/tools.ts` ✅
- 指向稳定入口：`src/index.ts` ✅
- 覆盖核心实现：3-8 条通常够

**坏的 code-refs**：
- 指向目录：`src/agent/` ❌（写文件路径）
- 指向已删除文件 ❌（validate 会抓）
- 列满所有相关文件（20+ 条）❌（只需要"读这几个就能核对"的最小集）

## 审查（last-reviewed）规则

| 变更类型 | 需要做 | 更新 last-reviewed？ |
|---|---|---|
| 源码重构，设计未变 | 更新 `code-refs` 路径 | ✅ |
| 设计本身变了 | 重写正文 + 更新 `code-refs` | ✅ |
| 只改了正文措辞 | — | ❌ |
| 周期性审查（季度） | 对照 `code-refs` 过一遍 | ✅ |

## 常见反模式

### ❌ 把规范写进 knowledge

```md
# 前端组件

- 所有组件必须用 React Functional Component  ← 这是规范，放 project/coding.mdc
- Button 组件有 primary / secondary 两种变体  ← 这是事实，留在 knowledge
```

### ❌ overview 写成了 API 文档

```md
## API

### getUser(id: string): User  ← 这种粒度应去 deep 文档或让代码自说
  参数：id - 用户 ID
  返回：User 对象
```

### ❌ 没有 code-refs 就写了文档

所有 `knowledge/**/*.mdc` 必须有 `code-refs`。如果一份文档不能给出任何源码锚点——它要么是规范（去 project/），要么是废话。

## 写作检查清单

- [ ] `depth: overview` 的文档 ≤ 150 行
- [ ] `code-refs` 每条都是真实存在的文件（不是目录、不是想象的路径）
- [ ] 写的是"是什么/为什么"，没有混入"应该怎么做"
- [ ] 子系统切分基于内聚的源码模块，不是技术层
- [ ] overview 里每个模块都能在代码里找到对应目录
