# axm-health-check-guide.md — `.axm` 文档体检指南

> 适用范围：用户说"用 axm 给当前项目的 `.axm` 体检"、"检查 axm 是否符合代码事实"、"清理 / 归档废弃文档、计划、spec、bug"等。体检是提示词驱动的深度审计，不新增脚本契约。

## 0. 原则

1. **代码事实优先**：以当前工作树、配置、测试、真实源码路径为准；`.axm` 是待核验对象，不是事实来源。
2. **先机械，后判断**：先跑 `validate.mjs` 与必要的 `reindex.mjs --dry-run`，再做语义审计。
3. **多 agent 并行**：当前环境支持 Task / subagent / 多 agent 时，必须并行启动；不支持时，说明限制并按相同职责分轮执行。
4. **交叉验证**：任何归档或关闭结论至少需要"文档证据 + 代码 / 测试 / 配置证据"两侧支撑；冲突时保留为待确认。
5. **状态归档**：默认不新建 `archive/` 目录。废弃规范 / knowledge 用 `doc-state: deprecated`；完成或失效的 progress/spec/bug 用终态 `workflow-state`，并记录证据。

## 1. Preflight

1. 读取 `AGENTS.md`、`.axm/index.md`、`README.md`、项目清单文件（如 `package.json` / `go.mod` / `pyproject.toml`）。
2. 跑：
   - `node <skill-path>/scripts/validate.mjs --target=<项目根>`
   - `node <skill-path>/scripts/reindex.mjs --target=<项目根> --dry-run`
3. 收集 `.axm/**/*.md` 的路径、`doc-state`、`progress-type`、`workflow-state`、`code-refs`、`last-reviewed`。
4. 明确本次体检范围：全量 `.axm`，或用户指定的 subsystem / initiative。

## 2. 并行 Agent 分工

为每个 agent 提供目标项目根路径、skill 路径、体检范围、只读/可写边界、输出格式。建议至少 4 组：

| Agent | 范围 | 必须回答 |
| --- | --- | --- |
| A. Contract / Index | `AGENTS.md`、所有 `index.md`、validate/reindex 输出 | 路由是否缺失、索引是否漂移、Knowledge Index 是否指向不存在路径 |
| B. Project / Knowledge | `.axm/project/**`、`.axm/knowledge/**` 与 `code-refs` | 文档中的架构、命令、模块边界是否符合代码事实 |
| C. Progress / Spec | `.axm/progress/**/roadmap.md`、`specs/*.md` | 已完成、被替代、阻塞、仍有效的计划和 spec 分别是什么 |
| D. BUG | `.axm/progress/*/bugs/bug-*.md` | 哪些 bug 仍未关闭；哪些已有代码/测试证据可关闭、标 duplicate 或 wont-fix |
| E. Arbiter（可选） | 各 agent 输出 | 找冲突、补证据、给最终修改清单排序 |

Agent 输出统一用下列结构，方便合并：

```md
## Findings
- doc: .axm/...
  claim: 文档声称什么
  evidence: 代码 / 测试 / 配置证据路径与摘要
  verdict: current | stale | superseded | resolved | uncertain
  proposed-action: keep | update | deprecate | close | supersede | needs-human
```

## 3. 判定规则

- **keep**：文档事实仍与代码一致；必要时只更新 `last-reviewed`。
- **update**：文档有局部过期，但主体仍有效；改正文与 `last-reviewed`，保留 `doc-state: current`。
- **deprecate**：文档不应再被 AI 当作上下文；改 `doc-state: deprecated`，正文写明替代文档或废弃原因。
- **close / supersede progress**：roadmap/spec 已完成或被新方案替代；先确认长期事实已同步到 `project/` 或 `knowledge/`，再更新 `workflow-state`、`state-updated` 与验收证据。
- **close BUG**：只有当 bug 文档已有验证证据，或当前代码/测试能明确证明问题已解决时，才改为 `closed`；证据不足时保持原状态并列为待确认。
- **needs-human**：涉及产品取舍、人工验收、无法从代码证明的事实，不自动归档。

## 4. 修改流程

1. 合并并去重所有 agent finding，先处理确定性高、影响路由的项。
2. 更新文档时只改必要行：metadata 状态、正文事实、证据、相关索引。
3. 若发现缺失的长期事实，先补到 `project/` 或 `knowledge/`，再关闭对应 progress/spec。
4. 不修改目标项目 `.axm/universal/`，除非用户明确要求变更通用契约；通用契约变更应回到 axm skill 仓库的 `templates/`。
5. 收尾运行 `reindex.mjs --dry-run`、必要时 `reindex.mjs --target=<项目根>`，再跑 `validate.mjs --target=<项目根>`。

## 5. 交付报告

报告必须包含：

- 机械检查结果：validate errors/warnings、reindex dry-run 摘要
- 并行 agent 分工与每组结论
- 已修改文档清单
- 已归档清单：deprecated docs、closed/superseded progress/spec、closed/duplicate/wont-fix bugs
- 保留待确认清单与缺失证据
- 最终 validate 结果
