# progress/ 开发进度写作指南

> 本文指导 AI 在需要管理 roadmap、阶段 spec、验收状态与开发进展时，撰写 `.axm/progress/**/*.md` 进度文档。

## 目录定位

`progress/` 存阶段性开发上下文，不存长期规范或系统事实：

| 维度 | progress/ | knowledge/ | project/ |
|---|---|---|---|
| 写什么 | 准备怎么做、做到哪里、如何验收 | 当前系统是什么、为什么这样设计 | 应该怎么做 |
| 生命周期 | 阶段性 | 中长期 | 长期 |
| 典型文件 | roadmap.md、specs/*.md、decisions.md | overview.md、topic.md | architecture.md、coding.md |

## 建议结构

```
progress/<initiative>/
├── index.md
├── roadmap.md
├── decisions.md
└── specs/
    ├── index.md
    └── <spec>.md
```

并列于各 `<initiative>/` 之外，可选地存在一个项目级 BUG 管理目录：

```
progress/bugs/
├── index.md
├── log.md           # BUG 看板汇总（骨架 D, progress-type=roadmap）
└── <bug-id>.md      # 单条 BUG（骨架 D, progress-type=bug）
```

BUG 管理是面向 AI 的通用规范，不限测试类型（API/UI/单测/人工皆适用）。详细写作规则见 `bug-doc-guide.md`。

## roadmap.md

Roadmap 面向较大模块或较大开发主题，回答"大方向如何拆、现在到哪里"。

建议包含：

- 背景与目标
- 阶段列表
- 阶段依赖
- 当前事实进度
- 已完成阶段与对应 PR / commit / spec 链接
- 尚未确认的问题

阶段列表中的每个已拆分阶段必须链接到对应 `specs/<spec>.md`；尚未拆 spec 的阶段标记为 `未拆 spec`。阶段依赖必须写清上游与下游，例如 `phase-b 依赖 phase-a 完成人类验收`，让 AI 能判断哪些 spec 可以并行推进，哪些必须等待。

不要写每日流水账；只在事实进度被核对后更新。

## specs/*.md

Spec 面向一次阶段开发，回答"这一阶段具体做什么、怎么验收"。

建议包含：

- 背景
- 目标
- 范围
- 非目标
- 已确认的开发细节
- 设计约束或依赖
- 验收标准

验收标准必须分成两类：

| 类别 | 写什么 |
|---|---|
| AI 自动验收 | 命令、测试、脚本、静态检查、可判定输出 |
| 人类验收 | 交互路径、预期体验、人工确认点、截图或演示要求 |

Spec 可由 Superpowers、OpenSpec、人工讨论或其他外部方法生成；axm 只约束最终文档形状和归档位置。

## 闭合已完成 progress

当用户确认某个阶段、spec 或 initiative 已完成时，AI 需要做"闭合"，而不是只把表格状态改成 `已完成`。闭合目标是：后续 AI 既能看到历史验收证据，也不会把已落地事实误当作仍未完成计划。

### 何时闭合

满足以下条件时闭合：

- 代码、文档或配置已经落地，且用户确认阶段目标完成
- AI 自动验收已运行，或明确记录了无法运行的原因
- 人类验收项已确认，或明确标为 deferred / 不再做
- 后续工作已经拆到下一阶段、独立 spec，或写入 "尚未确认的问题"

### 闭合步骤

1. **确认事实来源**：读取对应 roadmap/spec，以及必要的 `knowledge/`、`project/`、源码或测试输出；不要只凭聊天记忆更新。
2. **同步长期事实**：把已经落地且未来仍应被召回的系统事实写入 `knowledge/`；把长期工程规范写入 `project/`。progress 只保留阶段历史、验收与决策轨迹。
3. **更新 roadmap**：
   - 阶段表状态改为 `已完成`，或写清 `核心完成 / deferred` 的边界
   - "当前事实进度"记录完成内容、关键 commit/PR、验收结论
   - "验证状态"记录最终命令、结果与已知既有阻塞
   - "尚未确认的问题"移除已解决项；遗留项必须指向下一阶段/spec 或标为 deferred
4. **更新 spec**：
   - 任务清单、AI 自动验收、人类验收逐项打勾或说明 deferred
   - 记录最终验证命令、输出摘要、commit/PR 或截图/人工确认点
   - 明确非目标仍为非目标，避免后续 AI 误补
5. **更新索引**：如果新增、删除、重命名了 progress 文档，运行 `reindex.mjs --dry-run`，确认 entries 一致；需要落盘时再运行不带 `--dry-run`。
6. **校验契约**：运行 `validate.mjs --target=<项目根>`；ERROR 必须修，WARN 可说明后交付。

### status 字段怎么用

axm-meta 的 `status` 表示这份文档是否仍可作为上下文参考，不等于阶段状态。

| 情况 | axm-meta `status` | 正文阶段状态 |
|---|---|---|
| 已完成且仍是有效历史上下文 | `active` | `已完成` |
| 计划被新方案替代，不应继续参考 | `deprecated` | 写明替代文档 |
| 草稿 spec 尚未确认 | `draft` | `待确认` |

不要为了表示阶段完成就把 progress 文档改成 `deprecated`。大多数已完成 roadmap/spec 仍应保持 `active`，因为它们记录了验收证据和历史决策。

## decisions.md

用于记录已确认且影响 roadmap/spec 的阶段性决策。不要把它当架构事实库；当决策已经落地并成为系统事实，应该同步到 `knowledge/`。

## axm metadata

所有非 index 的 progress 文档使用骨架 D：

```yaml
<!-- axm-meta
status: active
last-reviewed: 2026-05-12
owner: your-team
progress-type: roadmap
initiative: editor-redesign
related:
  - ../../knowledge/frontend/overview.md
-->
```

`progress-type` 取值：

- `roadmap`
- `spec`
- `decision`
- `bug`（仅用于 `progress/bugs/<bug-id>.md`，详见 `bug-doc-guide.md`）

## 自查清单

- [ ] 这份文档描述的是计划、进度、验收或阶段决策，而不是长期规范/事实
- [ ] 如果是 roadmap，已拆分阶段都链接到对应 `specs/<spec>.md`
- [ ] 如果是 roadmap，阶段/spec 之间的依赖关系写清了上游、下游与阻塞条件
- [ ] 如果是 spec，验收标准分为 AI 自动验收和人类验收
- [ ] 如果内容已经落地成系统事实，已同步到 `knowledge/`
- [ ] 如果阶段已完成，roadmap/spec 已记录完成状态、最终验收、commit/PR 或等价证据
- [ ] 如果阶段已完成，遗留项已移到后续阶段/spec，或明确标为 deferred
- [ ] `initiative` 能清楚表达所属模块或开发主题
- [ ] index.md 的 entries 与实际文件一致
