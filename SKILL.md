---
name: axm
description: |
  为项目建立 AI 可读的上下文知识库——`.axm/` 目录（规范 / 知识 / 索引 / 进度四类文档）加根目录 `AGENTS.md` 路由表，让 AI 接手任务时不必每次重新解释技术栈与架构。

  在以下场景必须立即调用：初始化或补全 axm / `AGENTS.md`；校验 axm-meta 契约（validate.mjs）或同步 index（reindex.mjs）；管理 roadmap / spec / 开发进度并写入 axm；管理 BUG（提交、优先级、验收、状态流转、关闭、重开）。
---

# axm

`.axm/` 是一套**给 AI 看的**项目上下文目录规范：用四类有契约的文档（规范 A / 知识 B / 索引 C / 进度 D）承载"这个项目怎么做、是什么、去哪读、做到哪里"，配合根目录 `AGENTS.md` 的 Knowledge Index 路由表，让 AI 接手任意任务前能快速定位需要的上下文。

本 skill 的核心分工是"**AI 判断 + 脚本机械**"：脚本负责跨项目逐字一致的内容（4 份 universal 规范 + axm-meta 契约校验 + index 同步），因为这些一旦漂移就让多项目维护者抓狂；AI 负责只能读代码才写得对的部分（架构、模块边界、真实源码路径、Knowledge Index 任务路由），因为这些是 AI 扫一遍项目才知道的。两边各做自己擅长的，初始化完的那一刻既有可复用骨架，也有项目特有的血肉。

Skill 目录布局：

```
axm/
├── SKILL.md              # 本文件
├── references/           # AI 按需读的写作指南
│   ├── axm-meta-contracts.md   # 四套骨架速查
│   ├── project-spec-guide.md      # 写 project/*.md 的要点
│   ├── knowledge-doc-guide.md     # 写 knowledge/**/*.md 的要点
│   ├── agents-md-guide.md         # 定制 AGENTS.md 的要点
│   ├── progress-doc-guide.md      # 写 progress/**/*.md 的要点
│   └── bug-doc-guide.md           # 写 progress/bugs/**/*.md 的要点（通用 BUG 管理规范）
├── templates/            # 脚本逐字释放的模板（.tpl 后缀）
│   ├── AGENTS.md.tpl
│   └── axm/              # 释放到目标仓库的 .axm/
└── scripts/              # 零依赖 Node 脚本
    ├── scaffold.mjs      # 释放通用规范 + 骨架
    ├── validate.mjs      # 校验契约
    └── reindex.mjs       # 同步索引
```

## 5 阶段 SOP

整个初始化是一条线性流水。除非用户明确只想做某一步，否则按顺序走完。每个阶段失败都应报告给用户，不要静默跳过。

### Phase 1 Discover（AI 执行）

**目标**：产出一份"项目画像"，让后续阶段有信息可用。

**操作**：
1. 从根目录读取**至少**以下文件（按实际存在情况选）：
   - `package.json` / `pnpm-workspace.yaml` / `turbo.json` — Node 生态
   - `Cargo.toml` — Rust
   - `pyproject.toml` / `requirements.txt` — Python
   - `go.mod` — Go
   - `Gemfile` / `composer.json` / `pom.xml` / `build.gradle` — 其他
   - `tsconfig.json` / `biome.json` / `.eslintrc*` — 前端工具链
2. 扫描顶层目录（`ls -la`），识别：是否 monorepo（`apps/` + `packages/`）、前后端分离、客户端 + 云端等结构
3. 针对核心目录（如 `src/`、`apps/*/src/`）扫一层，识别模块边界
4. 有 README 就读 README

**产出**：一份简短的"项目画像"给用户确认，至少包含：

```md
## 项目画像（待确认）

- **项目名**：xxx
- **技术栈**：Node/TypeScript + React（举例）
- **结构**：monorepo（pnpm + turborepo）/ 单体 / 前后端分离
- **核心模块**：
  - packages/core — 业务内核
  - packages/ui — UI 组件
  - apps/web — Web 端
- **依赖方向**：apps/* → packages/*
- **技术特色**（如有）：Tauri / tRPC / Supabase 等特殊集成
```

**等用户确认后再进 Phase 2**。如用户补充或修正，更新画像再确认。

### Phase 2 Scaffold（脚本执行）

**目标**：释放跨项目零差异的内容（universal 4 份规范 + 索引骨架 + AGENTS.md 骨架）。

**操作**：询问用户以下信息（能从项目画像推断的不用问）：
- `owner`：这套文档的维护方标识（团队名或个人名，如 `core-team`、`yourname`）
- `date`：今天的日期（格式 `YYYY-MM-DD`，你可以直接从系统时间推断填上）
- `project-name`：项目名（默认取目标目录名）

