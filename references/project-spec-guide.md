# project/ 规范写作指南

> 本文指导 AI 在 Phase 3 Author 阶段，根据 Phase 1 Discover 产出的项目画像，撰写 `.axm/project/*.mdc` 规范文档。

## 核心原则

1. **写"应该怎么做"，不写"是什么"**。"是什么"属于 `knowledge/`
2. **硬约束优先**：能被 lint/CI/types 机械校验的规则，明确列出具体工具和命令
3. **只写项目特有**：跨项目通用的流程/质量规则已在 `universal/`，不重复
4. **举例优于抽象**：给具体的路径、命令、包名

## 建议覆盖的规范文件

不强求全写。按项目实际需要选择：

| 文件 | 必要性 | 典型内容 |
|---|---|---|
| `architecture.mdc` | 几乎总是写 | 模块划分、依赖方向、IPC/API 契约、数据库 Schema |
| `coding.mdc` | 有编码标准时写 | 语言风格、lint 规则、命名约定、路径别名 |
| `design.mdc` | UI 项目写 | 设计系统（配色、字体、组件规范） |
| `<domain>.mdc` | 大型领域模型才写 | 业务术语统一、跨模块约定 |

## architecture.mdc 写作要点

按项目类型套下面的脚手架：

### Monorepo 项目

**必答**：
- 子包清单（apps/ / packages/ 的每个目录是什么）
- 依赖方向（`A → B` 表示 A 可以依赖 B）
- 包边界规则（哪些 import 被禁止）
- 何时建新包 vs 直接放现有包

**示例段落**：

```md
## 依赖方向

`apps/* → packages/feature + packages/core`
`packages/feature → packages/core`
`packages/core` 不依赖任何业务包

## 包边界

- `packages/core/` 禁止 `import` 任何 UI 库或平台 API
- `packages/ui/` 禁止 `import` 业务 store
```

### 前后端分离项目

**必答**：
- API 契约归属（OpenAPI / tRPC / GraphQL schema 在哪）
- 数据库连接层在哪
- 认证鉴权流程

### 客户端 + 云端项目（如 Tauri、Electron）

**必答**：
- 进程间通信协议（IPC 命令清单、事件清单）
- 前端路由层 vs 后端服务层的职责切分
- 本地文件 / 本地 DB 访问的抽象层位置

### 单体应用

**必答**：
- 分层结构（controller / service / repository / …）
- 依赖注入点
- 横切关注点（日志、错误处理、缓存）

## coding.mdc 写作要点

按技术栈给出具体命令和配置锚点：

### Node/TypeScript

```md
## 工具链

- 类型检查：`pnpm typecheck`
- Lint：`pnpm lint`（Biome / ESLint）
- 格式化：`pnpm format`
- 测试：`pnpm test`

## TypeScript 风格

- 严格模式：`strict: true`
- 禁止 `any`，必要时用 `unknown` + type narrowing
- 导入路径：使用 `@/` 别名指向 `src/`
```

### Rust

```md
## 工具链

- 编译检查：`cargo check --workspace`
- Clippy：`cargo clippy -- -D warnings`
- 格式化：`cargo fmt --check`
- 测试：`cargo test --workspace`

## Rust 风格

- 错误处理统一用 `thiserror::Error` + `Result<T, MyError>`
- 避免 `unwrap()` / `expect()`（测试代码例外）
```

### Python

```md
## 工具链

- 类型检查：`mypy src/`（strict mode）
- Lint / 格式化：`ruff check .` + `ruff format .`
- 测试：`pytest`

## Python 风格

- Python 3.11+ syntax（`X | None` 而非 `Optional[X]`）
- 所有函数/方法标注类型
```

### Go

```md
## 工具链

- 编译：`go build ./...`
- 静态检查：`go vet ./...` + `staticcheck ./...`
- 测试：`go test ./... -race`

## Go 风格

- 包名短、全小写、不用下划线
- 错误包裹用 `fmt.Errorf("... %w", err)`
```

## 注意事项

### 不要做的事

- **不要写流程性规则**（那些属于 `universal/devloop.mdc`）
- **不要写 git 规范**（那些属于 `universal/vcs.mdc`）
- **不要写"进行中"内容**（迁移进度、TODO、任务清单——走根目录独立文档）
- **不要复制粘贴同事的项目规范**——读完项目代码再写

### 一定要做的事

- 引用具体文件路径时用反引号：`` `packages/core/src/types.ts` ``
- 规则背后的"为什么"用 `>` 引用块短说（避免长段落）
- 给出"违反会怎样"的后果（如"被 lint 拦截"、"PR 被拒绝"）

## 写作检查清单

写完一份 `project/*.mdc` 前自查：

- [ ] 这条规则换个项目还适用吗？如果是，该放 `universal/`
- [ ] 这条规则只是描述现状，没说"该怎么做"？那该去 `knowledge/`
- [ ] 给的命令是当前仓库真能跑的吗（非复制自其他项目）
- [ ] 给的路径是当前仓库真存在的吗
- [ ] `applies-to` 写了 `project:<name>` 吗
- [ ] 自查写完能让新成员看完就知道"我该怎么写代码"
