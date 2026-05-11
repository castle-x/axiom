<!-- axm-meta
status: active
last-reviewed: 2026-05-11
owner: axm-skill
applies-to: [project:axm]
related:
  - ../knowledge/scripts/overview.md
-->


# 架构约定

axm 是一个 Anthropic Agent Skill 包，采用**扁平结构**（非 monorepo）。设计哲学：**AI 判断 + 脚本抄写**——AI 负责理解项目、撰写项目特有文档；脚本负责释放通用规范、校验契约、同步索引。

## 顶层结构

```
axiom/                      # skill 包本体，git clone 即用
├── SKILL.md                # Anthropic skill 入口（name + description + 5 阶段 SOP）
├── README.md               # 给人读的文档
├── AGENTS.md               # 本仓库自身的 AI 入口（吃狗粮）
├── .axm/                   # 本仓库自身的 .axm/（吃狗粮）
├── references/             # AI Phase 3 按需读的写作指南（4 份 .md）
├── templates/              # 脚本逐字释放的 .tpl 模板
└── scripts/                # 零依赖 Node 脚本
```

## 四大角色

| 角色 | 目录 | 谁读 | 谁写 |
|---|---|---|---|
| SOP 主入口 | `SKILL.md` | AI（progressive disclosure 第 2 层） | 维护者人工 |
| 写作指南 | `references/*.md` | AI（Phase 3 按需加载） | 维护者人工 |
| 释放模板 | `templates/**/*.tpl` | scaffold.mjs 读取 | 维护者人工 |
| 机械脚本 | `scripts/*.mjs` | AI 调用 Node 执行 | 维护者人工 |

## 职责边界（硬约束）

以下约束违反会让 skill 的"AI 判断 vs 脚本抄写"分工崩坏：

### 脚本（scripts/）

- **零 npm 依赖**：所有脚本只用 Node 内置模块（`node:fs` / `node:path` / `node:url`）。理由：用户 `git clone` 即用，无 `npm install` 步骤
- **不做 AI 判断类工作**：脚本不猜项目技术栈、不写项目特有 `.md`、不改动正文。脚本只做"抄写 + 校验 + 同步"
- **ESM 语法**：所有脚本文件扩展名 `.mjs`，用 `import` 而非 `require`

### 模板（templates/）

- **只允许 `{{owner}}` / `{{date}}` / `{{project_name}}` 三个变量**。理由：变量越少，跨项目模板内容越稳定
- **文件后缀必须 `.tpl`**：避免被误当作真实 `.md`（如被 IDE/grep 误扫）
- **`templates/axm/` 子目录映射到目标仓库 `.axm/`**：由 `scaffold.mjs` 的 `mapToDestRel` 规则决定

### 写作指南（references/）

- **不放规范条目**：这些是写作的"如何"，不是"什么"。`.axm/universal/docs.md` 才是契约真源
- **每份文件独立**：AI 按 Phase 3 的 3.x 子步骤选择性读取

### SKILL.md

- **< 500 行**：超过就拆到 `references/`（Anthropic skill 规范建议）
- **YAML frontmatter 只含 name + description**：遵循 Anthropic Agent Skills 开放标准
- **description 覆盖三大场景关键词**：初始化 `.axm`、校验 frontmatter、同步 index；"稍微 pushy" 抵抗 AI 的 undertrigger 倾向

## 扩展原则

新增能力时按以下顺序考虑落位：

1. 能由"AI 读项目 + 已有脚本"组合完成？→ 不新增代码，只改 `SKILL.md` 的 SOP 或 `references/` 指南
2. 是机械的、可泛化的校验/同步操作？→ 新增 `scripts/*.mjs`（仍零依赖）
3. 是跨项目需要逐字一致的规则？→ 改 `templates/` 和 `.axm/universal/docs.md` 模板
4. 是单项目场景？→ 不入 skill，留给用户在自己仓库的 `.axm/project/*.md` 写

违反扩展原则的信号：脚本里出现 `if (isNodeProject)` 之类的栈判断；或者 `references/` 里出现"步骤 1 做 X，步骤 2 做 Y"的流程指令。一旦看到这类代码，说明分工错位，应上移到 `SKILL.md` 的 SOP。
