<!-- axm-meta
status: active
last-reviewed: {{date}}
owner: {{owner}}
entries: []
-->

# progress/ — 开发进度

管理阶段性开发上下文：roadmap、阶段 spec、验收状态与开发进展。这里记录"准备怎么做、做到哪里、如何验收"，不替代 `knowledge/` 中的系统事实。

## 建议结构

```
progress/
└── <initiative>/
    ├── index.md
    ├── roadmap.md
    ├── decisions.md
    ├── specs/
    │   ├── index.md
    │   └── <spec>.md
    └── bugs/                # 该主题的 BUG（可选）
        ├── index.md
        ├── log.md           # 本主题 BUG 看板汇总
        └── <bug-id>.md      # 单条 BUG
```

## 写作规则

- roadmap 记录较大模块或主题的阶段划分、阶段/spec 依赖关系和事实进度
- roadmap 中每个已拆分阶段必须链接到对应 `specs/<spec>.md`；尚未拆 spec 的阶段标记为 `未拆 spec`
- roadmap 必须写清小目标/阶段 spec 之间的上游、下游与阻塞条件
- spec 记录一次阶段开发的细节与验收标准
- spec 的验收标准固定分为 **AI 自动验收** 和 **人类验收**
- **bug 文档（`<initiative>/bugs/<bug-id>.md`）** 记录单条 BUG，必须含优先级、复现步骤、修复验收标准与生命周期状态；BUG 必须挂在某个 initiative 下，禁止在 `progress/` 顶层建 `bugs/`；若无归属主题应先新建 initiative
- 已经落地的长期系统事实应同步沉淀到 `knowledge/`

参考 `universal/docs.md` 的骨架 D 获取 metadata 与内容约束。
