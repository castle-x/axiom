# AGENTS.md

axm 是一个 Anthropic Agent Skill 包，用于帮新项目快速完成 `.axm/` 知识库与 `AGENTS.md` 根入口的初始化。本文是 AI 处理本仓库任务的**唯一入口规则文档**；其他工具文件（`CLAUDE.md` / `CODEBUDDY.md` 等）仅作摘要，冲突时以本文为准。

> 本仓库进行自用验证：axm skill 自身的 `.axm/` 就是“用 axm 初始化一个 axm 项目”的产物。

## .axm 召回声明

**本条优先级最高，高于其余所有规则。**

每轮若实际读取过 `.axm/` 下任何文件，**必须**在回答最开头输出：

> **.axm 召回**
>
>
> | 文件          | 读取原因  |
> | ----------- | ----- |
> | `.axm/<路径>` | <一句话> |
>

仅列实际读取的文件，按读取顺序排列；本轮未读则不输出此块；沿用上轮已读内容仍需列出。该表格必须是回答的第一块内容。

## Architecture

axm 采用**扁平结构**（非 monorepo），git clone 到 `~/.claude/skills/axm/` 或项目 skills 目录即用。

### 模块划分

- `SKILL.md` — Anthropic Agent Skills 标准入口（YAML frontmatter + 5 阶段 SOP）
- `references/*.md` — AI Phase 3 按需加载的写作指南（4 份）
- `templates/**/*.tpl` — 脚本逐字释放的模板（含 `{{owner}}` / `{{date}}` / `{{project_name}}` 三个变量）
- `scripts/*.mjs` — 零依赖 Node 脚本（scaffold / validate / reindex）
- `scripts/_lib/*.mjs` — 脚本共享模块（frontmatter 解析器、walker、logger）
- `.axm/` + `AGENTS.md` — 本仓库自身的 AI 上下文（自用验证）

### 设计哲学

**AI 判断 + 脚本抄写**——跨项目需逐字一致的通用规范由脚本释放；项目特有的架构/知识文档由 AI 读完代码后撰写；可机械判定的契约校验由脚本做。

### 硬约束

- **脚本零 npm 依赖**：只用 Node 内置模块
- **模板变量只 3 个**：`{{owner}}` / `{{date}}` / `{{project_name}}`
- **SKILL.md < 500 行**：超了拆到 `references/`
- **扩展方向**：新能力优先走"改 SOP"或"改 references"，再考虑新增脚本；禁止让脚本做栈判断

细节见 `.axm/project/architecture.mdc`。

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

| 任务类型                      | 读哪里                                                                            |
| ------------------------- | ------------------------------------------------------------------------------ |
| 每次任务开始 / 分级与流程            | `.axm/universal/devloop.mdc`                                                   |
| 编码完成 / 提交前质量门禁            | `.axm/universal/quality.mdc`                                                   |
| 提交 / 分支操作                 | `.axm/universal/vcs.mdc`                                                       |
| 写 `.axm` 文档 / 三套骨架契约      | `.axm/universal/docs.mdc`                                                      |
| 修改脚本（scaffold/validate/reindex） | `.axm/project/coding.mdc` + `.axm/knowledge/scripts/overview.mdc`        |
| 新增脚本能力 / 跨包边界             | `.axm/project/architecture.mdc`                                                |
| 修改 SKILL.md 或 references  | `.axm/project/architecture.mdc` + `.axm/project/coding.mdc`（写作风格）             |
| 修改 templates/             | `.axm/project/architecture.mdc`（模板变量约束）                                        |
| Bug 修复                    | `.axm/universal/devloop.mdc` + `.axm/knowledge/scripts/overview.mdc`           |

`.axm/` 目录分区：`universal/`（通用流程）、`project/`（本项目规范）、`knowledge/`（系统设计事实）。各目录有 `index.mdc` 总索引。
