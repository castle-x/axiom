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
├── bugs/                    # BUG 管理（可选，由测试 agent 或人类提交）
│   ├── index.md
│   ├── log.md               # BUG 看板汇总
│   └── <bug-id>.md          # 单条 BUG
└── <initiative>/
    ├── index.md
    ├── roadmap.md
    ├── decisions.md
    └── specs/
        ├── index.md
        └── <spec>.md
```

## 写作规则

- roadmap 记录较大模块或主题的阶段划分、阶段/spec 依赖关系和事实进度
- roadmap 中每个已拆分阶段必须链接到对应 `specs/<spec>.md`；尚未拆 spec 的阶段标记为 `未拆 spec`
- roadmap 必须写清小目标/阶段 spec 之间的上游、下游与阻塞条件
- spec 记录一次阶段开发的细节与验收标准
- spec 的验收标准固定分为 **AI 自动验收** 和 **人类验收**
- **bug 文档（`bugs/<bug-id>.md`）** 记录单条 BUG，必须含优先级、复现步骤、修复验收标准与生命周期状态；详见 `bugs/index.md` 与 skill 的 `references/bug-doc-guide.md`
- 已经落地的长期系统事实应同步沉淀到 `knowledge/`

参考 `universal/docs.md` 的骨架 D 获取 metadata 与内容约束。