然后运行：

```bash
node <skill-path>/scripts/scaffold.mjs \
  --owner=<owner> \
  --date=<YYYY-MM-DD> \
  --project-name=<name> \
  --target=<项目根绝对路径>
```

默认拒绝覆盖已有文件；如果用户确认要覆盖，追加 `--force`。

脚本会输出 manifest（created / skipped / overwritten 三类）。**把 manifest 原样转述给用户**，让他们知道哪些被跳过了。

**产出**：目标仓库多出以下文件（10 个）：
- `AGENTS.md`
- `.axm/index.md`
- `.axm/universal/{index,docs,devloop,quality,vcs}.md`
- `.axm/project/index.md`（空 entries）
- `.axm/knowledge/index.md`（空 entries）
- `.axm/progress/index.md`（空 entries）

### Phase 3 Author（AI 执行）

**目标**：根据 Phase 1 画像，把"项目特有"的部分填进去。这是整个流程里 AI **唯一**要亲自写 `.md` 的阶段。

**操作**：按 3.1-3.8 顺序推进，每做一件**先读对应的 references 指南**再动手。3.6-3.8 按用户需要可选。

#### 3.1 写 `project/architecture.md`（必须）

先读 `<skill-path>/references/project-spec-guide.md`。

根据 Phase 1 画像，写清楚：
- 模块划分（每个 `apps/*` / `packages/*` / 根目录子目录的职责）
- 依赖方向
- 硬约束（包边界、禁止直接访问的 API 等）

axm-meta 用骨架 A（`applies-to: [project:<name>]`）。最短 30-80 行足够。

#### 3.2 写 `project/coding.md`（有编码标准就写）

还是参照 `references/project-spec-guide.md`。按实际技术栈给具体命令：
- 类型检查 / Lint / 测试的确切 CLI 命令
- 命名约定、路径别名、依赖版本要求

#### 3.3 建 knowledge 子系统并写 overview（至少建 1-2 个）

先读 `<skill-path>/references/knowledge-doc-guide.md`。

根据 Phase 1 识别到的核心模块，选 1-2 个最值得文档化的切成子系统：

```
knowledge/<system>/
├── index.md              # 骨架 C
└── overview.md           # 骨架 B，depth=overview
```

**overview.md 的 `code-refs` 必须填真实存在的源码路径**——`validate.mjs` 会硬校验。

deep 文档（具体话题）**本阶段不写**，只建目录和 overview；后续用户有具体需求时再补。

#### 3.4 补全 `AGENTS.md`

读 `<skill-path>/references/agents-md-guide.md`。

把 scaffold 生成的 `AGENTS.md` 里两处 TODO 补齐：
- **Architecture 段**（当前是 TODO 占位）：1-2 屏讲清技术栈、模块划分、依赖方向
- **Knowledge Index 表**：在已有的 4 条 universal 条目下追加项目特有的"任务类型 → 文档"路由。5-15 条刚好

#### 3.5 更新相关 index.md

`project/index.md` 和 `knowledge/index.md` 的 `entries` 需要根据刚写的文件填充。可以手动写，也可以跳过这步——Phase 4 完成后让 `reindex.mjs` 自动补。

#### 3.6 可选：建立 progress 开发进度

当用户明确要管理 roadmap / spec / 阶段验收时，先读 `<skill-path>/references/progress-doc-guide.md`，再在 `.axm/progress/<initiative>/` 下创建：

```
progress/<initiative>/
├── index.md
├── roadmap.md
└── specs/
    ├── index.md
    └── <spec>.md
```

roadmap 记录较大路线图和事实进度；spec 记录某次阶段开发的细节和验收标准。验收标准必须分为 **AI 自动验收** 与 **人类验收**。spec 的生成方法不限，可来自 Superpowers、OpenSpec 或人工讨论；axm 只约束最终文档位置与骨架 D。

#### 3.7 可选：闭合已完成 progress

当用户说某个阶段、spec 或 roadmap 已完成，需要"收尾 / 闭合 / 归档"时，先读 `<skill-path>/references/progress-doc-guide.md` 的闭合流程，再更新对应 progress 文档。闭合不是简单把状态改成 done；必须同时：

- 把已落地且仍长期有效的系统事实同步到 `knowledge/` 或 `project/`
- 在 roadmap/spec 中记录完成状态、最终验收、commit/PR 或等价证据
- 把遗留项移动到后续阶段、独立 spec 或明确标为 deferred
- 跑 `reindex.mjs --dry-run` 与 `validate.mjs`

已完成但仍有历史参考价值的 progress 文档通常保持 axm-meta `status: active`；只有被新方案取代或不应再作为参考时才改成 `deprecated`。

