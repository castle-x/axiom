<!-- axm-meta
status: active
last-reviewed: {{date}}
owner: {{owner}}
applies-to: [universal]
related:
  - ./devloop.md
  - ./vcs.md
  - ../index.md
-->

# 文档规范

定义 `.axm/` 目录下所有文档的结构、axm metadata、命名、索引、归档与审查规则。本文件是文档写作的最高约束，所有 `.axm/**/*.md` 必须遵循。

## 一、文档分类

`.axm/` 下有三类文档，对应三套 axm metadata 骨架：

| 类别 | 目录 | 生命周期 | 典型内容 | 骨架 |
|------|------|----------|----------|------|
| 规范 | `universal/`、`project/` | 长期 | 编码/流程/设计约束 | A |
| 知识 | `knowledge/**` | 中长期（随代码演进） | 系统设计、模块结构、设计决策 | B |
| 索引 | 所有 `index.md` | 长期 | 子目录的文件清单与导航 | C |

## 二、axm metadata 骨架（必须）

所有 `.axm/**/*.md` **必须**以隐藏的 `axm-meta` 注释块开头。注释块位于文件最顶部，Markdown 预览中不可见，与正文以空行分隔。

### 骨架 A — 规范类

用于 `universal/*.md`、`project/*.md`（不含 index.md）。

```yaml
<!-- axm-meta
status: active | draft | deprecated
last-reviewed: YYYY-MM-DD
owner: <team-or-person>
applies-to: [universal] | [project:<name>] | [project:<name>, <scope>]
related:
  - ../knowledge/<system>/overview.md
-->
```

字段定义：

| 字段 | 必填 | 说明 |
|---|---|---|
| `status` | ✅ | `active`（生效中）/ `draft`（草稿）/ `deprecated`（已废弃，应删除或重写） |
| `last-reviewed` | ✅ | 最近一次人工核对规范与现实一致性的日期（ISO 8601）。仅修 typo / 调格式不更新此字段 |
| `owner` | ✅ | 负责维护的团队或人员标识 |
| `applies-to` | ✅ | 适用范围。`universal` 表示跨项目通用规范；`project:<name>` 表示绑定到特定项目；可叠加子作用域（如 `project:<name>, frontend`） |
| `related` | ⭕ | 交叉引用的相关文档相对路径列表 |

### 骨架 B — 知识类

用于 `knowledge/**/*.md`（不含 index.md）。

```yaml
<!-- axm-meta
status: active | draft | deprecated
last-reviewed: YYYY-MM-DD
owner: <team-or-person>
depth: overview | deep
code-refs:
  - src/<module>/<file>.ts
  - src/<module>/<file>.rs
related:
  - ../../project/architecture.md
-->
```

字段定义（仅列与骨架 A 不同的部分）：

| 字段 | 必填 | 说明 |
|---|---|---|
| `depth` | ✅ | `overview`（≤150 行速查）或 `deep`（完整设计文档，允许超长） |
| `code-refs` | ✅ | 本文档描述事实所对应的源码路径列表。**必须是真实存在的路径**，用于 `last-reviewed` 审查时的锚点 |

### 骨架 C — 索引类

用于所有 `index.md`。

```yaml
<!-- axm-meta
status: active
last-reviewed: YYYY-MM-DD
owner: <team-or-person>
entries:
  - path: overview.md
    title: 子系统速查
    when-to-read: 了解子系统整体架构
  - path: architecture.md
    title: 子系统详细设计
    when-to-read: 需要深度设计细节时
-->
```

字段定义：

| 字段 | 必填 | 说明 |
|---|---|---|
| `entries` | ✅ | 本目录下所有直接子项（文件 + 子目录）的清单 |
| `entries[].path` | ✅ | 相对本 index 的路径（文件写 `*.md`，子目录写 `xxx/`） |
| `entries[].title` | ✅ | 简短标题，供 AI 选择时阅读 |
| `entries[].when-to-read` | ✅ | 触发条件的一句话描述（何时应读取此条目） |

## 三、axm metadata 写作细则

1. **字段顺序**：按骨架列表顺序编写，便于审阅
2. **字符串引号**：默认不加引号，仅当值包含 `: , [ ] { } #` 等 YAML 特殊字符时用双引号
3. **列表格式**：长列表用多行 `-` 缩进（如 `code-refs`），短列表（≤2 项且简单）可用 flow `[a, b]`
4. **日期格式**：严格 `YYYY-MM-DD`
5. **路径分隔符**：统一正斜杠 `/`，即使在 Windows 文档中
6. **`related` 与 `code-refs` 路径**：`related` 是相对本文件的 `.axm/` 内路径；`code-refs` 是相对仓库根的源码路径
7. **注释**：metadata 中避免 `#` 注释，说明信息写在正文 §一节

## 四、命名规则

- **扩展名**：统一 `.md`（Markdown + axm metadata 契约，区别于根入口 `AGENTS.md` 和业务/代码事实中的 `.md` 文件）
- **文件名**：kebab-case（`editor-layout.md`、`auth-redesign.md`）
- **禁止** 日期前缀：`2026-04-22-plan.md` ✗
- **禁止** 版本号前缀：`v2-design.md` ✗
- **index.md**：每个目录必须有一份，文件名固定为 `index.md`（不用 `README.md`），内容为骨架 C 索引

## 五、目录与索引链路

