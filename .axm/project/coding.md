<!-- axm-meta
status: active
last-reviewed: 2026-05-12
owner: axm-skill
applies-to: [project:axm]
related:
  - ./architecture.md
-->


# 编码规范

## 脚本（scripts/*.mjs）

### 硬约束

- **扩展名**：`.mjs`（ESM）
- **依赖**：**零 npm 依赖**。只能 `import` 以下两类：
  - Node 内置模块（`node:fs` / `node:path` / `node:url` / `node:process`）
  - 同仓库 `./_lib/*.mjs`
- **不引入**：`js-yaml` / `commander` / `chalk` / `mustache` / `handlebars` / 任何 3rd-party
- **理由**：用户 `git clone` 到 `~/.claude/skills/axm/` 后应立即可用，无需 `npm install` 步骤

### 行为约束

- **顶部 shebang**：每个主入口脚本（`scaffold.mjs` / `validate.mjs` / `reindex.mjs`）以 `#!/usr/bin/env node` 开头
- **main() 模式**：每个主脚本末尾调用 `main()`，不顶层写副作用
- **退出码语义**：
  - `0` = 成功
  - `1` = 契约违反 / 致命错误
  - `2` = 仅警告（validate 专用）
- **错误格式统一**：通过 `scripts/_lib/logger.mjs` 的 `formatIssue()` 输出，附 `docs.md §X` 章节引用
- **写文件原子化**：`reindex.mjs` 改文件必须 `.tmp + rename`，避免半成品
- **默认不覆盖**：`scaffold.mjs` 对已存在目标文件必须拒绝覆盖，显式 `--force` 才允许

## YAML 解析（scripts/_lib/frontmatter.mjs）

该解析器**刻意不全**——只覆盖四套骨架（A/B/C/D）实际用到的 YAML 子集：

- 标量（string / date / boolean）
- inline 列表 `[a, b]`
- block 字符串列表（`related` / `code-refs`）
- `entries` 对象列表（每项含 `path` / `title` / `when-to-read`）

**禁止扩展**支持嵌套 map / 多行字符串 / 锚点别名 / flow map / YAML 注释等特性。如果 `.axm` 文档未来需要这些，先改 `docs.md` 契约再改解析器。

## 模板（templates/*.tpl）

- **变量只能 3 个**：`{{owner}}` / `{{date}}` / `{{project_name}}`
- **不引入条件块**（`{{#if xxx}}`）或循环块（`{{#each xxx}}`）——这会让模板引擎复杂度爆炸，改由 AI 在 Phase 3 手写项目特有内容
- **`.tpl` 后缀**：确保 IDE 不把它们当真实 `.md` 渲染、不被 validate 扫到

## 写作风格

### SKILL.md 和 references/

- **imperative 祈使句**：不用 "You should..."，用 "读取文件"、"运行脚本"
- **解释 why**：不堆 ALL-CAPS MUST；每条约束说明"不这样会怎样"
- **< 500 行** SKILL.md，超了就拆 references

### .axm/**/*.md

- 一律遵循 `.axm/universal/docs.md` 的四套 axm metadata 骨架
- 每份文档回答**一个**问题
- 结构化优先：表格 / 列表 / 代码块
- 规范写"应该怎么做"，知识写"是什么、为什么"

## 质量门禁

| 检查项 | 命令 | 要求 |
|---|---|---|
| axm 契约校验 | `node scripts/validate.mjs --target=.` | 零 ERROR（WARN 可接受） |
| Node 脚本执行性 | `node scripts/scaffold.mjs --help 2>&1 ; node scripts/validate.mjs --target=.` | 不崩 |

无 lint / typecheck / test 工具链——脚本自证（`validate.mjs` 能跑过自己的 `.axm/` 就是最好的集成测试）。

## 提交前

1. 修改脚本后：在 `/tmp/axm-smoke` 建临时目录，跑一次 scaffold → validate → reindex 三件套，看 exit 码
2. 修改模板后：同上，看渲染结果是否有未替换的 `{{` 残留
3. 修改 `.axm/` 本仓库文档后：在仓库根跑 `node scripts/validate.mjs --target=.`

**特别提醒**：`scripts/_lib/frontmatter.mjs` 的任何改动都要用多份 `.axm/**/*.md` 实际回归（本仓库的 `.axm/` 就是回归套件）。
