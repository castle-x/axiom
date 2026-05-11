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

## 自查清单

- [ ] 这份文档描述的是计划、进度、验收或阶段决策，而不是长期规范/事实
- [ ] 如果是 roadmap，已拆分阶段都链接到对应 `specs/<spec>.md`
- [ ] 如果是 roadmap，阶段/spec 之间的依赖关系写清了上游、下游与阻塞条件
- [ ] 如果是 spec，验收标准分为 AI 自动验收和人类验收
- [ ] 如果内容已经落地成系统事实，已同步到 `knowledge/`
- [ ] `initiative` 能清楚表达所属模块或开发主题
- [ ] index.md 的 entries 与实际文件一致