```
.axm/
├── index.md                    # 骨架 C：一级分区总索引
├── universal/
│   ├── index.md                # 骨架 C
│   └── <spec>.md               # 骨架 A
├── project/
│   ├── index.md                # 骨架 C
│   └── <spec>.md               # 骨架 A
└── knowledge/
    ├── index.md                # 骨架 C：子系统索引
    └── <system>/
        ├── index.md            # 骨架 C：子系统内部索引
        ├── overview.md         # 骨架 B, depth=overview
        └── <topic>.md          # 骨架 B, depth=deep
```

**索引链路**（AI 查找规范/知识的路径）：

```
AGENTS.md（根入口·Knowledge Index）
   └→ .axm/index.md（一级分区总索引）
       └→ <dir>/index.md（子分区索引）
           └→ 具体 .md 文件
```

## 六、index.md 编写规则

所有 `index.md` **只做索引**，不写任何规范或知识正文：

- axm metadata：骨架 C（必填 `entries`）
- 正文：简短的"职责定位"段 + 以表格或列表形式呈现 `entries`
- **禁止**在 `index.md` 中直接写规则定义、代码示例、设计细节

## 七、内容写作原则

- 每个文档回答**一个**问题或定义**一条**规则域
- 结构化优先：表格 / 列表 / 代码块；拒绝散文式长段落
- 规范文档写"应该怎么做"；知识文档写"是什么、为什么"
- 举例优于抽象描述
- 避免重复：跨文档引用优于复制粘贴

## 八、审查流程（与 last-reviewed 绑定）

`last-reviewed` 字段是文档与现实一致性的锚点，更新规则：

1. **规范文档**：当规则本身被核对过仍然生效，或内容变更并核对过实施现状，更新 `last-reviewed`
2. **知识文档**：当 `code-refs` 列出的源码被读过一遍、确认正文描述与代码一致，更新 `last-reviewed`
3. **索引文档（index.md）**：当 `entries` 列表被重新核对过（文件存在、顺序合理），更新 `last-reviewed`
4. **仅修 typo / 调整格式 / 优化措辞**：**不**更新 `last-reviewed`

违反审查时效（代码与知识文档不一致）判定为技术债，标记 `@debt:docs` 并在对应 commit 中体现。

## 九、归档与废弃

1. **内容过时**：先将 `status` 改为 `deprecated`，在正文顶部说明原因与替代文档链接，保留至少 1 个 review 周期
2. **彻底删除**：deprecated 状态超过 1 个周期且无引用后，可以删除；**不**做 archive 目录保留（git 历史已足够）

## 十、规范文档的稳定性约束（AI 行为禁令）

`universal/*.md`、`project/*.md` 属于**长期规范**（骨架 A），承载的是"应该怎么做"的稳态规则。AI 在执行任务时对这类文件负有以下强约束：

### 10.1 禁止擅自修改规范

- **禁止**在未被用户显式指示的情况下修改 `universal/` 与 `project/` 下任何 `.md`（typo 修复也不例外，需先问）
- **禁止**以"顺手补齐""使其更完整""对齐当前实现"为由扩写规范条目
- **禁止**因迁移 / 重构 / 新功能而触发的"规则同步更新"——规则是稳态，应先通过根目录任务文档（如 `MIGRATION-*.md`）表达变化，规则更新由人类收口

### 10.2 禁止在规范文档写"进行中"内容

规范文档**禁止**出现以下任一类内容：

- 迁移状态、阶段进度、任务 TODO、完成百分比、"暂缓清单"
- 带时间窗的临时约束（"在 X 完成前，Y 暂时不做"）
- 正在讨论 / 待决策 / 草案性质的设计选择（应落在根目录专用提案文档）
- 指向进行中工作的强耦合链接（使规范的生效范围依赖外部未完成产物）

规范要么**生效**要么**不写**。进行中内容的正确归属：

| 内容类型 | 正确归属 |
|---|---|
| 迁移进度 / 阶段状态 | 根目录独立迁移文档（如 `MIGRATION-*.md`） |
| 一次性调研 / 审查 / 设计提案 | 根目录独立文档（如 `PROPOSAL-*.md`、`RESEARCH-*.md`） |
| 任务清单 / TODO | 不入库，走任务系统或 PR 描述 |

### 10.3 例外触发条件

仅当满足以下**任一**条件，AI 才可修改规范文档：

1. 用户在当前会话中**显式指示**修改某条规范（例："把 §3 的缩进从 2 改成 4"）
2. 用户明确授权"落规则"（例："把 X 规则写进 docs.md"）——AI 必须先出草案供确认再写入
3. `status: deprecated` 的文档按 §九归档流程处理

违反本节的修改，下一轮审查时应直接 `git checkout --` 回滚，无需征得原修改者同意。

## 十一、工具链约束

- Markdown 渲染器隐藏 `axm-meta` HTML 注释块，Biome/Prettier 不处理其内容 → 零工具链成本
- 本规范的契约由 axm skill 的 `scripts/validate.mjs` 机械校验，不依赖 git hook
- 未来如需在 CI 中启用，直接挂 `node <skill-path>/scripts/validate.mjs` 即可

## 附：三套骨架快速对照

| 维度 | 骨架 A（规范） | 骨架 B（知识） | 骨架 C（索引） |
|---|---|---|---|
| 必填字段 | status / last-reviewed / owner / applies-to | status / last-reviewed / owner / depth / code-refs | status / last-reviewed / owner / entries |
| 可选字段 | related | related | — |
| 使用位置 | universal/*.md · project/*.md | knowledge/**/*.md | 所有 index.md |
| 触发 `last-reviewed` 更新 | 规则被核对 | 代码对照完成 | entries 核对完成 |