#### 3.8 可选：建立 BUG 管理（挂在 initiative 下的通用规范）

当用户希望管理 BUG（来自测试 agent、人工测试或生产事故）——需要"BUG 列表 + 优先级 + 验收标准 + 状态流转"——**先读 `<skill-path>/references/bug-doc-guide.md`**，再在 `.axm/progress/<initiative>/bugs/` 下落地。

进入 3.8 前必须先就位的判断（其余约束以 `bug-doc-guide.md` 为准）：

- BUG **必须**挂在某个 initiative 下；找不到归属时**先新建 initiative**（推荐 `progress/quality/`，或具体模块如 `progress/<module>/`），先建 `<initiative>/index.md`，再开 `bugs/`
- 不要在 `progress/` 顶层另建 `bugs/`；不要把 axm-meta `initiative` 字段填成 `bugs`

剩下的（命名、骨架、生命周期 8 状态、看板、测试/开发/验收三套流程、反模式、自查清单）全部在 `bug-doc-guide.md` 中，不在本文件复述。

### Phase 4 Validate（脚本执行）

**目标**：机械校验 Phase 2+3 的产物符合 `docs.md` 契约。

**操作**：

```bash
node <skill-path>/scripts/validate.mjs --target=<项目根绝对路径>
```

脚本输出 `N error(s), M warning(s)`，退出码：
- `0` — 全 PASS，进 Phase 5
- `1` — 有 ERROR（契约违反），**必须回 Phase 3 修复**
- `2` — 仅 WARN（孤儿文件等），**可以进 Phase 5**，但向用户报告警告

常见 ERROR：
- `code-refs 指向的源码不存在` → Phase 3 填了想象的路径，改成真实路径
- `last-reviewed 日期格式非法` → 检查 axm-meta
- `index.md entries 引用的子项不存在` → Phase 3 漏创建或路径写错
- `Knowledge Index 引用的路径不存在` → AGENTS.md 指向了还没写的 `.md`

常见 WARN（可选修）：
- `发现孤儿子项未登记到 entries` → 运行 `node <skill-path>/scripts/reindex.mjs --target=<项目根>` 自动同步

**修复后重跑 validate 直到 exit 0 或仅剩可接受的 WARN。不要静默忽略 ERROR。**

### Phase 5 Handoff（AI 执行）

**目标**：告诉用户"做完了什么 / 还有哪些 TODO"。

**操作**：向用户输出一份简明清单：

```md
## axm 初始化完成

### 已创建（机械释放）
- AGENTS.md
- .axm/universal/{docs,devloop,quality,vcs}.md
- .axm/{index,universal/index,project/index,knowledge/index,progress/index}.md

### 已撰写（项目特有）
- .axm/project/architecture.md — <一句话概括>
- .axm/project/coding.md — <一句话概括>
- .axm/knowledge/<system>/overview.md — <一句话概括>

### Validate 结果
- 0 errors, N warnings（如有 warn 列出）

### 后续建议 TODO
- [ ] universal/quality.md 里的占位命令（`<项目 typecheck 命令>` 等）替换为项目实际命令
- [ ] 随着子系统深入，补 knowledge/<system>/<topic>.md deep 文档
- [ ] 运行测试 / CI 验证 axm 与代码现实一致后，更新各 .md 的 last-reviewed
```

## 单独调用脚本的场景

本 skill 不是必须走完整 5 阶段。独立用途：

### 只校验已有 .axm

用户改过 `.axm` 想验一下契约：

```bash
node <skill-path>/scripts/validate.mjs --target=<项目根>
```

### 只同步 index

用户新增/删除了 `.axm/**/*.md` 想更新索引：

```bash
# 先 dry-run 预览
node <skill-path>/scripts/reindex.mjs --target=<项目根> --dry-run
# 确认后落盘
node <skill-path>/scripts/reindex.mjs --target=<项目根>
```

reindex 会保留已有 `entries` 的顺序和 title/when-to-read，只追加孤儿（标 TODO）、删除失效条目。

> 闭合已完成 progress 的完整流程见 Phase 3.7；操作完后跑一次 `reindex.mjs --dry-run` + `validate.mjs` 收尾即可。

## 关键约束（必须遵守）

1. **Phase 2 之前不能写 .md**——通用规范由脚本释放，手写会跨项目漂移
2. **Phase 4 ERROR 必须修**，不能视而不见交付
3. **不要自作主张修改目标项目 `universal/` 下的 4 份文件**。那是跨项目"宪法"，需要变更时改 skill 里的 `templates/`，不是目标项目里的产物

（"code-refs 必须真实存在"、"deep 知识文档不主动写"已在 Phase 3.3 里讲过，不再单列。）
