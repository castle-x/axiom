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
    └── specs/
        ├── index.md
        └── <spec>.md
```

## 写作规则

- roadmap 记录较大模块或主题的阶段划分、依赖关系和事实进度
- spec 记录一次阶段开发的细节与验收标准
- spec 的验收标准固定分为 **AI 自动验收** 和 **人类验收**
- 已经落地的长期系统事实应同步沉淀到 `knowledge/`

参考 `universal/docs.md` 的骨架 D 获取 metadata 与内容约束。
