# AGENTS.md

axm 是一个 Anthropic Agent Skill 包，用于帮新项目快速完成 `.axm/` 知识库与 `AGENTS.md` 根入口的初始化。本文是 AI 处理本仓库任务的入口规则文档。

本仓库**不再 dogfood 自己生成的 `.axm/`**。维护 axm skill 时，以根目录源码、`SKILL.md`、`references/`、`templates/` 与 `scripts/` 为准；需要验证输出结构时，使用临时目标目录跑 scaffold/validate/reindex smoke test。

## Architecture

axm 采用**扁平结构**（非 monorepo），git clone 到 `~/.claude/skills/axm/` 或项目 skills 目录即用。

### 模块划分

- `SKILL.md` — Anthropic Agent Skills 标准入口（YAML axm-meta + 5 阶段 SOP）
- `references/*.md` — AI Phase 3 按需加载的写作指南（5 份）
- `templates/**/*.tpl` — 脚本逐字释放的模板（含 `{{owner}}` / `{{date}}` / `{{project_name}}` 三个变量）
- `scripts/*.mjs` — 零依赖 Node 脚本（scaffold / validate / reindex / preview）
- `scripts/_lib/*.mjs` — 脚本共享模块（axm-meta 解析器、walker、logger）
- `AGENTS.md` — 本仓库维护入口规则

### 设计哲学

**AI 判断 + 脚本抄写**——跨项目需逐字一致的通用规范由脚本释放；项目特有的架构/知识文档由 AI 读完代码后撰写；可机械判定的契约校验由脚本做。

### 硬约束

- **脚本零 npm 依赖**：只用 Node 内置模块
- **模板变量只 3 个**：`{{owner}}` / `{{date}}` / `{{project_name}}`
- **SKILL.md < 500 行**：超了拆到 `references/`
- **扩展方向**：新能力优先走"改 SOP"或"改 references"，再考虑新增脚本；禁止让脚本做栈判断

## Coding Rules

> 这些规则偏向谨慎而非速度。对于显然简单的任务，运用判断力即可。

### 1. 先思考，再动手

**不假设。不掩饰困惑。主动呈现权衡。**

动手前：

- 明确说出你的假设。不确定就问。
- 存在多种解读时，把它们列出来——不要沉默地选一个。
- 有更简单的方案就说出来。该推回就推回。
- 有不清楚的地方，停下来。说出困惑在哪。问。

### 2. 简单优先

**能解决问题的最少代码。不做任何投机性内容。**

- 不做超出要求的功能。
- 单次使用的代码不做抽象。
- 不做未被要求的"灵活性"或"可配置性"。
- 不为不可能发生的场景写错误处理。
- 写了 200 行、50 行就能解决的，重写。

自问："资深工程师会觉得这过度复杂吗？"如果是，简化。

### 3. 外科手术式修改

**只动必须动的。只清理自己制造的乱子。**

修改现有代码时：

- 不"改进"相邻代码、注释或格式。
- 不重构没有损坏的东西。
- 匹配已有风格，即使你会用不同写法。
- 注意到无关的死代码，说出来——不要删。

当你的改动产生孤儿时：

- 清理**因你的改动**而变成未使用的 import / 变量 / 函数。
- 不清理早于本次变更就已存在的死代码，除非被要求。

检验标准：每一行变更都应能直接追溯到用户的需求。

### 4. 目标驱动执行

**明确验收标准。循环直到验证通过。**

把任务转化为可验证的目标：

- "加校验" → "先写针对非法输入的测试，再让测试通过"
- "修 bug" → "先写能复现 bug 的测试，再让测试通过"
- "重构 X" → "确保重构前后测试都通过"

多步骤任务，先陈述简要计划：

```
1. [步骤] → 验证：[检查点]
2. [步骤] → 验证：[检查点]
3. [步骤] → 验证：[检查点]
```

清晰的验收标准让你能独立循环推进。模糊标准（"让它跑起来"）会导致反复澄清。

---

最终决定权在人。AI 不擅自做重大决策；有异议明确说出，但尊重人的选择。

**这些规则生效的标志：** diff 中不必要的改动减少；因过度复杂而返工的情况减少；澄清问题在动手前提出，而不是在出错后。

## Knowledge Index

| 任务类型 | 读哪里 |
| --- | --- |
| 理解 skill 流程 / 修改 SOP | `SKILL.md` |
| 修改 Phase 3 写作指南 | `references/*.md` |
| 修改生成内容 / universal 规则 | `templates/**/*.tpl`，必要时同步相关 `references/*.md` |
| 修改 scaffold/validate/reindex/preview | `scripts/*.mjs` + `scripts/_lib/*.mjs` |
| 了解用户侧产物结构 | `README.md` 的"完成后你的仓库会多出"与 `templates/` |
| 验证脚本或模板改动 | 在临时目录运行 scaffold → validate → reindex |

## Quality Gate

| 场景 | 命令 | 要求 |
| --- | --- | --- |
| 修改脚本 | `node scripts/validate.mjs --target=<临时 axm 项目>` | 零 ERROR（WARN 需解释） |
| 修改模板 | `node scripts/scaffold.mjs --owner=smoke --date=<YYYY-MM-DD> --project-name=smoke --target=<临时目录>` 后接 validate/reindex | 生成结果可校验，且无 `{{...}}` 残留 |
| 修改 `SKILL.md` / `references/` | 人工检查流程一致性；必要时跑一次完整 smoke test | 不引入与模板或脚本冲突的说明 |

不要再用 `node scripts/validate.mjs --target=.` 作为本仓库自测；仓库根目录不是 axm 目标项目。
